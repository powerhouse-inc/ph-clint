import { z } from "zod";
import type {
  AchraPresentationState,
  AddAgendaItemInput,
  AddChecklistItemInput,
  AddColumnBulletInput,
  AddHighlightInput,
  AddIconListItemInput,
  AddLinkInput,
  AddMilestoneInput,
  AddProcessStepInput,
  AddSlideInput,
  AddTextItemInput,
  AgendaItem,
  BulletColumn,
  ChecklistItem,
  DeleteAgendaItemInput,
  DeleteChecklistItemInput,
  DeleteColumnBulletInput,
  DeleteHighlightInput,
  DeleteIconListItemInput,
  DeleteLinkInput,
  DeleteMilestoneInput,
  DeleteProcessStepInput,
  DeleteSlideInput,
  DeleteTextItemInput,
  DuplicateSlideInput,
  HighlightItem,
  IconListItem,
  Link,
  MilestoneItem,
  ProcessStep,
  ReorderAgendaItemsInput,
  ReorderChecklistItemsInput,
  ReorderColumnBulletsInput,
  ReorderHighlightsInput,
  ReorderIconListItemsInput,
  ReorderLinksInput,
  ReorderMilestonesInput,
  ReorderProcessStepsInput,
  ReorderSlidesInput,
  ReorderTextItemsInput,
  SetColumnTitleInput,
  SetPresentationInfoInput,
  SetSlideTemplateInput,
  Slide,
  SlideTemplate,
  TextItem,
  TextListField,
  UpdateAgendaItemInput,
  UpdateChecklistItemInput,
  UpdateColumnBulletInput,
  UpdateHighlightInput,
  UpdateIconListItemInput,
  UpdateLinkInput,
  UpdateMilestoneInput,
  UpdateProcessStepInput,
  UpdateSlideContentInput,
  UpdateTextItemInput,
} from "./types.js";

type Properties<T> = Required<{
  [K in keyof T]: z.ZodType<T[K], any, T[K]>;
}>;

type definedNonNullAny = {};

export const isDefinedNonNullAny = (v: any): v is definedNonNullAny =>
  v !== undefined && v !== null;

export const definedNonNullAnySchema = z
  .any()
  .refine((v) => isDefinedNonNullAny(v));

export const SlideTemplateSchema = z.enum([
  "AGENDA",
  "BEFORE_AFTER",
  "BIG_IMAGE_CAPTION",
  "BIG_NUMBER",
  "BULLETS_IMAGE",
  "CHART_PLACEHOLDER",
  "CHECKLIST",
  "CODE_BLOCK",
  "CONTACT_CARD",
  "DATA_TABLE",
  "FEATURE_GRID",
  "ICON_LIST",
  "ICON_SLOGAN",
  "IMAGE_BULLETS",
  "IMAGE_GRID",
  "LOGO_ONLY",
  "NUMBERED_STEPS",
  "PRICING_TIERS",
  "PROCESS_TIMELINE",
  "QUOTE",
  "ROADMAP",
  "SECTION_DIVIDER_CENTERED",
  "SECTION_DIVIDER_LEFT",
  "SPLIT_HIGHLIGHT",
  "STATS_METRICS",
  "TAGS_ECOSYSTEM",
  "TEAM_GRID",
  "TESTIMONIAL",
  "THANK_YOU",
  "THREE_COLUMN_BULLETS",
  "TITLE",
  "TITLE_PRIMARY",
  "TWO_COLUMN_TEXT",
  "TWO_IMAGES",
]);

export const TextListFieldSchema = z.enum(["BULLET_ITEMS", "STEPS"]);

export function AchraPresentationStateSchema(): z.ZodObject<
  Properties<AchraPresentationState>
> {
  return z.object({
    __typename: z.literal("AchraPresentationState").optional(),
    author: z.string().nullable(),
    date: z.string().nullable(),
    slides: z.array(SlideSchema()),
    title: z.string().nullable(),
  });
}

export function AddAgendaItemInputSchema(): z.ZodObject<
  Properties<AddAgendaItemInput>
> {
  return z.object({
    id: z.string(),
    slideId: z.string(),
    title: z.string(),
  });
}

export function AddChecklistItemInputSchema(): z.ZodObject<
  Properties<AddChecklistItemInput>
> {
  return z.object({
    checked: z.boolean().nullish(),
    id: z.string(),
    slideId: z.string(),
    text: z.string(),
  });
}

export function AddColumnBulletInputSchema(): z.ZodObject<
  Properties<AddColumnBulletInput>
> {
  return z.object({
    columnIndex: z.number(),
    id: z.string(),
    position: z.number().nullish(),
    slideId: z.string(),
    text: z.string(),
  });
}

export function AddHighlightInputSchema(): z.ZodObject<
  Properties<AddHighlightInput>
> {
  return z.object({
    id: z.string(),
    label: z.string(),
    slideId: z.string(),
    sublabel: z.string().nullish(),
    value: z.string(),
  });
}

export function AddIconListItemInputSchema(): z.ZodObject<
  Properties<AddIconListItemInput>
> {
  return z.object({
    description: z.string().nullish(),
    id: z.string(),
    slideId: z.string(),
    title: z.string(),
  });
}

export function AddLinkInputSchema(): z.ZodObject<Properties<AddLinkInput>> {
  return z.object({
    id: z.string(),
    slideId: z.string(),
    text: z.string(),
  });
}

export function AddMilestoneInputSchema(): z.ZodObject<
  Properties<AddMilestoneInput>
> {
  return z.object({
    description: z.string().nullish(),
    id: z.string(),
    period: z.string(),
    slideId: z.string(),
    title: z.string(),
  });
}

export function AddProcessStepInputSchema(): z.ZodObject<
  Properties<AddProcessStepInput>
> {
  return z.object({
    description: z.string().nullish(),
    id: z.string(),
    slideId: z.string(),
    title: z.string(),
  });
}

export function AddSlideInputSchema(): z.ZodObject<Properties<AddSlideInput>> {
  return z.object({
    id: z.string(),
    position: z.number().nullish(),
    template: SlideTemplateSchema,
  });
}

export function AddTextItemInputSchema(): z.ZodObject<
  Properties<AddTextItemInput>
> {
  return z.object({
    id: z.string(),
    listField: TextListFieldSchema,
    position: z.number().nullish(),
    slideId: z.string(),
    text: z.string(),
  });
}

export function AgendaItemSchema(): z.ZodObject<Properties<AgendaItem>> {
  return z.object({
    __typename: z.literal("AgendaItem").optional(),
    id: z.string(),
    title: z.string(),
  });
}

export function BulletColumnSchema(): z.ZodObject<Properties<BulletColumn>> {
  return z.object({
    __typename: z.literal("BulletColumn").optional(),
    bulletItems: z.array(TextItemSchema()),
    title: z.string().nullable(),
  });
}

export function ChecklistItemSchema(): z.ZodObject<Properties<ChecklistItem>> {
  return z.object({
    __typename: z.literal("ChecklistItem").optional(),
    checked: z.boolean(),
    id: z.string(),
    text: z.string(),
  });
}

export function DeleteAgendaItemInputSchema(): z.ZodObject<
  Properties<DeleteAgendaItemInput>
> {
  return z.object({
    id: z.string(),
    slideId: z.string(),
  });
}

export function DeleteChecklistItemInputSchema(): z.ZodObject<
  Properties<DeleteChecklistItemInput>
> {
  return z.object({
    id: z.string(),
    slideId: z.string(),
  });
}

export function DeleteColumnBulletInputSchema(): z.ZodObject<
  Properties<DeleteColumnBulletInput>
> {
  return z.object({
    columnIndex: z.number(),
    id: z.string(),
    slideId: z.string(),
  });
}

export function DeleteHighlightInputSchema(): z.ZodObject<
  Properties<DeleteHighlightInput>
> {
  return z.object({
    id: z.string(),
    slideId: z.string(),
  });
}

export function DeleteIconListItemInputSchema(): z.ZodObject<
  Properties<DeleteIconListItemInput>
> {
  return z.object({
    id: z.string(),
    slideId: z.string(),
  });
}

export function DeleteLinkInputSchema(): z.ZodObject<
  Properties<DeleteLinkInput>
> {
  return z.object({
    id: z.string(),
    slideId: z.string(),
  });
}

export function DeleteMilestoneInputSchema(): z.ZodObject<
  Properties<DeleteMilestoneInput>
> {
  return z.object({
    id: z.string(),
    slideId: z.string(),
  });
}

export function DeleteProcessStepInputSchema(): z.ZodObject<
  Properties<DeleteProcessStepInput>
> {
  return z.object({
    id: z.string(),
    slideId: z.string(),
  });
}

export function DeleteSlideInputSchema(): z.ZodObject<
  Properties<DeleteSlideInput>
> {
  return z.object({
    slideId: z.string(),
  });
}

export function DeleteTextItemInputSchema(): z.ZodObject<
  Properties<DeleteTextItemInput>
> {
  return z.object({
    id: z.string(),
    listField: TextListFieldSchema,
    slideId: z.string(),
  });
}

export function DuplicateSlideInputSchema(): z.ZodObject<
  Properties<DuplicateSlideInput>
> {
  return z.object({
    id: z.string(),
    slideId: z.string(),
  });
}

export function HighlightItemSchema(): z.ZodObject<Properties<HighlightItem>> {
  return z.object({
    __typename: z.literal("HighlightItem").optional(),
    id: z.string(),
    label: z.string(),
    sublabel: z.string().nullable(),
    value: z.string(),
  });
}

export function IconListItemSchema(): z.ZodObject<Properties<IconListItem>> {
  return z.object({
    __typename: z.literal("IconListItem").optional(),
    description: z.string().nullable(),
    id: z.string(),
    title: z.string(),
  });
}

export function LinkSchema(): z.ZodObject<Properties<Link>> {
  return z.object({
    __typename: z.literal("Link").optional(),
    id: z.string(),
    text: z.string(),
  });
}

export function MilestoneItemSchema(): z.ZodObject<Properties<MilestoneItem>> {
  return z.object({
    __typename: z.literal("MilestoneItem").optional(),
    description: z.string().nullable(),
    id: z.string(),
    period: z.string(),
    title: z.string(),
  });
}

export function ProcessStepSchema(): z.ZodObject<Properties<ProcessStep>> {
  return z.object({
    __typename: z.literal("ProcessStep").optional(),
    description: z.string().nullable(),
    id: z.string(),
    title: z.string(),
  });
}

export function ReorderAgendaItemsInputSchema(): z.ZodObject<
  Properties<ReorderAgendaItemsInput>
> {
  return z.object({
    itemIds: z.array(z.string()),
    slideId: z.string(),
  });
}

export function ReorderChecklistItemsInputSchema(): z.ZodObject<
  Properties<ReorderChecklistItemsInput>
> {
  return z.object({
    itemIds: z.array(z.string()),
    slideId: z.string(),
  });
}

export function ReorderColumnBulletsInputSchema(): z.ZodObject<
  Properties<ReorderColumnBulletsInput>
> {
  return z.object({
    bulletIds: z.array(z.string()),
    columnIndex: z.number(),
    slideId: z.string(),
  });
}

export function ReorderHighlightsInputSchema(): z.ZodObject<
  Properties<ReorderHighlightsInput>
> {
  return z.object({
    highlightIds: z.array(z.string()),
    slideId: z.string(),
  });
}

export function ReorderIconListItemsInputSchema(): z.ZodObject<
  Properties<ReorderIconListItemsInput>
> {
  return z.object({
    itemIds: z.array(z.string()),
    slideId: z.string(),
  });
}

export function ReorderLinksInputSchema(): z.ZodObject<
  Properties<ReorderLinksInput>
> {
  return z.object({
    linkIds: z.array(z.string()),
    slideId: z.string(),
  });
}

export function ReorderMilestonesInputSchema(): z.ZodObject<
  Properties<ReorderMilestonesInput>
> {
  return z.object({
    milestoneIds: z.array(z.string()),
    slideId: z.string(),
  });
}

export function ReorderProcessStepsInputSchema(): z.ZodObject<
  Properties<ReorderProcessStepsInput>
> {
  return z.object({
    slideId: z.string(),
    stepIds: z.array(z.string()),
  });
}

export function ReorderSlidesInputSchema(): z.ZodObject<
  Properties<ReorderSlidesInput>
> {
  return z.object({
    slideIds: z.array(z.string()),
  });
}

export function ReorderTextItemsInputSchema(): z.ZodObject<
  Properties<ReorderTextItemsInput>
> {
  return z.object({
    itemIds: z.array(z.string()),
    listField: TextListFieldSchema,
    slideId: z.string(),
  });
}

export function SetColumnTitleInputSchema(): z.ZodObject<
  Properties<SetColumnTitleInput>
> {
  return z.object({
    columnIndex: z.number(),
    slideId: z.string(),
    title: z.string(),
  });
}

export function SetPresentationInfoInputSchema(): z.ZodObject<
  Properties<SetPresentationInfoInput>
> {
  return z.object({
    author: z.string().nullish(),
    date: z.string().nullish(),
    title: z.string().nullish(),
  });
}

export function SetSlideTemplateInputSchema(): z.ZodObject<
  Properties<SetSlideTemplateInput>
> {
  return z.object({
    slideId: z.string(),
    template: SlideTemplateSchema,
  });
}

export function SlideSchema(): z.ZodObject<Properties<Slide>> {
  return z.object({
    __typename: z.literal("Slide").optional(),
    agendaItems: z.array(AgendaItemSchema()),
    bigNumber: z.string().nullable(),
    bulletItems: z.array(TextItemSchema()),
    checklistItems: z.array(ChecklistItemSchema()),
    codeContent: z.string().nullable(),
    columns: z.array(BulletColumnSchema()),
    description: z.string().nullable(),
    footerLeft: z.string().nullable(),
    footerRight: z.string().nullable(),
    highlights: z.array(HighlightItemSchema()),
    iconListItems: z.array(IconListItemSchema()),
    id: z.string(),
    imageUrl: z.string().nullable(),
    leftText: z.string().nullable(),
    leftTitle: z.string().nullable(),
    links: z.array(LinkSchema()),
    milestones: z.array(MilestoneItemSchema()),
    processSteps: z.array(ProcessStepSchema()),
    quoteText: z.string().nullable(),
    rightText: z.string().nullable(),
    rightTitle: z.string().nullable(),
    slogan: z.string().nullable(),
    speakerName: z.string().nullable(),
    speakerRole: z.string().nullable(),
    steps: z.array(TextItemSchema()),
    subtitle: z.string().nullable(),
    supertitle: z.string().nullable(),
    template: SlideTemplateSchema,
    title: z.string().nullable(),
  });
}

export function TextItemSchema(): z.ZodObject<Properties<TextItem>> {
  return z.object({
    __typename: z.literal("TextItem").optional(),
    id: z.string(),
    text: z.string(),
  });
}

export function UpdateAgendaItemInputSchema(): z.ZodObject<
  Properties<UpdateAgendaItemInput>
> {
  return z.object({
    id: z.string(),
    slideId: z.string(),
    title: z.string(),
  });
}

export function UpdateChecklistItemInputSchema(): z.ZodObject<
  Properties<UpdateChecklistItemInput>
> {
  return z.object({
    checked: z.boolean().nullish(),
    id: z.string(),
    slideId: z.string(),
    text: z.string().nullish(),
  });
}

export function UpdateColumnBulletInputSchema(): z.ZodObject<
  Properties<UpdateColumnBulletInput>
> {
  return z.object({
    columnIndex: z.number(),
    id: z.string(),
    slideId: z.string(),
    text: z.string(),
  });
}

export function UpdateHighlightInputSchema(): z.ZodObject<
  Properties<UpdateHighlightInput>
> {
  return z.object({
    id: z.string(),
    label: z.string().nullish(),
    slideId: z.string(),
    sublabel: z.string().nullish(),
    value: z.string().nullish(),
  });
}

export function UpdateIconListItemInputSchema(): z.ZodObject<
  Properties<UpdateIconListItemInput>
> {
  return z.object({
    description: z.string().nullish(),
    id: z.string(),
    slideId: z.string(),
    title: z.string().nullish(),
  });
}

export function UpdateLinkInputSchema(): z.ZodObject<
  Properties<UpdateLinkInput>
> {
  return z.object({
    id: z.string(),
    slideId: z.string(),
    text: z.string(),
  });
}

export function UpdateMilestoneInputSchema(): z.ZodObject<
  Properties<UpdateMilestoneInput>
> {
  return z.object({
    description: z.string().nullish(),
    id: z.string(),
    period: z.string().nullish(),
    slideId: z.string(),
    title: z.string().nullish(),
  });
}

export function UpdateProcessStepInputSchema(): z.ZodObject<
  Properties<UpdateProcessStepInput>
> {
  return z.object({
    description: z.string().nullish(),
    id: z.string(),
    slideId: z.string(),
    title: z.string().nullish(),
  });
}

export function UpdateSlideContentInputSchema(): z.ZodObject<
  Properties<UpdateSlideContentInput>
> {
  return z.object({
    bigNumber: z.string().nullish(),
    codeContent: z.string().nullish(),
    description: z.string().nullish(),
    footerLeft: z.string().nullish(),
    footerRight: z.string().nullish(),
    imageUrl: z.string().nullish(),
    leftText: z.string().nullish(),
    leftTitle: z.string().nullish(),
    quoteText: z.string().nullish(),
    rightText: z.string().nullish(),
    rightTitle: z.string().nullish(),
    slideId: z.string(),
    slogan: z.string().nullish(),
    speakerName: z.string().nullish(),
    speakerRole: z.string().nullish(),
    subtitle: z.string().nullish(),
    supertitle: z.string().nullish(),
    title: z.string().nullish(),
  });
}

export function UpdateTextItemInputSchema(): z.ZodObject<
  Properties<UpdateTextItemInput>
> {
  return z.object({
    id: z.string(),
    listField: TextListFieldSchema,
    slideId: z.string(),
    text: z.string(),
  });
}
