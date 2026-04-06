# 06 — Document Browser

A CLI for browsing and editing Powerhouse documents. Mounts remote drives, lists documents, reads state, and dispatches operations. No agent — direct command interaction with the reactor. Demonstrates the Powerhouse integration as a standalone feature.

## What It Shows

- Powerhouse integration: reactor initialization, drive mounting, document subscriptions
- Document operations as CLI commands (derived from Zod schemas)
- Reading document state and operation history
- Dispatching actions to documents
- Event handlers for document change notifications
- Workspace stores connection settings

## Code

### Powerhouse integration

```typescript
import { defineCli, defineCommand, definePowerhouseIntegration } from 'ph-clint';
import { z } from 'zod';

const configSchema = z.object({
  driveUrl: z.string().describe('Remote drive URL to connect to'),
});

const powerhouse = definePowerhouseIntegration({
  documentModels: ['powerhouse/document-drive', 'powerhouse/document-model'],
  drives: (config) => [
    { url: config.driveUrl, sync: true },
  ],
  storage: 'memory',
});
```

### Commands

```typescript
const drives = defineCommand({
  id: 'drives',
  description: 'List connected drives',
  inputSchema: z.object({}),
  execute: async (_, { reactor }) => {
    const list = await reactor.listDrives();
    return {
      text: list.map(d => `${d.id} — ${d.name} (${d.nodeCount} items)`).join('\n'),
      data: list,
    };
  },
});

const ls = defineCommand({
  id: 'ls',
  description: 'List documents in a drive or folder',
  inputSchema: z.object({
    drive: z.string().describe('Drive ID'),
    path: z.string().default('/').describe('Folder path'),
  }),
  execute: async ({ drive, path }, { reactor }) => {
    const nodes = await reactor.listNodes(drive, path);
    return {
      text: nodes.map(n =>
        `${n.kind === 'folder' ? '📁' : '📄'} ${n.name} (${n.documentType ?? 'folder'})`
      ).join('\n'),
      data: nodes,
    };
  },
});

const read = defineCommand({
  id: 'read',
  description: 'Read a document state',
  inputSchema: z.object({
    id: z.string().describe('Document ID'),
    scope: z.enum(['global', 'local']).default('global').describe('State scope'),
  }),
  execute: async ({ id, scope }, { reactor }) => {
    const doc = await reactor.getDocument(id);
    const state = scope === 'global' ? doc.state.global : doc.state.local;
    return {
      text: JSON.stringify(state, null, 2),
      data: state,
    };
  },
});

const history = defineCommand({
  id: 'history',
  description: 'Show operation history for a document',
  inputSchema: z.object({
    id: z.string().describe('Document ID'),
    limit: z.number().default(10).describe('Number of operations'),
  }),
  execute: async ({ id, limit }, { reactor }) => {
    const ops = await reactor.getOperations(id, { limit });
    return {
      text: ops.map(op =>
        `#${op.index} ${op.type} — ${new Date(op.timestamp).toISOString()}`
      ).join('\n'),
      data: ops,
    };
  },
});

const dispatch = defineCommand({
  id: 'dispatch',
  description: 'Dispatch an action to a document',
  inputSchema: z.object({
    id: z.string().describe('Document ID'),
    action: z.string().describe('Action name (e.g., SET_MODEL_NAME)'),
    input: z.string().describe('Action input as JSON'),
  }),
  execute: async ({ id, action, input }, { reactor }) => {
    const parsed = JSON.parse(input);
    const result = await reactor.dispatch(id, { type: action, input: parsed });
    return {
      text: result.error ? `Error: ${result.error}` : `Applied ${action} → revision ${result.revision}`,
      data: result,
    };
  },
});

const schema = defineCommand({
  id: 'schema',
  description: 'Show the schema for a document type',
  inputSchema: z.object({
    type: z.string().describe('Document type (e.g., powerhouse/document-model)'),
  }),
  execute: async ({ type }, { reactor }) => {
    const model = await reactor.getDocumentModel(type);
    return {
      text: JSON.stringify(model.specifications, null, 2),
      data: model,
    };
  },
});
```

### CLI entry point

```typescript
const cli = defineCli({
  name: 'phdoc',
  version: '1.0.0',
  description: 'Powerhouse document browser',
  configSchema,
  commands: [drives, ls, read, history, dispatch, schema],
  integrations: [powerhouse],
  events: {
    'document:changed': (event) => {
      console.log(`Document ${event.id} updated (rev ${event.revision})`);
    },
  },
  interactive: {
    welcome: 'Document Browser — /drives to list connected drives',
  },
});
```

### Usage

```bash
# Command mode
PHDOC_DRIVE_URL=http://localhost:4001/d/abc phdoc drives
phdoc ls --drive abc
phdoc read --id doc-123
phdoc dispatch --id doc-123 --action SET_MODEL_NAME --input '{"name":"Invoice"}'

# Interactive mode
phdoc -i
> /drives
> /ls --drive abc
> /read --id doc-123
> /schema --type powerhouse/document-model
> /dispatch --id doc-123 --action SET_MODEL_NAME --input '{"name":"Invoice"}'
# Document doc-123 updated (rev 5)     ← event handler fires
```

## Acceptance Criteria

- [ ] Reactor initializes with configured document models on startup
- [ ] Remote drive mounts and syncs from the configured URL
- [ ] `phdoc drives` lists connected drives with node counts
- [ ] `phdoc ls --drive X` lists documents and folders in a drive
- [ ] `phdoc read --id X` displays document global state as JSON
- [ ] `phdoc history --id X` shows operation history
- [ ] `phdoc dispatch` applies an action and reports the new revision
- [ ] `phdoc schema --type X` shows the document model specification
- [ ] Document change events fire when remote documents are synced
- [ ] Connection settings persist in workspace for subsequent invocations
- [ ] Missing `--drive-url` config results in a clear error message
