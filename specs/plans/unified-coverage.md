# Plan: Unified code coverage across library + examples

## Problem

The ph-clint library's integration code (`src/integrations/mastra/*`, `src/integrations/powerhouse/*`) has low test coverage because:

1. **Library tests are smoke tests** — `createWorkspace()` is tested as "returns something truthy", not "configures skills, allowedPaths, sandbox correctly"
2. **Example tests don't count** — examples exercise integration code but import from `dist/` (compiled JS), so coverage instrumentation in the library doesn't see the hits
3. **No merged reporting** — there's no way to see the combined coverage picture

## Two-part solution

### Part 1: Behavioral tests for integration helpers (library-side)

Add proper behavioral tests to `packages/ph-clint/tests/mastra-integration.test.ts` that verify what `createMastraHelpers` actually configures, not just that it returns truthy values.

**Tests to add:**

`createWorkspace`:
- Passes skill paths derived from `ctx.skills` to Workspace
- Passes `allowedPaths` constraining filesystem to workdir
- Configures `LocalSandbox` with correct `workingDirectory`
- With `skills: []`, only the runtime glob is passed

`getAgentInstructions`:
- Returns correct content when profile `.md` exists in `agent-profiles/` sibling of artifact dir
- Throws when agent ID not in `prompts.agents`
- Throws when `prompts` is undefined on context
- Throws when profile file doesn't exist on disk
- Uses first artifact directory that has the file

`makeAgentSetupContext` fixture:
- Add variant with actual skills (not `skills: []`)
- Add `prompts` field with agent config to default fixture

### Part 2: Unified coverage via moduleNameMapper + nyc merge

Make example test runs instrument the library's TypeScript source, then merge all coverage reports.

**Example jest.config.js changes:**

Add `moduleNameMapper` entries redirecting `@powerhousedao/ph-clint` imports to `../../packages/ph-clint/src/` so ts-jest instruments the TypeScript source:

```js
moduleNameMapper: {
  '^@powerhousedao/ph-clint/mastra$': '<rootDir>/../../packages/ph-clint/src/integrations/mastra/index.ts',
  '^@powerhousedao/ph-clint/powerhouse$': '<rootDir>/../../packages/ph-clint/src/integrations/powerhouse/index.ts',
  '^@powerhousedao/ph-clint/testing$': '<rootDir>/../../packages/ph-clint/src/testing/index.ts',
  '^@powerhousedao/ph-clint$': '<rootDir>/../../packages/ph-clint/src/index.ts',
  '^(\\.{1,2}/.*)\\.js$': '$1',
},
collectCoverageFrom: [
  '../../packages/ph-clint/src/**/*.ts',
  'src/**/*.ts',
  '!../../packages/ph-clint/src/interactive/*.tsx',
  '!../../packages/ph-clint/src/**/*.d.ts',
],
coverageReporters: ['json', 'lcov'],
```

**Files to change:**
- `examples/01-hello-world/jest.config.js`
- `examples/02-task-tracker/jest.config.js`
- `examples/03-file-watcher/jest.config.js`
- `examples/04-chat-assistant/jest.config.js`
- `examples/05-ph-rupert/jest.config.js`
- `packages/ph-clint/jest.config.js` — add `json` to `coverageReporters`

**Root merge script:**

Add `nyc` as a devDependency in `packages/ph-clint/` and a root-level script that:
1. Runs `pnpm test --coverage` in each project
2. Collects all `coverage-final.json` files
3. Runs `nyc merge` + `nyc report` for unified output

**Risk:** ts-jest compiles library source using the example's tsconfig. May need a shared `tsconfig.test.json` reference or inline ts-jest options for JSX/allowJs.

### Part 3: `c8` + `node:test` for ESM-incompatible integration tests

Jest's CJS module runtime cannot `require()` ESM-only packages. This blocks real integration tests that exercise code paths pulling in:
- `@mercuriusjs/gateway` (CJS) → `p-map` (ESM-only)
- `zocker` (CJS entry) → `@faker-js/faker` (ESM-only)

**Workaround applied (zocker):** `moduleNameMapper` redirects `zocker` to its ESM entry (`dist/index.js` instead of `dist/index.cjs`), keeping the import chain in ESM. This unblocks Reactor + PGlite tests.

**Blocked (p-map):** `@mercuriusjs/gateway` has no ESM entry. Switchboard tests that call `startSwitchboard()` (which lazy-imports `@powerhousedao/reactor-api` → mercurius) cannot run in Jest. The pure logic was extracted into `buildSwitchboardInstance()` and tested directly.

**Future fix:** Run the blocked Switchboard integration tests outside Jest using `c8 tsx --test`:

```sh
c8 --reporter=json --report-dir=coverage-switchboard \
  tsx --test tests/powerhouse-switchboard.integration.test.ts
```

Then merge into the unified report:
```sh
nyc merge coverage-jest coverage-switchboard .nyc_output
nyc report --reporter=text --reporter=lcov
```

This uses V8's native coverage (no Jest module system) and produces the same json/lcov format. Combine with Part 2's nyc merge for a single unified report.

## Implementation order

1. Part 1 first — behavioral tests in the library (immediate value, catches regressions)
2. Part 2 second — unified coverage pipeline (infrastructure, longer setup)
3. Part 3 third — c8-based Switchboard integration tests (unblocks full reactor-api coverage)

## Out of scope

- Switching from Jest to Vitest
- Coverage thresholds for examples
