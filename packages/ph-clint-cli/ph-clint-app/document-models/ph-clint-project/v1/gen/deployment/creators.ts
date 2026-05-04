import { createAction } from "document-model";
import {
  AddSupportedResourceInputSchema,
  RemoveSupportedResourceInputSchema,
  SetProxyEnabledInputSchema,
} from "../schema/zod.js";
import type {
  AddSupportedResourceInput,
  RemoveSupportedResourceInput,
  SetProxyEnabledInput,
} from "../types.js";
import type {
  AddSupportedResourceAction,
  RemoveSupportedResourceAction,
  SetProxyEnabledAction,
} from "./actions.js";

export const addSupportedResource = (input: AddSupportedResourceInput) =>
  createAction<AddSupportedResourceAction>(
    "ADD_SUPPORTED_RESOURCE",
    { ...input },
    undefined,
    AddSupportedResourceInputSchema,
    "global",
  );

export const removeSupportedResource = (input: RemoveSupportedResourceInput) =>
  createAction<RemoveSupportedResourceAction>(
    "REMOVE_SUPPORTED_RESOURCE",
    { ...input },
    undefined,
    RemoveSupportedResourceInputSchema,
    "global",
  );

export const setProxyEnabled = (input: SetProxyEnabledInput) =>
  createAction<SetProxyEnabledAction>(
    "SET_PROXY_ENABLED",
    { ...input },
    undefined,
    SetProxyEnabledInputSchema,
    "global",
  );
