import type { Action } from "document-model";
import type {
  AddStakeholderInput,
  SetStakeholderNameInput,
  SetStakeholderEthAddressInput,
  SetStakeholderAvatarInput,
  RemoveStakeholderInput,
  ReaddStakeholderInput,
} from "../types.js";

export type AddStakeholderAction = Action & {
  type: "ADD_STAKEHOLDER";
  input: AddStakeholderInput;
};
export type SetStakeholderNameAction = Action & {
  type: "SET_STAKEHOLDER_NAME";
  input: SetStakeholderNameInput;
};
export type SetStakeholderEthAddressAction = Action & {
  type: "SET_STAKEHOLDER_ETH_ADDRESS";
  input: SetStakeholderEthAddressInput;
};
export type SetStakeholderAvatarAction = Action & {
  type: "SET_STAKEHOLDER_AVATAR";
  input: SetStakeholderAvatarInput;
};
export type RemoveStakeholderAction = Action & {
  type: "REMOVE_STAKEHOLDER";
  input: RemoveStakeholderInput;
};
export type ReaddStakeholderAction = Action & {
  type: "READD_STAKEHOLDER";
  input: ReaddStakeholderInput;
};

export type AgentChatStakeholdersAction =
  | AddStakeholderAction
  | SetStakeholderNameAction
  | SetStakeholderEthAddressAction
  | SetStakeholderAvatarAction
  | RemoveStakeholderAction
  | ReaddStakeholderAction;
