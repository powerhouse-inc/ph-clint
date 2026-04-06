import { type SignalDispatch } from "document-model";
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
import type { WorkBreakdownStructureState } from "../types.js";

export interface WorkBreakdownStructureWorkflowOperations {
  createGoalOperation: (
    state: WorkBreakdownStructureState,
    action: CreateGoalAction,
    dispatch?: SignalDispatch,
  ) => void;
  delegateGoalOperation: (
    state: WorkBreakdownStructureState,
    action: DelegateGoalAction,
    dispatch?: SignalDispatch,
  ) => void;
  reportOnGoalOperation: (
    state: WorkBreakdownStructureState,
    action: ReportOnGoalAction,
    dispatch?: SignalDispatch,
  ) => void;
  markInProgressOperation: (
    state: WorkBreakdownStructureState,
    action: MarkInProgressAction,
    dispatch?: SignalDispatch,
  ) => void;
  markCompletedOperation: (
    state: WorkBreakdownStructureState,
    action: MarkCompletedAction,
    dispatch?: SignalDispatch,
  ) => void;
  markTodoOperation: (
    state: WorkBreakdownStructureState,
    action: MarkTodoAction,
    dispatch?: SignalDispatch,
  ) => void;
  reportBlockedOperation: (
    state: WorkBreakdownStructureState,
    action: ReportBlockedAction,
    dispatch?: SignalDispatch,
  ) => void;
  unblockGoalOperation: (
    state: WorkBreakdownStructureState,
    action: UnblockGoalAction,
    dispatch?: SignalDispatch,
  ) => void;
  markWontDoOperation: (
    state: WorkBreakdownStructureState,
    action: MarkWontDoAction,
    dispatch?: SignalDispatch,
  ) => void;
}
