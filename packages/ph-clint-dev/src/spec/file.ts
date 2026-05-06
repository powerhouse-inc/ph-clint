/**
 * Persistence for `ClintProjectSpec`.
 * Stored at `{impl-project}/.ph/ph-clint-cli/project-spec.json`.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  clintProjectSpecSchema,
  type ClintProjectSpec,
} from './types.js';

const SPEC_DIR = path.join('.ph', 'ph-clint-cli');
const SPEC_FILE = 'project-spec.json';

export function getSpecPath(projectDir: string): string {
  return path.join(projectDir, SPEC_DIR, SPEC_FILE);
}

function isEnoent(err: unknown): boolean {
  return (
    !!err &&
    typeof err === 'object' &&
    'code' in err &&
    (err as { code: unknown }).code === 'ENOENT'
  );
}

export async function readProjectSpec(
  projectDir: string,
): Promise<ClintProjectSpec | null> {
  try {
    const raw = await fs.readFile(getSpecPath(projectDir), 'utf8');
    return clintProjectSpecSchema.parse(JSON.parse(raw));
  } catch (err) {
    if (isEnoent(err)) return null;
    throw err;
  }
}

export async function writeProjectSpec(
  projectDir: string,
  spec: ClintProjectSpec,
): Promise<void> {
  const file = getSpecPath(projectDir);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(spec, null, 2) + '\n', 'utf8');
}
