import { baseActions } from "document-model";
import { agentsActions, messagesActions, userActions } from "./gen/creators.js";

/** Actions for the ClaudeChat document model */

export const actions = {
  ...baseActions,
  ...agentsActions,
  ...messagesActions,
  ...userActions,
};
