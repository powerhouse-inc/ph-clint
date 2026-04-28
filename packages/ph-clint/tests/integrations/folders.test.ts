import { describe, it, expect, jest } from '@jest/globals';
import {
  createFolderOperations,
  createFolderCommands,
} from '../../src/integrations/powerhouse/folders.js';
import type { FolderOperations } from '../../src/integrations/powerhouse/types.js';

// ── Mock client ──────────────────────────────────────────────────

interface MockNode {
  header: { id: string; name: string; documentType: string };
  name: string;
}

function createMockClient() {
  const nodes = new Map<string, MockNode>();
  const children = new Map<string, string[]>(); // parentId → childIds

  function addNode(id: string, name: string, docType: string) {
    nodes.set(id, {
      header: { id, name, documentType: docType },
      name,
    });
  }

  // Set up drive root
  addNode('drive-root', 'root', 'powerhouse/document-drive');
  children.set('drive-root', []);

  let nextId = 1;

  const client = {
    get: jest.fn(async (id: string) => nodes.get(id)),
    getChildren: jest.fn(async (parentId: string) => ({
      results: (children.get(parentId) ?? []).map((cid) => nodes.get(cid)).filter(Boolean),
    })),
    addChildren: jest.fn(async (parentId: string, docIds: string[]) => {
      const existing = children.get(parentId) ?? [];
      for (const id of docIds) {
        if (!existing.includes(id)) existing.push(id);
      }
      children.set(parentId, existing);
    }),
    removeChildren: jest.fn(async (parentId: string, docIds: string[]) => {
      const existing = children.get(parentId) ?? [];
      children.set(
        parentId,
        existing.filter((id) => !docIds.includes(id)),
      );
    }),
    createEmpty: jest.fn(async (docType: string, options?: { parentIdentifier?: string }) => {
      const id = `node-${nextId++}`;
      addNode(id, '', docType);
      children.set(id, []);
      if (options?.parentIdentifier) {
        const parentChildren = children.get(options.parentIdentifier) ?? [];
        if (!parentChildren.includes(id)) parentChildren.push(id);
        children.set(options.parentIdentifier, parentChildren);
      }
      return nodes.get(id)!;
    }),
    rename: jest.fn(async (id: string, name: string) => {
      const node = nodes.get(id);
      if (node) {
        node.name = name;
        node.header.name = name;
      }
      return nodes.get(id)!;
    }),
    find: jest.fn(async (search: { documentTypes?: string[] }) => {
      const types = search.documentTypes ?? [];
      const results = [...nodes.values()].filter(
        (n) => types.includes(n.header.documentType),
      );
      return { results };
    }),
  };

  return { client: client as any, addNode, children, nodes };
}

// ── FolderOperations tests ───────────────────────────────────────

describe('createFolderOperations', () => {
  it('ensureFolder creates nested folder hierarchy', async () => {
    const { client } = createMockClient();
    const ops = createFolderOperations(client, 'drive-root');

    const leafId = await ops.ensureFolder('specs/project-a');

    // Two folders created: specs, project-a
    expect(client.createEmpty).toHaveBeenCalledTimes(2);
    // createEmpty now uses parentIdentifier to link folders
    expect(client.createEmpty).toHaveBeenCalledWith('powerhouse/document-drive', { parentIdentifier: 'drive-root' });
    expect(client.createEmpty).toHaveBeenCalledWith('powerhouse/document-drive', { parentIdentifier: expect.any(String) });
    expect(client.rename).toHaveBeenCalledWith(expect.any(String), 'specs');
    expect(client.rename).toHaveBeenCalledWith(expect.any(String), 'project-a');
    // addChildren is NOT called for folders (parentIdentifier handles it)
    expect(client.addChildren).not.toHaveBeenCalled();
    expect(typeof leafId).toBe('string');
  });

  it('ensureFolder reuses existing folders', async () => {
    const { client } = createMockClient();
    const ops = createFolderOperations(client, 'drive-root');

    // Create once
    await ops.ensureFolder('specs/project-a');
    const createCount = (client.createEmpty as jest.Mock).mock.calls.length;

    // Create again — should reuse
    await ops.ensureFolder('specs/project-a');
    expect(client.createEmpty).toHaveBeenCalledTimes(createCount);
  });

  it('addDocument creates folder and links document', async () => {
    const { client, addNode } = createMockClient();
    const ops = createFolderOperations(client, 'drive-root');

    addNode('doc-1', 'My Doc', 'test/type');
    await ops.addDocument('doc-1', 'specs');

    expect(client.addChildren).toHaveBeenCalled();
    // Document should be linked in the specs folder
    const lastCall = (client.addChildren as jest.Mock).mock.calls.at(-1) as unknown[];
    expect(lastCall[1]).toEqual(['doc-1']);
  });

  it('addDocument renames document when name provided', async () => {
    const { client, addNode } = createMockClient();
    const ops = createFolderOperations(client, 'drive-root');

    addNode('doc-1', 'Old Name', 'test/type');
    await ops.addDocument('doc-1', 'specs', 'New Name');

    expect(client.rename).toHaveBeenCalledWith('doc-1', 'New Name');
  });

  it('removeDocument removes from specific folder', async () => {
    const { client, addNode } = createMockClient();
    const ops = createFolderOperations(client, 'drive-root');

    addNode('doc-1', 'My Doc', 'test/type');
    await ops.addDocument('doc-1', 'specs');
    await ops.removeDocument('doc-1', 'specs');

    // Verify removeChildren was called
    expect(client.removeChildren).toHaveBeenCalled();
  });

  it('removeDocument removes from drive root when no path', async () => {
    const { client } = createMockClient();
    const ops = createFolderOperations(client, 'drive-root');

    await ops.removeDocument('doc-1');

    expect(client.removeChildren).toHaveBeenCalledWith('drive-root', ['doc-1']);
  });

  it('getDocument delegates to client.get', async () => {
    const { client, addNode } = createMockClient();
    const ops = createFolderOperations(client, 'drive-root');

    addNode('doc-1', 'My Doc', 'test/type');
    const doc = await ops.getDocument('doc-1');
    expect(doc).toEqual(expect.objectContaining({ name: 'My Doc' }));
  });

  it('listFolder lists drive root contents', async () => {
    const { client, addNode, children } = createMockClient();
    const ops = createFolderOperations(client, 'drive-root');

    addNode('folder-1', 'specs', 'powerhouse/document-drive');
    addNode('doc-1', 'readme', 'test/type');
    children.set('drive-root', ['folder-1', 'doc-1']);

    const entries = await ops.listFolder();

    expect(entries).toHaveLength(2);
    expect(entries[0]).toEqual({
      id: 'folder-1',
      name: 'specs',
      type: 'folder',
      documentType: undefined,
      path: 'specs',
    });
    expect(entries[1]).toEqual({
      id: 'doc-1',
      name: 'readme',
      type: 'document',
      documentType: 'test/type',
      path: 'readme',
    });
  });

  it('listFolder lists subfolder with path prefix', async () => {
    const { client } = createMockClient();
    const ops = createFolderOperations(client, 'drive-root');

    // Create folder structure
    await ops.ensureFolder('specs');
    // Add a doc to specs
    const entries = await ops.listFolder('specs');
    expect(entries).toEqual([]);
  });

  it('findByType returns matching documents', async () => {
    const { client, addNode } = createMockClient();
    const ops = createFolderOperations(client, 'drive-root');

    addNode('doc-1', 'Spec A', 'test/spec');
    addNode('doc-2', 'Spec B', 'test/spec');
    addNode('doc-3', 'Other', 'test/other');

    const results = await ops.findByType('test/spec');
    expect(results).toHaveLength(2);
    expect(results.every((r) => r.documentType === 'test/spec')).toBe(true);
  });
});

// ── createFolderCommands tests ───────────────────────────────────

describe('createFolderCommands', () => {
  it('generates four commands with correct IDs', () => {
    const ops = {} as FolderOperations;
    const cmds = createFolderCommands(ops);

    expect(cmds).toHaveLength(4);
    expect(cmds.map((c) => c.id)).toEqual([
      'folders-add-document',
      'folders-remove-document',
      'folders-get-document',
      'folders-ls',
    ]);
  });

  it('each command has inputSchema and execute', () => {
    const ops = {} as FolderOperations;
    const cmds = createFolderCommands(ops);

    for (const cmd of cmds) {
      expect(cmd.inputSchema).toBeDefined();
      expect(typeof cmd.execute).toBe('function');
    }
  });

  it('folders-ls execute returns formatted output', async () => {
    const ops: FolderOperations = {
      addDocument: async () => {},
      removeDocument: async () => {},
      getDocument: async () => ({}),
      listFolder: async () => [
        { id: 'abcdefgh1234', name: 'my-folder', type: 'folder', path: 'my-folder' },
        { id: 'ijklmnop5678', name: 'readme', type: 'document', documentType: 'test/doc', path: 'readme' },
      ],
      ensureFolder: async () => '',
      findByType: async () => [],
    };

    const cmds = createFolderCommands(ops);
    const lsCmd = cmds.find((c) => c.id === 'folders-ls')!;
    const result = await lsCmd.execute({}, {} as any);
    expect(result).toEqual(
      expect.objectContaining({
        text: expect.stringContaining('[dir] my-folder'),
      }),
    );
    expect(result.text).toContain('[doc] readme (test/doc)');
  });

  it('folders-add-document execute calls addDocument', async () => {
    const addDocument = jest.fn<() => Promise<void>>(async () => {});
    const ops: FolderOperations = {
      addDocument,
      removeDocument: async () => {},
      getDocument: async () => ({}),
      listFolder: async () => [],
      ensureFolder: async () => '',
      findByType: async () => [],
    };
    const cmds = createFolderCommands(ops);
    const cmd = cmds.find((c) => c.id === 'folders-add-document')!;
    const result = await cmd.execute(
      { documentId: 'd1', folderPath: 'specs', name: 'My Doc' },
      {} as any,
    );
    expect(addDocument).toHaveBeenCalledWith('d1', 'specs', 'My Doc');
    expect(result.text).toContain('d1');
  });

  it('folders-remove-document execute calls removeDocument', async () => {
    const removeDocument = jest.fn<() => Promise<void>>(async () => {});
    const ops: FolderOperations = {
      addDocument: async () => {},
      removeDocument,
      getDocument: async () => ({}),
      listFolder: async () => [],
      ensureFolder: async () => '',
      findByType: async () => [],
    };
    const cmds = createFolderCommands(ops);
    const cmd = cmds.find((c) => c.id === 'folders-remove-document')!;
    const result = await cmd.execute({ documentId: 'd1' }, {} as any);
    expect(removeDocument).toHaveBeenCalledWith('d1', undefined);
    expect(result.text).toContain('d1');
  });

  it('folders-get-document execute returns JSON', async () => {
    const ops: FolderOperations = {
      addDocument: async () => {},
      removeDocument: async () => {},
      getDocument: async () => ({ foo: 'bar' }),
      listFolder: async () => [],
      ensureFolder: async () => '',
      findByType: async () => [],
    };
    const cmds = createFolderCommands(ops);
    const cmd = cmds.find((c) => c.id === 'folders-get-document')!;
    const result = await cmd.execute({ documentId: 'd1' }, {} as any);
    expect(JSON.parse(result.text)).toEqual({ foo: 'bar' });
    expect(result.data).toEqual({ foo: 'bar' });
  });

  it('folders-ls returns empty message for empty folder', async () => {
    const ops: FolderOperations = {
      addDocument: async () => {},
      removeDocument: async () => {},
      getDocument: async () => ({}),
      listFolder: async () => [],
      ensureFolder: async () => '',
      findByType: async () => [],
    };

    const cmds = createFolderCommands(ops);
    const lsCmd = cmds.find((c) => c.id === 'folders-ls')!;
    const result = await lsCmd.execute({}, {} as any);
    expect(result.text).toBe('Empty folder');
  });
});
