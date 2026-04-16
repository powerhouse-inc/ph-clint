import { createAction } from "document-model";
import {
  EnableRoutineInputSchema,
  DisableRoutineInputSchema,
} from "../schema/zod.js";
import type { EnableRoutineInput, DisableRoutineInput } from "../types.js";
import type { EnableRoutineAction, DisableRoutineAction } from "./actions.js";

export const enableRoutine = (input: EnableRoutineInput) =>
  createAction<EnableRoutineAction>(
    "ENABLE_ROUTINE",
    { ...input },
    undefined,
    EnableRoutineInputSchema,
    "global",
  );

export const disableRoutine = (input: DisableRoutineInput) =>
  createAction<DisableRoutineAction>(
    "DISABLE_ROUTINE",
    { ...input },
    undefined,
    DisableRoutineInputSchema,
    "global",
  );
