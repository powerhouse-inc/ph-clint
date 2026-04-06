/**
 * This is a scaffold file meant for customization:
 * - change it by adding new tests or modifying the existing ones
 */

import { describe, it, expect } from "vitest";
import { generateMock } from "@powerhousedao/codegen";
import {
  reducer,
  utils,
  isAchraPresentationDocument,
  addProcessStep,
  AddProcessStepInputSchema,
  updateProcessStep,
  UpdateProcessStepInputSchema,
  deleteProcessStep,
  DeleteProcessStepInputSchema,
  reorderProcessSteps,
  ReorderProcessStepsInputSchema,
  addAgendaItem,
  AddAgendaItemInputSchema,
  updateAgendaItem,
  UpdateAgendaItemInputSchema,
  deleteAgendaItem,
  DeleteAgendaItemInputSchema,
  reorderAgendaItems,
  ReorderAgendaItemsInputSchema,
  addMilestone,
  AddMilestoneInputSchema,
  updateMilestone,
  UpdateMilestoneInputSchema,
  deleteMilestone,
  DeleteMilestoneInputSchema,
  reorderMilestones,
  ReorderMilestonesInputSchema,
} from "@powerhousedao/agent-manager/document-models/achra-presentation";

describe("StructureFlow Operations", () => {
  it("should handle addProcessStep operation", () => {
    const document = utils.createDocument();
    const input = generateMock(AddProcessStepInputSchema());

    const updatedDocument = reducer(document, addProcessStep(input));

    expect(isAchraPresentationDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "ADD_PROCESS_STEP",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });
  it("should handle updateProcessStep operation", () => {
    const document = utils.createDocument();
    const input = generateMock(UpdateProcessStepInputSchema());

    const updatedDocument = reducer(document, updateProcessStep(input));

    expect(isAchraPresentationDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "UPDATE_PROCESS_STEP",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });
  it("should handle deleteProcessStep operation", () => {
    const document = utils.createDocument();
    const input = generateMock(DeleteProcessStepInputSchema());

    const updatedDocument = reducer(document, deleteProcessStep(input));

    expect(isAchraPresentationDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "DELETE_PROCESS_STEP",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });
  it("should handle reorderProcessSteps operation", () => {
    const document = utils.createDocument();
    const input = generateMock(ReorderProcessStepsInputSchema());

    const updatedDocument = reducer(document, reorderProcessSteps(input));

    expect(isAchraPresentationDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "REORDER_PROCESS_STEPS",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });
  it("should handle addAgendaItem operation", () => {
    const document = utils.createDocument();
    const input = generateMock(AddAgendaItemInputSchema());

    const updatedDocument = reducer(document, addAgendaItem(input));

    expect(isAchraPresentationDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "ADD_AGENDA_ITEM",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });
  it("should handle updateAgendaItem operation", () => {
    const document = utils.createDocument();
    const input = generateMock(UpdateAgendaItemInputSchema());

    const updatedDocument = reducer(document, updateAgendaItem(input));

    expect(isAchraPresentationDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "UPDATE_AGENDA_ITEM",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });
  it("should handle deleteAgendaItem operation", () => {
    const document = utils.createDocument();
    const input = generateMock(DeleteAgendaItemInputSchema());

    const updatedDocument = reducer(document, deleteAgendaItem(input));

    expect(isAchraPresentationDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "DELETE_AGENDA_ITEM",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });
  it("should handle reorderAgendaItems operation", () => {
    const document = utils.createDocument();
    const input = generateMock(ReorderAgendaItemsInputSchema());

    const updatedDocument = reducer(document, reorderAgendaItems(input));

    expect(isAchraPresentationDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "REORDER_AGENDA_ITEMS",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });
  it("should handle addMilestone operation", () => {
    const document = utils.createDocument();
    const input = generateMock(AddMilestoneInputSchema());

    const updatedDocument = reducer(document, addMilestone(input));

    expect(isAchraPresentationDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "ADD_MILESTONE",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });
  it("should handle updateMilestone operation", () => {
    const document = utils.createDocument();
    const input = generateMock(UpdateMilestoneInputSchema());

    const updatedDocument = reducer(document, updateMilestone(input));

    expect(isAchraPresentationDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "UPDATE_MILESTONE",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });
  it("should handle deleteMilestone operation", () => {
    const document = utils.createDocument();
    const input = generateMock(DeleteMilestoneInputSchema());

    const updatedDocument = reducer(document, deleteMilestone(input));

    expect(isAchraPresentationDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "DELETE_MILESTONE",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });
  it("should handle reorderMilestones operation", () => {
    const document = utils.createDocument();
    const input = generateMock(ReorderMilestonesInputSchema());

    const updatedDocument = reducer(document, reorderMilestones(input));

    expect(isAchraPresentationDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "REORDER_MILESTONES",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });
});
