# Spec Document ↔ Spec JSON Round-Trip

## Why This Matters

The `ph-clint-project` document and the on-disk `project-spec.json` are two representations of the same truth. The document lives in the Reactor (ephemeral, per-session storage), while the spec JSON lives in the project directory (persistent, version-controlled). The system must guarantee:

1. **Document → JSON**: Any change to the document (via editor, GraphQL, or programmatic operation) is fully reflected in the spec JSON on disk.
2. **JSON → Document**: If the Reactor state is lost (deleted `.ph/`, fresh clone, new machine), the document is fully restored from the spec JSON — no data loss.

If either direction drops a field, users silently lose configuration. The round-trip is the contract that makes the spec JSON a reliable source of truth.

## What the E2E Test Verifies

`tests/e2e/spec-roundtrip.test.ts` exercises the full lifecycle:

| Step | What happens |
|------|-------------|
| 1 | Start ph-clint-cli, verify the personal drive has a **deterministic ID** (same across runs) |
| 2 | Create a `ph-clint-project` document via GraphQL and populate it with `IMPORT_SPEC` covering **every field** |
| 3 | Wait for the `spec-change` trigger to write `project-spec.json` to disk |
| 4 | Read the spec JSON and assert every field matches the document — plus an **exhaustive shape check** that fails on unexpected or missing paths |
| 5 | Stop CLI, shut down Connect, delete Reactor state (`.ph/` in workdir) |
| 6 | Restart CLI from the same workdir — it discovers the orphaned spec JSON |
| 7 | Verify the document is fully recreated from the spec JSON with identical field values, and the drive ID is the same as run 1 |

### Exhaustive Shape Guard

The test defines `EXPECTED_SPEC_PATHS` — a static set of every leaf key path in the spec JSON (e.g. `features.mastra.common.enableChat`, `packages[].documentTypes[]`). After asserting individual field values, it compares the actual paths against this set:

- **Unexpected paths** → a new field was added to the spec but the test doesn't cover it
- **Missing paths** → an expected field disappeared from the spec output

This catches silent regressions where a new state field is added to the document model but never wired through `specFromDocumentState` or `specToImportInput`.

## How to Proceed When It Fails

### "Unexpected paths in spec JSON: `features.foo.bar`"

A new field was added to `ClintProjectSpec` or the document state and is now serialized to the spec JSON, but the test doesn't know about it.

1. Add the field's path(s) to `EXPECTED_SPEC_PATHS` in the test
2. Add explicit assertions for the field in both step 4 (JSON check) and step 7 (restored document check)
3. Add the field to `SPEC_INPUT` at the top of the test so it exercises a non-default value
4. Ensure `specToImportInput()` in `spec-change.ts` maps the field for re-import

### "Missing paths in spec JSON: `deployment.newField`"

A field is expected by the test but not present in the output.

- If the field was intentionally removed: delete it from `EXPECTED_SPEC_PATHS` and remove related assertions
- If it's a bug: check `specFromDocumentState()` — it likely doesn't extract the field from document state

### "Stale service detected — already running"

Connect was left running from a previous test (or manual session). The test asserts no service reports "already running" on startup.

- The test shuts down Connect between runs (step 5) and in `afterAll`
- If this persists: run `ph-clint ph-clint-studio-stop` manually, or check that `runCliCommand` in the test successfully stops it

### "Drive ID mismatch between runs"

The personal drive lost its deterministic ID.

- Check that `deterministicId(CLI_NAME, 'personal-drive')` is still passed in `cli.ts`
- Check that `ensureDrive` in `drive.ts` respects the `id` field in `DriveConfig`
- The ID is derived from `SHA-256("ph-clint:personal-drive")` — it must be the same on every system

### Round-trip lost a field after document model change

When modifying the `ph-clint-project` document model:

1. Update the `IMPORT_SPEC` operation schema to include the new field
2. Update the lifecycle reducer to handle the field (with any guards/validation)
3. Update `specFromDocumentState()` to extract the field from document state into the spec
4. Update `specToImportInput()` to map the spec field back into `ImportSpecInput`
5. Run the e2e test — it will tell you exactly what's missing

## Key Files

| File | Role |
|------|------|
| `ph-clint-cli/src/triggers/spec-change.ts` | Trigger that watches documents and writes spec JSON; contains `specToImportInput()` |
| `ph-clint-cli/src/spec/from-document.ts` | `specFromDocumentState()` — document state → ClintProjectSpec |
| `ph-clint-cli/src/spec/types.ts` | `ClintProjectSpec` Zod schema — the canonical spec shape |
| `ph-clint-cli/src/spec/ensure-document.ts` | Bootstrap: creates a document from spec JSON when none exists |
| `ph-clint-app/.../reducers/lifecycle.ts` | `IMPORT_SPEC` reducer — ImportSpecInput → document state |
| `ph-clint/src/integrations/powerhouse/identity.ts` | `deterministicId()` — stable ID derivation |
| `ph-clint/src/integrations/powerhouse/drive.ts` | `ensureDrive()` — respects deterministic drive ID |

## Running the Test

```sh
cd packages/ph-clint-cli/ph-clint-cli
pnpm test:e2e  # runs all e2e tests including spec-roundtrip
```

The test is excluded from `pnpm test` (unit tests only). It takes ~25 seconds and requires no external services — it starts its own Reactor, Switchboard, and Connect instances.
