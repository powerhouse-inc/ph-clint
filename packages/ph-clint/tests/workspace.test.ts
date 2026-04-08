import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { mkdtemp, rm, readFile, chmod, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { createWorkdirStore, createMemoryWorkdirStore } from '../src/core/store.js';

describe('createWorkdirStore', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'ph-clint-ws-'));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('exposes basePath', () => {
    const ws = createWorkdirStore(dir);
    expect(ws.basePath).toBe(dir);
  });

  describe('read', () => {
    it('returns fallback when file does not exist', async () => {
      const ws = createWorkdirStore(dir);
      const result = await ws.read('missing.json', []);
      expect(result).toEqual([]);
    });

    it('returns fallback with object default', async () => {
      const ws = createWorkdirStore(dir);
      const result = await ws.read('missing.json', { count: 0 });
      expect(result).toEqual({ count: 0 });
    });

    it('reads previously written data', async () => {
      const ws = createWorkdirStore(dir);
      await ws.write('data.json', { hello: 'world' });
      const result = await ws.read('data.json', {});
      expect(result).toEqual({ hello: 'world' });
    });

    it('reads arrays', async () => {
      const ws = createWorkdirStore(dir);
      await ws.write('list.json', [1, 2, 3]);
      const result = await ws.read<number[]>('list.json', []);
      expect(result).toEqual([1, 2, 3]);
    });

    it('propagates errors other than ENOENT', async () => {
      const ws = createWorkdirStore(dir);
      // Write a non-JSON file to trigger parse error
      const { writeFile: wf } = await import('node:fs/promises');
      await wf(join(dir, 'bad.json'), 'not json', 'utf8');
      await expect(ws.read('bad.json', {})).rejects.toThrow();
    });
  });

  describe('write', () => {
    it('creates parent directories', async () => {
      const ws = createWorkdirStore(dir);
      await ws.write('nested/deep/data.json', { ok: true });
      const result = await ws.read('nested/deep/data.json', {});
      expect(result).toEqual({ ok: true });
    });

    it('overwrites existing data', async () => {
      const ws = createWorkdirStore(dir);
      await ws.write('data.json', { v: 1 });
      await ws.write('data.json', { v: 2 });
      const result = await ws.read('data.json', {});
      expect(result).toEqual({ v: 2 });
    });

    it('writes valid JSON with trailing newline', async () => {
      const ws = createWorkdirStore(dir);
      await ws.write('data.json', { a: 1 });
      const raw = await readFile(join(dir, 'data.json'), 'utf8');
      expect(raw).toBe('{\n  "a": 1\n}\n');
    });

    it('cleans up temp file on rename failure', async () => {
      const ws = createWorkdirStore(dir);
      // Write a file first, then make the dir read-only so rename fails
      await ws.write('data.json', { v: 1 });
      // Now make the directory read-only (no write permission) so rename fails
      await chmod(dir, 0o444);
      try {
        await expect(ws.write('data.json', { v: 2 })).rejects.toThrow();
        // The temp file should have been cleaned up
        const files = (await import('node:fs')).readdirSync(dir);
        const tmpFiles = files.filter((f: string) => f.startsWith('.tmp-'));
        expect(tmpFiles).toHaveLength(0);
      } finally {
        // Restore permissions so afterEach cleanup works
        await chmod(dir, 0o755);
      }
    });
  });
});

describe('createMemoryWorkdirStore', () => {
  it('exposes basePath (default empty)', () => {
    const ws = createMemoryWorkdirStore();
    expect(ws.basePath).toBe('');
  });

  it('exposes custom basePath', () => {
    const ws = createMemoryWorkdirStore('/tmp/test');
    expect(ws.basePath).toBe('/tmp/test');
  });

  it('returns fallback when key does not exist', async () => {
    const ws = createMemoryWorkdirStore();
    const result = await ws.read('key', 'default');
    expect(result).toBe('default');
  });

  it('reads previously written data', async () => {
    const ws = createMemoryWorkdirStore();
    await ws.write('key', { data: true });
    const result = await ws.read('key', {});
    expect(result).toEqual({ data: true });
  });

  it('overwrites existing data', async () => {
    const ws = createMemoryWorkdirStore();
    await ws.write('key', 1);
    await ws.write('key', 2);
    const result = await ws.read<number>('key', 0);
    expect(result).toBe(2);
  });

  it('isolates keys', async () => {
    const ws = createMemoryWorkdirStore();
    await ws.write('a', 'alpha');
    await ws.write('b', 'beta');
    expect(await ws.read('a', '')).toBe('alpha');
    expect(await ws.read('b', '')).toBe('beta');
    expect(await ws.read('c', 'fallback')).toBe('fallback');
  });
});
