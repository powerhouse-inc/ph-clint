import { type ClintProjectSpec, getBinName } from '../../spec/types.js';

export function buildSmokeTestTs(spec: ClintProjectSpec): string {
  const bin = getBinName(spec);
  return [
    `import { describe, it, expect } from '@jest/globals';`,
    ``,
    `describe('${bin}', () => {`,
    `  it('loads without error', async () => {`,
    `    const { cli } = await import('../src/cli.js');`,
    `    expect(cli).toBeDefined();`,
    `  });`,
    `});`,
    ``,
  ].join('\n');
}
