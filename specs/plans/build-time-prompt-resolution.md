# Plan: Build-time prompt resolution

## Trigger

`ph-rupert -i` crashes after global install (`pnpm install -g @powerhousedao/ph-rupert-cli@0.0.1-dev.1`):

```
Error: ENOENT: no such file or directory, open '…/node_modules/@powerhousedao/ph-rupert-cli/gen/agent-profiles/RupertDevAgent.md'
```

The `gen/` directory is not in the published package's `files` field — only `dist` and `prompts` ship. The compiled agent profile exists at `dist/gen/agent-profiles/RupertDevAgent.md`, but `agent-rupert.ts` hardcodes a path to `gen/agent-profiles/`.

## Wider design issue

The immediate fix (add `gen` to `files` or patch the path) papers over a deeper problem: the implementation project manually handles concerns that the framework should own.

### What's wrong with `agent-rupert.ts` today

1. **Hardcoded path to build output.** `loadInstructions` reads from `gen/agent-profiles/` — a build artifact path that doesn't survive publishing. The `.mastra` directory hack on line 19 is a second workaround for the same root cause.

2. **Duplicates framework plumbing.** The file manually creates `WorkdirStore`, `getMastraPaths`, `Workspace`, `LocalFilesystem`, `LocalSandbox`, `Memory`, `LibSQLStore` — all of which `createMastraHelpers` already provides via `createWorkspace()` and `createMemory()`.

3. **Reconstructs its own context.** `createAgentRupert` takes 7 positional args, then reassembles them into an `AgentSetupContext` (lines 83-91) to pass to `createMastraHelpers`. The context was already available in `createAgent`.

4. **Creates helpers twice.** `createAgent` creates `createMastraHelpers` and `createWorkdirStore` a second time just to call `wrapAgent`.

### Why `prompts/` shouldn't ship — `gen/` should

The `prompts/` directory contains Handlebars source templates. The `gen/` directory contains the rendered output — plain Markdown files with all template variables resolved. Today, `prompts/` is published and `gen/` is not. This is backwards.

The runtime has no reason to compile Handlebars templates. The few runtime variables that exist in today's skill templates (ports, paths) are being removed — prompt engineering is simpler and more robust when it doesn't have to account for runtime variations. Build-time compilation is the right moment to bake in all context.

The published package should contain only `dist/` (compiled TypeScript + built prompts). The `prompts/` directory is source material for the build pipeline, not a runtime artifact.

### Skills vs agent profiles — inconsistent resolution

Skills are handled correctly: `prompts.sources` lists candidate directories, `readSkillsFromSources` skips non-existent ones, `installSkills` copies them to the workdir store. The framework owns the full lifecycle.

However, the property name `sources` is misleading. From the runtime's perspective these directories are not "sources" — they are build artifacts that the framework discovers and installs into the agent's workdir. The name `sources` only makes sense from the build pipeline's vantage point, and even there it's the *output* side. Rename to `artifacts` to make the role clear: these are pre-built prompt artifacts (skills + agent profiles) ready for discovery and installation.

Agent profiles have no framework support. The implementation does raw `readFileSync` with a path that only works in the dev environment. The framework should resolve agent profile instructions the same way — using the `prompts` config that already declares agent names, sections, and skill assignments.

## Target state

### The ideal `agent-rupert.ts`

```ts
import { Agent } from '@mastra/core/agent';
import { MCPClient } from '@mastra/mcp';
import { createMastraHelpers } from '@powerhousedao/ph-clint/mastra';
import type { AgentSetupContext, AgentProvider } from '@powerhousedao/ph-clint';
import type { Config } from '../framework.js';
import { createDemoAgent } from './demo-agent.js';

export async function createAgent(ctx: AgentSetupContext<Config>): Promise<AgentProvider> {
  if (!ctx.config.apiKey) return createDemoAgent();

  const m = createMastraHelpers(ctx);

  const agent = new Agent({
    id: 'rupert-dev-agent',
    name: 'Rupert Dev Agent',
    instructions: m.getAgentInstructions('rupert-dev-agent'),
    model: ctx.config.apiKey
      ? { id: ctx.config.model as `${string}/${string}`, apiKey: ctx.config.apiKey }
      : (ctx.config.model as `${string}/${string}`),
    tools: () => m.getTools({ MCPClient }),
    workspace: await m.createWorkspace(),
    memory: await m.createMemory(),
  });

  return m.wrapAgent(agent, {
    maxSteps: 80,
    enableLogging: ctx.config.agentLogging,
    cacheControl: true,
  });
}
```

Design principles:
- **Explicit.** The Mastra `Agent` constructor is right there — the implementation dev sees every field. No magic factory hiding what goes into the agent.
- **Framework-facilitated.** `m.getAgentInstructions()`, `m.createWorkspace()`, `m.createMemory()`, `m.getTools()`, `m.wrapAgent()` handle the repetitive plumbing. Each is a single call that the dev can replace with custom logic if needed.
- **No path knowledge.** The implementation never references `gen/`, `dist/gen/`, `CLI_ROOT`, or store internals. Resolution is the framework's job.
- **Single function.** No separate `createAgentRupert` with unpacked positional args. The Mastra Dev Studio entrypoint constructs its own `AgentSetupContext` and calls the same factory.

## Implementation plan

### 1. Rename `PromptsConfig.sources` to `PromptsConfig.artifacts`

**Files:** `packages/ph-clint/src/core/types.ts`, `packages/ph-clint/src/core/cli.ts`, `packages/ph-clint/src/core/skills.ts`, `packages/ph-clint/src/core/init.ts`

Rename the `sources` field to `artifacts` on `PromptsConfig` and update all internal references (`readSkillsFromSources`, `installSkills`, metadata output, etc.). The property lists directories containing pre-built prompt artifacts (skills and agent profiles) that the framework discovers and installs — not template sources to compile from.

This is a breaking change to the CLI definition API. Update example 05's `cli.ts` in step 6.

### 2. Add `getAgentInstructions()` to `MastraHelpers`

**File:** `packages/ph-clint/src/integrations/mastra/index.ts`

Add a `getAgentInstructions(agentId: string): string` method to the helpers object returned by `createMastraHelpers`. It:

1. Looks up `agentId` in `ctx.prompts.agents` to get `{ name, sections, skills }`.
2. Resolves the `agent-profiles/` directory as a sibling of each `prompts.artifacts` entry (i.e. `path.join(path.dirname(artifact), 'agent-profiles')`). Uses the first existing directory.
3. Reads the pre-built agent profile Markdown file: `{agentProfilesDir}/{name}.md` (e.g. `RupertDevAgent.md`). The file is already fully rendered — no Handlebars compilation at runtime.
4. Returns the string.

Throws a clear error if the agent ID is not in prompts config or if the profile file is missing — no silent fallback.

**Dependencies:** needs access to the prompts metadata from `ctx`. Does NOT need `renderSkillTemplate` — files are pre-built plain Markdown.

### 3. Expose prompts metadata on `AgentSetupContext`

**File:** `packages/ph-clint/src/core/types.ts` and `packages/ph-clint/src/core/cli.ts`

The `AgentSetupContext` currently has `skills: SkillInfo[]` but not the full `prompts` config (agents, sources, etc.). Add a `prompts` field to `AgentSetupContext` so that `createMastraHelpers` can access agent profile definitions and source paths.

This is the prompts metadata already computed inside `defineCli` — it just needs to be threaded through to the agent factory.

### 4. Agent profile resolution via `PromptsConfig.artifacts`

**File:** `packages/ph-clint/src/core/types.ts`

Currently `PromptsConfig.artifacts` (renamed in step 1) points at skill directories (`gen/skills`, `dist/gen/skills`). For agent profile resolution we need the parent — the build output root where both `skills/` and `agent-profiles/` live.

**Approach:** Derive it from existing artifacts. `agent-profiles/` is always a sibling of the skill artifact dir. `getAgentInstructions` does `path.dirname(artifact) + '/agent-profiles/'` to find the agent profiles directory. This matches the layout `buildSkills` already produces:

```
gen/
├── agent-profiles/    ← path.dirname('gen/skills') + '/agent-profiles/'
│   └── RupertDevAgent.md
└── skills/            ← what artifacts already points at
    └── document-modeling/
```

No new config fields needed. The sibling convention is already established by `buildSkills`.

### 5. Simplify `05-ph-rupert/src/agents/agent-rupert.ts`

Replace the current 134-line file with the ~25-line target version shown above. Remove:
- `loadInstructions` function
- `projectRoot` / `.mastra` hack
- `createAgentRupert` export (the 7-arg function)
- All direct imports of `createWorkdirStore`, `getMastraPaths`, `Workspace`, `LocalFilesystem`, `LocalSandbox`, `Memory`, `LibSQLStore`

### 6. Update `prompts.artifacts` in `cli.ts`

**File:** `examples/05-ph-rupert/src/cli.ts`

Rename `sources` to `artifacts` (matching step 1). The paths themselves are correct — they already point at build output directories containing pre-built Markdown:

```ts
prompts: {
  artifacts: [
    path.join(CLI_ROOT, 'gen', 'skills'),        // Dev: local build output
    path.join(CLI_ROOT, 'dist', 'gen', 'skills'), // Published: inside dist/
  ],
  // ...
}
```

### 7. Ensure `buildSkills` writes to `dist/gen`

**File:** `examples/05-ph-rupert/scripts/build-skills.ts`

Keep both output targets:

```ts
output: [
  path.join(PROJECT_ROOT, 'gen'),           // Dev: fast iteration, Mastra Dev Studio
  path.join(PROJECT_ROOT, 'dist', 'gen'),   // Published: ships inside dist/
],
```

This is the same as today. The `dist/gen` output is now the canonical runtime source in published packages (since `prompts/` will no longer ship).

### 8. Remove `prompts` from `package.json` `files`

**File:** `examples/05-ph-rupert/package.json`

Change `files` from `["dist", "prompts"]` to `["dist"]`.

The `prompts/` directory is Handlebars source — it is consumed by `buildSkills` at build time and its output lands in `dist/gen/`. There is no reason to ship the templates to end users. The `build` script (`pnpm build:skills && tsc`) already ensures `dist/gen/` is populated before TypeScript compilation.

### 9. Update Mastra Dev Studio entrypoint

**File:** `examples/05-ph-rupert/src/mastra/index.ts` (if it exists)

Should construct an `AgentSetupContext` and call `createAgent(ctx)` instead of calling `createAgentRupert` directly. This eliminates the dual-purpose export.

## Testing

- Unit test `getAgentInstructions`: place pre-built `.md` files in a temp directory, configure sources to point there, verify the method reads and returns the content correctly.
- Integration test: `ph-rupert --help` still works (skills resolve from `dist/gen/skills`).
- E2E test: simulate published layout (only `dist/` present, no `gen/`, no `prompts/`), verify `ph-rupert -i` initializes without ENOENT.
- Regression: existing skill resolution tests still pass.

### 10. Update ph-clint tests

**Files:**
- `packages/ph-clint/tests/cli.test.ts` — rename `sources:` → `artifacts:` in all test fixtures, update metadata assertion that checks for `sources` key in JSON output
- `packages/ph-clint/tests/skills.test.ts` — update import if `readSkillsFromSources` is renamed (recommend renaming to `readSkills` — the parameter makes the source clear)
- `packages/ph-clint/tests/init.test.ts` — rename `sources:` → `artifacts:` in prompts config fixtures

### 11. Update example 05 `mastra/index.ts`

**File:** `examples/05-ph-rupert/src/mastra/index.ts`

This file calls `readSkillsFromSources()` and `installSkills()` with hardcoded skill source paths (independent of the CLI's prompts config). Update to use the renamed function and align variable names.

Combines with step 9 (Mastra Dev Studio entrypoint) — both touch the same file and concern the same agent factory simplification.

### 12. Update ph-clint documentation

**Files:**
- `specs/archive/ph-clint-powerhouse/design-first-class-reactor-agent.md` — update `PromptsConfig` reference to use `artifacts` instead of `sources`
- `examples/05-ph-rupert/README.md` — update skill source references

No changes needed in `CLAUDE.md` (doesn't mention `PromptsConfig.sources`), `specs/features.md`, or `specs/implementation.md` (`sources` there refers to event sources, unrelated).

### 13. Build, test, and smoke test

1. `cd packages/ph-clint && pnpm build` — build framework
2. `cd packages/ph-clint && pnpm test` — run full test suite, verify all pass
3. `cd examples/05-ph-rupert && pnpm install` — reinstall (new exports from ph-clint)
4. `cd examples/05-ph-rupert && pnpm build` — build example (runs build:skills + tsc)
5. Smoke test: `cd examples/05-ph-rupert && node dist/main.js --help` — verify CLI starts
6. Smoke test: `cd examples/05-ph-rupert && node dist/main.js --meta` — verify metadata output shows `artifacts` not `sources`

### 14. Publish example 05 dev version

**Command:** `cd examples/05-ph-rupert && pnpm publish:dev`

This runs `ph-publish dev` which:
1. Loads `publish.config.ts` (group `rupert-cli`, base version `0.0.1`)
2. Computes next dev prerelease version (`0.0.1-dev.N`)
3. Runs `pnpm build` (build:skills + tsc)
4. Rewrites `file:` deps to registry versions
5. Publishes to npm with `--tag dev`
6. Restores `file:` paths

Use `--dry-run` first to validate, then publish for real.

## Verification

- All ph-clint tests pass (`pnpm test` in `packages/ph-clint/`)
- Example 05 builds cleanly (`pnpm build` in `examples/05-ph-rupert/`)
- `node dist/main.js --help` still works (skills resolve from `dist/gen/skills`)
- `node dist/main.js --meta` shows `"artifacts"` in prompts metadata (not `"sources"`)
- Published package installs and runs: `npx @powerhousedao/ph-rupert-cli@dev --help`

## Out of scope

- Removing `buildSkills` entirely — it still serves dev-time validation and Mastra Dev Studio.
- Changing the skill installation/copy pipeline (`installSkills`) — that works correctly today.
- Reworking the Mastra Dev Studio bundler integration — separate concern.
- Removing runtime template variables from skill templates — separate concern, to be addressed independently.
