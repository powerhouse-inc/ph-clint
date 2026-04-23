import { describe, it, expect } from '@jest/globals';
import { buildCliTs } from '../../src/codegen/builders/cli-ts.js';
import { clintProjectSpecSchema } from '../../src/spec/types.js';

describe('buildCliTs', () => {
  it('emits a minimal defineCli call for the no-features case', () => {
    const spec = clintProjectSpecSchema.parse({ name: 'foo' });
    const code = buildCliTs(spec);
    expect(code).toContain("import { defineCli } from '@powerhousedao/ph-clint'");
    expect(code).toContain('export const cli = defineCli({');
    expect(code).toContain('// @clint:begin imports');
    expect(code).toContain('// @clint:end imports');
    expect(code).toContain('// @clint:begin reactor');
    expect(code).toContain('// @clint:end reactor');
    expect(code).toContain('// @clint:begin mastra');
    expect(code).toContain('// @clint:end mastra');
    // No feature wiring emitted.
    expect(code).not.toContain('cli.configureReactor');
    expect(code).not.toContain('cli.configureAgent');
    expect(code).not.toContain('buildDefaultReactor');
    // No document-models import.
    expect(code).not.toContain('documentModels');
  });

  it('wires Mastra when mastra.enabled', () => {
    const spec = clintProjectSpecSchema.parse({
      name: 'foo',
      features: { mastra: { enabled: true } },
    });
    const code = buildCliTs(spec);
    expect(code).toContain("import { createAgent } from './agents/agent.js'");
    expect(code).toContain('cli.configureAgent(createAgent)');
    expect(code).toContain(
      "'Type a message to talk to the agent, or /help for commands.'",
    );
  });

  it('wires Powerhouse when powerhouse is enabled', () => {
    const spec = clintProjectSpecSchema.parse({
      name: 'foo',
      features: { powerhouse: 'Connect' },
    });
    const code = buildCliTs(spec);
    expect(code).toContain("import { defineCli, buildDefaultReactor } from '@powerhousedao/ph-clint'");
    expect(code).toContain("import { documentModels } from 'foo-app'");
    expect(code).toContain('cli.configureReactor');
    expect(code).toContain('switchboard: { enabled: true }');
    expect(code).toContain('connect: { enabled: true }');
    expect(code).toContain('root: CLI_ROOT');
    expect(code).not.toContain('resolveConnectAssets');
    expect(code).not.toContain('appDir');
    expect(code).toContain('Switchboard:');
    expect(code).toContain('Connect:');
  });

  it('honours powerhouse level — Reactor only omits switchboard/connect', () => {
    const spec = clintProjectSpecSchema.parse({
      name: 'foo',
      features: {
        powerhouse: 'Reactor',
      },
    });
    const code = buildCliTs(spec);
    expect(code).toContain('switchboard: { enabled: false }');
    expect(code).toContain('connect: { enabled: false }');
    expect(code).not.toContain('Switchboard: http://');
    expect(code).not.toContain('Connect:     http://');
  });

  it('all features on — emits both reactor and agent wiring', () => {
    const spec = clintProjectSpecSchema.parse({
      name: 'foo',
      features: {
        powerhouse: 'Connect',
        mastra: { enabled: true },
        routine: { enabled: true },
      },
    });
    const code = buildCliTs(spec);
    expect(code).toContain('cli.configureReactor');
    expect(code).toContain('cli.configureAgent(createAgent)');
    expect(code).toContain('documentModels');
  });
});
