/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import type { Reducer, StateReducer } from "document-model";
import { isDocumentAction, createReducer } from "document-model";
import type { PhClintProjectPHState } from "document-models/ph-clint-project/v1";

import { phClintProjectIdentityOperations } from "../src/reducers/identity.js";
import { phClintProjectFeaturesPowerhouseOperations } from "../src/reducers/features-powerhouse.js";
import { phClintProjectFeaturesMastraOperations } from "../src/reducers/features-mastra.js";
import { phClintProjectFeaturesRoutineOperations } from "../src/reducers/features-routine.js";

import {
  SetPackageNameInputSchema,
  ClearBinInputSchema,
  SetBinInputSchema,
  SetDescriptionInputSchema,
  SetVersionInputSchema,
  ClearScopeInputSchema,
  SetScopeInputSchema,
  EnablePowerhouseInputSchema,
  SetPowerhouseSwitchboardInputSchema,
  SetPowerhouseConnectInputSchema,
  EnableMastraInputSchema,
  DisableMastraInputSchema,
  EnableRoutineInputSchema,
  DisableRoutineInputSchema,
} from "./schema/zod.js";

const stateReducer: StateReducer<PhClintProjectPHState> = (
  state,
  action,
  dispatch,
) => {
  if (isDocumentAction(action)) {
    return state;
  }
  switch (action.type) {
    case "SET_PACKAGE_NAME": {
      SetPackageNameInputSchema().parse(action.input);

      phClintProjectIdentityOperations.setPackageNameOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "CLEAR_BIN": {
      ClearBinInputSchema().parse(action.input);

      phClintProjectIdentityOperations.clearBinOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "SET_BIN": {
      SetBinInputSchema().parse(action.input);

      phClintProjectIdentityOperations.setBinOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "SET_DESCRIPTION": {
      SetDescriptionInputSchema().parse(action.input);

      phClintProjectIdentityOperations.setDescriptionOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "SET_VERSION": {
      SetVersionInputSchema().parse(action.input);

      phClintProjectIdentityOperations.setVersionOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "CLEAR_SCOPE": {
      ClearScopeInputSchema().parse(action.input);

      phClintProjectIdentityOperations.clearScopeOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "SET_SCOPE": {
      SetScopeInputSchema().parse(action.input);

      phClintProjectIdentityOperations.setScopeOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "ENABLE_POWERHOUSE": {
      EnablePowerhouseInputSchema().parse(action.input);

      phClintProjectFeaturesPowerhouseOperations.enablePowerhouseOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "SET_POWERHOUSE_SWITCHBOARD": {
      SetPowerhouseSwitchboardInputSchema().parse(action.input);

      phClintProjectFeaturesPowerhouseOperations.setPowerhouseSwitchboardOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "SET_POWERHOUSE_CONNECT": {
      SetPowerhouseConnectInputSchema().parse(action.input);

      phClintProjectFeaturesPowerhouseOperations.setPowerhouseConnectOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "ENABLE_MASTRA": {
      EnableMastraInputSchema().parse(action.input);

      phClintProjectFeaturesMastraOperations.enableMastraOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "DISABLE_MASTRA": {
      DisableMastraInputSchema().parse(action.input);

      phClintProjectFeaturesMastraOperations.disableMastraOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "ENABLE_ROUTINE": {
      EnableRoutineInputSchema().parse(action.input);

      phClintProjectFeaturesRoutineOperations.enableRoutineOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "DISABLE_ROUTINE": {
      DisableRoutineInputSchema().parse(action.input);

      phClintProjectFeaturesRoutineOperations.disableRoutineOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    default:
      return state;
  }
};

export const reducer: Reducer<PhClintProjectPHState> =
  createReducer(stateReducer);
