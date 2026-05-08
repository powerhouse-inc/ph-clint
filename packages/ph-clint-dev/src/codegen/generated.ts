/**
 * Tracks the derived state from the last successful code generation.
 *
 * Stored at `{targetDir}/.ph/ph-clint-cli/generated.json`. Used to detect
 * folder renames (name/scope changes) and re-apply patches that depend on
 * the project identity.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  type ClintProjectSpec,
  getAppFolderName,
  getCliFolderName,
} from '../spec/types.js';

const GEN_DIR = path.join('.ph', 'ph-clint-cli');
const GEN_FILE = 'generated.json';

/**
 * Bumped whenever the on-disk layout shape changes incompatibly. Old projects
 * with `layoutVersion < CURRENT_LAYOUT_VERSION` are refused at regen with a
 * manual-migration error.
 *
 *   1 — split layout glued by `pnpm --prefix` (each sub-dir its own lockfile).
 *   2 — pnpm 11 workspace at the project root (single lockfile, workspace:*
 *       intra-workspace deps, no inner pnpm-workspace.yaml).
 */
export const CURRENT_LAYOUT_VERSION = 2;

export interface GeneratedState {
  name: string;
  scope: string | undefined;
  cliFolderName: string;
  appFolderName: string;
  /** True once `ph init` has run successfully in the app dir. */
  appInitialized: boolean;
  /** See `CURRENT_LAYOUT_VERSION`. Absent on projects scaffolded before v2. */
  layoutVersion?: number;
}

export function getGeneratedPath(targetDir: string): string {
  return path.join(targetDir, GEN_DIR, GEN_FILE);
}

export async function readGeneratedState(
  targetDir: string,
): Promise<GeneratedState | null> {
  try {
    const raw = await fs.readFile(getGeneratedPath(targetDir), 'utf8');
    return JSON.parse(raw) as GeneratedState;
  } catch (err) {
    if (
      err &&
      typeof err === 'object' &&
      'code' in err &&
      (err as { code: unknown }).code === 'ENOENT'
    ) {
      return null;
    }
    throw err;
  }
}

export async function writeGeneratedState(
  targetDir: string,
  state: GeneratedState,
): Promise<void> {
  const file = getGeneratedPath(targetDir);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(state, null, 2) + '\n', 'utf8');
}

/**
 * Derive a `GeneratedState` from a spec. The `appInitialized` flag must be
 * supplied by the caller (it depends on filesystem state, not the spec).
 */
export function generatedStateFromSpec(
  spec: ClintProjectSpec,
  appInitialized: boolean,
): GeneratedState {
  const split = spec.features.powerhouse !== 'Disabled';
  return {
    name: spec.name,
    scope: spec.scope,
    cliFolderName: split ? getCliFolderName(spec) : '',
    appFolderName: split ? getAppFolderName(spec) : '',
    appInitialized,
    layoutVersion: CURRENT_LAYOUT_VERSION,
  };
}
