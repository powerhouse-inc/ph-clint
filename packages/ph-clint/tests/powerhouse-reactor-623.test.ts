/**
 * The embedded reactor on Powerhouse 6.2.3.
 *
 * 6.2.3 creates documents as `v2-required` by default: a content-addressed
 * id and signed actions only. The embedded reactor is local and private and
 * runs without a Renown identity, so it has to create legacy documents: a
 * fixed drive id must be accepted (no `ID_MISMATCH`) and unsigned writes to
 * folders and documents must go through (no `UNSIGNED_REQUIRED`).
 */
import { describe, it, expect, afterAll, beforeAll } from '@jest/globals';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { rm } from 'node:fs/promises';
import {
  baseCreateDocument,
  createAction,
  createReducer,
  createState,
  defaultBaseState,
  isDocumentAction,
} from 'document-model';
import type { DocumentModelModule } from 'document-model';
import { buildReactor } from '../src/integrations/powerhouse/reactor.js';
import { ensureDrive } from '../src/integrations/powerhouse/drive.js';
import { createFolderOperations } from '../src/integrations/powerhouse/folders.js';
import { deterministicId } from '../src/integrations/powerhouse/identity.js';
import type { ReactorClientModule } from '../src/integrations/powerhouse/types.js';

// ── Minimal chat-session document model ─────────────────────────
// ph-clint cannot depend on clint-common (which owns the real
// `powerhouse/chat-session` model), so this stand-in has the same type and a
// single ADD_MESSAGE operation — enough to exercise an unsigned write.

const CHAT_SESSION_TYPE = 'powerhouse/chat-session';

function createChatState(state?: any): any {
  return {
    ...defaultBaseState(),
    ...state,
    document: { version: 1, ...state?.document },
    global: { messages: [], ...state?.global },
    local: { ...state?.local },
  };
}

const chatReducer = createReducer((state: any, action: any) => {
  if (isDocumentAction(action)) return state;
  if (action.type === 'ADD_MESSAGE') {
    state.global.messages.push({ id: action.input.id, text: action.input.text });
  }
  return state;
});

const chatSessionModule = {
  version: 1,
  reducer: chatReducer,
  actions: {},
  utils: {
    fileExtension: 'chat',
    createState: createChatState,
    createDocument: (state?: any) =>
      baseCreateDocument(createChatState, state, CHAT_SESSION_TYPE),
    saveToFileHandle: async () => {},
    loadFromInput: async () => {
      throw new Error('not supported in this fixture');
    },
    isStateOfType: () => true,
    assertIsStateOfType: () => {},
    isDocumentOfType: () => true,
    assertIsDocumentOfType: () => {},
  },
  documentModel: createState(defaultBaseState(), {
    id: CHAT_SESSION_TYPE,
    name: 'ChatSession',
    extension: 'chat',
    description: '',
    author: { name: '', website: '' },
    specifications: [
      {
        version: 1,
        changeLog: [],
        state: {
          global: { schema: '', initialValue: '{"messages":[]}', examples: [] },
          local: { schema: '', initialValue: '{}', examples: [] },
        },
        modules: [],
      },
    ],
  } as any),
} as unknown as DocumentModelModule;

// ── Real reactor setup ──────────────────────────────────────────

const testDir = join(tmpdir(), `reactor-623-test-${randomBytes(4).toString('hex')}`);
let reactorModule: ReactorClientModule;

beforeAll(async () => {
  reactorModule = await buildReactor({
    documentModels: [chatSessionModule],
    storagePath: join(testDir, 'reactor-storage'),
    enableSync: false,
  });
}, 30_000);

afterAll(async () => {
  if (reactorModule) {
    try {
      const status = reactorModule.reactor.kill();
      await status.completed;
    } catch {}
  }
  await rm(testDir, { recursive: true, force: true }).catch(() => {});
});

describe('embedded reactor on Powerhouse 6.2.3', () => {
  it('creates the agent drive with a fixed id on 6.2.3', async () => {
    const wantedId = deterministicId('reactor-623-test', 'personal-drive');

    const drive = await ensureDrive(reactorModule, {
      id: wantedId,
      name: 'Agent Drive',
      preferredEditor: 'powerhouse-drive-editor',
    });

    expect(drive.id).toBe(wantedId);
    const doc = (await reactorModule.client.get(wantedId)) as any;
    expect(doc.header.id).toBe(wantedId);
    expect(doc.header.name).toBe('Agent Drive');
    expect(doc.header.meta?.preferredEditor).toBe('powerhouse-drive-editor');

    // Idempotent on the next start-up.
    const again = await ensureDrive(reactorModule, { id: wantedId, name: 'Agent Drive' });
    expect(again.id).toBe(wantedId);
  }, 30_000);

  it('writes folders and a chat-session unsigned on the embedded reactor', async () => {
    const drive = await ensureDrive(reactorModule, { name: 'unsigned-writes-drive' });
    const client = reactorModule.client as any;
    const ops = createFolderOperations(client, drive.id);

    const folderId = await ops.ensureFolder('sessions/2026');
    expect(typeof folderId).toBe('string');

    const { documentId } = await ops.createDocument(
      CHAT_SESSION_TYPE,
      'sessions/2026',
      'First chat',
    );

    await client.execute(documentId, 'main', [
      createAction('ADD_MESSAGE', { id: 'm1', text: 'hello' }, undefined, undefined, 'global'),
    ]);

    const session = await client.get(documentId);
    expect(session.header.documentType).toBe(CHAT_SESSION_TYPE);
    expect(session.state.global.messages).toEqual([{ id: 'm1', text: 'hello' }]);

    const driveDoc = await client.get(drive.id);
    const fileNode = driveDoc.state.global.nodes.find(
      (n: any) => n.kind === 'file' && n.id === documentId,
    );
    expect(fileNode?.parentFolder).toBe(folderId);
  }, 30_000);
});
