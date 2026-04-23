/**
 * Builds the root `publish.config.ts` for split-layout projects.
 * Defines a single lockstep group containing both the app and cli packages.
 */
import { type ClintProjectSpec } from '../../spec/types.js';

export function buildPublishConfigTs(spec: ClintProjectSpec): string {
  const app = `${spec.name}-app`;
  const cli = `${spec.name}-cli`;
  // The publish pipeline appends the prerelease suffix (e.g. -dev.0), so we
  // only store the base semver (M.m.p) here.
  const baseVersion = spec.version.replace(/-.*$/, '');

  return `// Publish config — loaded by ph-clint's publish pipeline.
// definePublishConfig is an identity function; a plain export is equivalent.
export default {
  groups: {
    '${spec.name}': {
      version: '${baseVersion}',
      packages: [
        { path: '${app}', category: 'app' },
        { path: '${cli}', category: 'cli' },
      ],
    },
  },
};
`;
}
