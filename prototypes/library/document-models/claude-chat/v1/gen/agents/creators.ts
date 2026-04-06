import { createAction } from "document-model/core";
import { AddAgentInputSchema } from "../schema/zod.js";
import type { AddAgentInput } from "../types.js";
import type { AddAgentAction } from "./actions.js";

export const addAgent = (input: AddAgentInput) =>
  createAction<AddAgentAction>(
    "ADD_AGENT",
    { ...input },
    undefined,
    AddAgentInputSchema,
    "global",
  );
