import { gql } from "graphql-tag";
import type { DocumentNode } from "graphql";

export const schema: DocumentNode = gql`
  """
  Queries: AchraPresentation Document
  """
  type AchraPresentationQueries {
    getDocument(docId: PHID!, driveId: PHID): AchraPresentation
    getDocuments(driveId: String!): [AchraPresentation!]
  }

  type Query {
    AchraPresentation: AchraPresentationQueries
  }

  """
  Mutations: AchraPresentation
  """
  type Mutation {
    AchraPresentation_createDocument(name: String!, driveId: String): String

    AchraPresentation_setPresentationInfo(
      driveId: String
      docId: PHID
      input: AchraPresentation_SetPresentationInfoInput
    ): Int
    AchraPresentation_addSlide(
      driveId: String
      docId: PHID
      input: AchraPresentation_AddSlideInput
    ): Int
    AchraPresentation_deleteSlide(
      driveId: String
      docId: PHID
      input: AchraPresentation_DeleteSlideInput
    ): Int
    AchraPresentation_duplicateSlide(
      driveId: String
      docId: PHID
      input: AchraPresentation_DuplicateSlideInput
    ): Int
    AchraPresentation_reorderSlides(
      driveId: String
      docId: PHID
      input: AchraPresentation_ReorderSlidesInput
    ): Int
    AchraPresentation_setSlideTemplate(
      driveId: String
      docId: PHID
      input: AchraPresentation_SetSlideTemplateInput
    ): Int
    AchraPresentation_updateSlideContent(
      driveId: String
      docId: PHID
      input: AchraPresentation_UpdateSlideContentInput
    ): Int
    AchraPresentation_addLink(
      driveId: String
      docId: PHID
      input: AchraPresentation_AddLinkInput
    ): Int
    AchraPresentation_updateLink(
      driveId: String
      docId: PHID
      input: AchraPresentation_UpdateLinkInput
    ): Int
    AchraPresentation_deleteLink(
      driveId: String
      docId: PHID
      input: AchraPresentation_DeleteLinkInput
    ): Int
    AchraPresentation_reorderLinks(
      driveId: String
      docId: PHID
      input: AchraPresentation_ReorderLinksInput
    ): Int
    AchraPresentation_addProcessStep(
      driveId: String
      docId: PHID
      input: AchraPresentation_AddProcessStepInput
    ): Int
    AchraPresentation_updateProcessStep(
      driveId: String
      docId: PHID
      input: AchraPresentation_UpdateProcessStepInput
    ): Int
    AchraPresentation_deleteProcessStep(
      driveId: String
      docId: PHID
      input: AchraPresentation_DeleteProcessStepInput
    ): Int
    AchraPresentation_reorderProcessSteps(
      driveId: String
      docId: PHID
      input: AchraPresentation_ReorderProcessStepsInput
    ): Int
    AchraPresentation_addAgendaItem(
      driveId: String
      docId: PHID
      input: AchraPresentation_AddAgendaItemInput
    ): Int
    AchraPresentation_updateAgendaItem(
      driveId: String
      docId: PHID
      input: AchraPresentation_UpdateAgendaItemInput
    ): Int
    AchraPresentation_deleteAgendaItem(
      driveId: String
      docId: PHID
      input: AchraPresentation_DeleteAgendaItemInput
    ): Int
    AchraPresentation_reorderAgendaItems(
      driveId: String
      docId: PHID
      input: AchraPresentation_ReorderAgendaItemsInput
    ): Int
    AchraPresentation_addMilestone(
      driveId: String
      docId: PHID
      input: AchraPresentation_AddMilestoneInput
    ): Int
    AchraPresentation_updateMilestone(
      driveId: String
      docId: PHID
      input: AchraPresentation_UpdateMilestoneInput
    ): Int
    AchraPresentation_deleteMilestone(
      driveId: String
      docId: PHID
      input: AchraPresentation_DeleteMilestoneInput
    ): Int
    AchraPresentation_reorderMilestones(
      driveId: String
      docId: PHID
      input: AchraPresentation_ReorderMilestonesInput
    ): Int
    AchraPresentation_addTextItem(
      driveId: String
      docId: PHID
      input: AchraPresentation_AddTextItemInput
    ): Int
    AchraPresentation_updateTextItem(
      driveId: String
      docId: PHID
      input: AchraPresentation_UpdateTextItemInput
    ): Int
    AchraPresentation_deleteTextItem(
      driveId: String
      docId: PHID
      input: AchraPresentation_DeleteTextItemInput
    ): Int
    AchraPresentation_reorderTextItems(
      driveId: String
      docId: PHID
      input: AchraPresentation_ReorderTextItemsInput
    ): Int
    AchraPresentation_setColumnTitle(
      driveId: String
      docId: PHID
      input: AchraPresentation_SetColumnTitleInput
    ): Int
    AchraPresentation_addColumnBullet(
      driveId: String
      docId: PHID
      input: AchraPresentation_AddColumnBulletInput
    ): Int
    AchraPresentation_updateColumnBullet(
      driveId: String
      docId: PHID
      input: AchraPresentation_UpdateColumnBulletInput
    ): Int
    AchraPresentation_deleteColumnBullet(
      driveId: String
      docId: PHID
      input: AchraPresentation_DeleteColumnBulletInput
    ): Int
    AchraPresentation_reorderColumnBullets(
      driveId: String
      docId: PHID
      input: AchraPresentation_ReorderColumnBulletsInput
    ): Int
    AchraPresentation_addChecklistItem(
      driveId: String
      docId: PHID
      input: AchraPresentation_AddChecklistItemInput
    ): Int
    AchraPresentation_updateChecklistItem(
      driveId: String
      docId: PHID
      input: AchraPresentation_UpdateChecklistItemInput
    ): Int
    AchraPresentation_deleteChecklistItem(
      driveId: String
      docId: PHID
      input: AchraPresentation_DeleteChecklistItemInput
    ): Int
    AchraPresentation_reorderChecklistItems(
      driveId: String
      docId: PHID
      input: AchraPresentation_ReorderChecklistItemsInput
    ): Int
    AchraPresentation_addIconListItem(
      driveId: String
      docId: PHID
      input: AchraPresentation_AddIconListItemInput
    ): Int
    AchraPresentation_updateIconListItem(
      driveId: String
      docId: PHID
      input: AchraPresentation_UpdateIconListItemInput
    ): Int
    AchraPresentation_deleteIconListItem(
      driveId: String
      docId: PHID
      input: AchraPresentation_DeleteIconListItemInput
    ): Int
    AchraPresentation_reorderIconListItems(
      driveId: String
      docId: PHID
      input: AchraPresentation_ReorderIconListItemsInput
    ): Int
    AchraPresentation_addHighlight(
      driveId: String
      docId: PHID
      input: AchraPresentation_AddHighlightInput
    ): Int
    AchraPresentation_updateHighlight(
      driveId: String
      docId: PHID
      input: AchraPresentation_UpdateHighlightInput
    ): Int
    AchraPresentation_deleteHighlight(
      driveId: String
      docId: PHID
      input: AchraPresentation_DeleteHighlightInput
    ): Int
    AchraPresentation_reorderHighlights(
      driveId: String
      docId: PHID
      input: AchraPresentation_ReorderHighlightsInput
    ): Int
  }

  """
  Module: Core
  """
  input AchraPresentation_SetPresentationInfoInput {
    title: String
    author: String
    date: String
  }
  input AchraPresentation_AddSlideInput {
    id: OID!
    template: AchraPresentation_SlideTemplate!
    position: Int
  }
  input AchraPresentation_DeleteSlideInput {
    slideId: OID!
  }
  input AchraPresentation_DuplicateSlideInput {
    id: OID!
    slideId: OID!
  }
  input AchraPresentation_ReorderSlidesInput {
    slideIds: [OID!]!
  }
  input AchraPresentation_SetSlideTemplateInput {
    slideId: OID!
    template: AchraPresentation_SlideTemplate!
  }
  input AchraPresentation_UpdateSlideContentInput {
    slideId: OID!
    title: String
    subtitle: String
    supertitle: String
    description: String
    footerLeft: String
    footerRight: String
    slogan: String
    quoteText: String
    speakerName: String
    speakerRole: String
    bigNumber: String
    codeContent: String
    imageUrl: String
    leftTitle: String
    leftText: String
    rightTitle: String
    rightText: String
  }

  """
  Module: TitleBranding
  """
  input AchraPresentation_AddLinkInput {
    slideId: OID!
    id: OID!
    text: String!
  }
  input AchraPresentation_UpdateLinkInput {
    slideId: OID!
    id: OID!
    text: String!
  }
  input AchraPresentation_DeleteLinkInput {
    slideId: OID!
    id: OID!
  }
  input AchraPresentation_ReorderLinksInput {
    slideId: OID!
    linkIds: [OID!]!
  }

  """
  Module: StructureFlow
  """
  input AchraPresentation_AddProcessStepInput {
    slideId: OID!
    id: OID!
    title: String!
    description: String
  }
  input AchraPresentation_UpdateProcessStepInput {
    slideId: OID!
    id: OID!
    title: String
    description: String
  }
  input AchraPresentation_DeleteProcessStepInput {
    slideId: OID!
    id: OID!
  }
  input AchraPresentation_ReorderProcessStepsInput {
    slideId: OID!
    stepIds: [OID!]!
  }
  input AchraPresentation_AddAgendaItemInput {
    slideId: OID!
    id: OID!
    title: String!
  }
  input AchraPresentation_UpdateAgendaItemInput {
    slideId: OID!
    id: OID!
    title: String!
  }
  input AchraPresentation_DeleteAgendaItemInput {
    slideId: OID!
    id: OID!
  }
  input AchraPresentation_ReorderAgendaItemsInput {
    slideId: OID!
    itemIds: [OID!]!
  }
  input AchraPresentation_AddMilestoneInput {
    slideId: OID!
    id: OID!
    period: String!
    title: String!
    description: String
  }
  input AchraPresentation_UpdateMilestoneInput {
    slideId: OID!
    id: OID!
    period: String
    title: String
    description: String
  }
  input AchraPresentation_DeleteMilestoneInput {
    slideId: OID!
    id: OID!
  }
  input AchraPresentation_ReorderMilestonesInput {
    slideId: OID!
    milestoneIds: [OID!]!
  }

  """
  Module: TextLists
  """
  input AchraPresentation_AddTextItemInput {
    slideId: OID!
    id: OID!
    listField: AchraPresentation_TextListField!
    text: String!
    position: Int
  }
  input AchraPresentation_UpdateTextItemInput {
    slideId: OID!
    id: OID!
    listField: AchraPresentation_TextListField!
    text: String!
  }
  input AchraPresentation_DeleteTextItemInput {
    slideId: OID!
    id: OID!
    listField: AchraPresentation_TextListField!
  }
  input AchraPresentation_ReorderTextItemsInput {
    slideId: OID!
    listField: AchraPresentation_TextListField!
    itemIds: [OID!]!
  }
  input AchraPresentation_SetColumnTitleInput {
    slideId: OID!
    columnIndex: Int!
    title: String!
  }
  input AchraPresentation_AddColumnBulletInput {
    slideId: OID!
    columnIndex: Int!
    id: OID!
    text: String!
    position: Int
  }
  input AchraPresentation_UpdateColumnBulletInput {
    slideId: OID!
    columnIndex: Int!
    id: OID!
    text: String!
  }
  input AchraPresentation_DeleteColumnBulletInput {
    slideId: OID!
    columnIndex: Int!
    id: OID!
  }
  input AchraPresentation_ReorderColumnBulletsInput {
    slideId: OID!
    columnIndex: Int!
    bulletIds: [OID!]!
  }
  input AchraPresentation_AddChecklistItemInput {
    slideId: OID!
    id: OID!
    text: String!
    checked: Boolean
  }
  input AchraPresentation_UpdateChecklistItemInput {
    slideId: OID!
    id: OID!
    text: String
    checked: Boolean
  }
  input AchraPresentation_DeleteChecklistItemInput {
    slideId: OID!
    id: OID!
  }
  input AchraPresentation_ReorderChecklistItemsInput {
    slideId: OID!
    itemIds: [OID!]!
  }
  input AchraPresentation_AddIconListItemInput {
    slideId: OID!
    id: OID!
    title: String!
    description: String
  }
  input AchraPresentation_UpdateIconListItemInput {
    slideId: OID!
    id: OID!
    title: String
    description: String
  }
  input AchraPresentation_DeleteIconListItemInput {
    slideId: OID!
    id: OID!
  }
  input AchraPresentation_ReorderIconListItemsInput {
    slideId: OID!
    itemIds: [OID!]!
  }
  input AchraPresentation_AddHighlightInput {
    slideId: OID!
    id: OID!
    value: String!
    label: String!
    sublabel: String
  }
  input AchraPresentation_UpdateHighlightInput {
    slideId: OID!
    id: OID!
    value: String
    label: String
    sublabel: String
  }
  input AchraPresentation_DeleteHighlightInput {
    slideId: OID!
    id: OID!
  }
  input AchraPresentation_ReorderHighlightsInput {
    slideId: OID!
    highlightIds: [OID!]!
  }
`;
