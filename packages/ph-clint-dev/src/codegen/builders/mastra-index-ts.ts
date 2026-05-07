/**
 * Builds `src/mastra/index.ts` — Mastra Studio entry point.
 *
 * When Mastra is off, emit a no-op placeholder so the directory still exists
 * and `mastra dev` fails predictably rather than importing partial code.
 *
 * When Mastra is on with full agent config, bootstrap the CLI and re-export
 * the configured Mastra Agent via `cli.bootstrap()`.
 */
import { type ClintProjectSpec } from '../../spec/types.js';
import { DEMO_PROVIDER } from './provider-utils.js';

/**
 * Derive the `{PROVIDER}_API_KEY` env var name from a provider prefix
 * (e.g. `anthropic` → `ANTHROPIC_API_KEY`).
 */
function getApiKeyEnvVar(provider: string): string {
  return `${provider.toUpperCase()}_API_KEY`;
}

export function buildMastraIndexTs(spec: ClintProjectSpec): string {
  const { mastra } = spec.features;
  if (!mastra.enabled) {
    return [
      '// @clint:begin mastra-index',
      '/**',
      ' * Mastra Studio entry point — placeholder. Enable the `mastra` feature to',
      ' * populate this file. Until then `mastra:*` scripts are effectively no-ops.',
      ' */',
      'export {};',
      '// @clint:end mastra-index',
      '',
    ].join('\n');
  }

  // Full agent config available — emit bootstrap-based Mastra instance
  const realModels = mastra.models.filter(m => m.id.split(/[:/]/)[0] !== DEMO_PROVIDER);
  if (mastra.agentId && realModels.length > 0) {
    const providers = [...new Set(realModels.map(m => m.id.split(/[:/]/)[0]))];

    const lines: string[] = [
      '// @clint:begin mastra-index',
      '/**',
      ' * Mastra Studio entry point for `mastra dev` / `mastra build` / `mastra start`.',
      ' *',
      ' * Bootstraps the CLI to get the configured agent, then exports a Mastra',
      ' * instance for Studio integration.',
      ' */',
      "import { Mastra } from '@mastra/core/mastra';",
      "import type { Agent } from '@mastra/core/agent';",
      "import path from 'node:path';",
      "import { cli } from '../cli.js';",
      "import { CLI_ROOT } from '../config.js';",
      '',
      "// Under `mastra dev`, CLI_ROOT points to .mastra/ (bundler output).",
      '// The actual project root is its parent.',
      "const projectRoot = path.basename(CLI_ROOT) === '.mastra'",
      '  ? path.dirname(CLI_ROOT)',
      '  : CLI_ROOT;',
      '',
      'const rt = await cli.bootstrap({ workdir: projectRoot });',
      '',
    ];

    // API key env bridge for Studio
    lines.push(
      `// Workaround: Mastra Studio checks process.env for API keys directly.`,
      `// Bridge the ph-clint resolved keys so Studio's provider detection works.`,
    );
    for (const provider of providers) {
      const field = `${provider}ApiKey`;
      const envVar = getApiKeyEnvVar(provider);
      lines.push(
        `{`,
        `  const key = rt.config.${field} as string | undefined;`,
        `  if (key && !process.env.${envVar}) process.env.${envVar} = key;`,
        `}`,
      );
    }
    lines.push('');

    lines.push(
      'const mastraAgent = await rt.mastraAgent as Agent | undefined;',
      '',
      'export const mastra = new Mastra({',
      '  agents: mastraAgent ? { [mastraAgent.id]: mastraAgent } : {},',
      '});',
      '// @clint:end mastra-index',
      '',
    );

    return lines.join('\n');
  }

  // Mastra enabled but no full agent config yet — placeholder
  return [
    '// @clint:begin mastra-index',
    '/**',
    ' * Mastra Studio entry point for `mastra dev` / `mastra build` / `mastra start`.',
    ' *',
    " * Re-export a configured `@mastra/core` Mastra instance from here once you",
    " * replace the demo createAgent shim with a real Mastra Agent.",
    ' */',
    'export {};',
    '// @clint:end mastra-index',
    '',
  ].join('\n');
}
