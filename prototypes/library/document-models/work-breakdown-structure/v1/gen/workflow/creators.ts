import { createAction } from "document-model/core";
import {
  CreateGoalInputSchema,
  DelegateGoalInputSchema,
  ReportOnGoalInputSchema,
  MarkInProgressInputSchema,
  MarkCompletedInputSchema,
  MarkTodoInputSchema,
  ReportBlockedInputSchema,
  UnblockGoalInputSchema,
  MarkWontDoInputSchema,
} from "../schema/zod.js";
import type {
  CreateGoalInput,
  DelegateGoalInput,
  ReportOnGoalInput,
  MarkInProgressInput,
  MarkCompletedInput,
  MarkTodoInput,
  ReportBlockedInput,
  UnblockGoalInput,
  MarkWontDoInput,
} from "../types.js";
import type {
  CreateGoalAction,
  DelegateGoalAction,
  ReportOnGoalAction,
  MarkInProgressAction,
  MarkCompletedAction,
  MarkTodoAction,
  ReportBlockedAction,
  UnblockGoalAction,
  MarkWontDoAction,
} from "./actions.js";

export const createGoal = (input: CreateGoalInput) =>
  createAction<CreateGoalAction>(
    "CREATE_GOAL",
    { ...input },
    undefined,
    CreateGoalInputSchema,
    "global",
  );

export const delegateGoal = (input: DelegateGoalInput) =>
  createAction<DelegateGoalAction>(
    "DELEGATE_GOAL",
    { ...input },
    undefined,
    DelegateGoalInputSchema,
    "global",
  );

export const reportOnGoal = (input: ReportOnGoalInput) =>
  createAction<ReportOnGoalAction>(
    "REPORT_ON_GOAL",
    { ...input },
    undefined,
    ReportOnGoalInputSchema,
    "global",
  );

export const markInProgress = (input: MarkInProgressInput) =>
  createAction<MarkInProgressAction>(
    "MARK_IN_PROGRESS",
    { ...input },
    undefined,
    MarkInProgressInputSchema,
    "global",
  );

export const markCompleted = (input: MarkCompletedInput) =>
  createAction<MarkCompletedAction>(
    "MARK_COMPLETED",
    { ...input },
    undefined,
    MarkCompletedInputSchema,
    "global",
  );

export const markTodo = (input: MarkTodoInput) =>
  createAction<MarkTodoAction>(
    "MARK_TODO",
    { ...input },
    undefined,
    MarkTodoInputSchema,
    "global",
  );

export const reportBlocked = (input: ReportBlockedInput) =>
  createAction<ReportBlockedAction>(
    "REPORT_BLOCKED",
    { ...input },
    undefined,
    ReportBlockedInputSchema,
    "global",
  );

export const unblockGoal = (input: UnblockGoalInput) =>
  createAction<UnblockGoalAction>(
    "UNBLOCK_GOAL",
    { ...input },
    undefined,
    UnblockGoalInputSchema,
    "global",
  );

export const markWontDo = (input: MarkWontDoInput) =>
  createAction<MarkWontDoAction>(
    "MARK_WONT_DO",
    { ...input },
    undefined,
    MarkWontDoInputSchema,
    "global",
  );
