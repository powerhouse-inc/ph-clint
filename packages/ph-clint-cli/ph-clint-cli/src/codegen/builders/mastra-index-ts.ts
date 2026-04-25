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

/**
 * Derive the `{PROVIDER}_API_KEY` env var name from a model ID like
 * `anthropic/claude-sonnet-4-5` or `openai:gpt-4o`.
 */
function getApiKeyEnvVar(modelId: string): string {
  const provider = modelId.split(/[:/]/)[0];
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
  if (mastra.agentId && mastra.models.length > 0) {
    const envVars = [...new Set(mastra.models.map(m => getApiKeyEnvVar(m.id)))];

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
      `// Bridge the ph-clint resolved key so Studio's provider detection works.`,
      `const apiKey = rt.config.apiKey as string | undefined;`,
    );
    for (const ev of envVars) {
      lines.push(
        `if (apiKey && !process.env.${ev}) {`,
        `  process.env.${ev} = apiKey;`,
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
