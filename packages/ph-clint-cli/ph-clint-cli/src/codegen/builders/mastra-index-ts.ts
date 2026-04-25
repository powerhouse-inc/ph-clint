/**
 * Builds `src/mastra/index.ts` — Mastra Studio entry point.
 *
 * When Mastra is off, emit a no-op placeholder so the directory still exists
 * and `mastra dev` fails predictably rather than importing partial code.
 *
 * When Mastra is on with full agent config, emit a real Mastra instance
 * that registers the agent.
 */
import { type ClintProjectSpec } from '../../spec/types.js';

export function buildMastraIndexTs(spec: ClintProjectSpec): string {
  const { mastra } = spec.features;
  if (!mastra.enabled) {
    return [
      '/**',
      ' * Mastra Studio entry point — placeholder. Enable the `mastra` feature to',
      ' * populate this file. Until then `mastra:*` scripts are effectively no-ops.',
      ' */',
      '// @clint:begin mastra-index',
      'export {};',
      '// @clint:end mastra-index',
      '',
    ].join('\n');
  }

  // Full agent config available — emit real Mastra instance
  if (mastra.agentId && mastra.models.length > 0) {
    const agentId = mastra.agentId;
    return [
      '/**',
      ' * Mastra Studio entry point for `mastra dev` / `mastra build` / `mastra start`.',
      ' *',
      ' * Exports a configured Mastra instance with the project agent registered.',
      ' */',
      "import { Mastra } from '@mastra/core/mastra';",
      "import { Agent } from '@mastra/core/agent';",
      '',
      '// @clint:begin mastra-index',
      `const agent = new Agent({ id: '${agentId}', model: '${(mastra.models.find(m => m.isDefault) ?? mastra.models[0]).id}' });`,
      '',
      'export const mastra = new Mastra({',
      `  agents: { '${agentId}': agent },`,
      '});',
      '// @clint:end mastra-index',
      '',
    ].join('\n');
  }

  // Mastra enabled but no full agent config yet — placeholder
  return [
    '/**',
    ' * Mastra Studio entry point for `mastra dev` / `mastra build` / `mastra start`.',
    ' *',
    " * Re-export a configured `@mastra/core` Mastra instance from here once you",
    " * replace the demo createAgent shim with a real Mastra Agent.",
    ' */',
    '// @clint:begin mastra-index',
    'export {};',
    '// @clint:end mastra-index',
    '',
  ].join('\n');
}
