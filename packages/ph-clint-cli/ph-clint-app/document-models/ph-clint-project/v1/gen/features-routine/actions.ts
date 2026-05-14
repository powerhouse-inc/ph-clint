/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import type { Action } from "document-model";
import type { DisableRoutineInput, EnableRoutineInput } from "../types.js";

export type EnableRoutineAction = Action & {
  type: "ENABLE_ROUTINE";
  input: EnableRoutineInput;
};
export type DisableRoutineAction = Action & {
  type: "DISABLE_ROUTINE";
  input: DisableRoutineInput;
};

export type PhClintProjectFeaturesRoutineAction =
  | EnableRoutineAction
  | DisableRoutineAction;
