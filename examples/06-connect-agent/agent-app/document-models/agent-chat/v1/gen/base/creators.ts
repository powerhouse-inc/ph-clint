import { createAction } from "document-model";
import {
  SetTopicInputSchema,
  ClearTopicInputSchema,
  SetPruneLengthInputSchema,
  RemovePruneLengthInputSchema,
} from "../schema/zod.js";
import type {
  SetTopicInput,
  ClearTopicInput,
  SetPruneLengthInput,
  RemovePruneLengthInput,
} from "../types.js";
import type {
  SetTopicAction,
  ClearTopicAction,
  SetPruneLengthAction,
  RemovePruneLengthAction,
} from "./actions.js";

export const setTopic = (input: SetTopicInput) =>
  createAction<SetTopicAction>(
    "SET_TOPIC",
    { ...input },
    undefined,
    SetTopicInputSchema,
    "global",
  );

export const clearTopic = (input: ClearTopicInput) =>
  createAction<ClearTopicAction>(
    "CLEAR_TOPIC",
    { ...input },
    undefined,
    ClearTopicInputSchema,
    "global",
  );

export const setPruneLength = (input: SetPruneLengthInput) =>
  createAction<SetPruneLengthAction>(
    "SET_PRUNE_LENGTH",
    { ...input },
    undefined,
    SetPruneLengthInputSchema,
    "global",
  );

export const removePruneLength = (input: RemovePruneLengthInput) =>
  createAction<RemovePruneLengthAction>(
    "REMOVE_PRUNE_LENGTH",
    { ...input },
    undefined,
    RemovePruneLengthInputSchema,
    "global",
  );
