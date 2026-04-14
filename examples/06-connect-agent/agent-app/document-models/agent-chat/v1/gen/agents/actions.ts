import type { Action } from "document-model";
import type {
  AddAgentInput,
  SetAgentNameInput,
  SetAgentEthAddressInput,
  SetAgentRoleInput,
  SetAgentDescriptionInput,
  SetAgentAvatarInput,
  RemoveAgentInput,
  ReaddAgentInput,
} from "../types.js";

export type AddAgentAction = Action & {
  type: "ADD_AGENT";
  input: AddAgentInput;
};
export type SetAgentNameAction = Action & {
  type: "SET_AGENT_NAME";
  input: SetAgentNameInput;
};
export type SetAgentEthAddressAction = Action & {
  type: "SET_AGENT_ETH_ADDRESS";
  input: SetAgentEthAddressInput;
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
export type RemoveAgentAction = Action & {
  type: "REMOVE_AGENT";
  input: RemoveAgentInput;
};
export type ReaddAgentAction = Action & {
  type: "READD_AGENT";
  input: ReaddAgentInput;
};

export type AgentChatAgentsAction =
  | AddAgentAction
  | SetAgentNameAction
  | SetAgentEthAddressAction
  | SetAgentRoleAction
  | SetAgentDescriptionAction
  | SetAgentAvatarAction
  | RemoveAgentAction
  | ReaddAgentAction;
