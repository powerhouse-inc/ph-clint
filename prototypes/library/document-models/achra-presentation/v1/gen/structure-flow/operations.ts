import { type SignalDispatch } from "document-model";
import type {
  AddProcessStepAction,
  UpdateProcessStepAction,
  DeleteProcessStepAction,
  ReorderProcessStepsAction,
  AddAgendaItemAction,
  UpdateAgendaItemAction,
  DeleteAgendaItemAction,
  ReorderAgendaItemsAction,
  AddMilestoneAction,
  UpdateMilestoneAction,
  DeleteMilestoneAction,
  ReorderMilestonesAction,
} from "./actions.js";
import type { AchraPresentationState } from "../types.js";

export interface AchraPresentationStructureFlowOperations {
  addProcessStepOperation: (
    state: AchraPresentationState,
    action: AddProcessStepAction,
    dispatch?: SignalDispatch,
  ) => void;
  updateProcessStepOperation: (
    state: AchraPresentationState,
    action: UpdateProcessStepAction,
    dispatch?: SignalDispatch,
  ) => void;
  deleteProcessStepOperation: (
    state: AchraPresentationState,
    action: DeleteProcessStepAction,
    dispatch?: SignalDispatch,
  ) => void;
  reorderProcessStepsOperation: (
    state: AchraPresentationState,
    action: ReorderProcessStepsAction,
    dispatch?: SignalDispatch,
  ) => void;
  addAgendaItemOperation: (
    state: AchraPresentationState,
    action: AddAgendaItemAction,
    dispatch?: SignalDispatch,
  ) => void;
  updateAgendaItemOperation: (
    state: AchraPresentationState,
    action: UpdateAgendaItemAction,
    dispatch?: SignalDispatch,
  ) => void;
  deleteAgendaItemOperation: (
    state: AchraPresentationState,
    action: DeleteAgendaItemAction,
    dispatch?: SignalDispatch,
  ) => void;
  reorderAgendaItemsOperation: (
    state: AchraPresentationState,
    action: ReorderAgendaItemsAction,
    dispatch?: SignalDispatch,
  ) => void;
  addMilestoneOperation: (
    state: AchraPresentationState,
    action: AddMilestoneAction,
    dispatch?: SignalDispatch,
  ) => void;
  updateMilestoneOperation: (
    state: AchraPresentationState,
    action: UpdateMilestoneAction,
    dispatch?: SignalDispatch,
  ) => void;
  deleteMilestoneOperation: (
    state: AchraPresentationState,
    action: DeleteMilestoneAction,
    dispatch?: SignalDispatch,
  ) => void;
  reorderMilestonesOperation: (
    state: AchraPresentationState,
    action: ReorderMilestonesAction,
    dispatch?: SignalDispatch,
  ) => void;
}
