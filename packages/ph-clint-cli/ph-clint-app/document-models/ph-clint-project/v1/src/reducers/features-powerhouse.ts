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
      // Auto-create managed app package when transitioning from Disabled to enabled
      if (current === 0 && next >= 1) {
        const hasManaged = state.packages.some((p) => p.managed);
        if (!hasManaged) {
          const baseName = state.name
            ? state.name.replace(/-cli$/, "-app")
            : "app";
          const appName =
            state.scope && state.name ? `${state.scope}/${baseName}` : baseName;
          state.packages.push({
            id: `app-${state.name || "managed"}`,
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
