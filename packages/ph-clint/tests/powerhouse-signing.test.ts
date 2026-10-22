/**
 * Signed writes on the embedded reactor (`signing`).
 *
 * With a signer the agent's client signs every action (v2 tuples carrying the
 * signer's user), refuses writes it cannot sign instead of sending them
 * unsigned, keeps off legacy documents when told to, and the module's own
 * client (what the switchboard serves) never signs with the agent's identity.
 */
import { describe, it, expect, afterAll, beforeAll, beforeEach } from '@jest/globals';
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
  signaturePolicyOf,
  withSignaturePolicy,
} from 'document-model';
import type { DocumentModelModule } from 'document-model';
import { buildReactor, type BuiltReactorModule } from '../src/integrations/powerhouse/reactor.js';
import { ensureDrive } from '../src/integrations/powerhouse/drive.js';
import { applyCreatePolicy } from '../src/integrations/powerhouse/create-policy.js';
import { createFolderOperations } from '../src/integrations/powerhouse/folders.js';
import { deterministicId } from '../src/integrations/powerhouse/identity.js';
import {
  DocumentNotWritableError,
  SignerNotReadyError,
  canWrite,
} from '../src/integrations/powerhouse/signing.js';
import { createTestSigner, OWNER, type TestSigner } from './helpers/test-signer.js';

const NOTE_TYPE = 'test/note';

function createNoteState(state?: any): any {
  return {
    ...defaultBaseState(),
    ...state,
    document: { version: 1, ...state?.document },
    global: { lines: [], ...state?.global },
    local: { ...state?.local },
  };
}

const noteModule = {
  version: 1,
  reducer: createReducer((state: any, action: any) => {
    if (isDocumentAction(action)) return state;
    if (action.type === 'ADD_LINE') state.global.lines.push(action.input.text);
    return state;
  }),
  actions: {},
  utils: {
    fileExtension: 'note',
    createState: createNoteState,
    createDocument: (state?: any) => baseCreateDocument(createNoteState, state, NOTE_TYPE),
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
    id: NOTE_TYPE,
    name: 'Note',
    extension: 'note',
    description: '',
    author: { name: '', website: '' },
    specifications: [
      {
        version: 1,
        changeLog: [],
        state: {
          global: { schema: '', initialValue: '{"lines":[]}', examples: [] },
          local: { schema: '', initialValue: '{}', examples: [] },
        },
        modules: [],
      },
    ],
  } as any),
} as unknown as DocumentModelModule;

const addLine = (text: string) =>
  createAction('ADD_LINE', { text }, undefined, undefined, 'global');

const testDir = join(tmpdir(), `reactor-signing-test-${randomBytes(4).toString('hex')}`);
const modules: BuiltReactorModule[] = [];

async function build(name: string, signing: Parameters<typeof buildReactor>[0]['signing']) {
  const module = await buildReactor({
    documentModels: [noteModule],
    storagePath: join(testDir, name),
    enableSync: false,
    signing,
  });
  modules.push(module);
  return module;
}

afterAll(async () => {
  for (const module of modules) {
    try {
      await module.reactor.kill().completed;
    } catch {}
  }
  await rm(testDir, { recursive: true, force: true }).catch(() => {});
});

async function lastSigner(module: BuiltReactorModule, documentId: string): Promise<any> {
  const page = await module.agentClient.getOperations(documentId, { scopes: ['global'] } as any);
  const ops = page.results;
  return ops[ops.length - 1]?.action?.context?.signer;
}

describe('signed writes, every document v2-required', () => {
  let signer: TestSigner;
  let module: BuiltReactorModule;
  let created: string[];

  beforeAll(async () => {
    signer = await createTestSigner();
    created = [];
    module = await build('v2', {
      signer,
      createSignaturePolicy: 'v2-required',
      legacyDocuments: 'refuse',
    });
  }, 30_000);

  beforeEach(() => {
    signer.user = OWNER;
  });

  it('creates the drive under a derived id and signs as the user', async () => {
    const agent = { ...module, client: module.agentClient };
    const drive = await ensureDrive(agent, {
      name: 'Home',
      preferredEditor: 'test-editor',
      matchByName: false,
      onCreated: (id) => {
        created.push(id);
      },
    });
    expect(created).toEqual([drive.id]);
    const doc = (await module.agentClient.get(drive.id)) as any;
    expect(signaturePolicyOf(doc.header)).toBe('v2-required');
    expect(doc.header.meta?.preferredEditor).toBe('test-editor');

    const ops = createFolderOperations(module.agentClient as any, drive.id);
    const { documentId } = await ops.createDocument(NOTE_TYPE, 'notes', 'First');
    await module.agentClient.execute(documentId, 'main', [addLine('hello')]);
    const note = (await module.agentClient.get(documentId)) as any;
    expect(signaturePolicyOf(note.header)).toBe('v2-required');
    expect(note.state.global.lines).toEqual(['hello']);
    const s = await lastSigner(module, documentId);
    expect(s.user.address).toBe(OWNER.address);
    expect(s.app.key).toBe(signer.app.key);
    expect(s.signatures.at(-1)[2]).toMatch(/^v2:/);
  }, 30_000);

  it('refuses a write it cannot sign and writes nothing', async () => {
    const doc = await module.agentClient.createEmpty(NOTE_TYPE);
    signer.user = undefined;
    await expect(
      module.agentClient.execute(doc.header.id, 'main', [addLine('unsigned')]),
    ).rejects.toBeInstanceOf(SignerNotReadyError);
    await expect(module.agentClient.createEmpty(NOTE_TYPE)).rejects.toBeInstanceOf(
      SignerNotReadyError,
    );
    signer.user = OWNER;
    const after = (await module.agentClient.get(doc.header.id)) as any;
    expect(after.state.global.lines).toEqual([]);
  }, 30_000);

  it('leaves legacy documents alone', async () => {
    const legacy = withSignaturePolicy(noteModule.utils.createDocument(), 'legacy');
    await module.client.create(legacy);
    await expect(
      module.agentClient.execute(legacy.header.id, 'main', [addLine('x')]),
    ).rejects.toBeInstanceOf(DocumentNotWritableError);
    await expect(
      module.agentClient.create(withSignaturePolicy(noteModule.utils.createDocument(), 'legacy')),
    ).rejects.toBeInstanceOf(DocumentNotWritableError);
  }, 30_000);

  it('never signs with the agent identity on the module client (switchboard)', async () => {
    const doc = await module.agentClient.createEmpty(NOTE_TYPE);
    // The switchboard's client has no signer: an unsigned write to a
    // v2-required document is refused rather than signed as the owner.
    await expect(
      module.client.execute(doc.header.id, 'main', [addLine('via switchboard')]),
    ).rejects.toThrow(/UNSIGNED_REQUIRED/);
  }, 30_000);

  it('refuses a fixed id under a v2 create policy', async () => {
    await expect(
      applyCreatePolicy(module.agentClient, noteModule.utils.createDocument(), 'fixed-id'),
    ).rejects.toThrow(/fixed id/);
  });

  it('defers creating a drive it may not create yet', async () => {
    const agent = { ...module, client: module.agentClient };
    const drive = await ensureDrive(agent, {
      name: 'Later',
      matchByName: false,
      canCreate: () => false,
    });
    expect(drive).toEqual({ id: '', name: 'Later', deferred: true });
  });

  it('finds a drive through resolveId first', async () => {
    const agent = { ...module, client: module.agentClient };
    const drive = await ensureDrive(agent, {
      name: 'Pointed',
      resolveId: async () => 'pointed-id',
      canCreate: () => false,
    });
    expect(drive.id).toBe('pointed-id');
  });
});

describe('signed writes beside legacy documents', () => {
  let signer: TestSigner;
  let module: BuiltReactorModule;

  beforeAll(async () => {
    signer = await createTestSigner();
    module = await build('compat', {
      signer,
      createSignaturePolicy: 'legacy',
      legacyDocuments: 'sign-when-ready',
    });
  }, 30_000);

  it('keeps a fixed-id legacy drive and writes unsigned until it can sign', async () => {
    const agent = { ...module, client: module.agentClient };
    const wantedId = deterministicId('signing-test', 'compat-drive');
    const drive = await ensureDrive(agent, { id: wantedId, name: 'Home' });
    expect(drive.id).toBe(wantedId);

    const doc = await module.agentClient.createEmpty(NOTE_TYPE);
    expect(signaturePolicyOf(doc.header)).toBe('legacy');

    signer.user = undefined;
    await module.agentClient.execute(doc.header.id, 'main', [addLine('before')]);
    expect((await lastSigner(module, doc.header.id))?.app?.key ?? '').toBe('');

    signer.user = OWNER;
    await module.agentClient.execute(doc.header.id, 'main', [addLine('after')]);
    const read = (await module.agentClient.get(doc.header.id)) as any;
    expect(read.state.global.lines).toEqual(['before', 'after']);
    expect((await lastSigner(module, doc.header.id)).user.address).toBe(OWNER.address);
  }, 30_000);
});

describe('canWrite', () => {
  const v2 = { header: { id: 'a', protocolVersions: { signature: 2 } } };
  const legacy = { header: { id: 'b', protocolVersions: { 'base-reducer': 2 } } };

  it('needs a ready signer for v2 documents', () => {
    expect(canWrite({ ready: () => false, legacyDocuments: 'refuse' }, v2)).toBe(false);
    expect(canWrite({ ready: () => true, legacyDocuments: 'refuse' }, v2)).toBe(true);
  });

  it('follows the legacy rule for legacy documents', () => {
    expect(canWrite({ ready: () => true, legacyDocuments: 'refuse' }, legacy)).toBe(false);
    expect(canWrite({ ready: () => false, legacyDocuments: 'sign-when-ready' }, legacy)).toBe(true);
  });

  it('applies the host rule first', () => {
    expect(
      canWrite({ ready: () => true, legacyDocuments: 'refuse', accepts: () => false }, v2),
    ).toBe(false);
  });
});

describe('buildDefaultReactor with signing', () => {
  it('exposes the write rules and announces when writes become possible', async () => {
    const { buildDefaultReactor } = await import('../src/integrations/powerhouse/index.js');
    const signer = await createTestSigner();
    const events: string[] = [];
    let notify: (() => void) | undefined;
    const reactor = await buildDefaultReactor(
      {
        workdir: testDir,
        config: {},
        workspace: { getStoreFolder: (name: string) => join(testDir, 'default', name) },
        emit: (event: string) => {
          events.push(event);
        },
      } as any,
      {
        documentModels: [noteModule],
        drive: { name: 'Home', matchByName: false, canCreate: () => signer.user !== undefined },
        signing: {
          signer,
          createSignaturePolicy: 'v2-required',
          legacyDocuments: 'refuse',
          onSignerChange: (listener) => {
            notify = listener;
            return () => {
              notify = undefined;
            };
          },
        },
      },
    );
    try {
      // No identity yet: no drive is created and nothing can be written.
      expect(reactor.driveId).toBe('');
      expect(reactor.writes?.ready()).toBe(false);
      const v2 = { header: { id: 'x', protocolVersions: { signature: 2 } } };
      expect(reactor.writes?.canWrite(v2)).toBe(false);

      signer.user = OWNER;
      notify?.();
      expect(events).toContain('powerhouse:writes:ready');
      expect(reactor.writes?.canWrite(v2)).toBe(true);
    } finally {
      await reactor.shutdown();
    }
  }, 30_000);
});
