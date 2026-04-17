/**
 * Registry of file builders. Each entry knows its own relative path (within
 * the CLI sub-tree) and a function that builds its content from the spec.
 *
 * Orchestrated by `codegen/index.ts` — it walks this registry, adjusts paths
 * for flat vs split layouts, and writes the files.
 */
import { buildCliPackageJson } from './cli-package-json.js';
import { buildCliTs } from './cli-ts.js';
import { buildConfigTs } from './config-ts.js';
import { buildMainTs } from './main-ts.js';
import { buildTsconfigJson } from './tsconfig-json.js';
import { buildJestConfigJs } from './jest-config-js.js';
import { buildEslintConfigJs } from './eslint-config-js.js';
import { buildGitignore } from './gitignore.js';
import { buildMastraIndexTs } from './mastra-index-ts.js';
import { buildBuildSkillsScript } from './build-skills-ts.js';
import { buildAgentBaseMd } from './agent-base-md.js';
import { buildAgentTs } from './agent-ts.js';
import { buildFrameworkGenTs } from './framework-gen-ts.js';
import { buildFrameworkTs } from './framework-ts.js';
import { type ClintProjectSpec } from '../../spec/types.js';

/**
 * A spec-driven file builder. Returns `null` from `build` to indicate the
 * file should not be emitted for the given spec.
 */
export interface FileBuilder {
  /** Path relative to the CLI root (flat or `{name}-cli/`). */
  relativePath: string;
  build(spec: ClintProjectSpec): string | null;
  /**
   * When true, this file is only emitted on `mode: 'create'`. In `update`
   * mode the planner ignores the builder entirely, leaving any on-disk
   * version untouched regardless of hash state. Used for files that carry
   * user-owned hand edits (e.g. `src/framework.ts`'s `configSchema`).
   */
  initOnly?: boolean;
}

export const CLI_FILE_BUILDERS: FileBuilder[] = [
  { relativePath: 'package.json', build: buildCliPackageJson },
  { relativePath: 'tsconfig.json', build: () => buildTsconfigJson() },
  { relativePath: 'jest.config.js', build: () => buildJestConfigJs() },
  { relativePath: 'eslint.config.js', build: () => buildEslintConfigJs() },
  { relativePath: '.gitignore', build: () => buildGitignore() },
  { relativePath: 'src/main.ts', build: () => buildMainTs() },
  { relativePath: 'src/cli.ts', build: buildCliTs },
  { relativePath: 'src/config.ts', build: buildConfigTs },
  // User-owned; init-only. Holds `configSchema` + `secretsSchema` edits.
  { relativePath: 'src/framework.ts', build: buildFrameworkTs, initOnly: true },
  // Machine-owned; regenerated on every run. Null when no document types.
  { relativePath: 'src/framework.gen.ts', build: buildFrameworkGenTs },
  { relativePath: 'src/mastra/index.ts', build: buildMastraIndexTs },
  { relativePath: 'scripts/build-skills.ts', build: () => buildBuildSkillsScript() },
  { relativePath: 'prompts/agent-profiles/AgentBase.md', build: buildAgentBaseMd },
  {
    relativePath: 'src/agents/agent.ts',
    build: (spec) => (spec.features.mastra.enabled ? buildAgentTs(spec) : null),
  },
  // Gitkeep placeholders so directories are tracked in git when otherwise empty.
  { relativePath: 'src/commands/.gitkeep', build: () => '' },
  { relativePath: 'src/services/.gitkeep', build: () => '' },
  {
    relativePath: 'src/triggers/.gitkeep',
    build: (spec) => (spec.features.routine.enabled ? '' : ''),
  },
  {
    relativePath: 'src/agents/.gitkeep',
    build: (spec) => (spec.features.mastra.enabled ? null : ''),
  },
  { relativePath: 'prompts/skills-tpl/.gitkeep', build: () => '' },
  { relativePath: 'prompts/skills-ext/.gitkeep', build: () => '' },
  { relativePath: 'tests/.gitkeep', build: () => '' },
];

export {
  buildCliPackageJson,
  buildCliTs,
  buildConfigTs,
  buildMainTs,
  buildTsconfigJson,
  buildJestConfigJs,
  buildEslintConfigJs,
  buildGitignore,
  buildMastraIndexTs,
  buildBuildSkillsScript,
  buildAgentBaseMd,
  buildAgentTs,
  buildFrameworkGenTs,
  buildFrameworkTs,
};
export { buildRootPackageJson } from './root-package-json.js';
export { buildReadme } from './readme-md.js';
export { buildAppIndexTs } from './app-index-ts.js';
