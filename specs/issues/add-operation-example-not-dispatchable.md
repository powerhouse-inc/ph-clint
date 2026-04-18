# ADD_OPERATION_EXAMPLE Not Dispatchable via MCP

Observed in RupertDevAgent session (2026-04-18) creating a contacts book document model.

## Symptom

The agent tried to dispatch `ADD_OPERATION_EXAMPLE` actions via `reactor-project-mcp__addActions` and got:

```
Action creator "addOperationExample" for action type "ADD_OPERATION_EXAMPLE"
is not defined in documentModelDocumentModelModule.actions
```

## Root Cause

The action is defined in the `document-model` package schema but **not exported in the main action creators object**:

- `AddOperationExampleAction` exists in the type union `DocumentModelAction`
- The action creator function `addOperationExample` exists as a standalone export
- It's grouped into a separate `operationExampleCreators` object
- But `documentModelActions` (the export used by MCP/Switchboard for dispatch) **omits all operation example actions**: `addOperationExample`, `updateOperationExample`, `deleteOperationExample`, `reorderOperationExamples`

Compare: operation ERROR actions (`addOperationError`, `setOperationErrorCode`, etc.) ARE included in `documentModelActions`.

## Impact

- Agents cannot add usage examples to operations when defining document models via MCP
- The document model spec has an `examples` array per operation, but it can only be populated through direct API access, not through the standard action dispatch path
- The agent recovered gracefully (moved on without examples), but the document model is less complete

## Where This Lives

This is an upstream issue in the `document-model` npm package (`document-model/dist/src/document-model/actions.js`), not in ph-clint or the skill templates.

## Workaround

None via MCP. The `examples` field on operations remains empty unless populated through a different code path.

## Fix

The `operationExampleCreators` need to be merged into `documentModelActions` in the `document-model` package, matching how `operationErrorCreators` are already included.
