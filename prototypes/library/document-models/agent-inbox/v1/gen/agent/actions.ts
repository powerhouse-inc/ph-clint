import type { Action } from "document-model";
import type {
  SetAgentNameInput,
  SetAgentAddressInput,
  SetAgentRoleInput,
  SetAgentDescriptionInput,
  SetAgentAvatarInput,
} from "../types.js";

export type SetAgentNameAction = Action & {
  type: "SET_AGENT_NAME";
  input: SetAgentNameInput;
};
export type SetAgentAddressAction = Action & {
  type: "SET_AGENT_ADDRESS";
  input: SetAgentAddressInput;
};
export type SetAgentRoleAction = Action & {
  type: "SET_AGENT_ROLE";
  input: SetAgentRoleInput;
};
export type SetAgentDescriptionAction = Action & {
  type: "SET_AGENT_DESCRIPTION";
  input: SetAgentDescriptionInput;
};
export type SetAgentAvatarAction = Action & {
  type: "SET_AGENT_AVATAR";
  input: SetAgentAvatarInput;
};

export type AgentInboxAgentAction =
  | SetAgentNameAction
  | SetAgentAddressAction
  | SetAgentRoleAction
  | SetAgentDescriptionAction
  | SetAgentAvatarAction;
