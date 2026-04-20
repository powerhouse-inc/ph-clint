import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

/**
 * Check that the git working tree is clean.
 * Throws if there are uncommitted changes.
 */
export async function checkCleanWorkingTree(): Promise<void> {
  try {
    const { stdout } = await execFileAsync('git', ['status', '--porcelain']);
    if (stdout.trim().length > 0) {
      throw new Error(
        'Git working tree is not clean. Commit or stash changes first, ' +
          'or use --skip-git-check to bypass.',
      );
    }
  } catch (err) {
    if (err instanceof Error && err.message.includes('working tree')) {
      throw err;
    }
    // git not available or not a repo — skip silently
  }
}
