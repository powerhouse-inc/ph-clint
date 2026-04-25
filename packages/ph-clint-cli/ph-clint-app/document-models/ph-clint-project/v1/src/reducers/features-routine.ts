import type { PhClintProjectFeaturesRoutineOperations } from "document-models/ph-clint-project/v1";

export const phClintProjectFeaturesRoutineOperations: PhClintProjectFeaturesRoutineOperations =
  {
    enableRoutineOperation(state) {
      state.features.routine.enabled = true;
    },
    disableRoutineOperation(state) {
      state.features.routine.enabled = false;
    },
  };
