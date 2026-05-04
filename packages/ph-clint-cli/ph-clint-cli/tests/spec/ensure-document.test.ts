/**
 * Integration tests for ensureSpecDocument — uses a real PGlite-backed
 * reactor, no mocks.
 */
import { describe, it, expect, afterAll, beforeAll } from '@jest/globals';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { rm } from 'node:fs/promises';
import {
  buildReactor,
  ensureDrive,
  createFolderOperations,
} from '@powerhousedao/ph-clint/powerhouse';
import { documentModels } from '@powerhousedao/ph-clint-app';
import type { ReactorClientModule } from '@powerhousedao/ph-clint';
import { ensureSpecDocument } from '../../src/spec/ensure-document.js';
import { readProjectSpec } from '../../src/spec/file.js';
import { clintProjectSpecSchema } from '../../src/spec/types.js';

const testDir = join(
  tmpdir(),
  `ensure-doc-test-${randomBytes(4).toString('hex')}`,
);
let reactorModule: ReactorClientModule;
let driveId: string;

function makeSpec(overrides: Record<string, unknown> = {}) {
  return clintProjectSpecSchema.parse({
    name: 'test-project-cli',
    ...overrides,
  });
}

beforeAll(async () => {
  reactorModule = await buildReactor({
    documentModels,
    storagePath: join(testDir, 'reactor-storage'),
    enableSync: false,
  });
  const drive = await ensureDrive(reactorModule, {
    name: 'ensure-doc-test-drive',
  });
  driveId = drive.id;
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

describe('ensureSpecDocument', () => {
  it('creates a new spec document when none exists', async () => {
    const client = reactorModule.client as any;
    const folders = createFolderOperations(client, driveId);
    const spec = makeSpec();
    const targetDir = join(testDir, 'project-new');

    const { docId, created } = await ensureSpecDocument({
      spec,
      targetDir,
      reactor: { client, driveId } as any,
      folders,
    });

    expect(created).toBe(true);
    expect(typeof docId).toBe('string');

    // Document exists in reactor
    const doc = await client.get(docId);
    expect(doc).toBeDefined();
    expect(doc.header.documentType).toBe('powerhouse/ph-clint-project');

    // Document is in drive nodes
    const drive = await client.get(driveId);
    const nodes = (drive as any).state.global.nodes;
    const fileNode = nodes.find(
      (n: any) => n.kind === 'file' && n.id === docId,
    );
    expect(fileNode).toBeDefined();
    expect(fileNode.name).toBe('test-project-cli');

    // Spec persisted to disk with documentId
    const persisted = await readProjectSpec(targetDir);
    expect(persisted).not.toBeNull();
    expect(persisted!.documentId).toBe(docId);
    expect(persisted!.documentType).toBe('powerhouse/ph-clint-project');
  });

  it('is a no-op when document already exists', async () => {
    const client = reactorModule.client as any;
    const folders = createFolderOperations(client, driveId);
    const spec = makeSpec({ name: 'existing-project-cli' });
    const targetDir = join(testDir, 'project-existing');

    // First call: creates the document
    const first = await ensureSpecDocument({
      spec,
      targetDir,
      reactor: { client, driveId } as any,
      folders,
    });
    expect(first.created).toBe(true);

    // Second call: document exists, should be no-op
    const second = await ensureSpecDocument({
      spec,
      targetDir,
      reactor: { client, driveId } as any,
      folders,
    });
    expect(second.created).toBe(false);
    expect(second.docId).toBe(first.docId);
  });

  it('re-adds document to drive when removed from drive but still in reactor', async () => {
    const client = reactorModule.client as any;
    const folders = createFolderOperations(client, driveId);
    const spec = makeSpec({ name: 'unlinked-project-cli' });
    const targetDir = join(testDir, 'project-unlinked');

    // Create initial document
    const first = await ensureSpecDocument({
      spec,
      targetDir,
      reactor: { client, driveId } as any,
      folders,
    });
    expect(first.created).toBe(true);
    const docId = first.docId;

    // Remove from drive only (document still exists in reactor)
    await folders.removeDocument(docId);

    // Verify document is gone from drive nodes but still in reactor
    const drive = await client.get(driveId);
    const nodesAfterRemove = (drive as any).state.global.nodes;
    expect(nodesAfterRemove.find((n: any) => n.id === docId)).toBeUndefined();
    const docStillExists = await client.get(docId);
    expect(docStillExists).toBeDefined();

    // Re-run ensure — should re-add to drive, reusing the same document
    const second = await ensureSpecDocument({
      spec,
      targetDir,
      reactor: { client, driveId } as any,
      folders,
    });
    expect(second.created).toBe(true);
    expect(second.docId).toBe(docId); // reuses same doc

    // Document is back in drive nodes
    const driveAfter = await client.get(driveId);
    const nodesAfter = (driveAfter as any).state.global.nodes;
    const fileNode = nodesAfter.find((n: any) => n.id === docId);
    expect(fileNode).toBeDefined();
  });

  it('creates new document when old one is fully deleted from reactor', async () => {
    const client = reactorModule.client as any;
    const folders = createFolderOperations(client, driveId);
    const spec = makeSpec({ name: 'deleted-project-cli' });
    const targetDir = join(testDir, 'project-deleted');

    // Create initial document
    const first = await ensureSpecDocument({
      spec,
      targetDir,
      reactor: { client, driveId } as any,
      folders,
    });
    expect(first.created).toBe(true);
    const oldDocId = first.docId;

    // Fully delete: remove from drive + delete from reactor
    await folders.removeDocument(oldDocId);
    await client.deleteDocument(oldDocId);

    // Re-run ensure — old doc is gone, should create a new one
    const second = await ensureSpecDocument({
      spec,
      targetDir,
      reactor: { client, driveId } as any,
      folders,
    });
    expect(second.created).toBe(true);
    expect(second.docId).not.toBe(oldDocId);

    // New document exists in reactor and drive
    const doc = await client.get(second.docId);
    expect(doc).toBeDefined();

    // Persisted spec has the new docId
    const persisted = await readProjectSpec(targetDir);
    expect(persisted!.documentId).toBe(second.docId);
  });

  it('spec document contains imported spec data', async () => {
    const client = reactorModule.client as any;
    const folders = createFolderOperations(client, driveId);
    const spec = makeSpec({
      name: 'imported-project-cli',
      description: 'A test project with imported spec data',
    });
    const targetDir = join(testDir, 'project-imported');

    const { docId } = await ensureSpecDocument({
      spec,
      targetDir,
      reactor: { client, driveId } as any,
      folders,
    });

    // Read the document and verify the spec was imported
    const doc = await client.get(docId) as any;
    const state = doc.state.global;
    expect(state.name).toBe('imported-project-cli');
    expect(state.description).toBe('A test project with imported spec data');
  });

  it('folder structure is created in drive', async () => {
    const client = reactorModule.client as any;
    const folders = createFolderOperations(client, driveId);
    const spec = makeSpec({ name: 'folder-test-cli' });
    const targetDir = join(testDir, 'project-folder');

    await ensureSpecDocument({
      spec,
      targetDir,
      reactor: { client, driveId } as any,
      folders,
    });

    // "specs" folder should exist at drive root
    const rootEntries = await folders.listFolder();
    const specsFolder = rootEntries.find(
      (e) => e.name === 'specs' && e.type === 'folder',
    );
    expect(specsFolder).toBeDefined();

    // "folder-test" folder should exist under "specs"
    const specsEntries = await folders.listFolder('specs');
    const projectFolder = specsEntries.find(
      (e) => e.name === 'folder-test-cli' && e.type === 'folder',
    );
    expect(projectFolder).toBeDefined();
  });
});
