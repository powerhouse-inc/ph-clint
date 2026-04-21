/**
 * Builds the root `publish.config.ts` for split-layout projects.
 * Defines a single lockstep group containing both the app and cli packages.
 */
import { type ClintProjectSpec } from '../../spec/types.js';

export function buildPublishConfigTs(spec: ClintProjectSpec): string {
  const app = `${spec.name}-app`;
  const cli = `${spec.name}-cli`;

  return `import { definePublishConfig } from '@powerhousedao/ph-clint-dev/publish';

export default definePublishConfig({
  groups: {
    '${spec.name}': {
      version: '${spec.version}',
      packages: [
        { path: '${app}', category: 'app' },
        { path: '${cli}', category: 'cli' },
      ],
    },
  },
});
`;
}
