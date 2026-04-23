import type { PhClintProjectFeaturesMastraOperations } from 'document-models/ph-clint-project/v1';

export const phClintProjectFeaturesMastraOperations: PhClintProjectFeaturesMastraOperations = {
  enableMastraOperation(state) {
    state.features.mastra.enabled = true;
  },
  disableMastraOperation(state) {
    state.features.mastra.enabled = false;
  },
};
