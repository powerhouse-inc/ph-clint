import { createAction } from "document-model/core";
import {
  AddProcessStepInputSchema,
  UpdateProcessStepInputSchema,
  DeleteProcessStepInputSchema,
  ReorderProcessStepsInputSchema,
  AddAgendaItemInputSchema,
  UpdateAgendaItemInputSchema,
  DeleteAgendaItemInputSchema,
  ReorderAgendaItemsInputSchema,
  AddMilestoneInputSchema,
  UpdateMilestoneInputSchema,
  DeleteMilestoneInputSchema,
  ReorderMilestonesInputSchema,
} from "../schema/zod.js";
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

export const addProcessStep = (input: AddProcessStepInput) =>
  createAction<AddProcessStepAction>(
    "ADD_PROCESS_STEP",
    { ...input },
    undefined,
    AddProcessStepInputSchema,
    "global",
  );

export const updateProcessStep = (input: UpdateProcessStepInput) =>
  createAction<UpdateProcessStepAction>(
    "UPDATE_PROCESS_STEP",
    { ...input },
    undefined,
    UpdateProcessStepInputSchema,
    "global",
  );

export const deleteProcessStep = (input: DeleteProcessStepInput) =>
  createAction<DeleteProcessStepAction>(
    "DELETE_PROCESS_STEP",
    { ...input },
    undefined,
    DeleteProcessStepInputSchema,
    "global",
  );

export const reorderProcessSteps = (input: ReorderProcessStepsInput) =>
  createAction<ReorderProcessStepsAction>(
    "REORDER_PROCESS_STEPS",
    { ...input },
    undefined,
    ReorderProcessStepsInputSchema,
    "global",
  );

export const addAgendaItem = (input: AddAgendaItemInput) =>
  createAction<AddAgendaItemAction>(
    "ADD_AGENDA_ITEM",
    { ...input },
    undefined,
    AddAgendaItemInputSchema,
    "global",
  );

export const updateAgendaItem = (input: UpdateAgendaItemInput) =>
  createAction<UpdateAgendaItemAction>(
    "UPDATE_AGENDA_ITEM",
    { ...input },
    undefined,
    UpdateAgendaItemInputSchema,
    "global",
  );

export const deleteAgendaItem = (input: DeleteAgendaItemInput) =>
  createAction<DeleteAgendaItemAction>(
    "DELETE_AGENDA_ITEM",
    { ...input },
    undefined,
    DeleteAgendaItemInputSchema,
    "global",
  );

export const reorderAgendaItems = (input: ReorderAgendaItemsInput) =>
  createAction<ReorderAgendaItemsAction>(
    "REORDER_AGENDA_ITEMS",
    { ...input },
    undefined,
    ReorderAgendaItemsInputSchema,
    "global",
  );

export const addMilestone = (input: AddMilestoneInput) =>
  createAction<AddMilestoneAction>(
    "ADD_MILESTONE",
    { ...input },
    undefined,
    AddMilestoneInputSchema,
    "global",
  );

export const updateMilestone = (input: UpdateMilestoneInput) =>
  createAction<UpdateMilestoneAction>(
    "UPDATE_MILESTONE",
    { ...input },
    undefined,
    UpdateMilestoneInputSchema,
    "global",
  );

export const deleteMilestone = (input: DeleteMilestoneInput) =>
  createAction<DeleteMilestoneAction>(
    "DELETE_MILESTONE",
    { ...input },
    undefined,
    DeleteMilestoneInputSchema,
    "global",
  );

export const reorderMilestones = (input: ReorderMilestonesInput) =>
  createAction<ReorderMilestonesAction>(
    "REORDER_MILESTONES",
    { ...input },
    undefined,
    ReorderMilestonesInputSchema,
    "global",
  );
