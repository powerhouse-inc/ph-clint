import type { BaseSubgraph } from "@powerhousedao/reactor-api";
import { addFile } from "document-drive";
import { setName } from "document-model";
import {
  actions,
  achraPresentationDocumentType,
} from "@powerhousedao/agent-manager/document-models/achra-presentation";

import type {
  AchraPresentationDocument,
  SetPresentationInfoInput,
  AddSlideInput,
  DeleteSlideInput,
  DuplicateSlideInput,
  ReorderSlidesInput,
  SetSlideTemplateInput,
  UpdateSlideContentInput,
  AddLinkInput,
  UpdateLinkInput,
  DeleteLinkInput,
  ReorderLinksInput,
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
  AddTextItemInput,
  UpdateTextItemInput,
  DeleteTextItemInput,
  ReorderTextItemsInput,
  SetColumnTitleInput,
  AddColumnBulletInput,
  UpdateColumnBulletInput,
  DeleteColumnBulletInput,
  ReorderColumnBulletsInput,
  AddChecklistItemInput,
  UpdateChecklistItemInput,
  DeleteChecklistItemInput,
  ReorderChecklistItemsInput,
  AddIconListItemInput,
  UpdateIconListItemInput,
  DeleteIconListItemInput,
  ReorderIconListItemsInput,
  AddHighlightInput,
  UpdateHighlightInput,
  DeleteHighlightInput,
  ReorderHighlightsInput,
} from "@powerhousedao/agent-manager/document-models/achra-presentation";

export const getResolvers = (
  subgraph: BaseSubgraph,
): Record<string, unknown> => {
  const reactor = subgraph.reactor;

  return {
    Query: {
      AchraPresentation: async () => {
        return {
          getDocument: async (args: { docId: string; driveId: string }) => {
            const { docId, driveId } = args;

            if (!docId) {
              throw new Error("Document id is required");
            }

            if (driveId) {
              const docIds = await reactor.getDocuments(driveId);
              if (!docIds.includes(docId)) {
                throw new Error(
                  `Document with id ${docId} is not part of ${driveId}`,
                );
              }
            }

            const doc =
              await reactor.getDocument<AchraPresentationDocument>(docId);
            return {
              driveId: driveId,
              ...doc,
              ...doc.header,
              created: doc.header.createdAtUtcIso,
              lastModified: doc.header.lastModifiedAtUtcIso,
              state: doc.state.global,
              stateJSON: doc.state.global,
              revision: doc.header?.revision?.global ?? 0,
            };
          },
          getDocuments: async (args: { driveId: string }) => {
            const { driveId } = args;
            const docsIds = await reactor.getDocuments(driveId);
            const docs = await Promise.all(
              docsIds.map(async (docId) => {
                const doc =
                  await reactor.getDocument<AchraPresentationDocument>(docId);
                return {
                  driveId: driveId,
                  ...doc,
                  ...doc.header,
                  created: doc.header.createdAtUtcIso,
                  lastModified: doc.header.lastModifiedAtUtcIso,
                  state: doc.state.global,
                  stateJSON: doc.state.global,
                  revision: doc.header?.revision?.global ?? 0,
                };
              }),
            );

            return docs.filter(
              (doc) =>
                doc.header.documentType === achraPresentationDocumentType,
            );
          },
        };
      },
    },
    Mutation: {
      AchraPresentation_createDocument: async (
        _: unknown,
        args: { name: string; driveId?: string },
      ) => {
        const { driveId, name } = args;
        const document = await reactor.addDocument(
          achraPresentationDocumentType,
        );

        if (driveId) {
          await reactor.addAction(
            driveId,
            addFile({
              name,
              id: document.header.id,
              documentType: achraPresentationDocumentType,
            }),
          );
        }

        if (name) {
          await reactor.addAction(document.header.id, setName(name));
        }

        return document.header.id;
      },

      AchraPresentation_setPresentationInfo: async (
        _: unknown,
        args: { docId: string; input: SetPresentationInfoInput },
      ) => {
        const { docId, input } = args;
        const doc = await reactor.getDocument<AchraPresentationDocument>(docId);
        if (!doc) {
          throw new Error("Document not found");
        }

        const result = await reactor.addAction(
          docId,
          actions.setPresentationInfo(input),
        );

        if (result.status !== "SUCCESS") {
          throw new Error(
            result.error?.message ?? "Failed to setPresentationInfo",
          );
        }

        return true;
      },

      AchraPresentation_addSlide: async (
        _: unknown,
        args: { docId: string; input: AddSlideInput },
      ) => {
        const { docId, input } = args;
        const doc = await reactor.getDocument<AchraPresentationDocument>(docId);
        if (!doc) {
          throw new Error("Document not found");
        }

        const result = await reactor.addAction(docId, actions.addSlide(input));

        if (result.status !== "SUCCESS") {
          throw new Error(result.error?.message ?? "Failed to addSlide");
        }

        return true;
      },

      AchraPresentation_deleteSlide: async (
        _: unknown,
        args: { docId: string; input: DeleteSlideInput },
      ) => {
        const { docId, input } = args;
        const doc = await reactor.getDocument<AchraPresentationDocument>(docId);
        if (!doc) {
          throw new Error("Document not found");
        }

        const result = await reactor.addAction(
          docId,
          actions.deleteSlide(input),
        );

        if (result.status !== "SUCCESS") {
          throw new Error(result.error?.message ?? "Failed to deleteSlide");
        }

        return true;
      },

      AchraPresentation_duplicateSlide: async (
        _: unknown,
        args: { docId: string; input: DuplicateSlideInput },
      ) => {
        const { docId, input } = args;
        const doc = await reactor.getDocument<AchraPresentationDocument>(docId);
        if (!doc) {
          throw new Error("Document not found");
        }

        const result = await reactor.addAction(
          docId,
          actions.duplicateSlide(input),
        );

        if (result.status !== "SUCCESS") {
          throw new Error(result.error?.message ?? "Failed to duplicateSlide");
        }

        return true;
      },

      AchraPresentation_reorderSlides: async (
        _: unknown,
        args: { docId: string; input: ReorderSlidesInput },
      ) => {
        const { docId, input } = args;
        const doc = await reactor.getDocument<AchraPresentationDocument>(docId);
        if (!doc) {
          throw new Error("Document not found");
        }

        const result = await reactor.addAction(
          docId,
          actions.reorderSlides(input),
        );

        if (result.status !== "SUCCESS") {
          throw new Error(result.error?.message ?? "Failed to reorderSlides");
        }

        return true;
      },

      AchraPresentation_setSlideTemplate: async (
        _: unknown,
        args: { docId: string; input: SetSlideTemplateInput },
      ) => {
        const { docId, input } = args;
        const doc = await reactor.getDocument<AchraPresentationDocument>(docId);
        if (!doc) {
          throw new Error("Document not found");
        }

        const result = await reactor.addAction(
          docId,
          actions.setSlideTemplate(input),
        );

        if (result.status !== "SUCCESS") {
          throw new Error(
            result.error?.message ?? "Failed to setSlideTemplate",
          );
        }

        return true;
      },

      AchraPresentation_updateSlideContent: async (
        _: unknown,
        args: { docId: string; input: UpdateSlideContentInput },
      ) => {
        const { docId, input } = args;
        const doc = await reactor.getDocument<AchraPresentationDocument>(docId);
        if (!doc) {
          throw new Error("Document not found");
        }

        const result = await reactor.addAction(
          docId,
          actions.updateSlideContent(input),
        );

        if (result.status !== "SUCCESS") {
          throw new Error(
            result.error?.message ?? "Failed to updateSlideContent",
          );
        }

        return true;
      },

      AchraPresentation_addLink: async (
        _: unknown,
        args: { docId: string; input: AddLinkInput },
      ) => {
        const { docId, input } = args;
        const doc = await reactor.getDocument<AchraPresentationDocument>(docId);
        if (!doc) {
          throw new Error("Document not found");
        }

        const result = await reactor.addAction(docId, actions.addLink(input));

        if (result.status !== "SUCCESS") {
          throw new Error(result.error?.message ?? "Failed to addLink");
        }

        return true;
      },

      AchraPresentation_updateLink: async (
        _: unknown,
        args: { docId: string; input: UpdateLinkInput },
      ) => {
        const { docId, input } = args;
        const doc = await reactor.getDocument<AchraPresentationDocument>(docId);
        if (!doc) {
          throw new Error("Document not found");
        }

        const result = await reactor.addAction(
          docId,
          actions.updateLink(input),
        );

        if (result.status !== "SUCCESS") {
          throw new Error(result.error?.message ?? "Failed to updateLink");
        }

        return true;
      },

      AchraPresentation_deleteLink: async (
        _: unknown,
        args: { docId: string; input: DeleteLinkInput },
      ) => {
        const { docId, input } = args;
        const doc = await reactor.getDocument<AchraPresentationDocument>(docId);
        if (!doc) {
          throw new Error("Document not found");
        }

        const result = await reactor.addAction(
          docId,
          actions.deleteLink(input),
        );

        if (result.status !== "SUCCESS") {
          throw new Error(result.error?.message ?? "Failed to deleteLink");
        }

        return true;
      },

      AchraPresentation_reorderLinks: async (
        _: unknown,
        args: { docId: string; input: ReorderLinksInput },
      ) => {
        const { docId, input } = args;
        const doc = await reactor.getDocument<AchraPresentationDocument>(docId);
        if (!doc) {
          throw new Error("Document not found");
        }

        const result = await reactor.addAction(
          docId,
          actions.reorderLinks(input),
        );

        if (result.status !== "SUCCESS") {
          throw new Error(result.error?.message ?? "Failed to reorderLinks");
        }

        return true;
      },

      AchraPresentation_addProcessStep: async (
        _: unknown,
        args: { docId: string; input: AddProcessStepInput },
      ) => {
        const { docId, input } = args;
        const doc = await reactor.getDocument<AchraPresentationDocument>(docId);
        if (!doc) {
          throw new Error("Document not found");
        }

        const result = await reactor.addAction(
          docId,
          actions.addProcessStep(input),
        );

        if (result.status !== "SUCCESS") {
          throw new Error(result.error?.message ?? "Failed to addProcessStep");
        }

        return true;
      },

      AchraPresentation_updateProcessStep: async (
        _: unknown,
        args: { docId: string; input: UpdateProcessStepInput },
      ) => {
        const { docId, input } = args;
        const doc = await reactor.getDocument<AchraPresentationDocument>(docId);
        if (!doc) {
          throw new Error("Document not found");
        }

        const result = await reactor.addAction(
          docId,
          actions.updateProcessStep(input),
        );

        if (result.status !== "SUCCESS") {
          throw new Error(
            result.error?.message ?? "Failed to updateProcessStep",
          );
        }

        return true;
      },

      AchraPresentation_deleteProcessStep: async (
        _: unknown,
        args: { docId: string; input: DeleteProcessStepInput },
      ) => {
        const { docId, input } = args;
        const doc = await reactor.getDocument<AchraPresentationDocument>(docId);
        if (!doc) {
          throw new Error("Document not found");
        }

        const result = await reactor.addAction(
          docId,
          actions.deleteProcessStep(input),
        );

        if (result.status !== "SUCCESS") {
          throw new Error(
            result.error?.message ?? "Failed to deleteProcessStep",
          );
        }

        return true;
      },

      AchraPresentation_reorderProcessSteps: async (
        _: unknown,
        args: { docId: string; input: ReorderProcessStepsInput },
      ) => {
        const { docId, input } = args;
        const doc = await reactor.getDocument<AchraPresentationDocument>(docId);
        if (!doc) {
          throw new Error("Document not found");
        }

        const result = await reactor.addAction(
          docId,
          actions.reorderProcessSteps(input),
        );

        if (result.status !== "SUCCESS") {
          throw new Error(
            result.error?.message ?? "Failed to reorderProcessSteps",
          );
        }

        return true;
      },

      AchraPresentation_addAgendaItem: async (
        _: unknown,
        args: { docId: string; input: AddAgendaItemInput },
      ) => {
        const { docId, input } = args;
        const doc = await reactor.getDocument<AchraPresentationDocument>(docId);
        if (!doc) {
          throw new Error("Document not found");
        }

        const result = await reactor.addAction(
          docId,
          actions.addAgendaItem(input),
        );

        if (result.status !== "SUCCESS") {
          throw new Error(result.error?.message ?? "Failed to addAgendaItem");
        }

        return true;
      },

      AchraPresentation_updateAgendaItem: async (
        _: unknown,
        args: { docId: string; input: UpdateAgendaItemInput },
      ) => {
        const { docId, input } = args;
        const doc = await reactor.getDocument<AchraPresentationDocument>(docId);
        if (!doc) {
          throw new Error("Document not found");
        }

        const result = await reactor.addAction(
          docId,
          actions.updateAgendaItem(input),
        );

        if (result.status !== "SUCCESS") {
          throw new Error(
            result.error?.message ?? "Failed to updateAgendaItem",
          );
        }

        return true;
      },

      AchraPresentation_deleteAgendaItem: async (
        _: unknown,
        args: { docId: string; input: DeleteAgendaItemInput },
      ) => {
        const { docId, input } = args;
        const doc = await reactor.getDocument<AchraPresentationDocument>(docId);
        if (!doc) {
          throw new Error("Document not found");
        }

        const result = await reactor.addAction(
          docId,
          actions.deleteAgendaItem(input),
        );

        if (result.status !== "SUCCESS") {
          throw new Error(
            result.error?.message ?? "Failed to deleteAgendaItem",
          );
        }

        return true;
      },

      AchraPresentation_reorderAgendaItems: async (
        _: unknown,
        args: { docId: string; input: ReorderAgendaItemsInput },
      ) => {
        const { docId, input } = args;
        const doc = await reactor.getDocument<AchraPresentationDocument>(docId);
        if (!doc) {
          throw new Error("Document not found");
        }

        const result = await reactor.addAction(
          docId,
          actions.reorderAgendaItems(input),
        );

        if (result.status !== "SUCCESS") {
          throw new Error(
            result.error?.message ?? "Failed to reorderAgendaItems",
          );
        }

        return true;
      },

      AchraPresentation_addMilestone: async (
        _: unknown,
        args: { docId: string; input: AddMilestoneInput },
      ) => {
        const { docId, input } = args;
        const doc = await reactor.getDocument<AchraPresentationDocument>(docId);
        if (!doc) {
          throw new Error("Document not found");
        }

        const result = await reactor.addAction(
          docId,
          actions.addMilestone(input),
        );

        if (result.status !== "SUCCESS") {
          throw new Error(result.error?.message ?? "Failed to addMilestone");
        }

        return true;
      },

      AchraPresentation_updateMilestone: async (
        _: unknown,
        args: { docId: string; input: UpdateMilestoneInput },
      ) => {
        const { docId, input } = args;
        const doc = await reactor.getDocument<AchraPresentationDocument>(docId);
        if (!doc) {
          throw new Error("Document not found");
        }

        const result = await reactor.addAction(
          docId,
          actions.updateMilestone(input),
        );

        if (result.status !== "SUCCESS") {
          throw new Error(result.error?.message ?? "Failed to updateMilestone");
        }

        return true;
      },

      AchraPresentation_deleteMilestone: async (
        _: unknown,
        args: { docId: string; input: DeleteMilestoneInput },
      ) => {
        const { docId, input } = args;
        const doc = await reactor.getDocument<AchraPresentationDocument>(docId);
        if (!doc) {
          throw new Error("Document not found");
        }

        const result = await reactor.addAction(
          docId,
          actions.deleteMilestone(input),
        );

        if (result.status !== "SUCCESS") {
          throw new Error(result.error?.message ?? "Failed to deleteMilestone");
        }

        return true;
      },

      AchraPresentation_reorderMilestones: async (
        _: unknown,
        args: { docId: string; input: ReorderMilestonesInput },
      ) => {
        const { docId, input } = args;
        const doc = await reactor.getDocument<AchraPresentationDocument>(docId);
        if (!doc) {
          throw new Error("Document not found");
        }

        const result = await reactor.addAction(
          docId,
          actions.reorderMilestones(input),
        );

        if (result.status !== "SUCCESS") {
          throw new Error(
            result.error?.message ?? "Failed to reorderMilestones",
          );
        }

        return true;
      },

      AchraPresentation_addTextItem: async (
        _: unknown,
        args: { docId: string; input: AddTextItemInput },
      ) => {
        const { docId, input } = args;
        const doc = await reactor.getDocument<AchraPresentationDocument>(docId);
        if (!doc) {
          throw new Error("Document not found");
        }

        const result = await reactor.addAction(
          docId,
          actions.addTextItem(input),
        );

        if (result.status !== "SUCCESS") {
          throw new Error(result.error?.message ?? "Failed to addTextItem");
        }

        return true;
      },

      AchraPresentation_updateTextItem: async (
        _: unknown,
        args: { docId: string; input: UpdateTextItemInput },
      ) => {
        const { docId, input } = args;
        const doc = await reactor.getDocument<AchraPresentationDocument>(docId);
        if (!doc) {
          throw new Error("Document not found");
        }

        const result = await reactor.addAction(
          docId,
          actions.updateTextItem(input),
        );

        if (result.status !== "SUCCESS") {
          throw new Error(result.error?.message ?? "Failed to updateTextItem");
        }

        return true;
      },

      AchraPresentation_deleteTextItem: async (
        _: unknown,
        args: { docId: string; input: DeleteTextItemInput },
      ) => {
        const { docId, input } = args;
        const doc = await reactor.getDocument<AchraPresentationDocument>(docId);
        if (!doc) {
          throw new Error("Document not found");
        }

        const result = await reactor.addAction(
          docId,
          actions.deleteTextItem(input),
        );

        if (result.status !== "SUCCESS") {
          throw new Error(result.error?.message ?? "Failed to deleteTextItem");
        }

        return true;
      },

      AchraPresentation_reorderTextItems: async (
        _: unknown,
        args: { docId: string; input: ReorderTextItemsInput },
      ) => {
        const { docId, input } = args;
        const doc = await reactor.getDocument<AchraPresentationDocument>(docId);
        if (!doc) {
          throw new Error("Document not found");
        }

        const result = await reactor.addAction(
          docId,
          actions.reorderTextItems(input),
        );

        if (result.status !== "SUCCESS") {
          throw new Error(
            result.error?.message ?? "Failed to reorderTextItems",
          );
        }

        return true;
      },

      AchraPresentation_setColumnTitle: async (
        _: unknown,
        args: { docId: string; input: SetColumnTitleInput },
      ) => {
        const { docId, input } = args;
        const doc = await reactor.getDocument<AchraPresentationDocument>(docId);
        if (!doc) {
          throw new Error("Document not found");
        }

        const result = await reactor.addAction(
          docId,
          actions.setColumnTitle(input),
        );

        if (result.status !== "SUCCESS") {
          throw new Error(result.error?.message ?? "Failed to setColumnTitle");
        }

        return true;
      },

      AchraPresentation_addColumnBullet: async (
        _: unknown,
        args: { docId: string; input: AddColumnBulletInput },
      ) => {
        const { docId, input } = args;
        const doc = await reactor.getDocument<AchraPresentationDocument>(docId);
        if (!doc) {
          throw new Error("Document not found");
        }

        const result = await reactor.addAction(
          docId,
          actions.addColumnBullet(input),
        );

        if (result.status !== "SUCCESS") {
          throw new Error(result.error?.message ?? "Failed to addColumnBullet");
        }

        return true;
      },

      AchraPresentation_updateColumnBullet: async (
        _: unknown,
        args: { docId: string; input: UpdateColumnBulletInput },
      ) => {
        const { docId, input } = args;
        const doc = await reactor.getDocument<AchraPresentationDocument>(docId);
        if (!doc) {
          throw new Error("Document not found");
        }

        const result = await reactor.addAction(
          docId,
          actions.updateColumnBullet(input),
        );

        if (result.status !== "SUCCESS") {
          throw new Error(
            result.error?.message ?? "Failed to updateColumnBullet",
          );
        }

        return true;
      },

      AchraPresentation_deleteColumnBullet: async (
        _: unknown,
        args: { docId: string; input: DeleteColumnBulletInput },
      ) => {
        const { docId, input } = args;
        const doc = await reactor.getDocument<AchraPresentationDocument>(docId);
        if (!doc) {
          throw new Error("Document not found");
        }

        const result = await reactor.addAction(
          docId,
          actions.deleteColumnBullet(input),
        );

        if (result.status !== "SUCCESS") {
          throw new Error(
            result.error?.message ?? "Failed to deleteColumnBullet",
          );
        }

        return true;
      },

      AchraPresentation_reorderColumnBullets: async (
        _: unknown,
        args: { docId: string; input: ReorderColumnBulletsInput },
      ) => {
        const { docId, input } = args;
        const doc = await reactor.getDocument<AchraPresentationDocument>(docId);
        if (!doc) {
          throw new Error("Document not found");
        }

        const result = await reactor.addAction(
          docId,
          actions.reorderColumnBullets(input),
        );

        if (result.status !== "SUCCESS") {
          throw new Error(
            result.error?.message ?? "Failed to reorderColumnBullets",
          );
        }

        return true;
      },

      AchraPresentation_addChecklistItem: async (
        _: unknown,
        args: { docId: string; input: AddChecklistItemInput },
      ) => {
        const { docId, input } = args;
        const doc = await reactor.getDocument<AchraPresentationDocument>(docId);
        if (!doc) {
          throw new Error("Document not found");
        }

        const result = await reactor.addAction(
          docId,
          actions.addChecklistItem(input),
        );

        if (result.status !== "SUCCESS") {
          throw new Error(
            result.error?.message ?? "Failed to addChecklistItem",
          );
        }

        return true;
      },

      AchraPresentation_updateChecklistItem: async (
        _: unknown,
        args: { docId: string; input: UpdateChecklistItemInput },
      ) => {
        const { docId, input } = args;
        const doc = await reactor.getDocument<AchraPresentationDocument>(docId);
        if (!doc) {
          throw new Error("Document not found");
        }

        const result = await reactor.addAction(
          docId,
          actions.updateChecklistItem(input),
        );

        if (result.status !== "SUCCESS") {
          throw new Error(
            result.error?.message ?? "Failed to updateChecklistItem",
          );
        }

        return true;
      },

      AchraPresentation_deleteChecklistItem: async (
        _: unknown,
        args: { docId: string; input: DeleteChecklistItemInput },
      ) => {
        const { docId, input } = args;
        const doc = await reactor.getDocument<AchraPresentationDocument>(docId);
        if (!doc) {
          throw new Error("Document not found");
        }

        const result = await reactor.addAction(
          docId,
          actions.deleteChecklistItem(input),
        );

        if (result.status !== "SUCCESS") {
          throw new Error(
            result.error?.message ?? "Failed to deleteChecklistItem",
          );
        }

        return true;
      },

      AchraPresentation_reorderChecklistItems: async (
        _: unknown,
        args: { docId: string; input: ReorderChecklistItemsInput },
      ) => {
        const { docId, input } = args;
        const doc = await reactor.getDocument<AchraPresentationDocument>(docId);
        if (!doc) {
          throw new Error("Document not found");
        }

        const result = await reactor.addAction(
          docId,
          actions.reorderChecklistItems(input),
        );

        if (result.status !== "SUCCESS") {
          throw new Error(
            result.error?.message ?? "Failed to reorderChecklistItems",
          );
        }

        return true;
      },

      AchraPresentation_addIconListItem: async (
        _: unknown,
        args: { docId: string; input: AddIconListItemInput },
      ) => {
        const { docId, input } = args;
        const doc = await reactor.getDocument<AchraPresentationDocument>(docId);
        if (!doc) {
          throw new Error("Document not found");
        }

        const result = await reactor.addAction(
          docId,
          actions.addIconListItem(input),
        );

        if (result.status !== "SUCCESS") {
          throw new Error(result.error?.message ?? "Failed to addIconListItem");
        }

        return true;
      },

      AchraPresentation_updateIconListItem: async (
        _: unknown,
        args: { docId: string; input: UpdateIconListItemInput },
      ) => {
        const { docId, input } = args;
        const doc = await reactor.getDocument<AchraPresentationDocument>(docId);
        if (!doc) {
          throw new Error("Document not found");
        }

        const result = await reactor.addAction(
          docId,
          actions.updateIconListItem(input),
        );

        if (result.status !== "SUCCESS") {
          throw new Error(
            result.error?.message ?? "Failed to updateIconListItem",
          );
        }

        return true;
      },

      AchraPresentation_deleteIconListItem: async (
        _: unknown,
        args: { docId: string; input: DeleteIconListItemInput },
      ) => {
        const { docId, input } = args;
        const doc = await reactor.getDocument<AchraPresentationDocument>(docId);
        if (!doc) {
          throw new Error("Document not found");
        }

        const result = await reactor.addAction(
          docId,
          actions.deleteIconListItem(input),
        );

        if (result.status !== "SUCCESS") {
          throw new Error(
            result.error?.message ?? "Failed to deleteIconListItem",
          );
        }

        return true;
      },

      AchraPresentation_reorderIconListItems: async (
        _: unknown,
        args: { docId: string; input: ReorderIconListItemsInput },
      ) => {
        const { docId, input } = args;
        const doc = await reactor.getDocument<AchraPresentationDocument>(docId);
        if (!doc) {
          throw new Error("Document not found");
        }

        const result = await reactor.addAction(
          docId,
          actions.reorderIconListItems(input),
        );

        if (result.status !== "SUCCESS") {
          throw new Error(
            result.error?.message ?? "Failed to reorderIconListItems",
          );
        }

        return true;
      },

      AchraPresentation_addHighlight: async (
        _: unknown,
        args: { docId: string; input: AddHighlightInput },
      ) => {
        const { docId, input } = args;
        const doc = await reactor.getDocument<AchraPresentationDocument>(docId);
        if (!doc) {
          throw new Error("Document not found");
        }

        const result = await reactor.addAction(
          docId,
          actions.addHighlight(input),
        );

        if (result.status !== "SUCCESS") {
          throw new Error(result.error?.message ?? "Failed to addHighlight");
        }

        return true;
      },

      AchraPresentation_updateHighlight: async (
        _: unknown,
        args: { docId: string; input: UpdateHighlightInput },
      ) => {
        const { docId, input } = args;
        const doc = await reactor.getDocument<AchraPresentationDocument>(docId);
        if (!doc) {
          throw new Error("Document not found");
        }

        const result = await reactor.addAction(
          docId,
          actions.updateHighlight(input),
        );

        if (result.status !== "SUCCESS") {
          throw new Error(result.error?.message ?? "Failed to updateHighlight");
        }

        return true;
      },

      AchraPresentation_deleteHighlight: async (
        _: unknown,
        args: { docId: string; input: DeleteHighlightInput },
      ) => {
        const { docId, input } = args;
        const doc = await reactor.getDocument<AchraPresentationDocument>(docId);
        if (!doc) {
          throw new Error("Document not found");
        }

        const result = await reactor.addAction(
          docId,
          actions.deleteHighlight(input),
        );

        if (result.status !== "SUCCESS") {
          throw new Error(result.error?.message ?? "Failed to deleteHighlight");
        }

        return true;
      },

      AchraPresentation_reorderHighlights: async (
        _: unknown,
        args: { docId: string; input: ReorderHighlightsInput },
      ) => {
        const { docId, input } = args;
        const doc = await reactor.getDocument<AchraPresentationDocument>(docId);
        if (!doc) {
          throw new Error("Document not found");
        }

        const result = await reactor.addAction(
          docId,
          actions.reorderHighlights(input),
        );

        if (result.status !== "SUCCESS") {
          throw new Error(
            result.error?.message ?? "Failed to reorderHighlights",
          );
        }

        return true;
      },
    },
  };
};
