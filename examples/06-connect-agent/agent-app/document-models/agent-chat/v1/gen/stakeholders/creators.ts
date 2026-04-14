import { createAction } from "document-model";
import {
  AddStakeholderInputSchema,
  SetStakeholderNameInputSchema,
  SetStakeholderEthAddressInputSchema,
  SetStakeholderAvatarInputSchema,
  RemoveStakeholderInputSchema,
  ReaddStakeholderInputSchema,
} from "../schema/zod.js";
import type {
  AddStakeholderInput,
  SetStakeholderNameInput,
  SetStakeholderEthAddressInput,
  SetStakeholderAvatarInput,
  RemoveStakeholderInput,
  ReaddStakeholderInput,
} from "../types.js";
import type {
  AddStakeholderAction,
  SetStakeholderNameAction,
  SetStakeholderEthAddressAction,
  SetStakeholderAvatarAction,
  RemoveStakeholderAction,
  ReaddStakeholderAction,
} from "./actions.js";

export const addStakeholder = (input: AddStakeholderInput) =>
  createAction<AddStakeholderAction>(
    "ADD_STAKEHOLDER",
    { ...input },
    undefined,
    AddStakeholderInputSchema,
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

export const setStakeholderEthAddress = (
  input: SetStakeholderEthAddressInput,
) =>
  createAction<SetStakeholderEthAddressAction>(
    "SET_STAKEHOLDER_ETH_ADDRESS",
    { ...input },
    undefined,
    SetStakeholderEthAddressInputSchema,
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

export const removeStakeholder = (input: RemoveStakeholderInput) =>
  createAction<RemoveStakeholderAction>(
    "REMOVE_STAKEHOLDER",
    { ...input },
    undefined,
    RemoveStakeholderInputSchema,
    "global",
  );

export const readdStakeholder = (input: ReaddStakeholderInput) =>
  createAction<ReaddStakeholderAction>(
    "READD_STAKEHOLDER",
    { ...input },
    undefined,
    ReaddStakeholderInputSchema,
    "global",
  );
