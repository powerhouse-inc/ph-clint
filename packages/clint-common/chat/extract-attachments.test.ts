import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync, existsSync, readFile } from 'node:fs';
import { readFile as readFileAsync } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import type { ContentPart, Message } from '@powerhousedao/clint-common/document-models/chat-session';
import {
  extensionForMediaType,
  resolveFilename,
  extractAttachments,
  resetExtractedCache,
} from './extract-attachments.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURE_PATH = join(__dirname, '..', 'prometheus.png');
const FIXTURE_BASE64 = readFileSync(FIXTURE_PATH).toString('base64');

function makePart(overrides: Partial<ContentPart> & { id: string; type: ContentPart['type'] }): ContentPart {
  return {
    args: null,
    data: null,
    error: null,
    filename: null,
    isError: null,
    mediaType: null,
    result: null,
    text: null,
    toolCallId: null,
    toolName: null,
    url: null,
    ...overrides,
  };
}

function makeMessage(parts: ContentPart[]): Message {
  return {
    id: 'msg-001',
    role: 'USER',
    content: parts,
    createdAt: '2026-05-07T00:00:00.000Z',
    stepIndex: null,
    usage: null,
  };
}

describe('extensionForMediaType', () => {
  it('returns correct extension for known MIME types', () => {
    expect(extensionForMediaType('image/png', 'IMAGE')).toBe('.png');
    expect(extensionForMediaType('image/jpeg', 'IMAGE')).toBe('.jpg');
    expect(extensionForMediaType('application/pdf', 'FILE')).toBe('.pdf');
    expect(extensionForMediaType('text/csv', 'FILE')).toBe('.csv');
  });

  it('falls back to .png for unknown IMAGE types', () => {
    expect(extensionForMediaType('image/x-custom', 'IMAGE')).toBe('.png');
    expect(extensionForMediaType(null, 'IMAGE')).toBe('.png');
    expect(extensionForMediaType(undefined, 'IMAGE')).toBe('.png');
  });

  it('falls back to .bin for unknown FILE types', () => {
    expect(extensionForMediaType('application/octet-stream', 'FILE')).toBe('.bin');
    expect(extensionForMediaType(null, 'FILE')).toBe('.bin');
  });
});

describe('resolveFilename', () => {
  it('uses part.filename basename with truncated id suffix', () => {
    const part = makePart({
      id: 'abcdef1234567890',
      type: 'IMAGE',
      filename: 'photo.jpg',
      mediaType: 'image/jpeg',
    });
    expect(resolveFilename(part)).toBe('photo_abcdef.jpg');
  });

  it('uses "attachment" as basename when no filename provided', () => {
    const part = makePart({
      id: 'xyz789abcdef',
      type: 'IMAGE',
      mediaType: 'image/png',
    });
    expect(resolveFilename(part)).toBe('attachment_xyz789.png');
  });

  it('handles filename without extension', () => {
    const part = makePart({
      id: 'aabbcc112233',
      type: 'FILE',
      filename: 'report',
      mediaType: 'application/pdf',
    });
    expect(resolveFilename(part)).toBe('report_aabbcc.pdf');
  });

  it('derives extension from mediaType, not original filename extension', () => {
    const part = makePart({
      id: '112233aabbcc',
      type: 'FILE',
      filename: 'data.xlsx',
      mediaType: 'text/csv',
    });
    expect(resolveFilename(part)).toBe('data_112233.csv');
  });
});

describe('extractAttachments', () => {
  let workdir: string;

  beforeEach(async () => {
    resetExtractedCache();
    workdir = await mkdtemp(join(tmpdir(), 'extract-attachments-'));
  });

  afterEach(async () => {
    await rm(workdir, { recursive: true, force: true });
  });

  it('extracts base64 IMAGE data to downloads/ and verifies file content', async () => {
    const part = makePart({
      id: 'img001abcdef',
      type: 'IMAGE',
      mediaType: 'image/png',
      data: FIXTURE_BASE64,
    });
    const message = makeMessage([part]);

    const results = await extractAttachments(message, {
      workdir,
      documentId: 'doc-1',
    });

    expect(results).toHaveLength(1);
    expect(results[0].partId).toBe('img001abcdef');
    expect(results[0].filename).toBe('attachment_img001.png');
    expect(results[0].localPath).toBe(join(workdir, 'downloads', 'attachment_img001.png'));
    expect(results[0].mediaType).toBe('image/png');

    // Verify the file was written correctly
    const written = await readFileAsync(results[0].localPath);
    const original = readFileSync(FIXTURE_PATH);
    expect(written.equals(original)).toBe(true);
  });

  it('skips TEXT parts', async () => {
    const part = makePart({
      id: 'txt001aaaaaa',
      type: 'TEXT',
      text: 'Hello world',
    });
    const message = makeMessage([part]);

    const results = await extractAttachments(message, {
      workdir,
      documentId: 'doc-2',
    });

    expect(results).toHaveLength(0);
    expect(existsSync(join(workdir, 'downloads'))).toBe(false);
  });

  it('deduplicates: second call for same document returns empty', async () => {
    const part = makePart({
      id: 'dup001abcdef',
      type: 'IMAGE',
      mediaType: 'image/png',
      data: FIXTURE_BASE64,
    });
    const message = makeMessage([part]);
    const opts = { workdir, documentId: 'doc-3' };

    const first = await extractAttachments(message, opts);
    expect(first).toHaveLength(1);

    const second = await extractAttachments(message, opts);
    expect(second).toHaveLength(0);
  });

  it('handles parts with no data and no url gracefully', async () => {
    const part = makePart({
      id: 'empty1abcdef',
      type: 'FILE',
      mediaType: 'application/pdf',
    });
    const message = makeMessage([part]);

    const results = await extractAttachments(message, {
      workdir,
      documentId: 'doc-4',
    });

    expect(results).toHaveLength(0);
  });

  it('extracts multiple attachments from one message', async () => {
    const imgPart = makePart({
      id: 'multi1abcdef',
      type: 'IMAGE',
      mediaType: 'image/png',
      data: FIXTURE_BASE64,
    });
    const filePart = makePart({
      id: 'multi2abcdef',
      type: 'FILE',
      mediaType: 'application/pdf',
      filename: 'report.pdf',
      data: Buffer.from('fake pdf content').toString('base64'),
    });
    const textPart = makePart({
      id: 'multi3aaaaaa',
      type: 'TEXT',
      text: 'Check these files',
    });
    const message = makeMessage([textPart, imgPart, filePart]);

    const results = await extractAttachments(message, {
      workdir,
      documentId: 'doc-5',
    });

    expect(results).toHaveLength(2);
    expect(results[0].filename).toBe('attachment_multi1.png');
    expect(results[1].filename).toBe('report_multi2.pdf');

    // Both files exist on disk
    expect(existsSync(results[0].localPath)).toBe(true);
    expect(existsSync(results[1].localPath)).toBe(true);
  });
});
