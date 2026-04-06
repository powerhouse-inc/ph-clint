import type { Action } from "document-model";
import type {
  AddStakeholderInput,
  RemoveStakeholderInput,
  SetStakeholderNameInput,
  SetStakeholderAddressInput,
  SetStakeholderAvatarInput,
  MoveStakeholderInput,
} from "../types.js";

export type AddStakeholderAction = Action & {
  type: "ADD_STAKEHOLDER";
  input: AddStakeholderInput;
};
export type RemoveStakeholderAction = Action & {
  type: "REMOVE_STAKEHOLDER";
  input: RemoveStakeholderInput;
};
export type SetStakeholderNameAction = Action & {
  type: "SET_STAKEHOLDER_NAME";
  input: SetStakeholderNameInput;
};
export type SetStakeholderAddressAction = Action & {
  type: "SET_STAKEHOLDER_ADDRESS";
  input: SetStakeholderAddressInput;
};
export type SetStakeholderAvatarAction = Action & {
  type: "SET_STAKEHOLDER_AVATAR";
  input: SetStakeholderAvatarInput;
};
export type MoveStakeholderAction = Action & {
  type: "MOVE_STAKEHOLDER";
  input: MoveStakeholderInput;
};

export type AgentInboxStakeholdersAction =
  | AddStakeholderAction
  | RemoveStakeholderAction
  | SetStakeholderNameAction
  | SetStakeholderAddressAction
  | SetStakeholderAvatarAction
  | MoveStakeholderAction;
