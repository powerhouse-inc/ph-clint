import { createAction } from "document-model/core";
import {
  RegisterProjectInputSchema,
  UpdateProjectConfigInputSchema,
  UpdateProjectStatusInputSchema,
} from "../schema/zod.js";
import type {
  RegisterProjectInput,
  UpdateProjectConfigInput,
  UpdateProjectStatusInput,
} from "../types.js";
import type {
  RegisterProjectAction,
  UpdateProjectConfigAction,
  UpdateProjectStatusAction,
} from "./actions.js";

export const registerProject = (input: RegisterProjectInput) =>
  createAction<RegisterProjectAction>(
    "REGISTER_PROJECT",
    { ...input },
    undefined,
    RegisterProjectInputSchema,
    "global",
  );

export const updateProjectConfig = (input: UpdateProjectConfigInput) =>
  createAction<UpdateProjectConfigAction>(
    "UPDATE_PROJECT_CONFIG",
    { ...input },
    undefined,
    UpdateProjectConfigInputSchema,
    "global",
  );

export const updateProjectStatus = (input: UpdateProjectStatusInput) =>
  createAction<UpdateProjectStatusAction>(
    "UPDATE_PROJECT_STATUS",
    { ...input },
    undefined,
    UpdateProjectStatusInputSchema,
    "global",
  );
