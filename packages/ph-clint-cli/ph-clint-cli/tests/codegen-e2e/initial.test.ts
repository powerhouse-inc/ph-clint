/**
 * E2E tests for initial (create-mode) codegen.
 *
 * For each fixture: generate → scaffold app (PH) → rewrite deps →
 * pnpm install → tsc → pnpm start --help → assert regex patterns.
 *
 * Then: runtime verification — boot the CLI, exercise the config subsystem,
 * start reactor/switchboard/connect, prompt the demo agent, and make live
 * HTTP requests to the Switchboard GraphQL/MCP and Connect web endpoints.
 *
 * These tests are slow (pnpm install + tsc per fixture) and should be
 * run separately from the fast unit/integration suite.
 */
import path from 'node:path';
import fs from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { describe, it, expect, afterAll } from '@jest/globals';
import { generateProject } from '../../src/codegen/index.js';
import { clintProjectSpecSchema } from '../../src/spec/types.js';
import { runPostGenActions, type PostGenActionKind } from '@powerhousedao/ph-clint-dev/codegen/actions';
import { FIXTURES } from './fixtures.js';
import { getBinName } from '../../src/spec/types.js';
import {
  mkTmpDir,
  rmRf,
  fileTree,
  rewriteLocalDeps,
  runHelp,
  runCommand,
  runMeta,
  runInteractive,
  pathExists,
  withLiveProcess,
  httpGet,
  httpPost,
  defaultPort,
} from './helpers.js';

const tmpDirs: string[] = [];
afterAll(async () => {
  await Promise.all(tmpDirs.map(rmRf));
}, 120_000);

/**
 * Per-fixture regex patterns that `pnpm start --help` output must match.
 */
const HELP_PATTERNS: Record<string, RegExp[]> = {
  minimal: [
    /test-minimal/,
    /0\.0\.1-dev\.0/,
    /--verbose/,
    /--meta/,
  ],
  'mastra-demo': [
    /test-mastra-demo/,
    /--resume/,
    /--interactive/,
    /config/,
  ],
  'mastra-configured': [
    /test-mastra-cfg/,
    /--resume/,
    /config/,
  ],
  'mastra-multi-model': [
    /test-multi/,
    /--resume/,
    /ANTHROPIC_API_KEY/,
    /OPENAI_API_KEY/,
    /config/,
  ],
  'reactor-minimal': [
    /test-reactor/,
    /--verbose/,
  ],
  switchboard: [
    /test-switchboard/,
    /--resume/,
    /--no-api/,
    /config/,
  ],
  'chat-switchboard': [
    /test-chat/,
    /--resume/,
    /--no-api/,
    /config/,
  ],
  'connect-full': [
    /test-connect/,
    /--resume/,
    /--no-api/,
    /--no-studio/,
    /ANTHROPIC_API_KEY/,
    /OPENAI_API_KEY/,
    /config/,
  ],
};

/** Files that MUST be present for a fixture (key structural assertions). */
const REQUIRED_FILES: Record<string, string[]> = {
  minimal: [
    'package.json',
    'src/cli.ts',
    'src/config.ts',
    'src/framework.ts',
    'src/main.ts',
    'src/mastra/index.ts',
    'README.md',
  ],
  'mastra-demo': [
    'src/agents/agent.ts',
    'prompts/agent-profiles/AgentBase.md',
  ],
  'mastra-configured': [
    'src/agents/agent.ts',
    'src/agents/demo-agent.ts',
    'prompts/agent-profiles/AgentBase.md',
  ],
  'mastra-multi-model': [
    'src/agents/agent.ts',
    'src/agents/demo-agent.ts',
    'prompts/agent-profiles/core.md',
    'prompts/agent-profiles/developer.md',
  ],
  'reactor-minimal': [
    'test-reactor-cli/package.json',
    'test-reactor-cli/src/cli.ts',
    'test-reactor-cli/src/framework.ts',
    'test-reactor-cli/src/framework.gen.ts',
    'package.json',
    'publish.config.js',
  ],
  switchboard: [
    'test-switchboard-cli/package.json',
    'test-switchboard-cli/src/cli.ts',
    'test-switchboard-cli/src/framework.gen.ts',
    'test-switchboard-cli/src/agents/agent.ts',
    'package.json',
  ],
  'chat-switchboard': [
    'test-chat-cli/package.json',
    'test-chat-cli/src/cli.ts',
    'test-chat-cli/src/framework.gen.ts',
    'test-chat-cli/src/agents/agent.ts',
    'package.json',
  ],
  'connect-full': [
    'test-connect-cli/package.json',
    'test-connect-cli/src/cli.ts',
    'test-connect-cli/src/framework.gen.ts',
    'test-connect-cli/src/agents/agent.ts',
    'test-connect-cli/prompts/agent-profiles/base.md',
    'test-connect-cli/prompts/agent-profiles/ops.md',
    'package.json',
    'publish.config.js',
  ],
};

/** Files that must NOT be present for a fixture. */
const ABSENT_FILES: Record<string, string[]> = {
  minimal: [
    'src/agents/agent.ts',
    'src/framework.gen.ts',
  ],
  'mastra-demo': [
    'src/framework.gen.ts',
  ],
  'mastra-multi-model': [
    'prompts/agent-profiles/AgentBase.md',
  ],
  'reactor-minimal': [
    'src/cli.ts',
  ],
};

/**
 * Expected pendingActions from generateProject() for each fixture.
 * Flat layouts get cli-install + cli-build.
 * Split layouts get the full chain: ph-init → app-install → app-build → cli-install → cli-build.
 */
const EXPECTED_ACTIONS: Record<string, PostGenActionKind[]> = {
  minimal: ['cli-install', 'cli-build'],
  'mastra-demo': ['cli-install', 'cli-build'],
  'mastra-configured': ['cli-install', 'cli-build'],
  'mastra-multi-model': ['cli-install', 'cli-build'],
  'reactor-minimal': ['ph-init', 'app-install', 'app-build', 'cli-install', 'cli-build'],
  switchboard: ['ph-init', 'app-install', 'app-build', 'cli-install', 'cli-build'],
  'chat-switchboard': ['ph-init', 'app-install', 'app-ph-install', 'app-build', 'cli-install', 'cli-build'],
  'connect-full': ['ph-init', 'app-install', 'app-build', 'cli-install', 'cli-build'],
};

describe.each(Object.keys(FIXTURES))('initial codegen — %s', (fixtureName) => {
  let cliDir: string;
  let tmp: string;
  let spec: ReturnType<typeof clintProjectSpecSchema.parse>;

  it(
    'generates, installs, builds, and runs --help',
    async () => {
      tmp = await mkTmpDir(fixtureName);
      tmpDirs.push(tmp);

      spec = clintProjectSpecSchema.parse(FIXTURES[fixtureName]);
      const result = await generateProject({ targetDir: tmp, spec });
      expect(result.mode).toBe('create');

      cliDir = result.cliDir;

      // ── Assert file tree ──
      const tree = await fileTree(tmp);

      const required = REQUIRED_FILES[fixtureName];
      if (required) {
        for (const f of required) {
          expect(tree).toContain(f);
        }
      }

      const absent = ABSENT_FILES[fixtureName];
      if (absent) {
        for (const f of absent) {
          expect(tree).not.toContain(f);
        }
      }

      // ── Assert post-gen actions ──
      const expectedActions = EXPECTED_ACTIONS[fixtureName];
      if (expectedActions) {
        const actionKinds = result.pendingActions.map((a) => a.kind);
        expect(actionKinds).toEqual(expectedActions);
      }

      // ── Run post-gen actions (ph-init, install, build) ──
      // Split into two phases so we can rewrite deps before CLI install.
      const appActions = result.pendingActions.filter(
        (a) => a.kind !== 'cli-install' && a.kind !== 'cli-build',
      );
      const cliActions = result.pendingActions.filter(
        (a) => a.kind === 'cli-install' || a.kind === 'cli-build',
      );
      const actionCtx = {
        log: (msg: string) => console.log(`[postgen] ${msg}`),
        runProcess: async (command: string, opts?: { cwd?: string; timeout?: number }) => {
          try {
            const output = execSync(command, {
              cwd: opts?.cwd,
              encoding: 'utf8',
              timeout: opts?.timeout ?? 300_000,
              stdio: ['pipe', 'pipe', 'pipe'],
            });
            return { success: true, output };
          } catch (err: unknown) {
            const e = err as { stdout?: string; stderr?: string };
            return { success: false, output: (e.stdout ?? '') + (e.stderr ?? '') };
          }
        },
      };

      await runPostGenActions(appActions, actionCtx);

      // Rewrite ph-clint/ph-clint-dev deps to file: references
      await rewriteLocalDeps(tmp, spec);

      await runPostGenActions(cliActions, actionCtx);

      // ── Run --help ──
      const helpOutput = runHelp(cliDir);

      const patterns = HELP_PATTERNS[fixtureName];
      if (patterns) {
        for (const pattern of patterns) {
          expect(helpOutput).toMatch(pattern);
        }
      }
    },
    300_000,
  );

  it(
    'passes runtime verification',
    async () => {
      // Skip if the build step didn't run (previous test failed).
      if (!cliDir) return;

      // ── --meta: verify introspection reflects the spec ──
      // CLI_NAME strips the -cli suffix at runtime (pkg.name.replace(/-cli$/, ''))
      const meta = runMeta(cliDir);
      expect(meta.name).toBe(getBinName(spec));
      expect(meta.hasAgent).toBe(spec.features.mastra.enabled);
      expect(meta.hasReactor).toBe(spec.features.powerhouse !== 'Disabled');

      // Agent-enabled fixtures expose a model config field.
      if (spec.features.mastra.enabled) {
        const config = meta.config as Record<string, { id: string }>;
        expect(config.model).toBeDefined();
        expect(config.model.id).toBe('model');
      }

      // Multi-model fixtures expose API key env vars for each provider.
      if (
        spec.features.mastra.enabled &&
        spec.features.mastra.models.length > 1
      ) {
        const configList = runCommand(cliDir, 'config --list');
        // Models from different providers → each provider's API key appears.
        const providers = new Set(
          spec.features.mastra.models.map((m) => m.id.split('/')[0]),
        );
        for (const provider of providers) {
          expect(configList).toMatch(new RegExp(`${provider}.*key`, 'i'));
        }
      }

      // ── Agent: demo agent echoes back the prompt ──
      if (spec.features.mastra.enabled) {
        // Use --no-api/--no-studio to avoid starting Switchboard/Connect
        // which would hold the port and conflict with later tests.
        const agentFlags = [
          ...(spec.features.powerhouse !== 'Disabled' ? ['--no-api'] : []),
          ...(spec.features.powerhouse === 'Connect' ? ['--no-studio'] : []),
        ];
        const output = await runInteractive(cliDir, agentFlags, {
          stdin: 'hello from e2e test\n',
        });
        expect(output).toMatch(/You said:.*hello from e2e test/);
        expect(output).toMatch(/demo.*agent/i);
      }

      // ── Reactor: boots PGlite and creates a drive ──
      if (spec.features.powerhouse !== 'Disabled') {
        const phFlags = [
          '--no-api',
          ...(spec.features.powerhouse === 'Connect' ? ['--no-studio'] : []),
        ];
        const output = await runInteractive(cliDir, phFlags);
        expect(output).toMatch(/Reactor ready \(drive: [0-9a-f-]+\)/);

        // Verify PGlite storage directory was created on disk.
        // Store folder uses CLI_NAME (bin name, without -cli suffix).
        const storagePath = path.join(
          cliDir,
          '.ph',
          getBinName(spec),
          'reactor-storage',
        );
        expect(await pathExists(storagePath)).toBe(true);
      }
    },
    120_000,
  );

  it(
    'switchboard serves GraphQL and MCP over HTTP',
    async () => {
      if (!cliDir) return;
      if (spec.features.powerhouse !== 'Switchboard') return;

      const sbPort = defaultPort(getBinName(spec), 'switchboard');

      const output = await withLiveProcess(
        cliDir,
        [], // no --no-api — we want the full Switchboard
        /Switchboard .* ready at/,
        async () => {
          // GraphQL introspection — verifies the schema is loaded.
          const gql = await httpPost(`http://localhost:${sbPort}/graphql`, {
            query: '{ __schema { queryType { name } } }',
          });
          expect(gql.status).toBe(200);
          const gqlBody = JSON.parse(gql.body);
          expect(gqlBody.data.__schema.queryType.name).toBe('Query');

          // MCP endpoint exists (POST-only SSE, GET returns 405).
          const mcp = await httpGet(`http://localhost:${sbPort}/mcp`);
          expect(mcp.status).toBe(405);
        },
        { timeoutMs: 60_000 },
      );

      expect(output).toMatch(/Switchboard .* ready at/);
      expect(output).toMatch(/MCP server available/);
    },
    90_000,
  );

  it(
    'connect serves the web UI over HTTP',
    async () => {
      if (!cliDir) return;
      if (spec.features.powerhouse !== 'Connect') return;

      const connectPort = defaultPort(getBinName(spec), 'connect');

      // Boot with --no-api. Connect launches as a detached child process
      // that survives the parent CLI exiting.
      const output = await runInteractive(cliDir, ['--no-api'], {
        timeoutMs: 60_000,
      });
      expect(output).toMatch(/Connect .* (?:ready|running) at/);

      try {
        // Connect web UI serves an HTML page.
        const res = await httpGet(`http://localhost:${connectPort}/`);
        expect(res.status).toBe(200);
        expect(res.body).toMatch(/<html/i);
      } finally {
        // Clean up the detached Connect child process.
        try {
          runCommand(cliDir, `${getBinName(spec)}-studio-stop`);
        } catch {
          // Best-effort cleanup.
        }
      }
    },
    90_000,
  );

  it(
    'chat attachment extraction writes image to downloads/',
    async () => {
      if (!cliDir) return;
      if (!spec.features.mastra.common.enableChat) return;
      if (spec.features.powerhouse !== 'Switchboard') return;

      const sbPort = defaultPort(getBinName(spec), 'switchboard');

      // Read the fixture image as base64.
      const fixturePath = path.resolve(
        import.meta.dirname,
        '../../../../clint-common/prometheus.png',
      );
      const imageBase64 = readFileSync(fixturePath).toString('base64');
      const partId = 'e2e-img-part-001';

      await withLiveProcess(
        cliDir,
        [],
        /Switchboard .* ready at/,
        async () => {
          // 1. Find the drive
          const driveRes = await httpPost(`http://localhost:${sbPort}/graphql`, {
            query: `{
              findDocuments(search: { type: "powerhouse/document-drive" }) {
                items { id name }
              }
            }`,
          });
          const drives = JSON.parse(driveRes.body).data.findDocuments.items as
            Array<{ id: string; name: string }>;
          const driveId = (drives.find((d) => d.name === 'Clint') ?? drives[0]).id;

          // 2. Create a chat-session document
          const createRes = await httpPost(`http://localhost:${sbPort}/graphql`, {
            query: `mutation ($type: String!, $parent: String) {
              createEmptyDocument(documentType: $type, parentIdentifier: $parent) {
                id documentType
              }
            }`,
            variables: {
              type: 'powerhouse/chat-session',
              parent: driveId,
            },
          });
          const docId = JSON.parse(createRes.body).data.createEmptyDocument.id as string;

          // 3. Dispatch ADD_USER_MESSAGE with an IMAGE content part
          const mutRes = await httpPost(`http://localhost:${sbPort}/graphql`, {
            query: `mutation ($id: String!, $actions: [JSONObject!]!) {
              mutateDocument(documentIdentifier: $id, actions: $actions) {
                id
                revisionsList { scope revision }
              }
            }`,
            variables: {
              id: docId,
              actions: [
                {
                  id: 'e2e-chat-action-1',
                  timestampUtcMs: new Date().toISOString(),
                  type: 'ADD_USER_MESSAGE',
                  input: {
                    id: 'e2e-msg-001',
                    createdAt: new Date().toISOString(),
                    content: [
                      {
                        id: partId,
                        type: 'IMAGE',
                        mediaType: 'image/png',
                        data: imageBase64,
                      },
                      {
                        id: 'e2e-text-part-001',
                        type: 'TEXT',
                        text: 'Describe this image',
                      },
                    ],
                  },
                  scope: 'global',
                },
              ],
            },
          });
          expect(JSON.parse(mutRes.body).errors).toBeUndefined();

          // 4. Wait briefly for the chat-session-watch trigger to fire and
          //    extract the attachment. The trigger runs asynchronously after
          //    the document change is committed.
          const expectedFile = path.join(
            cliDir,
            'downloads',
            `attachment_${partId.slice(0, 6)}.png`,
          );
          const deadline = Date.now() + 15_000;
          while (Date.now() < deadline) {
            try {
              await fs.access(expectedFile);
              break;
            } catch {
              await new Promise((r) => setTimeout(r, 1_000));
            }
          }

          // 5. Verify the file exists and matches the fixture
          const written = await fs.readFile(expectedFile);
          const original = readFileSync(fixturePath);
          expect(written.equals(original)).toBe(true);
        },
        { timeoutMs: 60_000 },
      );
    },
    120_000,
  );
});
