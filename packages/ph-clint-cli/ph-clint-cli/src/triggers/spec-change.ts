/**
 * `spec-change` trigger — watches the `powerhouse/ph-clint-project` document
 * on the Reactor drive and, when its state changes, enqueues a work item
 * that re-runs the code generator in update mode.
 *
 * Flow:
 *   1. `createDocumentChangeTrigger` (from ph-clint) owns the subscription,
 *      event coalescing, doc loading, and type narrowing.
 *   2. `documentId` resolves the target doc lazily: it prefers
 *      `config.projectDocumentId`, falling back to a drive scan for the first
 *      `powerhouse/ph-clint-project` document (and pinning the id into local
 *      config on success).
 *   3. `onChange` converts the doc state to a `ClintProjectSpec`, hashes it,
 *      and compares against `.ph/ph-clint-cli/.last-spec-hash`. If unchanged,
 *      emits nothing. If different, returns a `function` work item that calls
 *      `generateProject(spec, workdir, 'update')` and writes the new hash.
 */
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { WorkItem } from '@powerhousedao/ph-clint';
import { createDocumentChangeTrigger } from '../framework.js';
import { generateProject } from '../codegen/index.js';
import { runPhInit } from '../codegen/scaffold.js';
import { specFromDocumentState } from '../spec/from-document.js';
import { syncExternalSkills } from '../skills/sync.js';
import type { ClintProjectSpec } from '../spec/types.js';

const DOCUMENT_TYPE = 'powerhouse/ph-clint-project' as const;
const HASH_DIR = path.join('.ph', 'ph-clint-cli');
const HASH_FILE = '.last-spec-hash';
const TAG = '[spec-change]';

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
): Promise<string | undefined> {
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
    // fall through
  }
  return undefined;
}

export const specChangeTrigger = createDocumentChangeTrigger({
  id: 'spec-change',
  documentType: DOCUMENT_TYPE,

  // Resolve the target id lazily so we can also do first-time discovery and
  // persist the discovered id into local config.
  documentId: async (ctx) => {
    const configured =
      ctx.context.config.projectDocumentId &&
      ctx.context.config.projectDocumentId.length > 0
        ? ctx.context.config.projectDocumentId
        : undefined;
    if (configured) return configured;

    const reactor = await ctx.reactor();
    if (!reactor) return undefined;

    const discovered = await findProjectDocumentId(
      reactor.client,
      reactor.driveId,
    );
    if (!discovered) {
      ctx.context.log?.debug(
        `${TAG} no ${DOCUMENT_TYPE} document found on drive ${reactor.driveId}`,
      );
      return undefined;
    }

    // Persist into local config + mutate in-memory so future ticks skip discovery.
    try {
      const current = await ctx.context.workspace.loadLocalConfig<
        Record<string, unknown>
      >({});
      await ctx.context.workspace.storeLocalConfig({
        ...current,
        projectDocumentId: discovered,
      });
      ctx.context.config.projectDocumentId = discovered;
      ctx.context.log?.info(
        `${TAG} pinned projectDocumentId=${discovered} in ${ctx.context.workspace.getLocalConfigPath()}`,
      );
    } catch (err) {
      ctx.context.log?.warn(
        `${TAG} failed to persist projectDocumentId: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }

    return discovered;
  },

  async onChange(docs, ctx): Promise<WorkItem | null> {
    const [doc] = docs;
    const log = ctx.context.log;

    const spec = specFromDocumentState(doc.state.global);
    if (!spec) {
      log?.debug(
        `${TAG} document ${doc.header.id} state did not validate against ClintProjectSpec, skipping`,
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

    return {
      type: 'function',
      params: {
        fn: async () => {
          log?.info(
            `${TAG} regenerating project at ${targetDir} (doc=${doc.header.id})`,
          );
          const t0 = Date.now();
          const warnings: string[] = [];
          const result = await generateProject({
            targetDir,
            spec,
            mode: 'update',
            force: true,
            onWarn: (m) => warnings.push(m),
          });
          await writeLastSpecHash(targetDir, nextHash);
          const elapsed = Date.now() - t0;

          if (log) {
            if (result.migrated) log.info(`${TAG} migrated flat → split layout`);
            log.info(
              `${TAG} regenerated in ${elapsed}ms: ${result.files.length} written, ${result.skipped.length} skipped, ${result.deleted.length} deleted`,
            );
            for (const w of warnings) log.warn(`${TAG} ${w}`);
          }

          // Scaffold the reactor package (app dir) if it hasn't been initialized yet.
          if (result.appDir) {
            const appPkgJson = path.join(result.appDir, 'package.json');
            let appExists = false;
            try { await fs.access(appPkgJson); appExists = true; } catch { /* noop */ }
            if (!appExists) {
              log?.info(`${TAG} initializing reactor package at ${result.appDir}`);
              const phResult = await runPhInit({
                targetDir,
                appDir: result.appDir,
                spec,
                log: (msg) => log?.info(`${TAG} ${msg}`),
                stdio: 'ignore',
              });
              if (!phResult.ran) {
                log?.warn(`${TAG} ph init skipped: ${phResult.reason ?? 'unknown'}`);
              } else if (phResult.exitCode !== 0) {
                log?.warn(`${TAG} ph init exited with code ${phResult.exitCode}`);
              }
            }

            // Always ensure the app package name matches the spec's scope,
            // even if ph init ran in a previous trigger cycle without scope.
            if (spec.scope) {
              try {
                const raw = await fs.readFile(appPkgJson, 'utf8');
                const pkg = JSON.parse(raw);
                const appFolder = path.basename(result.appDir);
                const scopedName = `@${spec.scope}/${appFolder}`;
                if (pkg.name !== scopedName) {
                  pkg.name = scopedName;
                  pkg.publishConfig = { access: 'public' };
                  await fs.writeFile(appPkgJson, JSON.stringify(pkg, null, 2) + '\n');
                  log?.info(`${TAG} patched app package name to ${scopedName}`);
                }
              } catch (err) {
                log?.warn(
                  `${TAG} could not patch app package name: ${err instanceof Error ? err.message : String(err)}`,
                );
              }
            }
          }

          // Sync external skills after codegen.
          if (spec.externalSkills.length > 0) {
            const skillsResult = await syncExternalSkills({
              targetDir,
              desired: spec.externalSkills,
              log: (msg) => log?.info(`${TAG} ${msg}`),
            });
            if (log && (skillsResult.added.length > 0 || skillsResult.removed.length > 0)) {
              log.info(
                `${TAG} skills sync: +${skillsResult.added.length} -${skillsResult.removed.length}`,
              );
            }
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
