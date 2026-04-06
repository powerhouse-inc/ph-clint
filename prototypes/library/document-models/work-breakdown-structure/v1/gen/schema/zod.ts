import * as z from "zod";
import type {
  AddDependenciesInput,
  AddNoteInput,
  ClearInstructionsInput,
  ClearNotesInput,
  CompletedNoteInput,
  CreateGoalInput,
  DelegateGoalInput,
  Goal,
  GoalBlockReason,
  GoalBlockType,
  GoalInstructions,
  GoalStatus,
  InProgressNoteInput,
  InitialInstructionsInput,
  InitialNoteInput,
  InstructionsUpdate,
  MarkAsDraftInput,
  MarkAsReadyInput,
  MarkCompletedInput,
  MarkInProgressInput,
  MarkTodoInput,
  MarkWontDoInput,
  MetaData,
  MetaDataFormat,
  MetaDataInput,
  Note,
  OutcomeInput,
  RemoveDependenciesInput,
  RemoveNoteInput,
  ReorderInput,
  ReportBlockedInput,
  ReportNoteInput,
  ReportOnGoalInput,
  SetMetaDataInput,
  SetOwnerInput,
  SetReferencesInput,
  TodoNoteInput,
  UnblockGoalInput,
  UnblockNoteInput,
  UpdateDescriptionInput,
  UpdateInstructionsInput,
  WorkBreakdownStructureState,
  WorkType,
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

export const GoalBlockTypeSchema = z.enum([
  "AWAITING_APPROVAL",
  "MISSING_INFORMATION",
  "OTHER",
  "UNFINISHED_DEPENDENCIES",
]);

export const GoalStatusSchema = z.enum([
  "BLOCKED",
  "COMPLETED",
  "DELEGATED",
  "IN_PROGRESS",
  "IN_REVIEW",
  "TODO",
  "WONT_DO",
]);

export const MetaDataFormatSchema = z.enum(["JSON", "OTHER", "TEXT"]);

export const WorkTypeSchema = z.enum(["SCENARIO", "SKILL", "TASK"]);

export function AddDependenciesInputSchema(): z.ZodObject<
  Properties<AddDependenciesInput>
> {
  return z.object({
    dependsOn: z.array(z.string()),
    goalId: z.string(),
  });
}

export function AddNoteInputSchema(): z.ZodObject<Properties<AddNoteInput>> {
  return z.object({
    author: z.string().nullish(),
    goalId: z.string(),
    note: z.string(),
    noteId: z.string(),
  });
}

export function ClearInstructionsInputSchema(): z.ZodObject<
  Properties<ClearInstructionsInput>
> {
  return z.object({
    goalId: z.string(),
  });
}

export function ClearNotesInputSchema(): z.ZodObject<
  Properties<ClearNotesInput>
> {
  return z.object({
    goalId: z.string(),
  });
}

export function CompletedNoteInputSchema(): z.ZodObject<
  Properties<CompletedNoteInput>
> {
  return z.object({
    author: z.string().nullish(),
    id: z.string(),
    note: z.string(),
  });
}

export function CreateGoalInputSchema(): z.ZodObject<
  Properties<CreateGoalInput>
> {
  return z.object({
    assignee: z.string().nullish(),
    dependsOn: z.array(z.string()).nullish(),
    description: z.string(),
    draft: z.boolean().nullish(),
    id: z.string(),
    initialNote: z.lazy(() => InitialNoteInputSchema().nullish()),
    insertBefore: z.string().nullish(),
    instructions: z.lazy(() => InitialInstructionsInputSchema().nullish()),
    metaData: z.lazy(() => MetaDataInputSchema().nullish()),
    parentId: z.string().nullish(),
  });
}

export function DelegateGoalInputSchema(): z.ZodObject<
  Properties<DelegateGoalInput>
> {
  return z.object({
    assignee: z.string(),
    id: z.string(),
  });
}

export function GoalSchema(): z.ZodObject<Properties<Goal>> {
  return z.object({
    __typename: z.literal("Goal").optional(),
    assignee: z.string().nullish(),
    block: z.lazy(() => GoalBlockReasonSchema().nullish()),
    dependencies: z.array(z.string()),
    description: z.string(),
    id: z.string(),
    instructions: z.lazy(() => GoalInstructionsSchema().nullish()),
    isDraft: z.boolean(),
    notes: z.array(z.lazy(() => NoteSchema())),
    outcome: z.lazy(() => MetaDataSchema().nullish()),
    parentId: z.string().nullish(),
    status: GoalStatusSchema,
  });
}

export function GoalBlockReasonSchema(): z.ZodObject<
  Properties<GoalBlockReason>
> {
  return z.object({
    __typename: z.literal("GoalBlockReason").optional(),
    comment: z.string().nullish(),
    type: GoalBlockTypeSchema,
  });
}

export function GoalInstructionsSchema(): z.ZodObject<
  Properties<GoalInstructions>
> {
  return z.object({
    __typename: z.literal("GoalInstructions").optional(),
    comments: z.string(),
    context: z.lazy(() => MetaDataSchema().nullish()),
    workId: z.string().nullish(),
    workType: WorkTypeSchema.nullish(),
  });
}

export function InProgressNoteInputSchema(): z.ZodObject<
  Properties<InProgressNoteInput>
> {
  return z.object({
    author: z.string().nullish(),
    id: z.string(),
    note: z.string(),
  });
}

export function InitialInstructionsInputSchema(): z.ZodObject<
  Properties<InitialInstructionsInput>
> {
  return z.object({
    comments: z.string(),
    contextJSON: z.string().nullish(),
    workId: z.string().nullish(),
    workType: WorkTypeSchema.nullish(),
  });
}

export function InitialNoteInputSchema(): z.ZodObject<
  Properties<InitialNoteInput>
> {
  return z.object({
    author: z.string().nullish(),
    id: z.string(),
    note: z.string(),
  });
}

export function InstructionsUpdateSchema(): z.ZodObject<
  Properties<InstructionsUpdate>
> {
  return z.object({
    comments: z.string(),
    contextJSON: z.string().nullish(),
    workId: z.string().nullish(),
    workType: WorkTypeSchema.nullish(),
  });
}

export function MarkAsDraftInputSchema(): z.ZodObject<
  Properties<MarkAsDraftInput>
> {
  return z.object({
    goalId: z.string(),
  });
}

export function MarkAsReadyInputSchema(): z.ZodObject<
  Properties<MarkAsReadyInput>
> {
  return z.object({
    goalId: z.string(),
  });
}

export function MarkCompletedInputSchema(): z.ZodObject<
  Properties<MarkCompletedInput>
> {
  return z.object({
    id: z.string(),
    note: z.lazy(() => CompletedNoteInputSchema().nullish()),
    outcome: z.lazy(() => OutcomeInputSchema().nullish()),
  });
}

export function MarkInProgressInputSchema(): z.ZodObject<
  Properties<MarkInProgressInput>
> {
  return z.object({
    id: z.string(),
    note: z.lazy(() => InProgressNoteInputSchema().nullish()),
  });
}

export function MarkTodoInputSchema(): z.ZodObject<Properties<MarkTodoInput>> {
  return z.object({
    id: z.string(),
    note: z.lazy(() => TodoNoteInputSchema().nullish()),
  });
}

export function MarkWontDoInputSchema(): z.ZodObject<
  Properties<MarkWontDoInput>
> {
  return z.object({
    id: z.string(),
  });
}

export function MetaDataSchema(): z.ZodObject<Properties<MetaData>> {
  return z.object({
    __typename: z.literal("MetaData").optional(),
    data: z.string(),
    format: MetaDataFormatSchema,
  });
}

export function MetaDataInputSchema(): z.ZodObject<Properties<MetaDataInput>> {
  return z.object({
    data: z.string(),
    format: MetaDataFormatSchema,
  });
}

export function NoteSchema(): z.ZodObject<Properties<Note>> {
  return z.object({
    __typename: z.literal("Note").optional(),
    author: z.string().nullish(),
    id: z.string(),
    note: z.string(),
  });
}

export function OutcomeInputSchema(): z.ZodObject<Properties<OutcomeInput>> {
  return z.object({
    data: z.string(),
    format: MetaDataFormatSchema,
  });
}

export function RemoveDependenciesInputSchema(): z.ZodObject<
  Properties<RemoveDependenciesInput>
> {
  return z.object({
    dependencies: z.array(z.string()),
    goalId: z.string(),
  });
}

export function RemoveNoteInputSchema(): z.ZodObject<
  Properties<RemoveNoteInput>
> {
  return z.object({
    goalId: z.string(),
    noteId: z.string(),
  });
}

export function ReorderInputSchema(): z.ZodObject<Properties<ReorderInput>> {
  return z.object({
    goalId: z.string(),
    insertBefore: z.string().nullish(),
    parentId: z.string().nullish(),
  });
}

export function ReportBlockedInputSchema(): z.ZodObject<
  Properties<ReportBlockedInput>
> {
  return z.object({
    comment: z.string().nullish(),
    id: z.string(),
    type: GoalBlockTypeSchema,
  });
}

export function ReportNoteInputSchema(): z.ZodObject<
  Properties<ReportNoteInput>
> {
  return z.object({
    author: z.string().nullish(),
    id: z.string(),
    note: z.string(),
  });
}

export function ReportOnGoalInputSchema(): z.ZodObject<
  Properties<ReportOnGoalInput>
> {
  return z.object({
    id: z.string(),
    moveInReview: z.boolean(),
    note: z.lazy(() => ReportNoteInputSchema()),
  });
}

export function SetMetaDataInputSchema(): z.ZodObject<
  Properties<SetMetaDataInput>
> {
  return z.object({
    data: z.string(),
    format: MetaDataFormatSchema,
  });
}

export function SetOwnerInputSchema(): z.ZodObject<Properties<SetOwnerInput>> {
  return z.object({
    owner: z.string(),
  });
}

export function SetReferencesInputSchema(): z.ZodObject<
  Properties<SetReferencesInput>
> {
  return z.object({
    references: z.array(z.url()),
  });
}

export function TodoNoteInputSchema(): z.ZodObject<Properties<TodoNoteInput>> {
  return z.object({
    author: z.string().nullish(),
    id: z.string(),
    note: z.string(),
  });
}

export function UnblockGoalInputSchema(): z.ZodObject<
  Properties<UnblockGoalInput>
> {
  return z.object({
    id: z.string(),
    response: z.lazy(() => UnblockNoteInputSchema()),
  });
}

export function UnblockNoteInputSchema(): z.ZodObject<
  Properties<UnblockNoteInput>
> {
  return z.object({
    author: z.string().nullish(),
    id: z.string(),
    note: z.string(),
  });
}

export function UpdateDescriptionInputSchema(): z.ZodObject<
  Properties<UpdateDescriptionInput>
> {
  return z.object({
    description: z.string(),
    goalId: z.string(),
  });
}

export function UpdateInstructionsInputSchema(): z.ZodObject<
  Properties<UpdateInstructionsInput>
> {
  return z.object({
    goalId: z.string(),
    instructions: z.lazy(() => InstructionsUpdateSchema()),
  });
}

export function WorkBreakdownStructureStateSchema(): z.ZodObject<
  Properties<WorkBreakdownStructureState>
> {
  return z.object({
    __typename: z.literal("WorkBreakdownStructureState").optional(),
    goals: z.array(z.lazy(() => GoalSchema())),
    isBlocked: z.boolean(),
    metaData: z.lazy(() => MetaDataSchema().nullish()),
    owner: z.string().nullish(),
    references: z.array(z.url()),
  });
}
