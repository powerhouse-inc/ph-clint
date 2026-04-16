import type { PhClintProjectFeaturesRoutineOperations } from "document-models/ph-clint-project/v1";
import { MastraRequiresRoutineError } from "../../gen/features-routine/error.js";

export const phClintProjectFeaturesRoutineOperations: PhClintProjectFeaturesRoutineOperations =
  {
    enableRoutineOperation(state) {
      state.features.routine.enabled = true;
    },
    disableRoutineOperation(state) {
      if (state.features.mastra.enabled) {
        throw new MastraRequiresRoutineError(
          "Cannot disable routine while Mastra is enabled",
        );
      }
      state.features.routine.enabled = false;
    },
  };
