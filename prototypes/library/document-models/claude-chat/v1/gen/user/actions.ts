import type { Action } from "document-model";
import type { SetUsernameInput, SetSelectedAgentInput } from "../types.js";

export type SetUsernameAction = Action & {
  type: "SET_USERNAME";
  input: SetUsernameInput;
};
export type SetSelectedAgentAction = Action & {
  type: "SET_SELECTED_AGENT";
  input: SetSelectedAgentInput;
};

export type ClaudeChatUserAction = SetUsernameAction | SetSelectedAgentAction;
