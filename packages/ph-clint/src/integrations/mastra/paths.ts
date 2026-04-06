import { join } from 'node:path';

/**
 * Compute the nested Mastra paths within a CLI workspace.
 *
 * Layout:
 *   {workspacePath}/
 *     mastra/
 *       workspace/   — Mastra LocalFilesystem root
 *       db/
 *         mastra.db  — LibSQL database for memory
 */
export function getMastraWorkspacePaths(workspacePath: string) {
  const mastraRoot = join(workspacePath, 'mastra');
  return {
    /** Root of the Mastra subdirectory. */
    mastraRoot,
    /** LocalFilesystem basePath for the agent. */
    filesystemPath: join(mastraRoot, 'workspace'),
    /** LibSQL database file path. */
    dbPath: join(mastraRoot, 'db', 'mastra.db'),
  };
}
