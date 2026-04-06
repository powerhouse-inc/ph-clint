import { baseActions } from "document-model";
import {
  projectTargetingActions,
  projectManagementActions,
  runtimeInfoActions,
  logsActions,
} from "./gen/creators.js";

/** Actions for the AgentProjects document model */

export const actions = {
  ...baseActions,
  ...projectTargetingActions,
  ...projectManagementActions,
  ...runtimeInfoActions,
  ...logsActions,
};
