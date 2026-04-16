/**
 * `spec-change` trigger — watches the `powerhouse/ph-clint-project` document
 * on the Reactor drive and, when its state changes, enqueues a work item
 * that re-runs the code generator in update mode.
 *
 * Flow:
 *   1. `setup()` subscribes to `powerhouse:document:changed` events (the same
 *      bridge pattern example 06 uses).
 *   2. `poll()` drains pending events. If any fired, we load the latest
 *      ph-clint-project document, convert its state to a `ClintProjectSpec`,
 *      and hash it.
 *   3. The hash is compared against `.ph/ph-clint-cli/.last-spec-hash`. If
 *      unchanged, we emit nothing (idempotent). If different, we return a
 *      `function` work item that calls `generateProject(spec, workdir, 'update')`
 *      and, on success, writes the new hash.
 *
 * The document is expected to live on the default drive. If multiple
 * `ph-clint-project` documents are present we pick the first — this matches
 * the single-document scope chosen in Phase 4.
 */
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { defineTrigger } from '../framework.js';
import { generateProject } from '../codegen/index.js';
import { specFromDocumentState } from '../spec/from-document.js';
import type { ClintProjectSpec } from '../spec/types.js';

const DOCUMENT_TYPE = 'powerhouse/ph-clint-project' as const;

interface SpecChangeState {
  pending: number;
}
const HASH_DIR = path.join('.ph', 'ph-clint-cli');
const HASH_FILE = '.last-spec-hash';

function getHashPath(targetDir: string): string {
  return path.join(targetDir, HASH_DIR, HASH_FILE);
}

function isEnoent(err: unknown): boolean {
  return (
    !!err &&
    typeof err === 'object' &&
    'code' in err &&
    (err as { code: unknown }).code === 'ENOENT'
  );
}

async function readLastSpecHash(targetDir: string): Promise<string | null> {
  try {
    return (await fs.readFile(getHashPath(targetDir), 'utf8')).trim() || null;
  } catch (err) {
    if (isEnoent(err)) return null;
    throw err;
  }
}

async function writeLastSpecHash(
  targetDir: string,
  hash: string,
): Promise<void> {
  const file = getHashPath(targetDir);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, hash + '\n', 'utf8');
}

/** Stable hash of a ClintProjectSpec (sha256 of canonical-key JSON). */
export function hashSpec(spec: ClintProjectSpec): string {
  return crypto
    .createHash('sha256')
    .update(canonicalJson(spec), 'utf8')
    .digest('hex');
}

function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) {
    return '[' + value.map(canonicalJson).join(',') + ']';
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return (
    '{' +
    keys
      .map((k) => JSON.stringify(k) + ':' + canonicalJson(obj[k]))
      .join(',') +
    '}'
  );
}

/** Find the first ph-clint-project document on the default drive. */
async function findProjectDocumentId(
  client: { getChildren: (driveId: string) => Promise<{ results?: unknown[] }> },
  driveId: string,
): Promise<string | null> {
  try {
    const children = await client.getChildren(driveId);
    const results = (children?.results ?? []) as Array<{
      header?: { id?: string; documentType?: string };
    }>;
    for (const node of results) {
      if (node.header?.documentType === DOCUMENT_TYPE && node.header.id) {
        return node.header.id;
      }
    }
  } catch {
    // fall through to null
  }
  return null;
}

/** Extract document ids from a `powerhouse:document:changed` payload. */
function extractDocIds(
  documents: ReadonlyArray<{ header?: { id?: string } }>,
): string[] {
  const ids: string[] = [];
  for (const d of documents) {
    const id = d?.header?.id;
    if (typeof id === 'string' && id) ids.push(id);
  }
  return ids;
}

const TAG = '[spec-change]';

function safeJson(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export const specChangeTrigger = defineTrigger<SpecChangeState>({
  id: 'spec-change',
  type: 'condition',
  state: () => ({ pending: 0 }),

  async setup(ctx) {
    const log = ctx.context.log;
    const on = ctx.context.on;
    if (!on) {
      log?.debug(`${TAG} no event bus on CoreContext — running poll-only`);
      return;
    }
    on('powerhouse:document:changed', (payload) => {
      const targetId = ctx.context.config.projectDocumentId;
      const ids = extractDocIds(payload.documents);
      // Raw payload at debug — helps diagnose upstream shape changes.
      log?.debug(`${TAG} raw payload: ${safeJson(payload)}`);
      // If we know the target and can parse ids, drop non-matching events.
      // If ids can't be parsed (empty), fall through and let poll+hash dedup.
      if (targetId && ids.length > 0 && !ids.includes(targetId)) {
        log?.debug(
          `${TAG} ignored change event (target=${targetId}, docs=[${ids.join(', ')}])`,
        );
        return;
      }
      ctx.state.pending += 1;
      log?.debug(
        `${TAG} queued change event (docs=[${ids.join(', ')}], pending=${ctx.state.pending})`,
      );
    });
    // Also kick off an initial check so the first tick reconciles on startup.
    ctx.state.pending = 1;
    log?.debug(`${TAG} setup complete — initial reconcile queued`);
  },

  async poll(ctx) {
    const pending = ctx.state.pending;
    if (!pending) return null;
    ctx.state.pending = 0;

    const log = ctx.context.log;
    log?.debug(`${TAG} draining ${pending} pending event(s)`);

    const reactor = await ctx.reactor();
    if (!reactor) {
      log?.debug(`${TAG} no reactor available, skipping`);
      return null;
    }

    const configuredId =
      ctx.context.config.projectDocumentId &&
      ctx.context.config.projectDocumentId.length > 0
        ? ctx.context.config.projectDocumentId
        : undefined;
    const docId =
      configuredId ??
      (await findProjectDocumentId(reactor.client, reactor.driveId));
    if (!docId) {
      log?.debug(
        `${TAG} no ${DOCUMENT_TYPE} document found on drive ${reactor.driveId}`,
      );
      return null;
    }
    log?.debug(
      `${TAG} resolved target document ${docId} (${configuredId ? 'from config' : 'from discovery'})`,
    );

    // First-time discovery: persist the id into the local config file and
    // mutate the in-memory config so subsequent ticks skip discovery.
    if (!configuredId) {
      try {
        const current = await ctx.context.workspace.loadLocalConfig<
          Record<string, unknown>
        >({});
        await ctx.context.workspace.storeLocalConfig({
          ...current,
          projectDocumentId: docId,
        });
        ctx.context.config.projectDocumentId = docId;
        log?.info(
          `${TAG} pinned projectDocumentId=${docId} in ${ctx.context.workspace.getLocalConfigPath()}`,
        );
      } catch (err) {
        log?.warn(
          `${TAG} failed to persist projectDocumentId: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      }
    }

    const doc = await reactor.client.get<typeof DOCUMENT_TYPE>(docId);
    const spec = specFromDocumentState(doc.state.global);
    if (!spec) {
      log?.debug(
        `${TAG} document ${docId} state did not validate against ClintProjectSpec, skipping`,
      );
      return null;
    }

    const targetDir = ctx.context.workdir;
    const nextHash = hashSpec(spec);
    const prevHash = await readLastSpecHash(targetDir);
    if (nextHash === prevHash) {
      log?.debug(
        `${TAG} spec unchanged (hash=${nextHash.slice(0, 12)}…), nothing to do`,
      );
      return null;
    }
    log?.debug(
      `${TAG} spec changed: ${prevHash ? prevHash.slice(0, 12) + '…' : '<none>'} → ${nextHash.slice(0, 12)}…`,
    );
    log?.debug(
      `${TAG} next spec: name=${spec.name}, version=${spec.version}, ` +
        `powerhouse=${spec.features.powerhouse.enabled}, ` +
        `mastra=${spec.features.mastra.enabled}, ` +
        `routine=${spec.features.routine.enabled}`,
    );

    return {
      type: 'function',
      params: {
        fn: async () => {
          log?.info(
            `${TAG} regenerating project at ${targetDir} (doc=${docId})`,
          );
          const t0 = Date.now();
          const warnings: string[] = [];
          const result = await generateProject({
            targetDir,
            spec,
            mode: 'update',
            onWarn: (m) => warnings.push(m),
          });
          await writeLastSpecHash(targetDir, nextHash);
          const elapsed = Date.now() - t0;

          if (log) {
            if (result.migrated) {
              log.info(`${TAG} migrated flat → split layout`);
            }
            log.info(
              `${TAG} regenerated in ${elapsed}ms: ${result.files.length} written, ${result.skipped.length} skipped, ${result.deleted.length} deleted`,
            );
            for (const f of result.files) {
              log.debug(`${TAG}   wrote   ${f.relativePath}`);
            }
            for (const f of result.skipped) {
              log.debug(`${TAG}   skipped ${f.relativePath} (user-edited)`);
            }
            for (const f of result.deleted) {
              log.debug(`${TAG}   deleted ${f.relativePath}`);
            }
            for (const w of warnings) log.warn(`${TAG} ${w}`);
            log.debug(
              `${TAG} wrote hash ${nextHash.slice(0, 12)}… to ${getHashPath(targetDir)}`,
            );
          }
        },
      },
      callbacks: {
        onFailure: (err) => {
          log?.error(`${TAG} regen failed: ${err.message}`);
          log?.debug(`${TAG} stack: ${err.stack ?? '<no stack>'}`);
        },
      },
    };
  },
});
