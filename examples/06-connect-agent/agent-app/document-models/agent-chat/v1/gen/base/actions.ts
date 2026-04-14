import type { Action } from "document-model";
import type {
  SetTopicInput,
  ClearTopicInput,
  SetPruneLengthInput,
  RemovePruneLengthInput,
} from "../types.js";

export type SetTopicAction = Action & {
  type: "SET_TOPIC";
  input: SetTopicInput;
};
export type ClearTopicAction = Action & {
  type: "CLEAR_TOPIC";
  input: ClearTopicInput;
};
export type SetPruneLengthAction = Action & {
  type: "SET_PRUNE_LENGTH";
  input: SetPruneLengthInput;
};
export type RemovePruneLengthAction = Action & {
  type: "REMOVE_PRUNE_LENGTH";
  input: RemovePruneLengthInput;
};

export type AgentChatBaseAction =
  | SetTopicAction
  | ClearTopicAction
  | SetPruneLengthAction
  | RemovePruneLengthAction;
