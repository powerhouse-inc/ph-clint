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
import fsSync from 'node:fs';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

// ── Logging ─────────────────────────────────────────────────────────────

const WRITE_TO_LOG = true;
const LOG_FILE = path.resolve(
  import.meta.dirname,
  `../../switchboard-e2e-${new Date().toISOString().replace(/[:.]/g, '-')}.log`,
);

let logFd: number | null = null;

function log(msg: string): void {
  const ts = new Date().toISOString();
  const line = `[${ts}] ${msg}\n`;
  console.log(msg);
  if (WRITE_TO_LOG) {
    if (logFd === null) {
      logFd = fsSync.openSync(LOG_FILE, 'w');
      fsSync.writeSync(logFd, `=== E2E switchboard test started at ${ts} ===\n`);
    }
    fsSync.writeSync(logFd, line);
  }
}

function logCliOutput(cli: CliInstance, label: string, lastN = 50): void {
  const recent = cli.output.slice(-lastN);
  log(`--- ${label}: last ${recent.length} CLI output lines ---`);
  for (const line of recent) {
    log(`  cli> ${line}`);
  }
  log(`--- end ${label} ---`);
}

// ── Constants ───────────────────────────────────────────────────────────

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

async function npmRegistryView(
  packageName: string,
): Promise<Record<string, unknown> | null> {
  const encoded = packageName.replace('/', '%2f');
  const res = await fetch(`https://registry.npmjs.org/${encoded}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`npm registry HTTP ${res.status}`);
  return (await res.json()) as Record<string, unknown>;
}

async function getDevTaggedVersion(
  packageName: string,
): Promise<string | null> {
  const data = await npmRegistryView(packageName);
  if (!data) return null;
  const distTags = data['dist-tags'] as Record<string, string> | undefined;
  return distTags?.dev ?? null;
}

async function getAllVersions(
  packageName: string,
): Promise<string[]> {
  const data = await npmRegistryView(packageName);
  if (!data) return [];
  const versions = data.versions as Record<string, unknown> | undefined;
  return versions ? Object.keys(versions) : [];
}

async function waitForVersionOnNpm(
  packageName: string,
  version: string,
  timeoutMs: number,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  let attempt = 0;
  while (Date.now() < deadline) {
    attempt++;
    const data = await npmRegistryView(packageName);
    if (data) {
      const versions = data.versions as Record<string, unknown> | undefined;
      const distTags = data['dist-tags'] as Record<string, string> | undefined;
      if (versions && version in versions) {
        log(`[npm] ${packageName}@${version} found on attempt ${attempt}`);
        return;
      }
      if (attempt % 6 === 0) {
        const knownVersions = versions ? Object.keys(versions) : [];
        log(`[npm] attempt ${attempt}: ${packageName} has ${knownVersions.length} versions (latest: ${knownVersions.at(-1) ?? 'none'}, dev tag: ${distTags?.dev ?? 'none'}), waiting for ${version}`);
      }
    } else {
      if (attempt % 6 === 0) {
        log(`[npm] attempt ${attempt}: ${packageName} returns 404`);
      }
    }
    await new Promise((r) => setTimeout(r, 5_000));
  }
  throw new Error(
    `${packageName}@${version} not visible on npm after ${timeoutMs / 1000}s (${attempt} attempts)`,
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
        if (line.trim()) {
          output.push(line.trim());
          // Stream CLI output to the log in real time
          if (WRITE_TO_LOG && logFd !== null) {
            fsSync.writeSync(logFd, `  cli> ${line.trim()}\n`);
          }
        }
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
  let expectedVersion: string;
  let publishedVersion: string;

  beforeAll(async () => {
    log('[setup] Creating temp workdir and starting ph-clint-cli...');
    if (WRITE_TO_LOG) {
      log(`[setup] Log file: ${LOG_FILE}`);
    }
    workdir = await fs.mkdtemp(path.join(os.tmpdir(), 'ph-clint-e2e-'));
    log(`[setup] Workdir: ${workdir}`);

    cli = await startCli(workdir);
    url = cli.switchboardUrl;
    log(`[setup] Switchboard ready at ${url}`);

    // Query npm for current state
    const currentDev = await getDevTaggedVersion(CLI_PKG_NAME);
    const allVersions = await getAllVersions(CLI_PKG_NAME);
    log(`[setup] ${CLI_PKG_NAME} npm state: dev=${currentDev ?? '<none>'}, all versions=[${allVersions.join(', ')}]`);

    if (currentDev && currentDev.startsWith(`${BASE_VERSION}-dev.`)) {
      const n = parseInt(currentDev.split('-dev.')[1], 10);
      expectedVersion = `${BASE_VERSION}-dev.${n + 1}`;
    } else {
      expectedVersion = `${BASE_VERSION}-dev.0`;
    }
    log(`[setup] Expected next version: ${expectedVersion}`);
  }, STARTUP_TIMEOUT);

  afterAll(async () => {
    log('[teardown] Stopping CLI...');
    if (cli) {
      logCliOutput(cli, 'final CLI output');
      await killCli(cli);
    }
    if (workdir) {
      log(`[teardown] Cleaning up workdir: ${workdir}`);
      await fs.rm(workdir, { recursive: true, force: true }).catch(() => {});
    }
    if (logFd !== null) {
      log('[teardown] Done.');
      fsSync.closeSync(logFd);
      logFd = null;
    }
  }, 30_000);

  // ── Step 1: discover the drive ──

  it('finds the Clint drive', async () => {
    log('[step 1] Querying Switchboard for document drives...');
    const data = await gql<{
      findDocuments: { items: Array<{ id: string; name: string }> };
    }>(url, `{
      findDocuments(search: { type: "powerhouse/document-drive" }) {
        items { id name }
      }
    }`);
    const drives = data.findDocuments.items;
    log(`[step 1] Found ${drives.length} drive(s): ${drives.map((d) => `${d.name} (${d.id})`).join(', ')}`);
    expect(drives.length).toBeGreaterThanOrEqual(1);
    driveId = (drives.find((d) => d.name === 'Clint') ?? drives[0]).id;
    log(`[step 1] Using drive: ${driveId}`);
  });

  // ── Step 2: create the project document ──

  it('creates a ph-clint-project document', async () => {
    log(`[step 2] Creating powerhouse/ph-clint-project document in drive ${driveId}...`);
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
    log(`[step 2] Created document: ${docId} (type=${data.createEmptyDocument.documentType})`);
  });

  // ── Step 3: populate identity + features ──

  it(
    'populates the project spec',
    async () => {
      log(`[step 3] Dispatching identity + feature actions to ${docId}...`);
      const mutResult = await gql(url, MUTATE, {
        id: docId,
        actions: [
          action('SET_PACKAGE_NAME', { name: PROJECT_NAME }),
          action('SET_SCOPE', { scope: PROJECT_SCOPE }),
          action('SET_DESCRIPTION', { description: 'E2E test project' }),
          action('SET_POWERHOUSE_LEVEL', { level: 'Reactor' }),
        ],
      });
      log(`[step 3] Mutation result: ${JSON.stringify(mutResult)}`);

      const state = await getDocState(url, docId);
      expect(state.name).toBe(PROJECT_NAME);
      expect(state.scope).toBe(PROJECT_SCOPE);
      log(`[step 3] Spec populated: @${state.scope}/${state.name}, features=${JSON.stringify(state.features)}`);
    },
    ACTION_TIMEOUT,
  );

  // ── Step 4: wait for codegen + app scaffolding ──

  it(
    'spec-change trigger generates the project and initializes the app',
    async () => {
      const projectDir = path.join(workdir, PROJECT_NAME);
      const cliDir = path.join(projectDir, `${PROJECT_NAME}-cli`);
      const appDir = path.join(projectDir, `${PROJECT_NAME}-app`);

      log(`[step 4] Waiting for codegen + ph init...`);
      log(`[step 4]   cli dir: ${cliDir}`);
      log(`[step 4]   app dir: ${appDir}`);

      let pollCount = 0;
      await poll(
        async () => {
          pollCount++;
          try {
            await fs.access(path.join(cliDir, 'package.json'));
            const raw = await fs.readFile(path.join(appDir, 'package.json'), 'utf8');
            const pkg = JSON.parse(raw) as { name: string };
            if (pollCount % 5 === 0) {
              log(`[step 4] Poll #${pollCount}: cli/package.json exists, app name="${pkg.name}" (want "${APP_PKG_NAME}")`);
            }
            return pkg.name === APP_PKG_NAME;
          } catch {
            if (pollCount % 5 === 0) {
              const cliExists = await fs.access(path.join(cliDir, 'package.json')).then(() => true, () => false);
              const appExists = await fs.access(path.join(appDir, 'package.json')).then(() => true, () => false);
              log(`[step 4] Poll #${pollCount}: cli/package.json=${cliExists}, app/package.json=${appExists}`);
            }
            return false;
          }
        },
        PUBLISH_TIMEOUT,
        'waiting for generated cli + scoped app package.json',
      );

      // Verify CLI package.json
      const cliPkg = JSON.parse(
        await fs.readFile(path.join(cliDir, 'package.json'), 'utf8'),
      ) as { name: string };
      expect(cliPkg.name).toBe(CLI_PKG_NAME);

      // Verify app was scaffolded by ph init
      await expect(
        fs.access(path.join(appDir, 'powerhouse.config.json')),
      ).resolves.toBeUndefined();

      // Verify app package name was patched
      const appPkg = JSON.parse(
        await fs.readFile(path.join(appDir, 'package.json'), 'utf8'),
      ) as { name: string };
      expect(appPkg.name).toBe(APP_PKG_NAME);

      // Verify project-spec.json was written with documentId
      const specJson = JSON.parse(
        await fs.readFile(
          path.join(projectDir, '.ph', 'ph-clint-cli', 'project-spec.json'),
          'utf8',
        ),
      ) as { documentId?: string; documentType?: string; name: string };
      expect(specJson.name).toBe(PROJECT_NAME);
      expect(specJson.documentId).toBe(docId);
      expect(specJson.documentType).toBe('powerhouse/ph-clint-project');

      // Verify publish.config.ts
      const publishConfig = await fs.readFile(
        path.join(projectDir, 'publish.config.ts'),
        'utf8',
      );
      expect(publishConfig).toContain(`'${PROJECT_NAME}'`);
      expect(publishConfig).toContain(`'${PROJECT_NAME}-app'`);
      expect(publishConfig).toContain(`'${PROJECT_NAME}-cli'`);

      log(`[step 4] Project generated at ${projectDir}: cli=${cliPkg.name}, app=${appPkg.name}`);
      log(`[step 4] publish.config.ts exists and references all packages`);
      log(`[step 4] project-spec.json written with documentId=${specJson.documentId}`);

      // Log the generated project structure
      const workdirContents = await fs.readdir(workdir);
      const projectContents = await fs.readdir(projectDir);
      log(`[step 4] Workdir contents: ${workdirContents.join(', ')}`);
      log(`[step 4] Project contents: ${projectContents.join(', ')}`);
    },
    PUBLISH_TIMEOUT,
  );

  // ── Step 5: bump version and trigger a dev publish ──

  it(
    'dispatches BUMP_VERSION + PUBLISH_DEV',
    async () => {
      log(`[step 5] Dispatching BUMP_VERSION (${BASE_VERSION}) + PUBLISH_DEV...`);
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

      const state = (await getDocState(url, docId)) as {
        version: string;
        publishHistory: Array<{ id: string; tag: string; status: string; version: string }>;
      };
      expect(state.version).toBe(BASE_VERSION);

      log(`[step 5] Document version: ${state.version}`);
      log(`[step 5] Publish history (${state.publishHistory.length} records):`);
      for (const r of state.publishHistory) {
        log(`[step 5]   id=${r.id} tag=${r.tag} status=${r.status} version=${r.version}`);
      }

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
    },
    ACTION_TIMEOUT,
  );

  // ── Step 6: verify the publish trigger completes ──

  it(
    'publish trigger installs, builds, and publishes the package',
    async () => {
      log('[step 6] Waiting for publish trigger to complete...');
      let lastStatus = '';
      let pollCount = 0;
      const outputLenAtStart = cli.output.length;

      await poll(
        async () => {
          pollCount++;
          const state = (await getDocState(url, docId)) as {
            publishHistory: Array<{ id: string; status: string; version: string }>;
          };
          const record = state.publishHistory.find(
            (r) => r.id === 'e2e-publish-1',
          );
          if (record && record.status !== lastStatus) {
            lastStatus = record.status;
            log(`[step 6] Publish status changed: ${record.status} (poll #${pollCount})`);
          }
          // Every 15 polls (~30s), log new CLI output lines
          if (pollCount % 15 === 0) {
            const newLines = cli.output.slice(outputLenAtStart);
            const publishLines = newLines.filter(
              (l) =>
                l.includes('[publish]') ||
                l.includes('publish') ||
                l.includes('Publishing') ||
                l.includes('Building') ||
                l.includes('Version:') ||
                l.includes('error') ||
                l.includes('failed') ||
                l.includes('✓') ||
                l.includes('✗') ||
                l.includes('⊘'),
            );
            if (publishLines.length > 0) {
              log(`[step 6] Poll #${pollCount}: ${publishLines.length} publish-related CLI lines since step start:`);
              for (const line of publishLines.slice(-20)) {
                log(`[step 6]   cli> ${line}`);
              }
            } else {
              log(`[step 6] Poll #${pollCount}: ${newLines.length} new CLI lines, none publish-related`);
            }
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
      log(`[step 6] Final publish record: status=${record?.status}, version=${record?.version}`);

      // Log ALL CLI output lines that appeared during the publish
      const publishOutput = cli.output.slice(outputLenAtStart);
      log(`[step 6] CLI output during publish (${publishOutput.length} lines):`);
      for (const line of publishOutput) {
        log(`[step 6]   cli> ${line}`);
      }

      // After checking the record, also query npm directly to see what's actually there
      const cliVersions = await getAllVersions(CLI_PKG_NAME);
      const appVersions = await getAllVersions(APP_PKG_NAME);
      const cliDevTag = await getDevTaggedVersion(CLI_PKG_NAME);
      const appDevTag = await getDevTaggedVersion(APP_PKG_NAME);
      log(`[step 6] npm state after publish:`);
      log(`[step 6]   ${CLI_PKG_NAME}: versions=[${cliVersions.join(', ')}], dev=${cliDevTag ?? '<none>'}`);
      log(`[step 6]   ${APP_PKG_NAME}: versions=[${appVersions.join(', ')}], dev=${appDevTag ?? '<none>'}`);
      log(`[step 6]   Expected version: ${expectedVersion}`);

      expect(record?.status).toBe('Succeeded');
    },
    PUBLISH_TIMEOUT,
  );

  // ── Step 7: verify the package is on npm ──

  it(
    'published CLI package is available on npm',
    async () => {
      log(`[step 7] Checking npm for ${CLI_PKG_NAME}@${expectedVersion}...`);

      // First, check current state before waiting
      const cliVersionsBefore = await getAllVersions(CLI_PKG_NAME);
      const appVersionsBefore = await getAllVersions(APP_PKG_NAME);
      log(`[step 7] Current npm versions:`);
      log(`[step 7]   CLI: [${cliVersionsBefore.join(', ')}]`);
      log(`[step 7]   App: [${appVersionsBefore.join(', ')}]`);

      if (!cliVersionsBefore.includes(expectedVersion)) {
        log(`[step 7] ${expectedVersion} not yet visible, waiting...`);
      }

      await waitForVersionOnNpm(CLI_PKG_NAME, expectedVersion, NPM_PROPAGATION_TIMEOUT);
      log(`[step 7] ${CLI_PKG_NAME}@${expectedVersion} confirmed on npm`);

      await waitForVersionOnNpm(APP_PKG_NAME, expectedVersion, NPM_PROPAGATION_TIMEOUT);
      log(`[step 7] ${APP_PKG_NAME}@${expectedVersion} confirmed on npm`);

      publishedVersion = expectedVersion;
    },
    NPM_PROPAGATION_TIMEOUT + 10_000,
  );

  // ── Step 8: install and run the published CLI ──

  it(
    'installs and runs the published CLI',
    async () => {
      log(`[step 8] Installing ${CLI_PKG_NAME}@${publishedVersion}...`);
      const installDir = await fs.mkdtemp(
        path.join(os.tmpdir(), 'ph-clint-e2e-install-'),
      );
      log(`[step 8] Install dir: ${installDir}`);
      try {
        await fs.writeFile(
          path.join(installDir, 'package.json'),
          JSON.stringify({ name: 'e2e-install-test', private: true }),
        );

        log(`[step 8] Running: npm install ${CLI_PKG_NAME}@${publishedVersion}`);
        const installOutput = execSync(
          `npm install ${CLI_PKG_NAME}@${publishedVersion}`,
          { cwd: installDir, encoding: 'utf8', timeout: 120_000 },
        );
        log(`[step 8] npm install output: ${installOutput.trim().split('\n').slice(-5).join(' | ')}`);

        const installedPkg = JSON.parse(
          await fs.readFile(
            path.join(installDir, 'node_modules', CLI_PKG_NAME, 'package.json'),
            'utf8',
          ),
        ) as { version: string };
        expect(installedPkg.version).toBe(publishedVersion);
        log(`[step 8] Installed version: ${installedPkg.version}`);

        const binPath = path.join(installDir, 'node_modules', '.bin', PROJECT_NAME);
        log(`[step 8] Running: ${binPath} --version`);
        const versionOutput = execSync(
          `${binPath} --version`,
          { encoding: 'utf8', timeout: 10_000 },
        ).trim();
        log(`[step 8] CLI --version output: "${versionOutput}"`);

        expect(versionOutput).toContain(publishedVersion);
      } finally {
        await fs.rm(installDir, { recursive: true, force: true }).catch(() => {});
      }
    },
    180_000,
  );
});
