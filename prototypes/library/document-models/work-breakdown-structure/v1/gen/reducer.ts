// TODO: remove eslint-disable rules once refactor is done
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import type { StateReducer } from "document-model";
import { isDocumentAction, createReducer } from "document-model/core";
import type { WorkBreakdownStructurePHState } from "@powerhousedao/agent-manager/document-models/work-breakdown-structure/v1";

import { workBreakdownStructureDocumentationOperations } from "../src/reducers/documentation.js";
import { workBreakdownStructureHierarchyOperations } from "../src/reducers/hierarchy.js";
import { workBreakdownStructureWorkflowOperations } from "../src/reducers/workflow.js";
import { workBreakdownStructureMetadataOperations } from "../src/reducers/metadata.js";

import {
  UpdateDescriptionInputSchema,
  UpdateInstructionsInputSchema,
  AddNoteInputSchema,
  ClearInstructionsInputSchema,
  ClearNotesInputSchema,
  RemoveNoteInputSchema,
  MarkAsDraftInputSchema,
  MarkAsReadyInputSchema,
  SetOwnerInputSchema,
  ReorderInputSchema,
  AddDependenciesInputSchema,
  RemoveDependenciesInputSchema,
  CreateGoalInputSchema,
  DelegateGoalInputSchema,
  ReportOnGoalInputSchema,
  MarkInProgressInputSchema,
  MarkCompletedInputSchema,
  MarkTodoInputSchema,
  ReportBlockedInputSchema,
  UnblockGoalInputSchema,
  MarkWontDoInputSchema,
  SetReferencesInputSchema,
  SetMetaDataInputSchema,
} from "./schema/zod.js";

const stateReducer: StateReducer<WorkBreakdownStructurePHState> = (
  state,
  action,
  dispatch,
) => {
  if (isDocumentAction(action)) {
    return state;
  }
  switch (action.type) {
    case "UPDATE_DESCRIPTION": {
      UpdateDescriptionInputSchema().parse(action.input);

      workBreakdownStructureDocumentationOperations.updateDescriptionOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "UPDATE_INSTRUCTIONS": {
      UpdateInstructionsInputSchema().parse(action.input);

      workBreakdownStructureDocumentationOperations.updateInstructionsOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "ADD_NOTE": {
      AddNoteInputSchema().parse(action.input);

      workBreakdownStructureDocumentationOperations.addNoteOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "CLEAR_INSTRUCTIONS": {
      ClearInstructionsInputSchema().parse(action.input);

      workBreakdownStructureDocumentationOperations.clearInstructionsOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "CLEAR_NOTES": {
      ClearNotesInputSchema().parse(action.input);

      workBreakdownStructureDocumentationOperations.clearNotesOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "REMOVE_NOTE": {
      RemoveNoteInputSchema().parse(action.input);

      workBreakdownStructureDocumentationOperations.removeNoteOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "MARK_AS_DRAFT": {
      MarkAsDraftInputSchema().parse(action.input);

      workBreakdownStructureDocumentationOperations.markAsDraftOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "MARK_AS_READY": {
      MarkAsReadyInputSchema().parse(action.input);

      workBreakdownStructureDocumentationOperations.markAsReadyOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "SET_OWNER": {
      SetOwnerInputSchema().parse(action.input);

      workBreakdownStructureDocumentationOperations.setOwnerOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "REORDER": {
      ReorderInputSchema().parse(action.input);

      workBreakdownStructureHierarchyOperations.reorderOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "ADD_DEPENDENCIES": {
      AddDependenciesInputSchema().parse(action.input);

      workBreakdownStructureHierarchyOperations.addDependenciesOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "REMOVE_DEPENDENCIES": {
      RemoveDependenciesInputSchema().parse(action.input);

      workBreakdownStructureHierarchyOperations.removeDependenciesOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "CREATE_GOAL": {
      CreateGoalInputSchema().parse(action.input);

      workBreakdownStructureWorkflowOperations.createGoalOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "DELEGATE_GOAL": {
      DelegateGoalInputSchema().parse(action.input);

      workBreakdownStructureWorkflowOperations.delegateGoalOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "REPORT_ON_GOAL": {
      ReportOnGoalInputSchema().parse(action.input);

      workBreakdownStructureWorkflowOperations.reportOnGoalOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "MARK_IN_PROGRESS": {
      MarkInProgressInputSchema().parse(action.input);

      workBreakdownStructureWorkflowOperations.markInProgressOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "MARK_COMPLETED": {
      MarkCompletedInputSchema().parse(action.input);

      workBreakdownStructureWorkflowOperations.markCompletedOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "MARK_TODO": {
      MarkTodoInputSchema().parse(action.input);

      workBreakdownStructureWorkflowOperations.markTodoOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "REPORT_BLOCKED": {
      ReportBlockedInputSchema().parse(action.input);

      workBreakdownStructureWorkflowOperations.reportBlockedOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "UNBLOCK_GOAL": {
      UnblockGoalInputSchema().parse(action.input);

      workBreakdownStructureWorkflowOperations.unblockGoalOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "MARK_WONT_DO": {
      MarkWontDoInputSchema().parse(action.input);

      workBreakdownStructureWorkflowOperations.markWontDoOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "SET_REFERENCES": {
      SetReferencesInputSchema().parse(action.input);

      workBreakdownStructureMetadataOperations.setReferencesOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "SET_META_DATA": {
      SetMetaDataInputSchema().parse(action.input);

      workBreakdownStructureMetadataOperations.setMetaDataOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    default:
      return state;
  }
};

export const reducer =
  createReducer<WorkBreakdownStructurePHState>(stateReducer);
