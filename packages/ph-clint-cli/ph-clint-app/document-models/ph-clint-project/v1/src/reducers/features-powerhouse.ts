import { CannotLowerPowerhouseError } from "../../gen/features-powerhouse/error.js";
import type { PhClintProjectFeaturesPowerhouseOperations } from "document-models/ph-clint-project/v1";

const LEVELS = ["Disabled", "Reactor", "Switchboard", "Connect"] as const;

export const phClintProjectFeaturesPowerhouseOperations: PhClintProjectFeaturesPowerhouseOperations =
  {
    setPowerhouseLevelOperation(state, action) {
      const current = LEVELS.indexOf(
        state.features.powerhouse as (typeof LEVELS)[number],
      );
      const next = LEVELS.indexOf(action.input.level);
      if (current >= 1 && next < 1) {
        throw new CannotLowerPowerhouseError(
          "Cannot lower Powerhouse level below Reactor once enabled",
        );
      }
      state.features.powerhouse = action.input.level;
      // Auto-create app package when transitioning from Disabled to any higher level
      if (current === 0 && next >= 1 && state.name) {
        const baseName = state.name.replace(/-cli$/, "-app");
        const appName = state.scope ? `${state.scope}/${baseName}` : baseName;
        const exists = state.packages.find((p) => p.packageName === appName);
        if (!exists) {
          state.packages.push({
            id: `app-${state.name}`,
            packageName: appName,
            documentTypes: ["*/*"],
            version: null,
            managed: true,
          });
        }
      }
      // Auto-enable proxy when reaching Switchboard or above
      if (next >= 2 && !action.input.skipAutoProxy) {
        state.deployment.proxyEnabled = true;
      }
    },
  };
