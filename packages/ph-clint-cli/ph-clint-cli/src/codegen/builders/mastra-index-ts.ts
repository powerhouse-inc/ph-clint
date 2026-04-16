/**
 * Builds `src/mastra/index.ts` — Mastra Studio entry point.
 *
 * When Mastra is off, emit a no-op placeholder so the directory still exists
 * and `mastra dev` fails predictably rather than importing partial code.
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
  // When Mastra is enabled but we still emit the demo `AgentProvider` shim
  // (not a real `@mastra/core` Agent), there is no `mastra` export yet —
  // `mastra dev` will surface a helpful message once you wire a real Agent.
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
