/**
 * Per-file content hashes written by the generator so subsequent runs can
 * detect whether a previously-generated file has been hand-edited.
 *
 * Stored at `{targetDir}/.ph/ph-clint-cli/.hashes.json` alongside the project
 * spec. Keys are paths relative to the project root.
 */
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

export type HashRecord = Record<string, string>;

const HASHES_DIR = path.join('.ph', 'ph-clint-cli');
const HASHES_FILE = '.hashes.json';

export function getHashesPath(targetDir: string): string {
  return path.join(targetDir, HASHES_DIR, HASHES_FILE);
}

export function hashContent(content: string): string {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

function isEnoent(err: unknown): boolean {
  return (
    !!err &&
    typeof err === 'object' &&
    'code' in err &&
    (err as { code: unknown }).code === 'ENOENT'
  );
}

export async function hashFile(filePath: string): Promise<string | null> {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return hashContent(content);
  } catch (err) {
    if (isEnoent(err)) return null;
    throw err;
  }
}

export async function readHashes(targetDir: string): Promise<HashRecord> {
  try {
    const raw = await fs.readFile(getHashesPath(targetDir), 'utf8');
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as HashRecord;
    }
    return {};
  } catch (err) {
    if (isEnoent(err)) return {};
    throw err;
  }
}

export async function writeHashes(
  targetDir: string,
  hashes: HashRecord,
): Promise<void> {
  const file = getHashesPath(targetDir);
  await fs.mkdir(path.dirname(file), { recursive: true });
  // Sort keys for stable output across runs.
  const sorted: HashRecord = {};
  for (const key of Object.keys(hashes).sort()) {
    sorted[key] = hashes[key];
  }
  await fs.writeFile(file, JSON.stringify(sorted, null, 2) + '\n', 'utf8');
}
