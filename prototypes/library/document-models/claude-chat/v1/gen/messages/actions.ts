import type { Action } from "document-model";
import type { AddUserMessageInput, AddAgentMessageInput } from "../types.js";

export type AddUserMessageAction = Action & {
  type: "ADD_USER_MESSAGE";
  input: AddUserMessageInput;
};
export type AddAgentMessageAction = Action & {
  type: "ADD_AGENT_MESSAGE";
  input: AddAgentMessageInput;
};

export type ClaudeChatMessagesAction =
  | AddUserMessageAction
  | AddAgentMessageAction;
