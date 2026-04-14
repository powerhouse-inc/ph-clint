import type { Action } from "document-model";
import type {
  SendTextInput,
  SendErrorInput,
  SendToolCallInput,
  SendToolResultInput,
  DeleteMessageInput,
  MarkAsReadInput,
} from "../types.js";

export type SendTextAction = Action & {
  type: "SEND_TEXT";
  input: SendTextInput;
};
export type SendErrorAction = Action & {
  type: "SEND_ERROR";
  input: SendErrorInput;
};
export type SendToolCallAction = Action & {
  type: "SEND_TOOL_CALL";
  input: SendToolCallInput;
};
export type SendToolResultAction = Action & {
  type: "SEND_TOOL_RESULT";
  input: SendToolResultInput;
};
export type DeleteMessageAction = Action & {
  type: "DELETE_MESSAGE";
  input: DeleteMessageInput;
};
export type MarkAsReadAction = Action & {
  type: "MARK_AS_READ";
  input: MarkAsReadInput;
};

export type AgentChatMessagesAction =
  | SendTextAction
  | SendErrorAction
  | SendToolCallAction
  | SendToolResultAction
  | DeleteMessageAction
  | MarkAsReadAction;
