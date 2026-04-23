# Plan: ph-clint-project Document Model & Codegen Improvements

## Context

The `powerhouse/ph-clint-project` document model in `ph-clint-app` drives the code generator in `ph-clint-cli` via a spec-change trigger. The bridge (`specFromDocumentState()`) is a clean 1:1 field copy with null-guards — no renaming or conversion. However, the document model is incomplete: several fields exist only in `ClintProjectSpec` (like `documentTypes`) or are missing entirely (skills, reactor packages, publish operations). The editor UI and business logic also need updates (Powerhouse level enum, Mastra/Routine decoupling, confirmation dialogs, publish buttons).

**Goal**: Evolve the document model, spec, codegen, editor, and trigger to close all gaps — keeping `specFromDocumentState()` as a trivial guard-only copy throughout.

---

## Status Summary

| WP | Title | Document Model | Editor | Spec/Bridge | Codegen/CLI | Tests |
|----|-------|:-:|:-:|:-:|:-:|:-:|
| WP7 | Force Flag in Trigger | n/a | n/a | n/a | DONE | DONE |
| WP2 | Decouple Mastra/Routine | DONE | DONE | n/a | n/a | DONE |
| WP1 | Powerhouse Level Enum | DONE | DONE | DONE | DONE | DONE |
| WP3 | Powerhouse Packages | DONE | DONE | TODO | TODO | partial |
| WP4 | External Skills | DONE | DONE | TODO | TODO | partial |
| WP5 | Publish Operations | DONE | DONE | TODO | TODO | partial |
| WP6 | Multi-Project Pinning | DONE | n/a | TODO | TODO | TODO |
| WP8 | Placeholder Editor Pages | n/a | DONE | n/a | n/a | n/a |

**DONE** = fully implemented and tested.
**partial** = document model side has auto-generated tests passing (32 in ph-clint-app), but ph-clint-cli spec/codegen/tests not yet updated.
**TODO** = not started.

---

## Work Packages

### WP1: Powerhouse Level Enum — DONE

Replaced `features.powerhouse: { enabled, switchboard, connect }` with `features.powerhouse: PowerhouseLevel` enum (`Disabled → Reactor → Switchboard → Connect`). All layers updated: document model (MCP + reducer), spec schema (`powerhouseLevelSchema`, `phAtLeast()`), bridge (direct copy), all codegen builders, migration detection, editor (select dropdown), and all tests (18 app + 106 cli). Verified in Connect via Playwright.

### WP2: Decouple Mastra from Routine — DONE

`enableMastraOperation` no longer force-sets `routine.enabled = true`. `disableRoutineOperation` no longer guards against Mastra being on. Editor toggles are independent. Tests updated.

### WP3: Powerhouse Packages — IN PROGRESS

**Document model (DONE)**: State schema has `PowerhousePackage` type with `id`, `packageName`, `documentTypes`. Module `powerhouse_packages` with 4 operations (ADD/REMOVE_POWERHOUSE_PACKAGE, ADD/REMOVE_PACKAGE_DOCUMENT_TYPE) plus error types. `SET_POWERHOUSE_LEVEL` auto-creates app package on Disabled→higher transition. Editor has packages section with add/remove UI, app badge, document type management.

**Remaining (ph-clint-cli side)**:

| File | Change |
|------|--------|
| `src/spec/types.ts` | Replace flat `documentTypes: string[]` with `packages: [{ packageName, documentTypes }]`. Keep `getDocumentTypeSlug()` and `getDocumentTypeModuleName()` helpers. Add helper to flatten all document types from packages. |
| `src/spec/from-document.ts` | Remove the `documentTypes` forward-compat workaround. Copy `packages` directly from state. |
| `src/codegen/builders/framework-gen-ts.ts` | Change `spec.documentTypes.map(...)` → iterate `spec.packages.flatMap(p => p.documentTypes)` or similar. |
| `src/codegen/builders/app-index-ts.ts` | Same — flatten document types from packages. Only emit exports for app package document types (others come from node_modules). |
| `src/codegen/builders/cli-package-json.ts` | Add non-app packages as versioned dependencies (`"latest"` or user-specified). |
| `tests/spec/types.test.ts` | Update for new schema shape. |
| `tests/codegen/framework.test.ts` | Update test specs to use `packages` instead of `documentTypes`. |
| `tests/codegen/cli-package-json.test.ts` | Add test for external package dependencies. |
| Other test files | Update any fixture specs that reference `documentTypes`. |

### WP4: External Skills — IN PROGRESS

**Document model (DONE)**: State schema has `ExternalSkill` type with `id`, `name`, `githubUrl`. Module `external_skills` with 4 operations plus error types. Editor has skills section with add/remove UI.

**Remaining (ph-clint-cli side)**:

| File | Change |
|------|--------|
| `src/spec/types.ts` | Add `externalSkills: z.array(z.object({ name, githubUrl })).default([])` |
| `src/spec/from-document.ts` | Copy `externalSkills` directly from state |
| `src/commands/clint-skills-sync.ts` (new) | Read spec's `externalSkills`, diff against `.skills.json`, run `npx skills add/rm` |
| `src/triggers/spec-change.ts` | Call skills sync after codegen completes |
| Tests | New test for skills sync command |

### WP5: Publish Operations & UI — IN PROGRESS

**Document model (DONE)**: State schema has `PublishRecord`, `PublishTag`, `PublishStatus` types. Module `publishing` with 5 operations (BUMP_VERSION, PUBLISH_DEV/STAGING/PRODUCTION, SET_PUBLISH_STATUS) plus error types. Editor has publish section with version display, 3 publish buttons, and recent history with status badges.

**Remaining (ph-clint-cli side)**:

| File | Change |
|------|--------|
| `src/spec/types.ts` | Add `publishHistory` to spec (or decide it's doc-model only, not in spec) |
| `src/triggers/publish-trigger.ts` (new) | Watch for Pending records → invoke `ph-publish <tag>` → dispatch SET_PUBLISH_STATUS |
| Tests | Trigger tests |

**Open question**: `publishHistory` may not belong in `ClintProjectSpec` at all — it's a document-model concern (operation log), not a codegen input. The trigger watches the document directly, not the spec. Decision: keep `publishHistory` out of `ClintProjectSpec`; the publish trigger reads the document state directly.

### WP6: Multi-Project Document Pinning — IN PROGRESS

**Document model (DONE)**: Module `lifecycle` with `IMPORT_SPEC` operation that bulk-sets all fields from a spec input.

**Remaining (ph-clint-cli side)**:

| File | Change |
|------|--------|
| `src/framework.ts` | Replace `projectDocumentId` with `projects: Record<string, string>` map |
| `src/triggers/spec-change.ts` | Multi-document iteration, route regen per mapping |
| `src/boot/project-sync.ts` (new) | Scan workspace, read specs, create/reconcile documents via IMPORT_SPEC |
| `src/commands/clint-project-ls.ts` (new) | List all mapped projects |
| Tests | Integration tests for multi-project |

### WP7: Force Flag in Trigger — DONE

`force: true` is passed to `generateProject()` in `spec-change.ts`.

### WP8: Placeholder Editor Pages — DONE

Editor has tab navigation: "Project Spec" (current full editor), "Agent Profiles" (placeholder), "Skill Templates" (placeholder). Implemented inline in `editor.tsx`.

---

## Execution Order (updated)

```
DONE: WP7 → WP2 → WP1 → (doc model batch for WP3+WP4+WP5+WP6+WP8)
NOW:  WP3 cli-side → WP4 cli-side → WP5 cli-side → WP6 cli-side
```

The document model, reducers, and editor for ALL work packages are complete (32 tests passing in ph-clint-app). The remaining work is exclusively in `ph-clint-cli`: updating the spec schema, bridge, codegen builders, triggers, and tests.

### Suggested next steps

1. **WP3 cli-side**: Refactor `ClintProjectSpec` to use `packages` instead of `documentTypes`. Update `from-document.ts`, all codegen builders, and all tests. This is the largest remaining chunk.
2. **WP4 cli-side**: Add `externalSkills` to spec, bridge, create `clint-skills-sync` command, wire into trigger.
3. **WP5 cli-side**: Create `publish-trigger.ts`. Decide if `publishHistory` stays out of spec.
4. **WP6 cli-side**: Refactor config, trigger, add boot sync and `clint-project-ls` command.

## Cross-Cutting Principle

**`specFromDocumentState()` stays trivial**: After every change, the bridge must remain a direct field copy with only null-guards. The document model state shape and `ClintProjectSpec` must use identical field names and structures. No conversion, no renaming — ever.

## Verification

After each WP:
1. `cd ph-clint-app && pnpm build && pnpm test`
2. `cd ph-clint-cli && pnpm build && pnpm test`
3. Start the CLI (`pnpm dev`), open Connect, verify editor renders and operations dispatch correctly
4. Edit the document → verify spec-change trigger fires and codegen runs
