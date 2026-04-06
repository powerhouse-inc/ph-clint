// TODO: remove eslint-disable rules once refactor is done
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import type { StateReducer } from "document-model";
import { isDocumentAction, createReducer } from "document-model/core";
import type { AgentProjectsPHState } from "@powerhousedao/agent-manager/document-models/agent-projects/v1";

import { agentProjectsProjectTargetingOperations } from "../src/reducers/project-targeting.js";
import { agentProjectsProjectManagementOperations } from "../src/reducers/project-management.js";
import { agentProjectsRuntimeInfoOperations } from "../src/reducers/runtime-info.js";
import { agentProjectsLogsOperations } from "../src/reducers/logs.js";

import {
  CreateProjectInputSchema,
  RunProjectInputSchema,
  StopProjectInputSchema,
  DeleteProjectInputSchema,
  RegisterProjectInputSchema,
  UpdateProjectConfigInputSchema,
  UpdateProjectStatusInputSchema,
  UpdateRuntimeInfoInputSchema,
  AddLogEntryInputSchema,
  ClearProjectLogsInputSchema,
} from "./schema/zod.js";

const stateReducer: StateReducer<AgentProjectsPHState> = (
  state,
  action,
  dispatch,
) => {
  if (isDocumentAction(action)) {
    return state;
  }
  switch (action.type) {
    case "CREATE_PROJECT": {
      CreateProjectInputSchema().parse(action.input);

      agentProjectsProjectTargetingOperations.createProjectOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "RUN_PROJECT": {
      RunProjectInputSchema().parse(action.input);

      agentProjectsProjectTargetingOperations.runProjectOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "STOP_PROJECT": {
      StopProjectInputSchema().parse(action.input);

      agentProjectsProjectTargetingOperations.stopProjectOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "DELETE_PROJECT": {
      DeleteProjectInputSchema().parse(action.input);

      agentProjectsProjectTargetingOperations.deleteProjectOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "REGISTER_PROJECT": {
      RegisterProjectInputSchema().parse(action.input);

      agentProjectsProjectManagementOperations.registerProjectOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "UPDATE_PROJECT_CONFIG": {
      UpdateProjectConfigInputSchema().parse(action.input);

      agentProjectsProjectManagementOperations.updateProjectConfigOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "UPDATE_PROJECT_STATUS": {
      UpdateProjectStatusInputSchema().parse(action.input);

      agentProjectsProjectManagementOperations.updateProjectStatusOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "UPDATE_RUNTIME_INFO": {
      UpdateRuntimeInfoInputSchema().parse(action.input);

      agentProjectsRuntimeInfoOperations.updateRuntimeInfoOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "ADD_LOG_ENTRY": {
      AddLogEntryInputSchema().parse(action.input);

      agentProjectsLogsOperations.addLogEntryOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "CLEAR_PROJECT_LOGS": {
      ClearProjectLogsInputSchema().parse(action.input);

      agentProjectsLogsOperations.clearProjectLogsOperation(
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

export const reducer = createReducer<AgentProjectsPHState>(stateReducer);
