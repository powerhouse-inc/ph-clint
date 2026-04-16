/**
 * Low-level file-writing helpers for the code generator.
 */
import fs from 'node:fs/promises';
import path from 'node:path';

export async function writeFileEnsuringDir(
  filePath: string,
  content: string,
): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, 'utf8');
}

function isEnoent(err: unknown): boolean {
  return (
    !!err &&
    typeof err === 'object' &&
    'code' in err &&
    (err as { code: unknown }).code === 'ENOENT'
  );
}

/**
 * Returns true if the directory doesn't exist or only contains ignorable
 * entries (`.git`, `.DS_Store`, `.ph/ph-clint-cli/project-spec.json`).
 */
export async function isDirEmptyEnough(dir: string): Promise<boolean> {
  let entries: string[];
  try {
    entries = await fs.readdir(dir);
  } catch (err) {
    if (isEnoent(err)) return true;
    throw err;
  }
  const ignorable = new Set(['.git', '.DS_Store', '.ph']);
  return entries.every((entry) => ignorable.has(entry));
}
