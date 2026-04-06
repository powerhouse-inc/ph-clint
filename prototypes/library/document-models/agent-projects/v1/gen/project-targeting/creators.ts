import { createAction } from "document-model/core";
import {
  CreateProjectInputSchema,
  RunProjectInputSchema,
  StopProjectInputSchema,
  DeleteProjectInputSchema,
} from "../schema/zod.js";
import type {
  CreateProjectInput,
  RunProjectInput,
  StopProjectInput,
  DeleteProjectInput,
} from "../types.js";
import type {
  CreateProjectAction,
  RunProjectAction,
  StopProjectAction,
  DeleteProjectAction,
} from "./actions.js";

export const createProject = (input: CreateProjectInput) =>
  createAction<CreateProjectAction>(
    "CREATE_PROJECT",
    { ...input },
    undefined,
    CreateProjectInputSchema,
    "global",
  );

export const runProject = (input: RunProjectInput) =>
  createAction<RunProjectAction>(
    "RUN_PROJECT",
    { ...input },
    undefined,
    RunProjectInputSchema,
    "global",
  );

export const stopProject = (input: StopProjectInput) =>
  createAction<StopProjectAction>(
    "STOP_PROJECT",
    { ...input },
    undefined,
    StopProjectInputSchema,
    "global",
  );

export const deleteProject = (input: DeleteProjectInput) =>
  createAction<DeleteProjectAction>(
    "DELETE_PROJECT",
    { ...input },
    undefined,
    DeleteProjectInputSchema,
    "global",
  );
