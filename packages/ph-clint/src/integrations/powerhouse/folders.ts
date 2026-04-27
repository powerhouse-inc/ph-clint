/**
 * FolderOperations — programmatic API for managing documents
 * in the agent's personal drive using the reactor's folder hierarchy.
 *
 * Also exports `createFolderCommands()` to auto-generate CLI commands
 * that wrap the folder operations.
 */
import { z } from 'zod';
import type { TypedReactorClient } from './types.js';
import type { FolderEntry, FolderOperations } from './types.js';
import type { Command } from '../../core/types.js';

const DRIVE_TYPE = 'powerhouse/document-drive';

/** Minimal shape we read from child nodes. */
interface ChildNode {
  header?: {
    id?: string;
    name?: string;
    documentType?: string;
  };
  name?: string;
}

function nodeName(node: ChildNode): string {
  return node.name ?? node.header?.name ?? '';
}

function nodeId(node: ChildNode): string {
  return node.header?.id ?? '';
}

function isFolder(node: ChildNode): boolean {
  return node.header?.documentType === DRIVE_TYPE;
}

/**
 * Create a FolderOperations instance backed by the reactor client.
 */
export function createFolderOperations(
  client: TypedReactorClient<any>,
  personalDriveId: string,
): FolderOperations {
  function splitPath(folderPath: string): string[] {
    return folderPath.split('/').filter(Boolean);
  }

  async function getChildNodes(parentId: string): Promise<ChildNode[]> {
    const result = await client.getChildren(parentId);
    return (result?.results ?? []) as ChildNode[];
  }

  async function ensureFolder(folderPath: string): Promise<string> {
    const segments = splitPath(folderPath);
    let currentId = personalDriveId;

    for (const segment of segments) {
      const children = await getChildNodes(currentId);
      const existing = children.find(
        (c) => nodeName(c) === segment && isFolder(c),
      );
      if (existing) {
        currentId = nodeId(existing);
        continue;
      }

      // Create folder node and link it
      const folder = await client.createEmpty(DRIVE_TYPE);
      const folderId = folder.header.id;
      await client.rename(folderId, segment);
      await client.addChildren(currentId, [folderId]);
      currentId = folderId;
    }

    return currentId;
  }

  async function addDocument(
    documentId: string,
    folderPath: string,
    name?: string,
  ): Promise<void> {
    const folderId = await ensureFolder(folderPath);
    await client.addChildren(folderId, [documentId]);
    if (name) {
      await client.rename(documentId, name);
    }
  }

  async function removeDocument(
    documentId: string,
    folderPath?: string,
  ): Promise<void> {
    if (folderPath) {
      const folderId = await resolveFolder(folderPath);
      if (folderId) {
        await client.removeChildren(folderId, [documentId]);
      }
      return;
    }
    // No path — remove from drive root
    await client.removeChildren(personalDriveId, [documentId]);
  }

  async function resolveFolder(folderPath: string): Promise<string | undefined> {
    const segments = splitPath(folderPath);
    let currentId = personalDriveId;

    for (const segment of segments) {
      const children = await getChildNodes(currentId);
      const match = children.find(
        (c) => nodeName(c) === segment && isFolder(c),
      );
      if (!match) return undefined;
      currentId = nodeId(match);
    }

    return currentId;
  }

  async function getDocument(documentId: string): Promise<unknown> {
    return client.get(documentId);
  }

  async function listFolder(folderPath?: string): Promise<FolderEntry[]> {
    let parentId: string;
    if (folderPath) {
      const resolved = await resolveFolder(folderPath);
      if (!resolved) return []; // folder doesn't exist (yet) — avoid falling back to root
      parentId = resolved;
    } else {
      parentId = personalDriveId;
    }
    const prefix = folderPath ? folderPath.replace(/\/+$/, '') : '';

    const children = await getChildNodes(parentId);
    return children.map((c) => {
      const name = nodeName(c);
      return {
        id: nodeId(c),
        name,
        type: isFolder(c) ? 'folder' as const : 'document' as const,
        documentType: isFolder(c) ? undefined : c.header?.documentType,
        path: prefix ? `${prefix}/${name}` : name,
      };
    });
  }

  async function findByType(documentType: string): Promise<FolderEntry[]> {
    const result = await client.find({ documentTypes: [documentType] });
    const docs = (result?.results ?? []) as ChildNode[];
    return docs.map((c) => ({
      id: nodeId(c),
      name: nodeName(c),
      type: 'document' as const,
      documentType: c.header?.documentType,
      path: nodeName(c),
    }));
  }

  return {
    addDocument,
    removeDocument,
    getDocument,
    listFolder,
    ensureFolder,
    findByType,
  };
}

// ── Folder command schemas ────────────────────────────────────────

const addDocumentSchema = z.object({
  documentId: z.string().describe('Document ID to add'),
  folderPath: z.string().describe('Folder path (e.g. "specs/my-project")'),
  name: z.string().optional().describe('Display name for the document'),
});

const removeDocumentSchema = z.object({
  documentId: z.string().describe('Document ID to remove'),
  folderPath: z.string().optional().describe('Folder path to remove from'),
});

const getDocumentSchema = z.object({
  documentId: z.string().describe('Document ID to retrieve'),
});

const listFolderSchema = z.object({
  folderPath: z.string().optional().describe('Folder path (root if omitted)'),
});

/**
 * Auto-generate CLI commands that wrap FolderOperations.
 */
export function createFolderCommands(
  folderOps: FolderOperations,
): Command[] {
  const addDocument: Command<typeof addDocumentSchema> = {
    id: 'folders-add-document',
    description: 'Add a document to the personal drive at a folder path',
    inputSchema: addDocumentSchema,
    outputSchema: z.object({ text: z.string() }),
    execute: async (input) => {
      await folderOps.addDocument(input.documentId, input.folderPath, input.name);
      return { text: `Added document ${input.documentId} to ${input.folderPath}` };
    },
  };

  const removeDocument: Command<typeof removeDocumentSchema> = {
    id: 'folders-remove-document',
    description: 'Remove a document from the personal drive',
    inputSchema: removeDocumentSchema,
    outputSchema: z.object({ text: z.string() }),
    execute: async (input) => {
      await folderOps.removeDocument(input.documentId, input.folderPath);
      return { text: `Removed document ${input.documentId}` };
    },
  };

  const getDocument: Command<typeof getDocumentSchema> = {
    id: 'folders-get-document',
    description: 'Get a document from the personal drive',
    inputSchema: getDocumentSchema,
    outputSchema: z.object({ text: z.string(), data: z.unknown() }),
    execute: async (input) => {
      const doc = await folderOps.getDocument(input.documentId);
      return { text: JSON.stringify(doc, null, 2), data: doc };
    },
  };

  const listFolder: Command<typeof listFolderSchema> = {
    id: 'folders-ls',
    description: 'List folder contents in the personal drive',
    inputSchema: listFolderSchema,
    outputSchema: z.object({ text: z.string(), data: z.array(z.unknown()) }),
    execute: async (input) => {
      const entries = await folderOps.listFolder(input.folderPath);
      if (entries.length === 0) {
        return { text: 'Empty folder', data: [] };
      }
      const lines = entries.map((e) => {
        const icon = e.type === 'folder' ? '[dir]' : '[doc]';
        const typeInfo = e.documentType ? ` (${e.documentType})` : '';
        return `  ${icon} ${e.name}${typeInfo}  ${e.id.slice(0, 8)}...`;
      });
      return { text: lines.join('\n'), data: entries };
    },
  };

  return [addDocument, removeDocument, getDocument, listFolder];
}
