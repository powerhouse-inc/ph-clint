import { baseActions } from "document-model";
import {
  agentActions,
  stakeholdersActions,
  threadsActions,
  workflowActions,
} from "./gen/creators.js";

/** Actions for the AgentInbox document model */

export const actions = {
  ...baseActions,
  ...agentActions,
  ...stakeholdersActions,
  ...threadsActions,
  ...workflowActions,
};
