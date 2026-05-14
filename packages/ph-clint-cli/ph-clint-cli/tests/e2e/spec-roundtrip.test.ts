/**
 * E2E test — spec document ↔ spec JSON round-trip.
 *
 * 1. Start ph-clint-cli (Reactor + Switchboard + routine loop).
 * 2. Create a `powerhouse/ph-clint-project` document and populate it
 *    via IMPORT_SPEC with ALL fields (including mainAgent, subAgents,
 *    enableChat, deployment fields).
 * 3. Wait for the spec-change trigger to generate the project on disk.
 * 4. Read the generated project-spec.json and verify every field
 *    matches the document state.
 * 5. Stop ph-clint-cli, delete the workdir's .ph/ (reactor state).
 * 6. Restart ph-clint-cli — it should discover the spec JSON and
 *    recreate the document from it.
 * 7. Query the document via GraphQL and verify the full spec is
 *    restored identically.
 */
import { describe, it, expect, afterAll, beforeAll } from '@jest/globals';
import { spawn, type ChildProcess } from 'node:child_process';
import fsSync from 'node:fs';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

// ── Logging ─────────────────────────────────────────────────────────────

const WRITE_TO_LOG = true;
const LOG_FILE = path.resolve(
  import.meta.dirname,
  `../../spec-roundtrip-e2e-${new Date().toISOString().replace(/[:.]/g, '-')}.log`,
);

let logFd: number | null = null;
if (WRITE_TO_LOG) {
  logFd = fsSync.openSync(LOG_FILE, 'w');
  fsSync.writeSync(logFd, `=== E2E spec-roundtrip test loaded at ${new Date().toISOString()} ===\n`);
}

function log(msg: string): void {
  const ts = new Date().toISOString();
  const line = `[${ts}] ${msg}\n`;
  console.log(msg);
  if (WRITE_TO_LOG && logFd !== null) {
    fsSync.writeSync(logFd, line);
  }
}

// ── Constants ───────────────────────────────────────────────────────────

const CLI_DIR = path.resolve(import.meta.dirname, '../..');
const STARTUP_TIMEOUT = 60_000;
const ACTION_TIMEOUT = 30_000;
const TRIGGER_TIMEOUT = 120_000;
const POLL_INTERVAL = 2_000;

// ── Test spec data ──────────────────────────────────────────────────────

const SPEC_INPUT = {
  name: 'ph-roundtrip-test-cli',
  scope: '@powerhousedao',
  version: '0.5.0',
  description: 'Roundtrip e2e test project',
  powerhouse: 'Switchboard',
  mastraEnabled: true,
  routineEnabled: true,
  packages: [
    {
      id: 'pkg-app',
      packageName: '@powerhousedao/ph-roundtrip-test-app',
      documentTypes: ['powerhouse/ph-clint-project', 'powerhouse/chat-session'],
      version: '0.5.0',
    },
    {
      id: 'pkg-clint-common',
      packageName: '@powerhousedao/clint-common',
      documentTypes: ['powerhouse/chat-session'],
    },
  ],
  externalSkills: [
    {
      id: 'sk-playwright',
      name: 'playwright-cli',
      githubUrl: 'https://github.com/anthropics/playwright-cli',
    },
  ],
  models: [
    { id: 'anthropic/claude-sonnet-4-5' },
    { id: 'openai/gpt-4o' },
  ],
  profiles: [
    { id: 'base', title: 'Base Profile', content: 'You are a helpful assistant.' },
    { id: 'code-review', title: 'Code Review', content: 'Review code for bugs.' },
  ],
  mainAgent: {
    id: 'roundtrip-agent',
    name: 'Roundtrip Agent',
    description: 'An agent for testing spec round-trips end-to-end.',
    image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    modelId: 'anthropic/claude-sonnet-4-5',
    profileIds: ['base', 'code-review'],
    skills: [],
    toolPatterns: [],
  },
  subAgents: [
    {
      id: 'summarizer',
      name: 'Summarizer',
      description: 'Summarizes content.',
      modelId: 'openai/gpt-4o',
      profileIds: ['base'],
      skills: ['playwright-cli'],
      toolPatterns: ['cli-docs'],
    },
  ],
  enableChat: true,
  proxyEnabled: true,
  supportedResources: ['vetra-agent-s', 'vetra-agent-m', 'vetra-agent-l'],
};

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

const FIND_DOCS = `query ($type: String!) {
  findDocuments(search: { type: $type }) {
    items { id name }
  }
}`;

const GET_OPS = `query ($id: String!) {
  document(identifier: $id) {
    document {
      operations {
        items { action { type scope } }
      }
    }
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
        reject(new Error(`Startup timed out.\nLast output:\n${output.slice(-30).join('\n')}`));
      }
    }, STARTUP_TIMEOUT);

    function onData(chunk: Buffer) {
      for (const line of chunk.toString().split('\n')) {
        if (line.trim()) {
          output.push(line.trim());
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
        reject(new Error(`CLI exited (code ${code}) before ready.\n${output.slice(-30).join('\n')}`));
      }
    });
  });
}

async function killCli(cli: CliInstance): Promise<void> {
  cli.proc.kill('SIGTERM');
  const exited = await Promise.race([
    new Promise<boolean>((r) => cli.proc.on('exit', () => r(true))),
    new Promise<boolean>((r) => setTimeout(() => r(false), 3000)),
  ]);
  if (!exited) cli.proc.kill('SIGKILL');
  await new Promise<void>((r) => {
    if (cli.proc.exitCode !== null) { r(); return; }
    cli.proc.on('exit', () => r());
    setTimeout(r, 5000);
  });
}

/** Run a one-shot CLI command (e.g. ph-clint-studio-stop) and wait for exit. */
async function runCliCommand(workdirArg: string, ...args: string[]): Promise<{ code: number | null; output: string }> {
  return new Promise((resolve) => {
    const proc = spawn(
      'node',
      ['--import', 'tsx', 'src/main.ts', '--workdir', workdirArg, ...args],
      {
        cwd: CLI_DIR,
        env: { ...process.env, PH_CLINT_API_KEY: '', NODE_OPTIONS: '' },
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );
    const chunks: string[] = [];
    proc.stdout?.on('data', (d: Buffer) => chunks.push(d.toString()));
    proc.stderr?.on('data', (d: Buffer) => chunks.push(d.toString()));
    proc.on('exit', (code) => resolve({ code, output: chunks.join('') }));
    setTimeout(() => { proc.kill('SIGKILL'); resolve({ code: null, output: chunks.join('') }); }, 15_000);
  });
}

// ── Exhaustive shape check ───────────────────────────────────────────────

/**
 * Recursively collects all leaf key paths from an object.
 * Arrays produce a `[]` segment followed by their element keys.
 * e.g. { a: { b: [{ c: 1 }] } } → ['a.b[].c']
 */
function collectPaths(obj: unknown, prefix = ''): string[] {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return prefix ? [prefix] : [];
  }
  if (Array.isArray(obj)) {
    if (obj.length === 0) return prefix ? [prefix] : [];
    // Collect from first element as representative
    return collectPaths(obj[0], prefix + '[]');
  }
  const paths: string[] = [];
  for (const key of Object.keys(obj as Record<string, unknown>).sort()) {
    const child = (obj as Record<string, unknown>)[key];
    const childPrefix = prefix ? `${prefix}.${key}` : key;
    paths.push(...collectPaths(child, childPrefix));
  }
  return paths;
}

/**
 * The exhaustive set of leaf paths expected in project-spec.json.
 * If the spec gains new fields, this test MUST be updated — ensuring
 * new state is covered by the round-trip assertions above.
 */
const EXPECTED_SPEC_PATHS = new Set([
  'name',
  'scope',
  'version',
  'description',
  'features.powerhouse',
  'features.mastra.enabled',
  'features.mastra.mainAgent.id',
  'features.mastra.mainAgent.name',
  'features.mastra.mainAgent.description',
  'features.mastra.mainAgent.image',
  'features.mastra.mainAgent.modelId',
  'features.mastra.mainAgent.profileIds[]',
  // skills[] and toolPatterns[] collapse to the bare prefix when the array is
  // empty (collectPaths returns just the prefix for an empty array). The main
  // agent's skills/toolPatterns are commonly empty, so the bare-prefix path
  // is what appears in the spec JSON.
  'features.mastra.mainAgent.skills',
  'features.mastra.mainAgent.toolPatterns',
  'features.mastra.subAgents[].id',
  'features.mastra.subAgents[].name',
  'features.mastra.subAgents[].description',
  'features.mastra.subAgents[].modelId',
  'features.mastra.subAgents[].profileIds[]',
  'features.mastra.subAgents[].skills[]',
  'features.mastra.subAgents[].toolPatterns[]',
  'features.mastra.models[].id',
  'features.mastra.profiles[].id',
  'features.mastra.profiles[].title',
  'features.mastra.profiles[].content',
  'features.mastra.common.enableChat',
  'features.routine.enabled',
  'packages[].id',
  'packages[].packageName',
  'packages[].documentTypes[]',
  'packages[].version',
  'externalSkills[].id',
  'externalSkills[].name',
  'externalSkills[].githubUrl',
  'deployment.proxyEnabled',
  'deployment.observabilityEnabled',
  'deployment.supportedResources[]',
  'documentId',
  'documentType',
]);

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

describe('Spec round-trip e2e — document ↔ spec JSON', () => {
  let cli: CliInstance;
  let workdir: string;
  let url: string;
  let docId: string;
  let firstRunDriveId: string;

  // The project dir where codegen writes files
  const projectName = 'ph-roundtrip-test-cli';
  const specRelPath = path.join('.ph', 'ph-clint-cli', 'project-spec.json');

  function assertNoStaleServices(instance: CliInstance): void {
    const stale = instance.output.find((line) => line.includes('already running'));
    if (stale) {
      throw new Error(
        `Stale service detected — a previous test run left a service running.\n` +
        `  Output: ${stale}\n` +
        `  Fix: run \`ph-clint ph-clint-studio-stop\` manually, or ensure test teardown shuts down services.`,
      );
    }
  }

  function projectDir(): string {
    return path.join(workdir, projectName);
  }

  function specJsonPath(): string {
    return path.join(projectDir(), specRelPath);
  }

  beforeAll(async () => {
    log('[setup] Creating temp workdir and starting ph-clint-cli...');
    if (WRITE_TO_LOG) {
      log(`[setup] Log file: ${LOG_FILE}`);
    }
    workdir = await fs.mkdtemp(path.join(os.tmpdir(), 'ph-clint-roundtrip-'));
    log(`[setup] Workdir: ${workdir}`);

    cli = await startCli(workdir);
    url = cli.switchboardUrl;
    assertNoStaleServices(cli);
    log(`[setup] Switchboard ready at ${url}`);
  }, STARTUP_TIMEOUT);

  afterAll(async () => {
    log('[teardown] Stopping CLI...');
    if (cli) await killCli(cli);

    // Stop the persistent Connect service (it survives CLI exit)
    if (workdir) {
      log('[teardown] Stopping Connect service...');
      const result = await runCliCommand(workdir, 'ph-clint-studio-stop');
      log(`[teardown] ph-clint-studio-stop exited (${result.code}): ${result.output.trim().slice(0, 200)}`);
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
  }, 45_000);

  // ── Phase 1: Document → spec JSON ──────────────────────────────────────

  it('creates a ph-clint-project document via the Switchboard', async () => {
    log('[step 1] Finding drive...');
    const driveData = await gql<{
      findDocuments: { items: Array<{ id: string; name: string }> };
    }>(url, `{
      findDocuments(search: { type: "powerhouse/document-drive" }) {
        items { id name }
      }
    }`);
    const drives = driveData.findDocuments.items;
    log(`[step 1] Found ${drives.length} drive(s): ${drives.map((d) => `${d.name} (${d.id})`).join(', ')}`);
    const driveId = (drives.find((d) => d.name === 'Clint') ?? drives[0]).id;
    firstRunDriveId = driveId;
    log(`[step 1] Drive ID: ${driveId}`);

    log(`[step 1] Creating document in drive ${driveId}...`);
    const createData = await gql<{
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
    docId = createData.createEmptyDocument.id;
    log(`[step 1] Created document: ${docId}`);
    expect(createData.createEmptyDocument.documentType).toBe('powerhouse/ph-clint-project');
  }, ACTION_TIMEOUT);

  it('populates the document with full spec via IMPORT_SPEC', async () => {
    log(`[step 2] Dispatching IMPORT_SPEC to ${docId}...`);
    await gql(url, MUTATE, {
      id: docId,
      actions: [action('IMPORT_SPEC', SPEC_INPUT)],
    });

    const state = await getDocState(url, docId) as Record<string, unknown>;
    log(`[step 2] Document state name=${state.name}, version=${state.version}`);
    expect(state.name).toBe(SPEC_INPUT.name);
    expect(state.version).toBe(SPEC_INPUT.version);
  }, ACTION_TIMEOUT);

  it('spec-change trigger generates the project with spec JSON on disk', async () => {
    log(`[step 3] Waiting for spec-change trigger to write ${specJsonPath()}...`);

    let pollCount = 0;
    await poll(
      async () => {
        pollCount++;
        try {
          await fs.access(specJsonPath());
          if (pollCount % 3 === 0) log(`[step 3] Poll #${pollCount}: spec JSON found`);
          return true;
        } catch {
          if (pollCount % 5 === 0) log(`[step 3] Poll #${pollCount}: not yet`);
          return false;
        }
      },
      TRIGGER_TIMEOUT,
      'waiting for spec-change trigger to write project-spec.json',
    );

    log(`[step 3] Spec JSON exists at ${specJsonPath()}`);
  }, TRIGGER_TIMEOUT + 5_000);

  it('spec JSON contains all fields from the document', async () => {
    const raw = await fs.readFile(specJsonPath(), 'utf8');
    const spec = JSON.parse(raw) as Record<string, unknown>;
    log(`[step 4] Spec JSON keys: ${Object.keys(spec).join(', ')}`);

    // Identity
    expect(spec.name).toBe(SPEC_INPUT.name);
    expect(spec.scope).toBe(SPEC_INPUT.scope);
    expect(spec.version).toBe(SPEC_INPUT.version);
    expect(spec.description).toBe(SPEC_INPUT.description);

    // Features
    const features = spec.features as Record<string, unknown>;
    expect(features.powerhouse).toBe(SPEC_INPUT.powerhouse);
    expect(features.routine).toEqual({ enabled: true });

    const mastra = features.mastra as Record<string, unknown>;
    expect(mastra.enabled).toBe(true);
    expect(mastra.mainAgent).toEqual(SPEC_INPUT.mainAgent);
    expect(mastra.subAgents).toEqual(SPEC_INPUT.subAgents);
    expect(mastra.models).toEqual(SPEC_INPUT.models);
    expect(mastra.profiles).toEqual(SPEC_INPUT.profiles);

    const common = mastra.common as Record<string, unknown>;
    expect(common.enableChat).toBe(true);

    // Packages — the managed flag is derived by the reducer, not in the spec JSON.
    // Just verify names and document types are present.
    const packages = spec.packages as Array<Record<string, unknown>>;
    const appPkg = packages.find((p) => p.packageName === '@powerhousedao/ph-roundtrip-test-app');
    expect(appPkg).toBeDefined();
    expect(appPkg!.documentTypes).toEqual(
      expect.arrayContaining(['powerhouse/ph-clint-project', 'powerhouse/chat-session']),
    );

    const ccPkg = packages.find((p) => p.packageName === '@powerhousedao/clint-common');
    expect(ccPkg).toBeDefined();
    expect((ccPkg!.documentTypes as string[])).toContain('powerhouse/chat-session');

    // External skills
    const skills = spec.externalSkills as Array<Record<string, unknown>>;
    expect(skills).toHaveLength(1);
    expect(skills[0].name).toBe('playwright-cli');
    expect(skills[0].githubUrl).toBe('https://github.com/anthropics/playwright-cli');

    // Deployment
    const deployment = spec.deployment as Record<string, unknown>;
    expect(deployment.proxyEnabled).toBe(true);
    expect(deployment.supportedResources).toEqual(['vetra-agent-s', 'vetra-agent-m', 'vetra-agent-l']);

    // Document link
    expect(spec.documentId).toBe(docId);
    expect(spec.documentType).toBe('powerhouse/ph-clint-project');

    log(`[step 4] All spec JSON fields verified`);

    // Exhaustive shape guard: fail if spec has unexpected paths
    const actualPaths = new Set(collectPaths(spec));
    const unexpected = [...actualPaths].filter((p) => !EXPECTED_SPEC_PATHS.has(p));
    const missing = [...EXPECTED_SPEC_PATHS].filter((p) => !actualPaths.has(p));
    if (unexpected.length > 0) {
      log(`[step 4] UNEXPECTED paths in spec JSON: ${unexpected.join(', ')}`);
    }
    if (missing.length > 0) {
      log(`[step 4] MISSING paths in spec JSON: ${missing.join(', ')}`);
    }
    expect(unexpected).toEqual([]);
    expect(missing).toEqual([]);
    log(`[step 4] Exhaustive shape check passed (${actualPaths.size} paths)`);
  });

  // ── Phase 2: spec JSON → Document (recovery) ────────────────────────────

  it('stops CLI and deletes reactor state (.ph/ in workdir)', async () => {
    log(`[step 5] Stopping CLI...`);
    await killCli(cli);
    log(`[step 5] CLI stopped`);

    // Stop the persistent Connect service before restart
    log(`[step 5] Stopping Connect service...`);
    const stopResult = await runCliCommand(workdir, 'ph-clint-studio-stop');
    log(`[step 5] ph-clint-studio-stop exited (${stopResult.code})`);

    // Delete the CLI's reactor state — NOT the project's .ph/ folder
    const reactorState = path.join(workdir, '.ph');
    log(`[step 5] Deleting reactor state: ${reactorState}`);
    await fs.rm(reactorState, { recursive: true, force: true });

    // Verify it's gone
    const stateExists = await fs.access(reactorState).then(() => true, () => false);
    expect(stateExists).toBe(false);

    // Verify the project's spec JSON is still there
    const specExists = await fs.access(specJsonPath()).then(() => true, () => false);
    expect(specExists).toBe(true);
    log(`[step 5] Reactor state deleted, project spec JSON intact`);
  });

  it('restarts CLI — it bootstraps from the spec JSON', async () => {
    log(`[step 6] Restarting CLI with same workdir...`);
    cli = await startCli(workdir);
    url = cli.switchboardUrl;
    assertNoStaleServices(cli);
    log(`[step 6] CLI restarted, Switchboard at ${url}`);
  }, STARTUP_TIMEOUT);

  it('the spec document is fully restored from the spec JSON', async () => {
    // Verify drive ID is the same as the first run (deterministic)
    const driveData = await gql<{
      findDocuments: { items: Array<{ id: string; name: string }> };
    }>(url, `{
      findDocuments(search: { type: "powerhouse/document-drive" }) {
        items { id name }
      }
    }`);
    const secondRunDriveId = driveData.findDocuments.items[0]?.id;
    log(`[step 7] Second run drive ID: ${secondRunDriveId} (first run: ${firstRunDriveId})`);
    expect(secondRunDriveId).toBe(firstRunDriveId);

    log(`[step 7] Waiting for bootstrap to recreate the document...`);

    let newDocId: string | undefined;
    let pollCount = 0;

    await poll(
      async () => {
        pollCount++;
        try {
          const data = await gql<{
            findDocuments: { items: Array<{ id: string; name: string }> };
          }>(url, FIND_DOCS, { type: 'powerhouse/ph-clint-project' });
          const docs = data.findDocuments.items;
          if (docs.length > 0) {
            newDocId = docs[0].id;
            if (pollCount % 3 === 0) log(`[step 7] Poll #${pollCount}: found document ${newDocId}`);
            // Verify the document has been populated (name != null)
            const state = await getDocState(url, newDocId) as { name: string | null };
            return state.name === SPEC_INPUT.name;
          }
          if (pollCount % 5 === 0) log(`[step 7] Poll #${pollCount}: no documents yet`);
          return false;
        } catch (err) {
          if (pollCount % 5 === 0) log(`[step 7] Poll #${pollCount}: error: ${err}`);
          return false;
        }
      },
      TRIGGER_TIMEOUT,
      'waiting for document to be recreated from spec JSON',
    );

    expect(newDocId).toBeDefined();
    log(`[step 7] Document recreated: ${newDocId}`);

    // Now verify all fields match the original
    const state = await getDocState(url, newDocId!) as Record<string, unknown>;

    // Identity
    expect(state.name).toBe(SPEC_INPUT.name);
    expect(state.scope).toBe(SPEC_INPUT.scope);
    expect(state.version).toBe(SPEC_INPUT.version);
    expect(state.description).toBe(SPEC_INPUT.description);

    // Features
    const features = state.features as Record<string, unknown>;
    expect(features.powerhouse).toBe(SPEC_INPUT.powerhouse);
    expect(features.routine).toEqual(expect.objectContaining({ enabled: true }));

    const mastra = features.mastra as Record<string, unknown>;
    expect(mastra.enabled).toBe(true);
    expect(mastra.mainAgent).toEqual(SPEC_INPUT.mainAgent);
    expect(mastra.subAgents).toEqual(SPEC_INPUT.subAgents);
    expect(mastra.models).toEqual(SPEC_INPUT.models);
    expect(mastra.profiles).toEqual(SPEC_INPUT.profiles);

    const common = mastra.common as Record<string, unknown>;
    expect(common.enableChat).toBe(true);

    // Packages
    const packages = state.packages as Array<Record<string, unknown>>;
    const appPkg = packages.find((p) => p.packageName === '@powerhousedao/ph-roundtrip-test-app');
    expect(appPkg).toBeDefined();
    expect(appPkg!.documentTypes).toEqual(
      expect.arrayContaining(['powerhouse/ph-clint-project', 'powerhouse/chat-session']),
    );

    const ccPkg = packages.find((p) => p.packageName === '@powerhousedao/clint-common');
    expect(ccPkg).toBeDefined();
    expect((ccPkg!.documentTypes as string[])).toContain('powerhouse/chat-session');

    // External skills
    const skills = state.externalSkills as Array<Record<string, unknown>>;
    expect(skills).toHaveLength(1);
    expect(skills[0]).toEqual(expect.objectContaining({
      id: 'sk-playwright',
      name: 'playwright-cli',
      githubUrl: 'https://github.com/anthropics/playwright-cli',
    }));

    // Deployment
    const deployment = state.deployment as Record<string, unknown>;
    expect(deployment.proxyEnabled).toBe(true);
    expect(deployment.supportedResources).toEqual(['vetra-agent-s', 'vetra-agent-m', 'vetra-agent-l']);

    log(`[step 7] All document fields verified — round-trip complete!`);

    // Also verify the spec JSON on disk was updated with the new documentId
    const updatedSpec = JSON.parse(await fs.readFile(specJsonPath(), 'utf8')) as { documentId?: string };
    expect(updatedSpec.documentId).toBe(newDocId);
    log(`[step 7] Spec JSON updated with new documentId: ${updatedSpec.documentId}`);

    const opsData = await gql<{
      document: {
        document: {
          operations: { items: Array<{ action: { type: string; scope: string } }> };
        };
      };
    }>(url, GET_OPS, { id: newDocId });
    const opItems = opsData.document.document.operations.items;
    const docScopeTypes = opItems
      .filter((o) => o.action.scope === 'document')
      .map((o) => o.action.type);
    log(`[step 7] document-scope op types: ${docScopeTypes.join(', ')}`);
    expect(docScopeTypes).toContain('CREATE_DOCUMENT');
    expect(docScopeTypes).toContain('UPGRADE_DOCUMENT');
  }, TRIGGER_TIMEOUT + 10_000);
});
