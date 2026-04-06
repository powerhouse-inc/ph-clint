import * as z from "zod";
import type {
  AddLogEntryInput,
  AgentProjectsState,
  ClearProjectLogsInput,
  CreateProjectInput,
  CurrentStatus,
  DeleteProjectInput,
  LogEntry,
  Project,
  ProjectConfig,
  RegisterProjectInput,
  RunProjectInput,
  RuntimeInfo,
  StopProjectInput,
  TargetedStatus,
  UpdateProjectConfigInput,
  UpdateProjectStatusInput,
  UpdateRuntimeInfoInput,
} from "./types.js";

type Properties<T> = Required<{
  [K in keyof T]: z.ZodType<T[K]>;
}>;

type definedNonNullAny = {};

export const isDefinedNonNullAny = (v: any): v is definedNonNullAny =>
  v !== undefined && v !== null;

export const definedNonNullAnySchema = z
  .any()
  .refine((v) => isDefinedNonNullAny(v));

export const CurrentStatusSchema = z.enum([
  "DELETED",
  "INITIALIZING",
  "MISSING",
  "RUNNING",
  "STOPPED",
]);

export const TargetedStatusSchema = z.enum(["DELETED", "RUNNING", "STOPPED"]);

export function AddLogEntryInputSchema(): z.ZodObject<
  Properties<AddLogEntryInput>
> {
  return z.object({
    message: z.string(),
    projectId: z.string(),
    timestamp: z.iso.datetime(),
  });
}

export function AgentProjectsStateSchema(): z.ZodObject<
  Properties<AgentProjectsState>
> {
  return z.object({
    __typename: z.literal("AgentProjectsState").optional(),
    projects: z.array(z.lazy(() => ProjectSchema())),
  });
}

export function ClearProjectLogsInputSchema(): z.ZodObject<
  Properties<ClearProjectLogsInput>
> {
  return z.object({
    projectId: z.string(),
  });
}

export function CreateProjectInputSchema(): z.ZodObject<
  Properties<CreateProjectInput>
> {
  return z.object({
    connectPort: z.number().nullish(),
    id: z.string(),
    name: z.string(),
    switchboardPort: z.number().nullish(),
  });
}

export function DeleteProjectInputSchema(): z.ZodObject<
  Properties<DeleteProjectInput>
> {
  return z.object({
    projectId: z.string(),
  });
}

export function LogEntrySchema(): z.ZodObject<Properties<LogEntry>> {
  return z.object({
    __typename: z.literal("LogEntry").optional(),
    message: z.string(),
    timestamp: z.iso.datetime(),
  });
}

export function ProjectSchema(): z.ZodObject<Properties<Project>> {
  return z.object({
    __typename: z.literal("Project").optional(),
    configuration: z.lazy(() => ProjectConfigSchema()),
    currentStatus: CurrentStatusSchema,
    id: z.string(),
    logs: z.array(z.lazy(() => LogEntrySchema())),
    name: z.string(),
    path: z.string().nullish(),
    runtime: z.lazy(() => RuntimeInfoSchema().nullish()),
    targetedStatus: TargetedStatusSchema,
  });
}

export function ProjectConfigSchema(): z.ZodObject<Properties<ProjectConfig>> {
  return z.object({
    __typename: z.literal("ProjectConfig").optional(),
    autoStart: z.boolean(),
    connectPort: z.number(),
    startupTimeout: z.number(),
    switchboardPort: z.number(),
  });
}

export function RegisterProjectInputSchema(): z.ZodObject<
  Properties<RegisterProjectInput>
> {
  return z.object({
    autoStart: z.boolean(),
    connectPort: z.number(),
    currentStatus: CurrentStatusSchema,
    id: z.string(),
    name: z.string(),
    path: z.string(),
    startupTimeout: z.number(),
    switchboardPort: z.number(),
  });
}

export function RunProjectInputSchema(): z.ZodObject<
  Properties<RunProjectInput>
> {
  return z.object({
    projectId: z.string(),
  });
}

export function RuntimeInfoSchema(): z.ZodObject<Properties<RuntimeInfo>> {
  return z.object({
    __typename: z.literal("RuntimeInfo").optional(),
    connectPort: z.number(),
    driveUrl: z.string().nullish(),
    pid: z.number(),
    startedAt: z.iso.datetime(),
    switchboardPort: z.number(),
  });
}

export function StopProjectInputSchema(): z.ZodObject<
  Properties<StopProjectInput>
> {
  return z.object({
    projectId: z.string(),
  });
}

export function UpdateProjectConfigInputSchema(): z.ZodObject<
  Properties<UpdateProjectConfigInput>
> {
  return z.object({
    autoStart: z.boolean().nullish(),
    connectPort: z.number().nullish(),
    projectId: z.string(),
    startupTimeout: z.number().nullish(),
    switchboardPort: z.number().nullish(),
  });
}

export function UpdateProjectStatusInputSchema(): z.ZodObject<
  Properties<UpdateProjectStatusInput>
> {
  return z.object({
    currentStatus: CurrentStatusSchema,
    path: z.string().nullish(),
    projectId: z.string(),
  });
}

export function UpdateRuntimeInfoInputSchema(): z.ZodObject<
  Properties<UpdateRuntimeInfoInput>
> {
  return z.object({
    connectPort: z.number(),
    driveUrl: z.string().nullish(),
    pid: z.number(),
    projectId: z.string(),
    startedAt: z.iso.datetime(),
    switchboardPort: z.number(),
  });
}
