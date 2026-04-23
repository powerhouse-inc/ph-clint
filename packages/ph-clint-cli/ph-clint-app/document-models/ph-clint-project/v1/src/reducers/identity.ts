import { InvalidNameError, InvalidScopeError, InvalidVersionError } from '../../gen/identity/error.js';
import type { PhClintProjectIdentityOperations } from 'document-models/ph-clint-project/v1';

const NAME_PATTERN = /^[a-z][a-z0-9-]*$/;
const SEMVER_PATTERN = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

export const phClintProjectIdentityOperations: PhClintProjectIdentityOperations = {
  setPackageNameOperation(state, action) {
    if (!NAME_PATTERN.test(action.input.name)) {
      throw new InvalidNameError(`Invalid package name: ${action.input.name}`);
    }
    state.name = action.input.name;
  },
  setScopeOperation(state, action) {
    if (!NAME_PATTERN.test(action.input.scope)) {
      throw new InvalidScopeError(`Invalid scope: ${action.input.scope}`);
    }
    state.scope = action.input.scope;
  },
  clearScopeOperation(state) {
    state.scope = null;
  },
  setVersionOperation(state, action) {
    if (!SEMVER_PATTERN.test(action.input.version)) {
      throw new InvalidVersionError(`Invalid version: ${action.input.version}`);
    }
    state.version = action.input.version;
  },
  setDescriptionOperation(state, action) {
    state.description = action.input.description;
  },
  setBinOperation(state, action) {
    if (!NAME_PATTERN.test(action.input.bin)) {
      throw new InvalidNameError(`Invalid bin name: ${action.input.bin}`);
    }
    state.bin = action.input.bin;
  },
  clearBinOperation(state) {
    state.bin = null;
  },
};
