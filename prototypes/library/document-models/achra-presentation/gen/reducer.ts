// TODO: remove eslint-disable rules once refactor is done
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import type { StateReducer } from "document-model";
import { isDocumentAction, createReducer } from "document-model/core";
import type { AchraPresentationPHState } from "@powerhousedao/agent-manager/document-models/achra-presentation";

import { achraPresentationCoreOperations } from "../src/reducers/core.js";
import { achraPresentationTitleBrandingOperations } from "../src/reducers/title-branding.js";
import { achraPresentationStructureFlowOperations } from "../src/reducers/structure-flow.js";
import { achraPresentationTextListsOperations } from "../src/reducers/text-lists.js";

import {
  SetPresentationInfoInputSchema,
  AddSlideInputSchema,
  DeleteSlideInputSchema,
  DuplicateSlideInputSchema,
  ReorderSlidesInputSchema,
  SetSlideTemplateInputSchema,
  UpdateSlideContentInputSchema,
  AddLinkInputSchema,
  UpdateLinkInputSchema,
  DeleteLinkInputSchema,
  ReorderLinksInputSchema,
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
  AddTextItemInputSchema,
  UpdateTextItemInputSchema,
  DeleteTextItemInputSchema,
  ReorderTextItemsInputSchema,
  SetColumnTitleInputSchema,
  AddColumnBulletInputSchema,
  UpdateColumnBulletInputSchema,
  DeleteColumnBulletInputSchema,
  ReorderColumnBulletsInputSchema,
  AddChecklistItemInputSchema,
  UpdateChecklistItemInputSchema,
  DeleteChecklistItemInputSchema,
  ReorderChecklistItemsInputSchema,
  AddIconListItemInputSchema,
  UpdateIconListItemInputSchema,
  DeleteIconListItemInputSchema,
  ReorderIconListItemsInputSchema,
  AddHighlightInputSchema,
  UpdateHighlightInputSchema,
  DeleteHighlightInputSchema,
  ReorderHighlightsInputSchema,
} from "./schema/zod.js";

const stateReducer: StateReducer<AchraPresentationPHState> = (
  state,
  action,
  dispatch,
) => {
  if (isDocumentAction(action)) {
    return state;
  }

  switch (action.type) {
    case "SET_PRESENTATION_INFO":
      SetPresentationInfoInputSchema().parse(action.input);
      achraPresentationCoreOperations.setPresentationInfoOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );
      break;

    case "ADD_SLIDE":
      AddSlideInputSchema().parse(action.input);
      achraPresentationCoreOperations.addSlideOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );
      break;

    case "DELETE_SLIDE":
      DeleteSlideInputSchema().parse(action.input);
      achraPresentationCoreOperations.deleteSlideOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );
      break;

    case "DUPLICATE_SLIDE":
      DuplicateSlideInputSchema().parse(action.input);
      achraPresentationCoreOperations.duplicateSlideOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );
      break;

    case "REORDER_SLIDES":
      ReorderSlidesInputSchema().parse(action.input);
      achraPresentationCoreOperations.reorderSlidesOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );
      break;

    case "SET_SLIDE_TEMPLATE":
      SetSlideTemplateInputSchema().parse(action.input);
      achraPresentationCoreOperations.setSlideTemplateOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );
      break;

    case "UPDATE_SLIDE_CONTENT":
      UpdateSlideContentInputSchema().parse(action.input);
      achraPresentationCoreOperations.updateSlideContentOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );
      break;

    case "ADD_LINK":
      AddLinkInputSchema().parse(action.input);
      achraPresentationTitleBrandingOperations.addLinkOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );
      break;

    case "UPDATE_LINK":
      UpdateLinkInputSchema().parse(action.input);
      achraPresentationTitleBrandingOperations.updateLinkOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );
      break;

    case "DELETE_LINK":
      DeleteLinkInputSchema().parse(action.input);
      achraPresentationTitleBrandingOperations.deleteLinkOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );
      break;

    case "REORDER_LINKS":
      ReorderLinksInputSchema().parse(action.input);
      achraPresentationTitleBrandingOperations.reorderLinksOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );
      break;

    case "ADD_PROCESS_STEP":
      AddProcessStepInputSchema().parse(action.input);
      achraPresentationStructureFlowOperations.addProcessStepOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );
      break;

    case "UPDATE_PROCESS_STEP":
      UpdateProcessStepInputSchema().parse(action.input);
      achraPresentationStructureFlowOperations.updateProcessStepOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );
      break;

    case "DELETE_PROCESS_STEP":
      DeleteProcessStepInputSchema().parse(action.input);
      achraPresentationStructureFlowOperations.deleteProcessStepOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );
      break;

    case "REORDER_PROCESS_STEPS":
      ReorderProcessStepsInputSchema().parse(action.input);
      achraPresentationStructureFlowOperations.reorderProcessStepsOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );
      break;

    case "ADD_AGENDA_ITEM":
      AddAgendaItemInputSchema().parse(action.input);
      achraPresentationStructureFlowOperations.addAgendaItemOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );
      break;

    case "UPDATE_AGENDA_ITEM":
      UpdateAgendaItemInputSchema().parse(action.input);
      achraPresentationStructureFlowOperations.updateAgendaItemOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );
      break;

    case "DELETE_AGENDA_ITEM":
      DeleteAgendaItemInputSchema().parse(action.input);
      achraPresentationStructureFlowOperations.deleteAgendaItemOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );
      break;

    case "REORDER_AGENDA_ITEMS":
      ReorderAgendaItemsInputSchema().parse(action.input);
      achraPresentationStructureFlowOperations.reorderAgendaItemsOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );
      break;

    case "ADD_MILESTONE":
      AddMilestoneInputSchema().parse(action.input);
      achraPresentationStructureFlowOperations.addMilestoneOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );
      break;

    case "UPDATE_MILESTONE":
      UpdateMilestoneInputSchema().parse(action.input);
      achraPresentationStructureFlowOperations.updateMilestoneOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );
      break;

    case "DELETE_MILESTONE":
      DeleteMilestoneInputSchema().parse(action.input);
      achraPresentationStructureFlowOperations.deleteMilestoneOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );
      break;

    case "REORDER_MILESTONES":
      ReorderMilestonesInputSchema().parse(action.input);
      achraPresentationStructureFlowOperations.reorderMilestonesOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );
      break;

    case "ADD_TEXT_ITEM":
      AddTextItemInputSchema().parse(action.input);
      achraPresentationTextListsOperations.addTextItemOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );
      break;

    case "UPDATE_TEXT_ITEM":
      UpdateTextItemInputSchema().parse(action.input);
      achraPresentationTextListsOperations.updateTextItemOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );
      break;

    case "DELETE_TEXT_ITEM":
      DeleteTextItemInputSchema().parse(action.input);
      achraPresentationTextListsOperations.deleteTextItemOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );
      break;

    case "REORDER_TEXT_ITEMS":
      ReorderTextItemsInputSchema().parse(action.input);
      achraPresentationTextListsOperations.reorderTextItemsOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );
      break;

    case "SET_COLUMN_TITLE":
      SetColumnTitleInputSchema().parse(action.input);
      achraPresentationTextListsOperations.setColumnTitleOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );
      break;

    case "ADD_COLUMN_BULLET":
      AddColumnBulletInputSchema().parse(action.input);
      achraPresentationTextListsOperations.addColumnBulletOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );
      break;

    case "UPDATE_COLUMN_BULLET":
      UpdateColumnBulletInputSchema().parse(action.input);
      achraPresentationTextListsOperations.updateColumnBulletOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );
      break;

    case "DELETE_COLUMN_BULLET":
      DeleteColumnBulletInputSchema().parse(action.input);
      achraPresentationTextListsOperations.deleteColumnBulletOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );
      break;

    case "REORDER_COLUMN_BULLETS":
      ReorderColumnBulletsInputSchema().parse(action.input);
      achraPresentationTextListsOperations.reorderColumnBulletsOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );
      break;

    case "ADD_CHECKLIST_ITEM":
      AddChecklistItemInputSchema().parse(action.input);
      achraPresentationTextListsOperations.addChecklistItemOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );
      break;

    case "UPDATE_CHECKLIST_ITEM":
      UpdateChecklistItemInputSchema().parse(action.input);
      achraPresentationTextListsOperations.updateChecklistItemOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );
      break;

    case "DELETE_CHECKLIST_ITEM":
      DeleteChecklistItemInputSchema().parse(action.input);
      achraPresentationTextListsOperations.deleteChecklistItemOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );
      break;

    case "REORDER_CHECKLIST_ITEMS":
      ReorderChecklistItemsInputSchema().parse(action.input);
      achraPresentationTextListsOperations.reorderChecklistItemsOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );
      break;

    case "ADD_ICON_LIST_ITEM":
      AddIconListItemInputSchema().parse(action.input);
      achraPresentationTextListsOperations.addIconListItemOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );
      break;

    case "UPDATE_ICON_LIST_ITEM":
      UpdateIconListItemInputSchema().parse(action.input);
      achraPresentationTextListsOperations.updateIconListItemOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );
      break;

    case "DELETE_ICON_LIST_ITEM":
      DeleteIconListItemInputSchema().parse(action.input);
      achraPresentationTextListsOperations.deleteIconListItemOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );
      break;

    case "REORDER_ICON_LIST_ITEMS":
      ReorderIconListItemsInputSchema().parse(action.input);
      achraPresentationTextListsOperations.reorderIconListItemsOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );
      break;

    case "ADD_HIGHLIGHT":
      AddHighlightInputSchema().parse(action.input);
      achraPresentationTextListsOperations.addHighlightOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );
      break;

    case "UPDATE_HIGHLIGHT":
      UpdateHighlightInputSchema().parse(action.input);
      achraPresentationTextListsOperations.updateHighlightOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );
      break;

    case "DELETE_HIGHLIGHT":
      DeleteHighlightInputSchema().parse(action.input);
      achraPresentationTextListsOperations.deleteHighlightOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );
      break;

    case "REORDER_HIGHLIGHTS":
      ReorderHighlightsInputSchema().parse(action.input);
      achraPresentationTextListsOperations.reorderHighlightsOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );
      break;

    default:
      return state;
  }
};

export const reducer = createReducer<AchraPresentationPHState>(stateReducer);
