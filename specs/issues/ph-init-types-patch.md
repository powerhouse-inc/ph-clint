# Issue: `ph init` generates wrong types paths in package.json exports

## Status

**Workaround applied** in ph-clint codegen (commit 7aeee33).
Waiting for upstream `ph-cli` fix.

## Problem

`ph init` (tested on 6.0.0-dev.217) generates a reactor package with
mismatched type declaration paths:

- `tsconfig.json` correctly sets `"declarationDir": "./dist/types"`
- `package.json` exports incorrectly point `"types"` at `./dist/browser/*.d.ts`
- After `ph-cli build`, `.d.ts` files land in `dist/types/` — not `dist/browser/`
- Any TypeScript consumer that resolves the package via its export map gets
  `TS7016: Could not find a declaration file for module '...'`

## What the reactor package should look like

### tsconfig.json (already correct)

```json
{
  "compilerOptions": {
    "declarationDir": "./dist/types",
    "declaration": true,
    "declarationMap": true,
    "emitDeclarationOnly": true
  }
}
```

### package.json exports (needs fix)

Every conditional export entry that has a `"types"` field must point at
`./dist/types/` instead of `./dist/browser/`:

```jsonc
{
  "exports": {
    ".": {
      "types": "./dist/types/index.d.ts",       // was: ./dist/browser/index.d.ts
      "browser": "./dist/browser/index.js",
      "node": "./dist/node/index.mjs"
    },
    "./document-models": {
      "types": "./dist/types/document-models/index.d.ts",
      "browser": "./dist/browser/document-models/index.js",
      "node": "./dist/node/document-models/index.mjs"
    },
    "./document-models/*": {
      "types": "./dist/types/document-models/*/index.d.ts",
      "browser": "./dist/browser/document-models/*/index.js",
      "node": "./dist/node/document-models/*/index.mjs"
    },
    "./editors": {
      "types": "./dist/types/editors/index.d.ts",
      "browser": "./dist/browser/editors/index.js",
      "node": "./dist/node/editors/index.mjs"
    },
    "./editors/*": {
      "types": "./dist/types/editors/*/editor.d.ts",
      "browser": "./dist/browser/editors/*/editor.js",
      "node": "./dist/node/editors/*/editor.mjs"
    },
    "./subgraphs": {
      "types": "./dist/types/subgraphs/index.d.ts",
      "browser": "./dist/browser/subgraphs/index.js",
      "node": "./dist/node/subgraphs/index.mjs"
    },
    "./processors": {
      "types": "./dist/types/processors/index.d.ts",
      "browser": "./dist/browser/processors/index.js",
      "node": "./dist/node/processors/index.mjs"
    },
    "./manifest": "./dist/powerhouse.manifest.json",
    "./style.css": "./dist/style.css"
  }
}
```

The pattern is simple: replace `./dist/browser/` with `./dist/types/` in every
`"types"` field. The `"browser"` and `"node"` fields stay as they are.

### Verification

After `ph-cli build`, these files must exist:

```
dist/types/index.d.ts
dist/types/document-models/index.d.ts
dist/types/editors/index.d.ts
dist/types/subgraphs/index.d.ts
dist/types/processors/index.d.ts
```

And a consumer project with `"moduleResolution": "nodenext"` must be able to
`import { documentModels } from '<app-package>'` without TS7016 errors.

---

## Removing the workaround from ph-clint codegen

Once `ph init` generates correct types paths, remove the patching in these steps:

### 1. Delete `patchAppExportTypes`

**File:** `packages/ph-clint-dev/src/codegen/scaffold.ts`

Delete the `patchAppExportTypes` function (lines 141–179) and remove its call
from `runPhInit` (line 100):

```diff
   await patchAppPackageName(options.appDir, options.spec, log);
-  await patchAppExportTypes(options.appDir, log);
   return { ran: true, exitCode };
```

### 2. Update the scaffold test

**File:** `packages/ph-clint-dev/tests/codegen/scaffold.test.ts`

If any test exercises `patchAppExportTypes` directly, remove it. Currently no
unit test does (the function is only tested indirectly via E2E), so this step
may be a no-op.

### 3. Verify E2E tests still pass

Run the split-layout E2E fixtures that exercise `ph init`:

```sh
cd packages/ph-clint-cli/ph-clint-cli
NODE_OPTIONS='--experimental-vm-modules' npx jest --detectOpenHandles \
  --testPathPatterns 'tests/codegen-e2e/initial' \
  --testPathIgnorePatterns '/node_modules/' \
  -t 'reactor-minimal|switchboard|connect-full'
```

All three must pass `tsc` compilation (the "generates, installs, builds, and
runs --help" test). If they do, the upstream fix is confirmed and the patch is
safe to remove.

### 4. Note on `patchAppPackageName` — keep it

`patchAppPackageName` (scoped name + publishConfig) is **not** affected by this
fix. `ph init` still does not accept a `--scope` flag, so the name patch
remains necessary. Do not remove it as part of this cleanup.
