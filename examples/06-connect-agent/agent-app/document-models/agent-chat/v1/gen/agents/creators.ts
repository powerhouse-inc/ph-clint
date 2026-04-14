import { createAction } from "document-model";
import {
  AddAgentInputSchema,
  SetAgentNameInputSchema,
  SetAgentEthAddressInputSchema,
  SetAgentRoleInputSchema,
  SetAgentDescriptionInputSchema,
  SetAgentAvatarInputSchema,
  RemoveAgentInputSchema,
  ReaddAgentInputSchema,
} from "../schema/zod.js";
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
import type {
  AddAgentAction,
  SetAgentNameAction,
  SetAgentEthAddressAction,
  SetAgentRoleAction,
  SetAgentDescriptionAction,
  SetAgentAvatarAction,
  RemoveAgentAction,
  ReaddAgentAction,
} from "./actions.js";

export const addAgent = (input: AddAgentInput) =>
  createAction<AddAgentAction>(
    "ADD_AGENT",
    { ...input },
    undefined,
    AddAgentInputSchema,
    "global",
  );

export const setAgentName = (input: SetAgentNameInput) =>
  createAction<SetAgentNameAction>(
    "SET_AGENT_NAME",
    { ...input },
    undefined,
    SetAgentNameInputSchema,
    "global",
  );

export const setAgentEthAddress = (input: SetAgentEthAddressInput) =>
  createAction<SetAgentEthAddressAction>(
    "SET_AGENT_ETH_ADDRESS",
    { ...input },
    undefined,
    SetAgentEthAddressInputSchema,
    "global",
  );

export const setAgentRole = (input: SetAgentRoleInput) =>
  createAction<SetAgentRoleAction>(
    "SET_AGENT_ROLE",
    { ...input },
    undefined,
    SetAgentRoleInputSchema,
    "global",
  );

export const setAgentDescription = (input: SetAgentDescriptionInput) =>
  createAction<SetAgentDescriptionAction>(
    "SET_AGENT_DESCRIPTION",
    { ...input },
    undefined,
    SetAgentDescriptionInputSchema,
    "global",
  );

export const setAgentAvatar = (input: SetAgentAvatarInput) =>
  createAction<SetAgentAvatarAction>(
    "SET_AGENT_AVATAR",
    { ...input },
    undefined,
    SetAgentAvatarInputSchema,
    "global",
  );

export const removeAgent = (input: RemoveAgentInput) =>
  createAction<RemoveAgentAction>(
    "REMOVE_AGENT",
    { ...input },
    undefined,
    RemoveAgentInputSchema,
    "global",
  );

export const readdAgent = (input: ReaddAgentInput) =>
  createAction<ReaddAgentAction>(
    "READD_AGENT",
    { ...input },
    undefined,
    ReaddAgentInputSchema,
    "global",
  );
