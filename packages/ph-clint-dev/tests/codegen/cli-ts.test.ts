import { describe, it, expect } from '@jest/globals';
import { buildCliTs } from '../../src/codegen/builders/index.js';
import { clintProjectSpecSchema } from '../../src/spec/types.js';

describe('buildCliTs', () => {
  it('emits a minimal defineCli call for the no-features case', () => {
    const spec = clintProjectSpecSchema.parse({ name: 'foo-cli' });
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
      name: 'foo-cli',
      features: { mastra: { enabled: true } },
    });
    const code = buildCliTs(spec);
    expect(code).toContain("import { createAgent } from './agents/agent.js'");
    expect(code).toContain('cli.configureAgent(createAgent)');
    expect(code).toContain(
      "'Type a message to talk to the agent, or / for commands.'",
    );
  });

  it('wires Powerhouse when powerhouse is enabled', () => {
    const spec = clintProjectSpecSchema.parse({
      name: 'foo-cli',
      features: { powerhouse: 'Connect' },
    });
    const code = buildCliTs(spec);
    expect(code).toContain("import { defineCli, buildDefaultReactor } from '@powerhousedao/ph-clint'");
    expect(code).toContain("import { documentModels } from 'foo-app'");
    expect(code).toContain('cli.configureReactor');
    // Spread to materialize a mutable array — ph init now emits
    // `documentModels = [] as const` (readonly), which trips TS4104 if
    // passed bare to a `DocumentModelModule[]` parameter.
    expect(code).toContain('documentModels: [...documentModels],');
    expect(code).toContain('switchboard: { enabled: true }');
    expect(code).toContain('connect: { enabled: true }');
    expect(code).toContain('root: CLI_ROOT');
    expect(code).toContain('// @clint:begin root');
    expect(code).toContain('// @clint:end root');
    expect(code).not.toContain('resolveConnectAssets');
    expect(code).not.toContain('appDir');
    expect(code).not.toContain('Switchboard:');
    expect(code).not.toContain('Connect:');
  });

  it('honours powerhouse level — Reactor only omits switchboard/connect', () => {
    const spec = clintProjectSpecSchema.parse({
      name: 'foo-cli',
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
      name: 'foo-cli',
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

  it('populates prompts.agents with one entry per agent (main + subs), sections from profileIds', () => {
    const spec = clintProjectSpecSchema.parse({
      name: 'foo-cli',
      features: {
        mastra: {
          enabled: true,
          models: [
            { id: 'anthropic/claude-sonnet-4-5' },
            { id: 'openai/gpt-4o' },
          ],
          profiles: [
            { id: 'base', title: 'Base', content: 'Base instructions.' },
            { id: 'tools', title: 'Tools', content: 'Tool usage.' },
          ],
          mainAgent: {
            id: 'foo-agent',
            name: 'Foo Agent',
            description: null,
            image: null,
            modelId: 'anthropic/claude-sonnet-4-5',
            profileIds: ['base', 'tools'],
            skills: ['playwright-cli'],
            toolPatterns: [],
          },
          subAgents: [
            {
              id: 'summarizer',
              name: 'Summarizer',
              description: 'Summarizes content.',
              modelId: 'openai/gpt-4o',
              profileIds: ['base'],
              skills: [],
              toolPatterns: ['cli-docs'],
            },
          ],
        },
      },
    });
    const code = buildCliTs(spec);
    // Main agent entry
    expect(code).toContain("'foo-agent'");
    expect(code).toContain("'base.md'");
    expect(code).toContain("'tools.md'");
    expect(code).toContain("'playwright-cli'");
    // Sub-agent entry
    expect(code).toContain("'summarizer'");
  });

  it('emits proxyEnabled: true when deployment.proxyEnabled is true', () => {
    const spec = clintProjectSpecSchema.parse({
      name: 'foo-cli',
      deployment: { proxyEnabled: true },
    });
    const code = buildCliTs(spec);
    expect(code).toContain('proxyEnabled: true,');
    expect(code).toContain('// @clint:begin proxy');
    expect(code).toContain('// @clint:end proxy');
    // No jsonPostAnnounce import
    expect(code).not.toContain('jsonPostAnnounce');
  });

  it('omits proxyEnabled when deployment.proxyEnabled is false', () => {
    const spec = clintProjectSpecSchema.parse({ name: 'foo-cli' });
    const code = buildCliTs(spec);
    expect(code).not.toContain('proxyEnabled');
    expect(code).not.toContain('jsonPostAnnounce');
  });

  it('emits chatSessionWatchTrigger import when enableChat is true', () => {
    const spec = clintProjectSpecSchema.parse({
      name: 'foo-cli',
      features: {
        mastra: { enabled: true, common: { enableChat: true } },
      },
    });
    const code = buildCliTs(spec);
    expect(code).toContain(
      "import { chatSessionWatchTrigger } from '@powerhousedao/clint-common/chat'",
    );
    expect(code).toContain('triggers: [chatSessionWatchTrigger]');
  });

  it('omits chatSessionWatchTrigger when enableChat is false', () => {
    const spec = clintProjectSpecSchema.parse({
      name: 'foo-cli',
      features: {
        mastra: { enabled: true },
      },
    });
    const code = buildCliTs(spec);
    expect(code).not.toContain('chatSessionWatchTrigger');
    expect(code).toContain('triggers: []');
  });

  describe('observability', () => {
    it('does not emit observability import or lifecycle line when disabled', () => {
      const spec = clintProjectSpecSchema.parse({ name: 'foo-cli' });
      const code = buildCliTs(spec);
      expect(code).not.toContain('@powerhousedao/ph-clint-observability');
      expect(code).not.toContain('observability()');
      // Empty marker region is still emitted as a placeholder so regen can fill it.
      expect(code).toContain('// @clint:begin lifecycle');
      expect(code).toContain('// @clint:end lifecycle');
    });

    it('emits import + lifecycle: [observability()] inside markers when enabled', () => {
      const spec = clintProjectSpecSchema.parse({
        name: 'foo-cli',
        deployment: { observabilityEnabled: true },
      });
      const code = buildCliTs(spec);
      expect(code).toContain(`import { observability } from '@powerhousedao/ph-clint-observability';`);
      expect(code).toContain('lifecycle: [observability()],');
      const lifecycleRegion = code.substring(
        code.indexOf('// @clint:begin lifecycle'),
        code.indexOf('// @clint:end lifecycle'),
      );
      expect(lifecycleRegion).toContain('observability()');
    });
  });
});
