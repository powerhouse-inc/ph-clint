/**
 * Builds the project README for a freshly-generated ph-clint project.
 */
import {
  type ClintProjectSpec,
  getPackageName,
  phAtLeast,
} from '../../spec/types.js';

export function buildReadme(spec: ClintProjectSpec): string {
  const { mastra, routine, powerhouse } = spec.features;
  const ph = powerhouse;
  const title = getPackageName(spec);
  const lines: string[] = [];
  lines.push(`# ${title}`);
  lines.push('');
  lines.push(spec.description || 'A ph-clint-based project.');
  lines.push('');
  lines.push('## Getting started');
  lines.push('');
  lines.push('```sh');
  lines.push('pnpm install');
  lines.push('pnpm dev');
  lines.push('```');
  lines.push('');
  lines.push('## Enabled features');
  lines.push('');
  lines.push(`- **Powerhouse**: ${ph !== 'Disabled' ? `on (${ph})` : 'off'}`);
  if (phAtLeast(ph, 'Reactor')) {
    lines.push(`  - Switchboard: ${phAtLeast(ph, 'Switchboard') ? 'on' : 'off'}`);
    lines.push(`  - Connect: ${phAtLeast(ph, 'Connect') ? 'on' : 'off'}`);
  }
  lines.push(`- **Mastra agent**: ${mastra.enabled ? 'on' : 'off'}`);
  lines.push(`- **Routine loop**: ${routine.enabled ? 'on' : 'off'}`);
  lines.push('');
  lines.push('## Regenerate');
  lines.push('');
  lines.push(
    'Toggle features or update metadata in `.ph/ph-clint-cli/project-spec.json`,',
  );
  lines.push('then re-run `ph-clint clint-project-regen` to regenerate.');
  lines.push('');
  if (phAtLeast(ph, 'Reactor')) {
    lines.push('## Split layout');
    lines.push('');
    lines.push(
      `This project is split into \`${spec.name}-cli/\` (the CLI) and \`${spec.name}-app/\` (the Powerhouse reactor package).`,
    );
    lines.push('');
    lines.push(
      `Run \`ph init\` inside \`${spec.name}-app/\` to scaffold the reactor package layout (document-models, editors, manifest, etc.).`,
    );
    lines.push('');
  }
  return lines.join('\n');
}
