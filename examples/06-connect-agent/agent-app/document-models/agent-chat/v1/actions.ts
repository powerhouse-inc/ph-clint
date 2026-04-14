import { baseActions } from "document-model";
import {
  agentChatBaseActions,
  agentChatStakeholdersActions,
  agentChatAgentsActions,
  agentChatMessagesActions,
  agentChatReactionsActions,
} from "./gen/creators.js";

/** Actions for the AgentChat document model */

export const actions = {
  ...baseActions,
  ...agentChatBaseActions,
  ...agentChatStakeholdersActions,
  ...agentChatAgentsActions,
  ...agentChatMessagesActions,
  ...agentChatReactionsActions,
};
