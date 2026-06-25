import type { PhClintProjectDeploymentOperations } from "document-models/ph-clint-project/v1";
import {
  DuplicateResourceError,
  ResourceNotFoundError,
} from "../../gen/deployment/error.js";

export const phClintProjectDeploymentOperations: PhClintProjectDeploymentOperations =
  {
    addSupportedResourceOperation(state, action) {
      if (state.deployment.supportedResources.includes(action.input.resource)) {
        throw new DuplicateResourceError(
          `Resource already exists: ${action.input.resource}`,
        );
      }
      state.deployment.supportedResources.push(action.input.resource);
    },
    removeSupportedResourceOperation(state, action) {
      const idx = state.deployment.supportedResources.indexOf(
        action.input.resource,
      );
      if (idx === -1) {
        throw new ResourceNotFoundError(
          `Resource not found: ${action.input.resource}`,
        );
      }
      state.deployment.supportedResources.splice(idx, 1);
    },
    setProxyEnabledOperation(state, action) {
      state.deployment.proxyEnabled = action.input.enabled;
    },
    setObservabilityEnabledOperation(state, action) {
      state.deployment.observabilityEnabled = action.input.enabled;
    },
  };
