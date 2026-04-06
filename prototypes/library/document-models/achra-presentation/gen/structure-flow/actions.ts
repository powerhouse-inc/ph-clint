import { type Action } from "document-model";
import type {
  AddProcessStepInput,
  UpdateProcessStepInput,
  DeleteProcessStepInput,
  ReorderProcessStepsInput,
  AddAgendaItemInput,
  UpdateAgendaItemInput,
  DeleteAgendaItemInput,
  ReorderAgendaItemsInput,
  AddMilestoneInput,
  UpdateMilestoneInput,
  DeleteMilestoneInput,
  ReorderMilestonesInput,
} from "../types.js";

export type AddProcessStepAction = Action & {
  type: "ADD_PROCESS_STEP";
  input: AddProcessStepInput;
};
export type UpdateProcessStepAction = Action & {
  type: "UPDATE_PROCESS_STEP";
  input: UpdateProcessStepInput;
};
export type DeleteProcessStepAction = Action & {
  type: "DELETE_PROCESS_STEP";
  input: DeleteProcessStepInput;
};
export type ReorderProcessStepsAction = Action & {
  type: "REORDER_PROCESS_STEPS";
  input: ReorderProcessStepsInput;
};
export type AddAgendaItemAction = Action & {
  type: "ADD_AGENDA_ITEM";
  input: AddAgendaItemInput;
};
export type UpdateAgendaItemAction = Action & {
  type: "UPDATE_AGENDA_ITEM";
  input: UpdateAgendaItemInput;
};
export type DeleteAgendaItemAction = Action & {
  type: "DELETE_AGENDA_ITEM";
  input: DeleteAgendaItemInput;
};
export type ReorderAgendaItemsAction = Action & {
  type: "REORDER_AGENDA_ITEMS";
  input: ReorderAgendaItemsInput;
};
export type AddMilestoneAction = Action & {
  type: "ADD_MILESTONE";
  input: AddMilestoneInput;
};
export type UpdateMilestoneAction = Action & {
  type: "UPDATE_MILESTONE";
  input: UpdateMilestoneInput;
};
export type DeleteMilestoneAction = Action & {
  type: "DELETE_MILESTONE";
  input: DeleteMilestoneInput;
};
export type ReorderMilestonesAction = Action & {
  type: "REORDER_MILESTONES";
  input: ReorderMilestonesInput;
};

export type AchraPresentationStructureFlowAction =
  | AddProcessStepAction
  | UpdateProcessStepAction
  | DeleteProcessStepAction
  | ReorderProcessStepsAction
  | AddAgendaItemAction
  | UpdateAgendaItemAction
  | DeleteAgendaItemAction
  | ReorderAgendaItemsAction
  | AddMilestoneAction
  | UpdateMilestoneAction
  | DeleteMilestoneAction
  | ReorderMilestonesAction;
