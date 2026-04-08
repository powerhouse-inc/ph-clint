import { readFile, writeFile, rename, mkdir, unlink } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { randomBytes } from 'node:crypto';
import type { WorkdirStore } from './types.js';

/**
 * Create a file-based workdir store rooted at the given directory.
 * Each key maps to a JSON file within that directory.
 */
export function createWorkdirStore(basePath: string): WorkdirStore {
  return {
    basePath,
    async read<T>(key: string, fallback: T): Promise<T> {
      const filePath = join(basePath, key);
      try {
        const raw = await readFile(filePath, 'utf8');
        return JSON.parse(raw) as T;
      } catch (err: unknown) {
        if ((err as NodeJS.ErrnoException).code === 'ENOENT') return fallback;
        throw err;
      }
    },

    async write(key: string, value: unknown): Promise<void> {
      const filePath = join(basePath, key);
      const dir = dirname(filePath);
      await mkdir(dir, { recursive: true });

      const tmp = join(dir, `.tmp-${randomBytes(6).toString('hex')}`);
      try {
        await writeFile(tmp, JSON.stringify(value, null, 2) + '\n', 'utf8');
        await rename(tmp, filePath);
      } catch (err) {
        try { await unlink(tmp); } catch {}
        throw err;
      }
    },
  };
}

/**
 * Create an in-memory workdir store for testing or when no persistence is needed.
 */
export function createMemoryWorkdirStore(basePath = ''): WorkdirStore {
  const store = new Map<string, unknown>();
  return {
    basePath,
    async read<T>(key: string, fallback: T): Promise<T> {
      return store.has(key) ? (store.get(key) as T) : fallback;
    },
    async write(key: string, value: unknown): Promise<void> {
      store.set(key, value);
    },
  };
}
