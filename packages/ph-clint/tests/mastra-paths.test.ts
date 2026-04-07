import { describe, it, expect } from '@jest/globals';
import { join } from 'node:path';
import { getMastraPaths, getMastraWorkspacePaths } from '../src/integrations/mastra/paths.js';

describe('getMastraPaths', () => {
  it('computes paths from workdir and cliName', () => {
    const paths = getMastraPaths('/home/user/project', 'assist');
    expect(paths.filesystemPath).toBe('/home/user/project');
    expect(paths.dbPath).toBe(join('/home/user/project', '.ph', 'assist', 'mastra', 'mastra.db'));
  });

  it('works with relative workdir', () => {
    const paths = getMastraPaths('./workspace', 'mycli');
    expect(paths.filesystemPath).toBe('./workspace');
    expect(paths.dbPath).toBe(join('./workspace', '.ph', 'mycli', 'mastra', 'mastra.db'));
  });
});

describe('getMastraWorkspacePaths (legacy)', () => {
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
