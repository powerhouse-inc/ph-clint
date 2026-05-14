/**
 * `spec-change` trigger — watches ALL `powerhouse/ph-clint-project` documents
 * and, when any change, re-runs the code generator for each affected project.
 *
 * Flow:
 *   1. `createDocumentChangeTrigger` (from ph-clint) owns the subscription,
 *      event coalescing, doc loading, and type narrowing. No `documentId` is
 *      set, so it loads ALL matching documents on each poll.
 *   2. `getProjectMapping()` merges an on-disk scan (via the clint-project
 *      service's projectScanner) with personal-drive folder entries to
 *      correlate each document to an on-disk project directory.
 *   3. For each document, `specFromDocumentState()` builds a spec, hashes it,
 *      and compares against `.ph/ph-clint-cli/.last-spec-hash`. If unchanged,
 *      skips. Otherwise regenerates at the mapped target directory.
 */
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { scanProjects, getProjectMapping } from '@powerhousedao/ph-clint';
import type { ImportSpecInput } from '@powerhousedao/ph-clint-app/document-models/ph-clint-project';
import { createDocumentChangeTrigger } from '../framework.js';
import { generateProject } from '../codegen/index.js';
import { runPostGenActions } from '@powerhousedao/ph-clint-dev/codegen/actions';
import { specFromDocumentState } from '../spec/from-document.js';
import { readProjectSpec, writeProjectSpec } from '../spec/file.js';
import { ensureSpecDocument } from '../spec/ensure-document.js';
import { clintProject } from '../services/clint-project.js';
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

/** Stable hash of a ClintProjectSpec (sha256 of canonical-key JSON).
 *  Excludes documentId/documentType — they don't affect codegen output. */
export function hashSpec(spec: ClintProjectSpec): string {
  const { documentId, documentType, ...codegenRelevant } = spec;
  return crypto
    .createHash('sha256')
    .update(canonicalJson(codegenRelevant), 'utf8')
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

export function specToImportInput(spec: ClintProjectSpec): ImportSpecInput {
  const main = spec.features.mastra.mainAgent;
  return {
    name: spec.name,
    scope: spec.scope ?? null,
    version: spec.version,
    description: spec.description,
    powerhouse: spec.features.powerhouse,
    mastraEnabled: spec.features.mastra.enabled,
    routineEnabled: spec.features.routine.enabled,
    mainAgent: main
      ? {
          id: main.id,
          name: main.name,
          description: main.description,
          image: main.image,
          modelId: main.modelId,
          profileIds: [...main.profileIds],
          skills: [...main.skills],
          toolPatterns: [...main.toolPatterns],
        }
      : null,
    subAgents: spec.features.mastra.subAgents.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      modelId: s.modelId,
      profileIds: [...s.profileIds],
      skills: [...s.skills],
      toolPatterns: [...s.toolPatterns],
    })),
    models: spec.features.mastra.models.map((m) => ({
      id: m.id,
      isDefault: m.isDefault,
    })),
    profiles: spec.features.mastra.profiles.map((p) => ({
      id: p.id,
      title: p.title,
      content: p.content,
    })),
    packages: spec.packages.map((p) => ({
      id: p.id,
      packageName: p.packageName,
      documentTypes: p.documentTypes,
    })),
    externalSkills: spec.externalSkills.map((s) => ({
      id: s.id,
      name: s.name,
      githubUrl: s.githubUrl,
    })),
    enableChat: spec.features.mastra.common.enableChat,
    proxyEnabled: spec.deployment.proxyEnabled,
    observabilityEnabled: spec.deployment.observabilityEnabled,
    supportedResources: spec.deployment.supportedResources,
  };
}

export const specChangeTrigger = createDocumentChangeTrigger({
  id: 'spec-change',
  documentType: DOCUMENT_TYPE,
  // No documentId → watches ALL ph-clint-project docs
  callOnEmpty: true, // bootstrap from disk when no documents exist yet

  async onChange(docs, ctx) {
    const log = ctx.context.log;
    const folders = ctx.context.folders;

    // Build the mapping: on-disk projects + personal drive documents
    const scanner = clintProject.projectScanner;
    const scanResults = scanner
      ? scanProjects(ctx.context.workdir, scanner)
      : [];
    const mapping = await getProjectMapping(scanResults, folders);

    // Auto-create spec documents for unlinked or orphaned projects
    const reactor = await ctx.reactor();
    if (reactor && folders) {
      for (const entry of mapping) {
        if (!entry.path) continue;
        const existingSpec = await readProjectSpec(entry.path);
        if (!existingSpec) continue;

        try {
          const { docId, created } = await ensureSpecDocument({
            spec: existingSpec,
            targetDir: entry.path,
            reactor,
            folders,
          });
          if (created) {
            log?.info(`${TAG} linked project ${entry.name} to document ${docId}`);
          }
        } catch (err) {
          log?.warn(
            `${TAG} could not ensure spec document for ${entry.name}: ${err instanceof Error ? err.message : String(err)}`,
          );
        }
      }
    }

    for (const doc of docs) {
      const spec = specFromDocumentState(doc.state.global, {
        documentId: doc.header.id,
        documentType: doc.header.documentType,
      });
      if (!spec) {
        log?.debug(
          `${TAG} document ${doc.header.id} state did not validate against ClintProjectSpec, skipping`,
        );
        continue;
      }

      // Find target directory from mapping
      const entry = mapping.find((m) => m.documentId === doc.header.id);
      const targetDir = entry?.path ?? path.join(ctx.context.workdir, spec.name);

      // Per-project hash comparison
      const nextHash = hashSpec(spec);
      const prevHash = await readLastSpecHash(targetDir);
      if (nextHash === prevHash) {
        log?.debug(
          `${TAG} spec for ${spec.name} unchanged (hash=${nextHash.slice(0, 12)}…), skipping`,
        );
        continue;
      }
      log?.debug(
        `${TAG} spec for ${spec.name} changed: ${prevHash ? prevHash.slice(0, 12) + '…' : '<none>'} → ${nextHash.slice(0, 12)}…`,
      );

      log?.info(
        `${TAG} regenerating ${spec.name} at ${targetDir} (doc=${doc.header.id})`,
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

      // Write spec JSON with documentId
      await writeProjectSpec(targetDir, spec);
      await writeLastSpecHash(targetDir, nextHash);

      const elapsed = Date.now() - t0;
      if (log) {
        if (result.migrated) log.info(`${TAG} migrated flat → split layout`);
        log.info(
          `${TAG} regenerated ${spec.name} in ${elapsed}ms: ${result.files.length} written, ${result.skipped.length} skipped, ${result.deleted.length} deleted`,
        );
        for (const w of warnings) log.warn(`${TAG} ${w}`);
      }

      // Run post-generation actions (ph-init, install, build, skills-sync).
      // Route through ctx.context.stdout so output flows through
      // routine.onOutput → service log buffer → ServicePanel.
      await runPostGenActions(result.pendingActions, {
        log: (msg) => ctx.context.stdout(`${TAG} ${msg}\n`),
        runProcess: ctx.context.runProcess,
      });
    }

    // Work done inline, no additional work item needed
    return null;
  },
});
