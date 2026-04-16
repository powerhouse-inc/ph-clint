import type { PhClintProjectFeaturesPowerhouseOperations } from "document-models/ph-clint-project/v1";

export const phClintProjectFeaturesPowerhouseOperations: PhClintProjectFeaturesPowerhouseOperations =
  {
    enablePowerhouseOperation(state) {
      state.features.powerhouse.enabled = true;
    },
    setPowerhouseSwitchboardOperation(state, action) {
      state.features.powerhouse.switchboard = action.input.enabled;
    },
    setPowerhouseConnectOperation(state, action) {
      state.features.powerhouse.connect = action.input.enabled;
    },
  };
