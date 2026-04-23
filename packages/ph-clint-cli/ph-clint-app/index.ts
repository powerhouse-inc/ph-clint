import type { Manifest } from 'document-model';
import manifestJson from './powerhouse.manifest.json' with { type: 'json' };
export { documentModels } from './document-models/document-models.js';
export { upgradeManifests } from './document-models/upgrade-manifests.js';
export { editors } from './editors/editors.js';
export { processorFactory } from './processors/factory.js';
export const manifest: Manifest = manifestJson;

// Top-level re-exports of registered document models — consumed by
// `src/framework.gen.ts` in the CLI side, so impl code never has to
// reach into `document-models/<slug>/v1/module.js` directly.
export { PhClintProject } from './document-models/ph-clint-project/v1/module.js';
export * from './document-models/ph-clint-project/index.js';
