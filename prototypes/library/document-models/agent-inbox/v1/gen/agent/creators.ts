import { createAction } from "document-model/core";
import {
  SetAgentNameInputSchema,
  SetAgentAddressInputSchema,
  SetAgentRoleInputSchema,
  SetAgentDescriptionInputSchema,
  SetAgentAvatarInputSchema,
} from "../schema/zod.js";
import type {
  SetAgentNameInput,
  SetAgentAddressInput,
  SetAgentRoleInput,
  SetAgentDescriptionInput,
  SetAgentAvatarInput,
} from "../types.js";
import type {
  SetAgentNameAction,
  SetAgentAddressAction,
  SetAgentRoleAction,
  SetAgentDescriptionAction,
  SetAgentAvatarAction,
} from "./actions.js";

export const setAgentName = (input: SetAgentNameInput) =>
  createAction<SetAgentNameAction>(
    "SET_AGENT_NAME",
    { ...input },
    undefined,
    SetAgentNameInputSchema,
    "global",
  );

export const setAgentAddress = (input: SetAgentAddressInput) =>
  createAction<SetAgentAddressAction>(
    "SET_AGENT_ADDRESS",
    { ...input },
    undefined,
    SetAgentAddressInputSchema,
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
