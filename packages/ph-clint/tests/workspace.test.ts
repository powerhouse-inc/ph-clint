import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createWorkspace, createMemoryWorkspace } from '../src/core/workspace.js';

describe('createWorkspace', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'ph-clint-ws-'));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  describe('read', () => {
    it('returns fallback when file does not exist', async () => {
      const ws = createWorkspace(dir);
      const result = await ws.read('missing.json', []);
      expect(result).toEqual([]);
    });

    it('returns fallback with object default', async () => {
      const ws = createWorkspace(dir);
      const result = await ws.read('missing.json', { count: 0 });
      expect(result).toEqual({ count: 0 });
    });

    it('reads previously written data', async () => {
      const ws = createWorkspace(dir);
      await ws.write('data.json', { hello: 'world' });
      const result = await ws.read('data.json', {});
      expect(result).toEqual({ hello: 'world' });
    });

    it('reads arrays', async () => {
      const ws = createWorkspace(dir);
      await ws.write('list.json', [1, 2, 3]);
      const result = await ws.read<number[]>('list.json', []);
      expect(result).toEqual([1, 2, 3]);
    });

    it('propagates errors other than ENOENT', async () => {
      const ws = createWorkspace(dir);
      // Write a non-JSON file to trigger parse error
      const { writeFile: wf } = await import('node:fs/promises');
      await wf(join(dir, 'bad.json'), 'not json', 'utf8');
      await expect(ws.read('bad.json', {})).rejects.toThrow();
    });
  });

  describe('write', () => {
    it('creates parent directories', async () => {
      const ws = createWorkspace(dir);
      await ws.write('nested/deep/data.json', { ok: true });
      const result = await ws.read('nested/deep/data.json', {});
      expect(result).toEqual({ ok: true });
    });

    it('overwrites existing data', async () => {
      const ws = createWorkspace(dir);
      await ws.write('data.json', { v: 1 });
      await ws.write('data.json', { v: 2 });
      const result = await ws.read('data.json', {});
      expect(result).toEqual({ v: 2 });
    });

    it('writes valid JSON with trailing newline', async () => {
      const ws = createWorkspace(dir);
      await ws.write('data.json', { a: 1 });
      const raw = await readFile(join(dir, 'data.json'), 'utf8');
      expect(raw).toBe('{\n  "a": 1\n}\n');
    });
  });
});

describe('createMemoryWorkspace', () => {
  it('returns fallback when key does not exist', async () => {
    const ws = createMemoryWorkspace();
    const result = await ws.read('key', 'default');
    expect(result).toBe('default');
  });

  it('reads previously written data', async () => {
    const ws = createMemoryWorkspace();
    await ws.write('key', { data: true });
    const result = await ws.read('key', {});
    expect(result).toEqual({ data: true });
  });

  it('overwrites existing data', async () => {
    const ws = createMemoryWorkspace();
    await ws.write('key', 1);
    await ws.write('key', 2);
    const result = await ws.read<number>('key', 0);
    expect(result).toBe(2);
  });

  it('isolates keys', async () => {
    const ws = createMemoryWorkspace();
    await ws.write('a', 'alpha');
    await ws.write('b', 'beta');
    expect(await ws.read('a', '')).toBe('alpha');
    expect(await ws.read('b', '')).toBe('beta');
    expect(await ws.read('c', 'fallback')).toBe('fallback');
  });
});
