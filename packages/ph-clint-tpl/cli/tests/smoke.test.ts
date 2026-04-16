import { describe, it, expect } from '@jest/globals';
import { cli } from '../src/cli.js';
import { CLI_NAME, CLI_VERSION } from '../src/config.js';

describe('ph-clint-tpl-cli template', () => {
  it('produces a cli with the configured name and version', () => {
    const meta = cli.getMetadata() as { name: string; version: string };
    expect(meta.name).toBe(CLI_NAME);
    expect(meta.version).toBe(CLI_VERSION);
  });
});
