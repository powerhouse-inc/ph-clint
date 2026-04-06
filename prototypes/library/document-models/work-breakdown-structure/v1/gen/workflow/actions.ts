import type { Action } from "document-model";
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

export type CreateGoalAction = Action & {
  type: "CREATE_GOAL";
  input: CreateGoalInput;
};
export type DelegateGoalAction = Action & {
  type: "DELEGATE_GOAL";
  input: DelegateGoalInput;
};
export type ReportOnGoalAction = Action & {
  type: "REPORT_ON_GOAL";
  input: ReportOnGoalInput;
};
export type MarkInProgressAction = Action & {
  type: "MARK_IN_PROGRESS";
  input: MarkInProgressInput;
};
export type MarkCompletedAction = Action & {
  type: "MARK_COMPLETED";
  input: MarkCompletedInput;
};
export type MarkTodoAction = Action & {
  type: "MARK_TODO";
  input: MarkTodoInput;
};
export type ReportBlockedAction = Action & {
  type: "REPORT_BLOCKED";
  input: ReportBlockedInput;
};
export type UnblockGoalAction = Action & {
  type: "UNBLOCK_GOAL";
  input: UnblockGoalInput;
};
export type MarkWontDoAction = Action & {
  type: "MARK_WONT_DO";
  input: MarkWontDoInput;
};

export type WorkBreakdownStructureWorkflowAction =
  | CreateGoalAction
  | DelegateGoalAction
  | ReportOnGoalAction
  | MarkInProgressAction
  | MarkCompletedAction
  | MarkTodoAction
  | ReportBlockedAction
  | UnblockGoalAction
  | MarkWontDoAction;
