import { describe, it, expect } from '@jest/globals';
import { getMastraWorkspacePaths } from '../src/integrations/mastra/paths.js';

describe('getMastraWorkspacePaths', () => {
  it('computes nested paths from CLI workspace root', () => {
    const paths = getMastraWorkspacePaths('.ph/cli/assist');
    expect(paths.mastraRoot).toBe('.ph/cli/assist/mastra');
    expect(paths.filesystemPath).toBe('.ph/cli/assist/mastra/workspace');
    expect(paths.dbPath).toBe('.ph/cli/assist/mastra/db/mastra.db');
  });

  it('works with absolute paths', () => {
    const paths = getMastraWorkspacePaths('/home/user/.ph/cli/myapp');
    expect(paths.mastraRoot).toBe('/home/user/.ph/cli/myapp/mastra');
    expect(paths.filesystemPath).toBe('/home/user/.ph/cli/myapp/mastra/workspace');
    expect(paths.dbPath).toBe('/home/user/.ph/cli/myapp/mastra/db/mastra.db');
  });
});
