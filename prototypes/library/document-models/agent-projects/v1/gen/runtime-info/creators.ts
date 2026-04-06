import { createAction } from "document-model/core";
import { UpdateRuntimeInfoInputSchema } from "../schema/zod.js";
import type { UpdateRuntimeInfoInput } from "../types.js";
import type { UpdateRuntimeInfoAction } from "./actions.js";

export const updateRuntimeInfo = (input: UpdateRuntimeInfoInput) =>
  createAction<UpdateRuntimeInfoAction>(
    "UPDATE_RUNTIME_INFO",
    { ...input },
    undefined,
    UpdateRuntimeInfoInputSchema,
    "global",
  );
