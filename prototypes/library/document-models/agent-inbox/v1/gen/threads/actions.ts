import type { Action } from "document-model";
import type {
  CreateThreadInput,
  SendAgentMessageInput,
  SetThreadTopicInput,
  EditMessageContentInput,
  MarkMessageReadInput,
  MarkMessageUnreadInput,
  SendStakeholderMessageInput,
} from "../types.js";

export type CreateThreadAction = Action & {
  type: "CREATE_THREAD";
  input: CreateThreadInput;
};
export type SendAgentMessageAction = Action & {
  type: "SEND_AGENT_MESSAGE";
  input: SendAgentMessageInput;
};
export type SetThreadTopicAction = Action & {
  type: "SET_THREAD_TOPIC";
  input: SetThreadTopicInput;
};
export type EditMessageContentAction = Action & {
  type: "EDIT_MESSAGE_CONTENT";
  input: EditMessageContentInput;
};
export type MarkMessageReadAction = Action & {
  type: "MARK_MESSAGE_READ";
  input: MarkMessageReadInput;
};
export type MarkMessageUnreadAction = Action & {
  type: "MARK_MESSAGE_UNREAD";
  input: MarkMessageUnreadInput;
};
export type SendStakeholderMessageAction = Action & {
  type: "SEND_STAKEHOLDER_MESSAGE";
  input: SendStakeholderMessageInput;
};

export type AgentInboxThreadsAction =
  | CreateThreadAction
  | SendAgentMessageAction
  | SetThreadTopicAction
  | EditMessageContentAction
  | MarkMessageReadAction
  | MarkMessageUnreadAction
  | SendStakeholderMessageAction;
