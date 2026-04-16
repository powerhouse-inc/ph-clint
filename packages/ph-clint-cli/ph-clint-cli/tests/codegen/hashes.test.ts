import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  getHashesPath,
  hashContent,
  hashFile,
  readHashes,
  writeHashes,
} from '../../src/codegen/hashes.js';

async function mkTmpDir(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), 'ph-clint-hash-'));
}

async function rmRf(dir: string): Promise<void> {
  await fs.rm(dir, { recursive: true, force: true });
}

describe('hashes', () => {
  let tmp: string;

  beforeEach(async () => {
    tmp = await mkTmpDir();
  });

  afterEach(async () => {
    await rmRf(tmp);
  });

  it('hashContent is deterministic for identical input', () => {
    const a = hashContent('hello\n');
    const b = hashContent('hello\n');
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });

  it('hashContent changes when input changes', () => {
    expect(hashContent('a')).not.toBe(hashContent('b'));
  });

  it('hashFile returns null for a missing file', async () => {
    const result = await hashFile(path.join(tmp, 'nope.txt'));
    expect(result).toBeNull();
  });

  it('hashFile matches hashContent on the same text', async () => {
    const file = path.join(tmp, 'f.txt');
    await fs.writeFile(file, 'content', 'utf8');
    expect(await hashFile(file)).toBe(hashContent('content'));
  });

  it('readHashes returns {} when the file is absent', async () => {
    const result = await readHashes(tmp);
    expect(result).toEqual({});
  });

  it('writeHashes then readHashes round-trips', async () => {
    await writeHashes(tmp, { 'a.txt': 'h1', 'b.txt': 'h2' });
    const r = await readHashes(tmp);
    expect(r).toEqual({ 'a.txt': 'h1', 'b.txt': 'h2' });
  });

  it('writeHashes sorts keys for stable diffs', async () => {
    await writeHashes(tmp, { z: '1', a: '2', m: '3' });
    const raw = await fs.readFile(getHashesPath(tmp), 'utf8');
    const keys = Object.keys(JSON.parse(raw));
    expect(keys).toEqual(['a', 'm', 'z']);
  });

  it('readHashes tolerates a garbage (non-object) payload', async () => {
    await fs.mkdir(path.dirname(getHashesPath(tmp)), { recursive: true });
    await fs.writeFile(getHashesPath(tmp), '"not-an-object"', 'utf8');
    expect(await readHashes(tmp)).toEqual({});
  });
});
