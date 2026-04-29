/**
 * Builds the root `publish.config.js`.
 *
 * Split-layout: a lockstep group with both app and cli packages.
 * Single-layout: a single-package group at `.`.
 */
import { type ClintProjectSpec, phAtLeast } from '../../spec/types.js';

export function buildPublishConfigJs(spec: ClintProjectSpec): string {
  const split = phAtLeast(spec.features.powerhouse, 'Reactor');
  // The publish pipeline appends the prerelease suffix (e.g. -dev.0), so we
  // only store the base semver (M.m.p) here.
  const baseVersion = spec.version.replace(/-.*$/, '');

  const packages = split
    ? `[
        { path: '${spec.name}-app', category: 'app' },
        { path: '${spec.name}-cli', category: 'cli' },
      ]`
    : `[
        { path: '.', category: 'cli' },
      ]`;

  return `// Publish config — loaded by ph-clint's publish pipeline.
// definePublishConfig is an identity function; a plain export is equivalent.
export default {
  groups: {
    '${spec.name}': {
      version: '${baseVersion}',
      packages: ${packages},
    },
  },
};
`;
}
