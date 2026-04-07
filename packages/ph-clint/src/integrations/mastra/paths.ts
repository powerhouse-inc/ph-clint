import { join } from 'node:path';

/**
 * Compute Mastra paths for a CLI.
 *
 * Layout:
 *   {workdir}/                          — User/agent working directory (Mastra Workspace root)
 *     .ph/{cliName}/
 *       mastra/
 *         mastra.db                     — LibSQL database for memory
 *
 * @param workdir  Resolved workspace directory (absolute path).
 * @param cliName  CLI name, used to namespace under .ph/.
 */
export function getMastraPaths(workdir: string, cliName: string) {
  const contextDir = join(workdir, '.ph', cliName);
  return {
    /** The working directory — passed to Mastra as the Workspace/LocalFilesystem root. */
    filesystemPath: workdir,
    /** LibSQL database file path. */
    dbPath: join(contextDir, 'mastra', 'mastra.db'),
  };
}

/**
 * @deprecated Use getMastraPaths(workdir, cliName) instead.
 * Kept for backward compatibility during migration.
 */
export function getMastraWorkspacePaths(workspacePath: string) {
  const mastraRoot = join(workspacePath, 'mastra');
  return {
    mastraRoot,
    filesystemPath: join(mastraRoot, 'workspace'),
    dbPath: join(mastraRoot, 'db', 'mastra.db'),
  };
}
