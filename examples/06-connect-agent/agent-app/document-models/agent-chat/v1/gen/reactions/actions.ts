import type { Action } from "document-model";
import type { AddReactionInput, RemoveReactionInput } from "../types.js";

export type AddReactionAction = Action & {
  type: "ADD_REACTION";
  input: AddReactionInput;
};
export type RemoveReactionAction = Action & {
  type: "REMOVE_REACTION";
  input: RemoveReactionInput;
};

export type AgentChatReactionsAction = AddReactionAction | RemoveReactionAction;
