/**
 * `publish-trigger` — watches `powerhouse/ph-clint-project` documents for
 * publish records with `Pending` status and invokes the publish pipeline.
 *
 * Unlike `spec-change`, this trigger does NOT convert to a `ClintProjectSpec`.
 * It reads `publishHistory` directly from the document state, since publish
 * records are a doc-model concern (not a codegen input).
 *
 * Flow:
 *   1. On document change, scans `publishHistory` for records with status
 *      `"Pending"`.
 *   2. For each pending record, returns a work item that:
 *      a. Dispatches SET_PUBLISH_STATUS({ id, status: "InProgress" }).
 *      b. Runs `ph-clint clint-project-publish --tag <tag>`.
 *      c. Dispatches SET_PUBLISH_STATUS({ id, status: "Succeeded"|"Failed" }).
 */
import { spawn } from 'node:child_process';
import type { WorkItem } from '@powerhousedao/ph-clint';
import { setPublishStatus } from '@powerhousedao/ph-clint-app';
import { createDocumentChangeTrigger } from '../framework.js';

const DOCUMENT_TYPE = 'powerhouse/ph-clint-project' as const;
const TAG = '[publish]';

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

/** Run a shell command and return stdout. Rejects on non-zero exit. */
function exec(
  cmd: string,
  args: string[],
  cwd: string,
  onLog?: (msg: string) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] });
    const out: string[] = [];
    const err: string[] = [];
    proc.stdout?.on('data', (d: Buffer) => {
      const s = d.toString();
      out.push(s);
      if (onLog) for (const line of s.split('\n')) if (line.trim()) onLog(line.trim());
    });
    proc.stderr?.on('data', (d: Buffer) => {
      const s = d.toString();
      err.push(s);
      if (onLog) for (const line of s.split('\n')) if (line.trim()) onLog(line.trim());
    });
    proc.on('error', reject);
    proc.on('close', (code) => {
      if (code === 0) resolve(out.join(''));
      else reject(new Error(`${cmd} ${args.join(' ')} exited ${code}\n${err.join('')}`));
    });
  });
}

/** Map document model PublishTag values to CLI --tag values. */
export function tagToCli(tag: string): 'dev' | 'staging' | 'production' | null {
  switch (tag) {
    case 'Dev':
      return 'dev';
    case 'Staging':
      return 'staging';
    case 'Production':
      return 'production';
    default:
      return null;
  }
}

export const publishTrigger = createDocumentChangeTrigger({
  id: 'publish-trigger',
  documentType: DOCUMENT_TYPE,
  // Don't fire on startup — only react to new pending records.
  initialReconcile: false,

  // Resolve the target document lazily (same pattern as spec-change trigger).
  documentId: async (ctx) => {
    const configured =
      ctx.context.config.projectDocumentId &&
      ctx.context.config.projectDocumentId.length > 0
        ? ctx.context.config.projectDocumentId
        : undefined;
    if (configured) return configured;

    const reactor = await ctx.reactor();
    if (!reactor) return undefined;

    return findProjectDocumentId(reactor.client, reactor.driveId);
  },

  async onChange(doc, ctx): Promise<WorkItem | null> {
    const log = ctx.context.log;
    const publishHistory = doc.state.global.publishHistory ?? [];

    const pending = publishHistory.filter(
      (r: { status: string }) => r.status === 'Pending',
    );
    if (pending.length === 0) return null;

    // Process the first pending record (one per tick to avoid races).
    const record = pending[0] as {
      id: string;
      tag: string;
      version: string;
    };
    const cliTag = tagToCli(record.tag);
    if (!cliTag) {
      log?.warn(`${TAG} unknown publish tag "${record.tag}" for record ${record.id}`);
      return null;
    }

    log?.info(
      `${TAG} found pending ${record.tag} publish (id=${record.id}, version=${record.version})`,
    );

    return {
      type: 'function',
      params: {
        fn: async () => {
          const reactor = await ctx.reactor();
          if (!reactor) {
            log?.error(`${TAG} reactor not available, cannot update publish status`);
            return;
          }

          // Mark as InProgress.
          log?.info(`${TAG} marking record ${record.id} as InProgress`);
          await reactor.client.execute(doc.header.id, 'main', [
            setPublishStatus({ id: record.id, status: 'InProgress' }),
          ]);

          // Install dependencies in the generated project before publishing.
          const workdir = ctx.context.workdir;
          log?.info(`${TAG} running pnpm install in ${workdir}`);
          try {
            await exec('pnpm', ['install'], workdir, (msg) =>
              log?.debug(`${TAG} [install] ${msg}`),
            );
          } catch (installErr) {
            log?.error(
              `${TAG} pnpm install failed: ${installErr instanceof Error ? installErr.message : String(installErr)}`,
            );
          }

          // Run the publish command.
          let success = false;
          try {
            log?.info(
              `${TAG} invoking clint-project-publish --tag ${cliTag}`,
            );
            const { clintProjectPublish } = await import(
              '../commands/clint-project-publish.js'
            );
            const result = await clintProjectPublish.execute(
              { tag: cliTag, dryRun: false, skipBuild: false, skipGitCheck: true, verbose: false },
              // @ts-expect-error — minimal context; publish uses workdir + stdout.
              {
                workdir: ctx.context.workdir,
                stdout: (msg: string) => log?.info(`${TAG} ${msg}`),
                log,
              },
            );
            success = !result.text.includes('failed');
          } catch (err) {
            log?.error(
              `${TAG} publish failed: ${err instanceof Error ? err.message : String(err)}`,
            );
          }

          // Update status.
          const finalStatus = success ? 'Succeeded' : 'Failed';
          log?.info(`${TAG} marking record ${record.id} as ${finalStatus}`);
          await reactor.client.execute(doc.header.id, 'main', [
            setPublishStatus({
              id: record.id,
              status: finalStatus as 'Succeeded' | 'Failed',
            }),
          ]);
        },
      },
      callbacks: {
        onFailure: (err) => {
          log?.error(`${TAG} publish trigger failed: ${err.message}`);
        },
      },
    };
  },
});
