import { createAction } from "document-model/core";
import {
  AddStakeholderInputSchema,
  RemoveStakeholderInputSchema,
  SetStakeholderNameInputSchema,
  SetStakeholderAddressInputSchema,
  SetStakeholderAvatarInputSchema,
  MoveStakeholderInputSchema,
} from "../schema/zod.js";
import type {
  AddStakeholderInput,
  RemoveStakeholderInput,
  SetStakeholderNameInput,
  SetStakeholderAddressInput,
  SetStakeholderAvatarInput,
  MoveStakeholderInput,
} from "../types.js";
import type {
  AddStakeholderAction,
  RemoveStakeholderAction,
  SetStakeholderNameAction,
  SetStakeholderAddressAction,
  SetStakeholderAvatarAction,
  MoveStakeholderAction,
} from "./actions.js";

export const addStakeholder = (input: AddStakeholderInput) =>
  createAction<AddStakeholderAction>(
    "ADD_STAKEHOLDER",
    { ...input },
    undefined,
    AddStakeholderInputSchema,
    "global",
  );

export const removeStakeholder = (input: RemoveStakeholderInput) =>
  createAction<RemoveStakeholderAction>(
    "REMOVE_STAKEHOLDER",
    { ...input },
    undefined,
    RemoveStakeholderInputSchema,
    "global",
  );

export const setStakeholderName = (input: SetStakeholderNameInput) =>
  createAction<SetStakeholderNameAction>(
    "SET_STAKEHOLDER_NAME",
    { ...input },
    undefined,
    SetStakeholderNameInputSchema,
    "global",
  );

export const setStakeholderAddress = (input: SetStakeholderAddressInput) =>
  createAction<SetStakeholderAddressAction>(
    "SET_STAKEHOLDER_ADDRESS",
    { ...input },
    undefined,
    SetStakeholderAddressInputSchema,
    "global",
  );

export const setStakeholderAvatar = (input: SetStakeholderAvatarInput) =>
  createAction<SetStakeholderAvatarAction>(
    "SET_STAKEHOLDER_AVATAR",
    { ...input },
    undefined,
    SetStakeholderAvatarInputSchema,
    "global",
  );

export const moveStakeholder = (input: MoveStakeholderInput) =>
  createAction<MoveStakeholderAction>(
    "MOVE_STAKEHOLDER",
    { ...input },
    undefined,
    MoveStakeholderInputSchema,
    "global",
  );
