/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import { createAction } from "document-model";
import {
  AddSupportedResourceInputSchema,
  RemoveSupportedResourceInputSchema,
  SetObservabilityEnabledInputSchema,
  SetProxyEnabledInputSchema,
} from "../schema/zod.js";
import type {
  AddSupportedResourceInput,
  RemoveSupportedResourceInput,
  SetObservabilityEnabledInput,
  SetProxyEnabledInput,
} from "../types.js";
import type {
  AddSupportedResourceAction,
  RemoveSupportedResourceAction,
  SetObservabilityEnabledAction,
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

export const setObservabilityEnabled = (input: SetObservabilityEnabledInput) =>
  createAction<SetObservabilityEnabledAction>(
    "SET_OBSERVABILITY_ENABLED",
    { ...input },
    undefined,
    SetObservabilityEnabledInputSchema,
    "global",
  );
