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
import type { Logger } from '../../core/types.js';

const DRIVE_TYPE = 'powerhouse/document-drive';
const TAG = '[folders]';

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
  log?: Logger,
): FolderOperations {
  // Session-level cache: folder path → folder document ID.
  // Prevents duplicate folder creation when the reactor's read model
  // hasn't indexed a prior rename/addChildren by the time we re-query.
  const folderCache = new Map<string, string>();

  function splitPath(folderPath: string): string[] {
    return folderPath.split('/').filter(Boolean);
  }

  async function getChildNodes(parentId: string): Promise<ChildNode[]> {
    const result = await client.getChildren(parentId);
    return (result?.results ?? []) as ChildNode[];
  }

  async function ensureFolder(folderPath: string): Promise<string> {
    const cached = folderCache.get(folderPath);
    if (cached) {
      log?.debug(`${TAG} ensureFolder("${folderPath}") → cache hit ${cached.slice(0, 8)}…`);
      return cached;
    }

    const segments = splitPath(folderPath);
    let currentId = personalDriveId;
    let currentPath = '';

    for (const segment of segments) {
      currentPath = currentPath ? `${currentPath}/${segment}` : segment;

      // Check local cache first (handles back-to-back creates)
      const cachedSegment = folderCache.get(currentPath);
      if (cachedSegment) {
        log?.debug(`${TAG} ensureFolder segment "${currentPath}" → cache hit ${cachedSegment.slice(0, 8)}…`);
        currentId = cachedSegment;
        continue;
      }

      const children = await getChildNodes(currentId);
      log?.debug(
        `${TAG} ensureFolder segment "${segment}" in ${currentId.slice(0, 8)}…: ` +
        `${children.length} children [${children.map(c => `${isFolder(c) ? 'folder' : 'doc'}:"${nodeName(c)}"`).join(', ')}]`,
      );

      const existing = children.find(
        (c) => nodeName(c) === segment && isFolder(c),
      );
      if (existing) {
        currentId = nodeId(existing);
        folderCache.set(currentPath, currentId);
        log?.debug(`${TAG} ensureFolder segment "${segment}" → exists ${currentId.slice(0, 8)}…`);
        continue;
      }

      // Create folder node within the current parent and link it.
      // Use parentIdentifier so createEmpty registers the relationship.
      log?.debug(`${TAG} ensureFolder creating folder "${segment}" under ${currentId.slice(0, 8)}…`);
      const folder = await client.createEmpty(DRIVE_TYPE, { parentIdentifier: currentId });
      const folderId = folder.header.id;

      // Rename and verify the result
      const renamed = await client.rename(folderId, segment);
      const actualName = renamed.name ?? (renamed as ChildNode).header?.name ?? '';
      if (actualName !== segment) {
        log?.warn(
          `${TAG} ensureFolder: rename("${segment}") returned name="${actualName}" ` +
          `(header.name="${(renamed as ChildNode).header?.name}") — name may not persist in read model`,
        );
      }
      log?.debug(
        `${TAG} ensureFolder created folder "${segment}" → ${folderId.slice(0, 8)}… ` +
        `(rename verified: "${actualName}")`,
      );

      currentId = folderId;
      folderCache.set(currentPath, currentId);
    }

    return currentId;
  }

  async function addDocument(
    documentId: string,
    folderPath: string,
    name?: string,
  ): Promise<void> {
    log?.debug(`${TAG} addDocument ${documentId.slice(0, 8)}… to "${folderPath}" name=${name ?? '(none)'}`);
    const folderId = await ensureFolder(folderPath);
    await client.addChildren(folderId, [documentId]);
    if (name) {
      const renamed = await client.rename(documentId, name);
      const actualName = renamed.name ?? (renamed as ChildNode).header?.name ?? '';
      log?.debug(`${TAG} addDocument renamed ${documentId.slice(0, 8)}… → "${actualName}"`);
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
    // Check cache first
    const cached = folderCache.get(folderPath);
    if (cached) return cached;

    const segments = splitPath(folderPath);
    let currentId = personalDriveId;
    let currentPath = '';

    for (const segment of segments) {
      currentPath = currentPath ? `${currentPath}/${segment}` : segment;

      const cachedSegment = folderCache.get(currentPath);
      if (cachedSegment) {
        currentId = cachedSegment;
        continue;
      }

      const children = await getChildNodes(currentId);
      const match = children.find(
        (c) => nodeName(c) === segment && isFolder(c),
      );
      if (!match) return undefined;
      currentId = nodeId(match);
      folderCache.set(currentPath, currentId);
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
