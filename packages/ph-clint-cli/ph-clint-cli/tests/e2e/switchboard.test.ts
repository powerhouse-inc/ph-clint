/**
 * E2E test — full lifecycle via the Switchboard GraphQL API.
 *
 * 1. Start ph-clint-cli (Reactor + Switchboard + routine loop).
 * 2. Create a `powerhouse/ph-clint-project` document.
 * 3. Populate it with identity + features for `@powerhousedao/ph-e2e-test`.
 * 4. Wait for the spec-change trigger to generate the split-layout project.
 * 5. Dispatch BUMP_VERSION + PUBLISH_DEV actions.
 * 6. Wait for the publish trigger to install deps, build, and publish.
 * 7. Query npm for the actual published version (auto-computed by pipeline).
 * 8. Install the published CLI and verify it runs.
 */
import { describe, it, expect, afterAll, beforeAll } from '@jest/globals';
import { spawn, execSync, type ChildProcess } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const CLI_DIR = path.resolve(import.meta.dirname, '../..');
const STARTUP_TIMEOUT = 60_000;
const ACTION_TIMEOUT = 30_000;
const PUBLISH_TIMEOUT = 300_000; // 5 min — includes pnpm install + build + publish
const POLL_INTERVAL = 2_000;
const NPM_PROPAGATION_TIMEOUT = 180_000; // 3 min for npm CDN propagation

// ── Project constants ────────────────────────────────────────────────────

const PROJECT_NAME = 'ph-e2e-test';
const PROJECT_SCOPE = 'powerhousedao';
const CLI_PKG_NAME = `@${PROJECT_SCOPE}/${PROJECT_NAME}-cli`;
const APP_PKG_NAME = `@${PROJECT_SCOPE}/${PROJECT_NAME}-app`;
const BASE_VERSION = '0.0.1';

// ── GraphQL helpers ──────────────────────────────────────────────────────

async function gql<T = Record<string, unknown>>(
  url: string,
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`GraphQL HTTP ${res.status}: ${await res.text()}`);
  const body = (await res.json()) as { data?: T; errors?: Array<{ message: string }> };
  if (body.errors?.length) {
    throw new Error(`GraphQL errors: ${body.errors.map((e) => e.message).join('; ')}`);
  }
  return body.data as T;
}

const MUTATE = `mutation ($id: String!, $actions: [JSONObject!]!) {
  mutateDocument(documentIdentifier: $id, actions: $actions) {
    id
    revisionsList { scope revision }
  }
}`;

const GET_STATE = `query ($id: String!) {
  document(identifier: $id) {
    document { state }
  }
}`;

let actionCounter = 0;
function action(type: string, input: Record<string, unknown>, scope = 'global') {
  return {
    id: `e2e-action-${++actionCounter}`,
    timestampUtcMs: new Date().toISOString(),
    type,
    input,
    scope,
  };
}

type DocState = Record<string, unknown>;
async function getDocState(url: string, docId: string): Promise<DocState> {
  const data = await gql<{
    document: { document: { state: { global: DocState } } };
  }>(url, GET_STATE, { id: docId });
  return data.document.document.state.global;
}

// ── npm registry helpers ────────────────────────────────────────────────

/**
 * Query the npm registry directly via fetch (avoids npm CLI's aggressive
 * 404 caching for new packages).
 */
async function npmRegistryView(
  packageName: string,
): Promise<Record<string, unknown> | null> {
  const encoded = packageName.replace('/', '%2f');
  const res = await fetch(`https://registry.npmjs.org/${encoded}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`npm registry HTTP ${res.status}`);
  return (await res.json()) as Record<string, unknown>;
}

/**
 * Get the version currently tagged as `dev` for a package.
 * Returns null if the package or tag doesn't exist yet.
 */
async function getDevTaggedVersion(
  packageName: string,
): Promise<string | null> {
  const data = await npmRegistryView(packageName);
  if (!data) return null;
  const distTags = data['dist-tags'] as Record<string, string> | undefined;
  return distTags?.dev ?? null;
}

/**
 * Poll the npm registry until a specific version is visible.
 * Uses fetch against the registry API to avoid npm CLI caching.
 */
async function waitForVersionOnNpm(
  packageName: string,
  version: string,
  timeoutMs: number,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const data = await npmRegistryView(packageName);
    if (data) {
      const versions = data.versions as Record<string, unknown> | undefined;
      if (versions && version in versions) return;
    }
    await new Promise((r) => setTimeout(r, 5_000));
  }
  throw new Error(
    `${packageName}@${version} not visible on npm after ${timeoutMs / 1000}s`,
  );
}

// ── CLI process management ───────────────────────────────────────────────

interface CliInstance {
  proc: ChildProcess;
  switchboardUrl: string;
  workdir: string;
  output: string[];
}

function startCli(workdir: string): Promise<CliInstance> {
  return new Promise((resolve, reject) => {
    const proc = spawn(
      'node',
      ['--import', 'tsx', 'src/main.ts', '--workdir', workdir],
      {
        cwd: CLI_DIR,
        env: { ...process.env, PH_CLINT_API_KEY: '', NODE_OPTIONS: '' },
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );

    const output: string[] = [];
    let settled = false;

    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        proc.kill('SIGTERM');
        reject(new Error(`Startup timed out.\n${output.join('\n')}`));
      }
    }, STARTUP_TIMEOUT);

    function onData(chunk: Buffer) {
      for (const line of chunk.toString().split('\n')) {
        if (line.trim()) output.push(line.trim());
      }
      const match = chunk.toString().match(/ready at (http:\/\/[^\s]+\/graphql)/);
      if (match && !settled) {
        settled = true;
        clearTimeout(timeout);
        resolve({ proc, switchboardUrl: match[1], workdir, output });
      }
    }

    proc.stdout?.on('data', onData);
    proc.stderr?.on('data', onData);
    proc.on('error', (err) => {
      if (!settled) { settled = true; clearTimeout(timeout); reject(err); }
    });
    proc.on('exit', (code) => {
      if (!settled) {
        settled = true;
        clearTimeout(timeout);
        reject(new Error(`CLI exited (code ${code}) before ready.\n${output.join('\n')}`));
      }
    });
  });
}

async function killCli(cli: CliInstance): Promise<void> {
  cli.proc.kill('SIGTERM');
  const exited = await Promise.race([
    new Promise<boolean>((r) => cli.proc.on('exit', () => r(true))),
    new Promise<boolean>((r) => setTimeout(() => r(false), 2000)),
  ]);
  if (!exited) cli.proc.kill('SIGKILL');
  await new Promise<void>((r) => {
    if (cli.proc.exitCode !== null) { r(); return; }
    cli.proc.on('exit', () => r());
    setTimeout(r, 3000);
  });
}

// ── Polling helper ───────────────────────────────────────────────────────

async function poll(
  fn: () => Promise<boolean>,
  timeoutMs: number,
  label: string,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await fn()) return;
    await new Promise((r) => setTimeout(r, POLL_INTERVAL));
  }
  throw new Error(`poll timed out: ${label}`);
}

// ── Test suite ───────────────────────────────────────────────────────────

describe('Switchboard e2e — full project lifecycle', () => {
  let cli: CliInstance;
  let workdir: string;
  let url: string;
  let driveId: string;
  let docId: string;
  /** The version we expect the pipeline to compute (captured before publish). */
  let expectedVersion: string;
  /** The actual version visible on npm after publish. */
  let publishedVersion: string;

  beforeAll(async () => {
    console.log('[setup] Creating temp workdir and starting ph-clint-cli...');
    workdir = await fs.mkdtemp(path.join(os.tmpdir(), 'ph-clint-e2e-'));
    cli = await startCli(workdir);
    url = cli.switchboardUrl;
    console.log(`[setup] Switchboard ready at ${url}`);
    console.log(`[setup] Workdir: ${workdir}`);

    // Determine what the next dev version will be. The pipeline queries npm
    // for the latest `{BASE_VERSION}-dev.N` and increments N.
    const currentDev = await getDevTaggedVersion(CLI_PKG_NAME);
    if (currentDev && currentDev.startsWith(`${BASE_VERSION}-dev.`)) {
      const n = parseInt(currentDev.split('-dev.')[1], 10);
      expectedVersion = `${BASE_VERSION}-dev.${n + 1}`;
    } else {
      expectedVersion = `${BASE_VERSION}-dev.0`;
    }
    console.log(`[setup] npm dev tag for ${CLI_PKG_NAME}: ${currentDev ?? '<none>'}`);
    console.log(`[setup] Expected next version: ${expectedVersion}`);
  }, STARTUP_TIMEOUT);

  afterAll(async () => {
    console.log('[teardown] Stopping CLI and cleaning up...');
    if (cli) await killCli(cli);
    if (workdir) {
      await fs.rm(workdir, { recursive: true, force: true }).catch(() => {});
    }
    console.log('[teardown] Done.');
  }, 30_000);

  // ── Step 1: discover the drive ──

  it('finds the Clint drive', async () => {
    console.log('[step 1] Querying Switchboard for document drives...');
    const data = await gql<{
      findDocuments: { items: Array<{ id: string; name: string }> };
    }>(url, `{
      findDocuments(search: { type: "powerhouse/document-drive" }) {
        items { id name }
      }
    }`);
    const drives = data.findDocuments.items;
    console.log(`[step 1] Found ${drives.length} drive(s): ${drives.map((d) => `${d.name} (${d.id})`).join(', ')}`);
    expect(drives.length).toBeGreaterThanOrEqual(1);
    driveId = (drives.find((d) => d.name === 'Clint') ?? drives[0]).id;
    console.log(`[step 1] Using drive: ${driveId}`);
  });

  // ── Step 2: create the project document ──

  it('creates a ph-clint-project document', async () => {
    console.log(`[step 2] Creating powerhouse/ph-clint-project document in drive ${driveId}...`);
    const data = await gql<{
      createEmptyDocument: { id: string; documentType: string };
    }>(
      url,
      `mutation ($type: String!, $parent: String) {
        createEmptyDocument(documentType: $type, parentIdentifier: $parent) {
          id documentType
        }
      }`,
      { type: 'powerhouse/ph-clint-project', parent: driveId },
    );
    docId = data.createEmptyDocument.id;
    expect(data.createEmptyDocument.documentType).toBe('powerhouse/ph-clint-project');
    console.log(`[step 2] Created document: ${docId} (${data.createEmptyDocument.documentType})`);
  });

  // ── Step 3: populate identity + features ──

  it(
    'populates the project spec',
    async () => {
      console.log(`[step 3] Dispatching identity + feature actions to ${docId}...`);
      await gql(url, MUTATE, {
        id: docId,
        actions: [
          action('SET_PACKAGE_NAME', { name: PROJECT_NAME }),
          action('SET_SCOPE', { scope: PROJECT_SCOPE }),
          action('SET_DESCRIPTION', { description: 'E2E test project' }),
          action('SET_POWERHOUSE_LEVEL', { level: 'Reactor' }),
        ],
      });

      const state = await getDocState(url, docId);
      expect(state.name).toBe(PROJECT_NAME);
      expect(state.scope).toBe(PROJECT_SCOPE);
      console.log(`[step 3] Spec populated: @${state.scope}/${state.name}`);
      console.log(`[step 3] features:`, JSON.stringify(state.features));
    },
    ACTION_TIMEOUT,
  );

  // ── Step 4: wait for codegen + app scaffolding ──

  it(
    'spec-change trigger generates the project and initializes the app',
    async () => {
      const cliDir = path.join(workdir, `${PROJECT_NAME}-cli`);
      const appDir = path.join(workdir, `${PROJECT_NAME}-app`);

      console.log(`[step 4] Waiting for codegen + ph init (cli: ${cliDir}, app: ${appDir})...`);
      // Wait for the CLI package.json (codegen) AND the app package.json
      // with the correct scoped name (ph init + scope patch run after codegen
      // in the same work item — we must wait for the patch, not just existence).
      let pollCount = 0;
      await poll(
        async () => {
          pollCount++;
          try {
            await fs.access(path.join(cliDir, 'package.json'));
            const raw = await fs.readFile(path.join(appDir, 'package.json'), 'utf8');
            const pkg = JSON.parse(raw) as { name: string };
            if (pollCount % 10 === 0) {
              console.log(`[step 4] Poll #${pollCount}: cli/package.json exists, app name=${pkg.name} (want ${APP_PKG_NAME})`);
            }
            return pkg.name === APP_PKG_NAME;
          } catch {
            if (pollCount % 10 === 0) {
              const cliExists = await fs.access(path.join(cliDir, 'package.json')).then(() => true, () => false);
              const appExists = await fs.access(path.join(appDir, 'package.json')).then(() => true, () => false);
              console.log(`[step 4] Poll #${pollCount}: cli/package.json=${cliExists}, app/package.json=${appExists}`);
            }
            return false;
          }
        },
        PUBLISH_TIMEOUT, // ph init + pnpm install can take a while
        'waiting for generated cli + scoped app package.json',
      );

      // Verify CLI package.json
      const cliPkg = JSON.parse(
        await fs.readFile(path.join(cliDir, 'package.json'), 'utf8'),
      ) as { name: string };
      expect(cliPkg.name).toBe(CLI_PKG_NAME);

      // Verify app was scaffolded by ph init (has powerhouse.config.json).
      await expect(
        fs.access(path.join(appDir, 'powerhouse.config.json')),
      ).resolves.toBeUndefined();

      // Verify app package name was patched to include scope.
      const appPkg = JSON.parse(
        await fs.readFile(path.join(appDir, 'package.json'), 'utf8'),
      ) as { name: string };
      expect(appPkg.name).toBe(APP_PKG_NAME);

      // Verify publish.config.ts was generated at the root.
      const publishConfig = await fs.readFile(
        path.join(workdir, 'publish.config.ts'),
        'utf8',
      );
      expect(publishConfig).toContain(`'${PROJECT_NAME}'`);
      expect(publishConfig).toContain(`'${PROJECT_NAME}-app'`);
      expect(publishConfig).toContain(`'${PROJECT_NAME}-cli'`);

      console.log(`[step 4] Project generated: cli=${CLI_PKG_NAME}, app=${APP_PKG_NAME}`);
    },
    PUBLISH_TIMEOUT,
  );

  // ── Step 5: bump version and trigger a dev publish ──

  it(
    'dispatches BUMP_VERSION + PUBLISH_DEV',
    async () => {
      console.log(`[step 5] Dispatching BUMP_VERSION (${BASE_VERSION}) + PUBLISH_DEV...`);
      const publishRecordId = 'e2e-publish-1';

      await gql(url, MUTATE, {
        id: docId,
        actions: [
          action('BUMP_VERSION', { version: BASE_VERSION }),
          action('PUBLISH_DEV', {
            id: publishRecordId,
            timestamp: new Date().toISOString(),
          }),
        ],
      });

      // Verify the publish record was created with Pending status.
      const state = (await getDocState(url, docId)) as {
        version: string;
        publishHistory: Array<{ id: string; tag: string; status: string; version: string }>;
      };
      expect(state.version).toBe(BASE_VERSION);
      expect(state.publishHistory).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: publishRecordId,
            tag: 'Dev',
            status: 'Pending',
            version: BASE_VERSION,
          }),
        ]),
      );
      console.log(`[step 5] Publish record created: id=${state.publishHistory[0]?.id}, tag=${state.publishHistory[0]?.tag}, status=${state.publishHistory[0]?.status}`);
    },
    ACTION_TIMEOUT,
  );

  // ── Step 6: verify the publish trigger completes ──

  it(
    'publish trigger installs, builds, and publishes the package',
    async () => {
      console.log('[step 6] Waiting for publish trigger to complete (install + build + publish)...');
      // The publish trigger runs on the routine loop. It will:
      //   1. Mark the record InProgress
      //   2. Run pnpm install in the generated project
      //   3. Invoke the publish pipeline (build + publish)
      //   4. Mark Succeeded or Failed
      let lastStatus = '';
      await poll(
        async () => {
          const state = (await getDocState(url, docId)) as {
            publishHistory: Array<{ id: string; status: string }>;
          };
          const record = state.publishHistory.find(
            (r) => r.id === 'e2e-publish-1',
          );
          if (record && record.status !== lastStatus) {
            lastStatus = record.status;
            console.log(`[step 6] Publish status changed: ${record.status}`);
          }
          return !!record && record.status !== 'Pending' && record.status !== 'InProgress';
        },
        PUBLISH_TIMEOUT,
        'waiting for publish trigger to complete',
      );

      const state = (await getDocState(url, docId)) as {
        publishHistory: Array<{ id: string; status: string; version: string }>;
      };
      const record = state.publishHistory.find(
        (r) => r.id === 'e2e-publish-1',
      );
      console.log(`[step 6] Publish complete: status=${record?.status}, version=${record?.version}`);
      expect(record?.status).toBe('Succeeded');
    },
    PUBLISH_TIMEOUT,
  );

  // ── Step 7: verify the package is on npm ──

  it(
    'published CLI package is available on npm',
    async () => {
      console.log(`[step 7] Waiting for ${CLI_PKG_NAME}@${expectedVersion} on npm registry...`);
      await waitForVersionOnNpm(CLI_PKG_NAME, expectedVersion, NPM_PROPAGATION_TIMEOUT);
      console.log(`[step 7] ${CLI_PKG_NAME}@${expectedVersion} found on npm.`);

      console.log(`[step 7] Waiting for ${APP_PKG_NAME}@${expectedVersion} on npm registry...`);
      await waitForVersionOnNpm(APP_PKG_NAME, expectedVersion, NPM_PROPAGATION_TIMEOUT);
      console.log(`[step 7] ${APP_PKG_NAME}@${expectedVersion} found on npm.`);

      publishedVersion = expectedVersion;
    },
    NPM_PROPAGATION_TIMEOUT + 10_000,
  );

  // ── Step 8: install and run the published CLI ──

  it(
    'installs and runs the published CLI',
    async () => {
      console.log(`[step 8] Installing ${CLI_PKG_NAME}@${publishedVersion} in a fresh directory...`);
      const installDir = await fs.mkdtemp(
        path.join(os.tmpdir(), 'ph-clint-e2e-install-'),
      );
      try {
        // Initialize a minimal package.json so npm install works.
        await fs.writeFile(
          path.join(installDir, 'package.json'),
          JSON.stringify({ name: 'e2e-install-test', private: true }),
        );

        // Install the published CLI package.
        console.log(`[step 8] Running: npm install ${CLI_PKG_NAME}@${publishedVersion} (in ${installDir})`);
        execSync(
          `npm install ${CLI_PKG_NAME}@${publishedVersion}`,
          { cwd: installDir, encoding: 'utf8', timeout: 120_000 },
        );
        console.log('[step 8] npm install succeeded.');

        // Verify the installed version matches what we published.
        const installedPkg = JSON.parse(
          await fs.readFile(
            path.join(installDir, 'node_modules', CLI_PKG_NAME, 'package.json'),
            'utf8',
          ),
        ) as { version: string };
        expect(installedPkg.version).toBe(publishedVersion);
        console.log(`[step 8] Installed version: ${installedPkg.version}`);

        // Run the CLI binary with --version.
        const binPath = path.join(installDir, 'node_modules', '.bin', PROJECT_NAME);
        console.log(`[step 8] Running: ${binPath} --version`);
        const versionOutput = execSync(
          `${binPath} --version`,
          { encoding: 'utf8', timeout: 10_000 },
        ).trim();
        console.log(`[step 8] CLI output: ${versionOutput}`);

        // The --version output should contain the published version.
        expect(versionOutput).toContain(publishedVersion);
      } finally {
        await fs.rm(installDir, { recursive: true, force: true }).catch(() => {});
      }
    },
    180_000,
  );
});
