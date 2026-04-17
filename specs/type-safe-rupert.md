# Type-Safe Rupert: Migrate 05-ph-rupert to `createTypes` binding

## Goal

Migrate `examples/05-ph-rupert` from ad-hoc generic parameters and `as` casts
to the `createTypes()` binding pattern, matching what ph-clint-cli already uses.
After this migration, every `defineCommand`, `defineService`, and agent helper
gets its `Config` type automatically — no manual generics, no casts.

## Current State

- `src/config.ts` exports `CLI_NAME`, `CLI_VERSION`, `PROJECT_ROOT`,
  `renownConfigSchema`, `configSchema`, `secretsSchema`, and `type Config`.
- Commands import `defineCommand` from `'ph-clint'` with explicit generics:
  - `ph-auth.ts`: 3 commands, each `defineCommand<typeof schema, { text: string }, Config>`
  - `reactor-project-init.ts`: `defineCommand<typeof inputSchema, { text: string }, Config>`
    plus a **local `interface Config { phVersion?: string }`** (partial type hack)
  - `reactor-project-build.ts`: `defineCommand<typeof inputSchema, { text: string }>` (no Config)
  - `reactor-project-publish.ts`: `defineCommand<typeof publishInputSchema, { text: string }>` (no Config)
  - `fusion-project-init.ts`: bare `defineCommand({...})` (no generics)
- Services import `defineService` from `'ph-clint'` with `<Config>`:
  - `reactor-project.ts`: `defineService<Config>` + `import type { Config } from '../config.js'`
  - `fusion-project.ts`: same pattern
- Agent (`agent-rupert.ts`) imports `type Config` from `../config.js`
- Mastra entry (`mastra/index.ts`) imports `configSchema`, `secretsSchema`, `type Config` from `../config.js`

## Target State

### New file: `src/framework.ts`

```ts
import { createTypes } from 'ph-clint';
import { configSchema, secretsSchema } from './config.js';

const fullConfigSchema = configSchema.merge(secretsSchema);
export type Config = z.infer<typeof fullConfigSchema>;

export const { defineCommand, defineService } = createTypes({
  configSchema: fullConfigSchema,
});

// Re-export for cli.ts and mastra/index.ts
export { configSchema, secretsSchema } from './config.js';
```

### Changes to `src/config.ts`

- **Remove**: `export type Config = ...` (moves to framework.ts)
- **Keep**: `CLI_NAME`, `CLI_VERSION`, `PROJECT_ROOT`, `renownConfigSchema`,
  `configSchema`, `secretsSchema` (these are identity/schema definitions, not bindings)

### Changes per command file

| File | Before | After |
|------|--------|-------|
| `ph-auth.ts` | `import { defineCommand } from 'ph-clint'` + `import type { Config } from '../config.js'` + 3x `<typeof schema, { text: string }, Config>` | `import { defineCommand } from '../framework.js'` + `import type { Config } from '../framework.js'` + bare `defineCommand({...})`. Keep `Config` import for `buildRenown(config: Config)` helper. |
| `reactor-project-init.ts` | `import { defineCommand } from 'ph-clint'` + local `interface Config { phVersion?: string }` + `<typeof inputSchema, { text: string }, Config>` | `import { defineCommand } from '../framework.js'` + delete local interface + bare `defineCommand({...})` |
| `reactor-project-build.ts` | `import { defineCommand } from 'ph-clint'` + `<typeof inputSchema, { text: string }>` | `import { defineCommand } from '../framework.js'` + bare `defineCommand({...})` |
| `reactor-project-publish.ts` | `import { defineCommand } from 'ph-clint'` + `<typeof publishInputSchema, { text: string }>` | `import { defineCommand } from '../framework.js'` + bare `defineCommand({...})` |
| `fusion-project-init.ts` | `import { defineCommand } from 'ph-clint'` | `import { defineCommand } from '../framework.js'` |

### Changes per service file

| File | Before | After |
|------|--------|-------|
| `reactor-project.ts` | `import { defineService, ... } from 'ph-clint'` + `import type { Config }` + `defineService<Config>({...})` | `import { defineService } from '../framework.js'` + `import { checkWorkdir, checkCommand, checkPort } from 'ph-clint'` + bare `defineService({...})` |
| `fusion-project.ts` | Same pattern | Same fix |

### Changes to agent/mastra files

| File | Change |
|------|--------|
| `agent-rupert.ts` | `import type { Config } from '../config.js'` → `import type { Config } from '../framework.js'` |
| `mastra/index.ts` | `import { ..., configSchema, secretsSchema, type Config } from '../config.js'` → split: `import { configSchema, secretsSchema } from '../config.js'` + `import type { Config } from '../framework.js'` (or import both from framework.ts if re-exported) |

### Changes to `src/cli.ts`

- `import { ..., configSchema, secretsSchema } from './config.js'` → `import { configSchema, secretsSchema } from './framework.js'` (or keep from config.js since framework.ts re-exports)
- No change to `defineCli` call — it already receives the schemas as values

## File Change Summary

- **1 new**: `src/framework.ts`
- **10 modified**: `config.ts`, `cli.ts`, 5 command files, 2 service files, `agents/agent-rupert.ts`
- `mastra/index.ts` — optional, can import `Config` from framework.ts

## Verification

1. `pnpm build` must succeed (tsc clean)
2. `pnpm test` must pass (9/9 tests)
3. No `as` casts on config fields
4. No explicit `<..., Config>` generics on defineCommand/defineService
5. No local `interface Config` hacks
