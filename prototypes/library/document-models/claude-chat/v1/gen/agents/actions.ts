import type { Action } from "document-model";
import type { AddAgentInput } from "../types.js";

export type AddAgentAction = Action & {
  type: "ADD_AGENT";
  input: AddAgentInput;
};

export type ClaudeChatAgentsAction = AddAgentAction;
