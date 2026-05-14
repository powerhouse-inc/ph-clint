import { describe, it, expect } from '@jest/globals';
import { buildManifestJson } from '../../src/codegen/builders/index.js';
import { clintProjectSpecSchema } from '../../src/spec/types.js';

function parseManifest(spec: Parameters<typeof clintProjectSpecSchema.parse>[0]) {
  return JSON.parse(buildManifestJson(clintProjectSpecSchema.parse(spec)));
}

describe('buildManifestJson', () => {
  it('sets features.agent to false when mastra is disabled', () => {
    const m = parseManifest({ name: 'foo-cli' });
    expect(m.features.agent).toBe(false);
  });

  it('populates agent section when mastra has a main agent', () => {
    const m = parseManifest({
      name: 'foo-cli',
      features: {
        mastra: {
          enabled: true,
          models: [
            { id: 'anthropic/claude-sonnet-4-5', isDefault: true },
            { id: 'anthropic/claude-haiku-4-5', isDefault: false },
          ],
          profiles: [{ id: 'base', title: 'Base', content: '' }],
          mainAgent: {
            id: 'foo-agent',
            name: 'Foo Agent',
            description: 'A helpful agent',
            image: 'https://example.com/avatar.png',
            modelId: 'anthropic/claude-sonnet-4-5',
            profileIds: ['base'],
            skills: [],
            toolPatterns: [],
          },
        },
      },
    });
    expect(m.features.agent).toEqual({
      id: 'foo-agent',
      name: 'Foo Agent',
      description: 'A helpful agent',
      image: 'https://example.com/avatar.png',
      models: [
        { id: 'anthropic/claude-sonnet-4-5', default: true },
        { id: 'anthropic/claude-haiku-4-5', default: false },
      ],
    });
  });

  it('falls back to no-agent when mainAgent is null', () => {
    const m = parseManifest({
      name: 'foo-cli',
      features: { mastra: { enabled: true } },
    });
    expect(m.features.agent).toBe(false);
  });

  it('sets features.powerhouse to false when Disabled', () => {
    const m = parseManifest({ name: 'foo-cli' });
    expect(m.features.powerhouse).toBe(false);
  });

  it('populates powerhouse for Reactor level', () => {
    const m = parseManifest({ name: 'foo-cli', features: { powerhouse: 'Reactor' } });
    expect(m.features.powerhouse).toEqual({ support: 'Reactor', package: 'foo-app' });
  });

  it('populates powerhouse for Switchboard level', () => {
    const m = parseManifest({ name: 'foo-cli', features: { powerhouse: 'Switchboard' } });
    expect(m.features.powerhouse).toEqual({ support: 'Switchboard', package: 'foo-app' });
  });

  it('populates powerhouse for Connect level with scope', () => {
    const m = parseManifest({ name: 'foo-cli', scope: '@bar', features: { powerhouse: 'Connect' } });
    expect(m.features.powerhouse).toEqual({ support: 'Connect', package: '@bar/foo-app' });
  });

  it('derives serviceCommand from name by stripping -cli', () => {
    const m = parseManifest({ name: 'foo-cli' });
    expect(m.serviceCommand).toBe('foo');
  });

  it('passes through supportedResources', () => {
    const m = parseManifest({
      name: 'foo-cli',
      deployment: { supportedResources: ['vetra-agent-s', 'vetra-agent-m'] },
    });
    expect(m.supportedResources).toEqual(['vetra-agent-s', 'vetra-agent-m']);
  });

  it('passes through proxyEnabled boolean', () => {
    const m = parseManifest({
      name: 'foo-cli',
      deployment: { proxyEnabled: true },
    });
    expect(m.proxyEnabled).toBe(true);
  });

  it('defaults deployment fields', () => {
    const m = parseManifest({ name: 'foo-cli' });
    expect(m.proxyEnabled).toBe(false);
    expect(m.supportedResources).toEqual([]);
  });

  it('sets type to clint-project', () => {
    const m = parseManifest({ name: 'foo-cli' });
    expect(m.type).toBe('clint-project');
  });

  it('outputs valid JSON with trailing newline', () => {
    const spec = clintProjectSpecSchema.parse({ name: 'foo-cli' });
    const output = buildManifestJson(spec);
    expect(output.endsWith('\n')).toBe(true);
    expect(() => JSON.parse(output)).not.toThrow();
  });

  describe('observability', () => {
    it('sets features.observability to false when disabled (default)', () => {
      const m = parseManifest({ name: 'foo-cli' });
      expect(m.features.observability).toBe(false);
    });

    it('populates observability block with package and derived env vars when enabled', () => {
      const m = parseManifest({
        name: 'foo-cli',
        deployment: { observabilityEnabled: true },
      });
      expect(m.features.observability).toEqual({
        enabled: true,
        package: '@powerhousedao/ph-clint-observability',
        envVars: {
          sentryDsn: 'FOO_CLI_SENTRY_DSN',
          otelExporterOtlpEndpoint: 'FOO_CLI_OTEL_EXPORTER_OTLP_ENDPOINT',
        },
      });
    });

    it('handles multi-segment names in env var derivation', () => {
      const m = parseManifest({
        name: 'multi-word-cli',
        deployment: { observabilityEnabled: true },
      });
      expect(m.features.observability.envVars.sentryDsn).toBe('MULTI_WORD_CLI_SENTRY_DSN');
      expect(m.features.observability.envVars.otelExporterOtlpEndpoint).toBe('MULTI_WORD_CLI_OTEL_EXPORTER_OTLP_ENDPOINT');
    });
  });
});
