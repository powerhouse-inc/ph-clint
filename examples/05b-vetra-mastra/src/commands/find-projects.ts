import fs from 'node:fs';
import path from 'node:path';

export type FolderType = 'ProjectMatch' | 'ProjectMismatch' | 'NonProject';

export type IsProjectFolder = (folderPath: string) => boolean;

/**
 * Project-like indicator files/dirs. When any of these exist in a folder
 * that isn't a ProjectMatch, the folder is a ProjectMismatch and its
 * subtree is pruned from the search.
 */
const PROJECT_INDICATORS = [
  // JS/TS ecosystem
  '.git',
  'package.json',
  'node_modules',
  // Python
  'pyproject.toml',
  'setup.py',
  // Rust
  'Cargo.toml',
  // Go
  'go.mod',
  // Java / Kotlin
  'pom.xml',
  'build.gradle',
  'build.gradle.kts',
  // .NET
  '.sln',
  // Ruby
  'Gemfile',
  // PHP
  'composer.json',
];

function detectType(
  folderPath: string,
  isProjectFolder: IsProjectFolder,
): FolderType {
  if (isProjectFolder(folderPath)) return 'ProjectMatch';

  for (const indicator of PROJECT_INDICATORS) {
    if (fs.existsSync(path.join(folderPath, indicator))) {
      return 'ProjectMismatch';
    }
  }

  return 'NonProject';
}

export interface FindProjectsResult {
  name: string;
  path: string;
}

/**
 * Breadth-first search for project folders starting from `rootDir`.
 *
 * - If root itself is a ProjectMatch, returns it immediately.
 * - Otherwise searches subfolders breadth-first:
 *   - ProjectMatch  → added to results, subtree pruned
 *   - ProjectMismatch → subtree pruned
 *   - NonProject → subfolders enqueued for further search
 */
export function findProjects(
  rootDir: string,
  isProjectFolder: IsProjectFolder,
): FindProjectsResult[] {
  // Check root first
  const rootType = detectType(rootDir, isProjectFolder);
  if (rootType === 'ProjectMatch') {
    return [{ name: path.basename(rootDir), path: rootDir }];
  }

  const results: FindProjectsResult[] = [];
  const queue: string[] = [];

  // Seed queue with immediate subdirectories
  enqueueSubdirs(rootDir, queue);

  while (queue.length > 0) {
    const dir = queue.shift()!;
    const type = detectType(dir, isProjectFolder);

    switch (type) {
      case 'ProjectMatch':
        results.push({ name: path.basename(dir), path: dir });
        break; // prune subtree
      case 'ProjectMismatch':
        break; // prune subtree
      case 'NonProject':
        enqueueSubdirs(dir, queue);
        break;
    }
  }

  return results;
}

function enqueueSubdirs(dir: string, queue: string[]): void {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (entry.isDirectory() && !entry.name.startsWith('.')) {
      queue.push(path.join(dir, entry.name));
    }
  }
}
