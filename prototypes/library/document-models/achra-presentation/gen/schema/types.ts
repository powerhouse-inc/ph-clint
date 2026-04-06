export type Maybe<T> = T | null;
export type InputMaybe<T> = T | null | undefined;
export type Exact<T extends { [key: string]: unknown }> = {
  [K in keyof T]: T[K];
};
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]?: Maybe<T[SubKey]>;
};
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]: Maybe<T[SubKey]>;
};
export type MakeEmpty<
  T extends { [key: string]: unknown },
  K extends keyof T,
> = { [_ in K]?: never };
export type Incremental<T> =
  | T
  | {
      [P in keyof T]?: P extends " $fragmentName" | "__typename" ? T[P] : never;
    };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string };
  String: { input: string; output: string };
  Boolean: { input: boolean; output: boolean };
  Int: { input: number; output: number };
  Float: { input: number; output: number };
  Amount: {
    input: { unit?: string; value?: number };
    output: { unit?: string; value?: number };
  };
  Amount_Crypto: {
    input: { unit: string; value: string };
    output: { unit: string; value: string };
  };
  Amount_Currency: {
    input: { unit: string; value: string };
    output: { unit: string; value: string };
  };
  Amount_Fiat: {
    input: { unit: string; value: number };
    output: { unit: string; value: number };
  };
  Amount_Money: { input: number; output: number };
  Amount_Percentage: { input: number; output: number };
  Amount_Tokens: { input: number; output: number };
  Currency: { input: string; output: string };
  Date: { input: string; output: string };
  DateTime: { input: string; output: string };
  EmailAddress: { input: string; output: string };
  EthereumAddress: { input: string; output: string };
  OID: { input: string; output: string };
  OLabel: { input: string; output: string };
  PHID: { input: string; output: string };
  URL: { input: string; output: string };
  Upload: { input: File; output: File };
};

export type AchraPresentationState = {
  author: Maybe<Scalars["String"]["output"]>;
  date: Maybe<Scalars["String"]["output"]>;
  slides: Array<Slide>;
  title: Maybe<Scalars["String"]["output"]>;
};

export type AddAgendaItemInput = {
  id: Scalars["OID"]["input"];
  slideId: Scalars["OID"]["input"];
  title: Scalars["String"]["input"];
};

export type AddChecklistItemInput = {
  checked?: InputMaybe<Scalars["Boolean"]["input"]>;
  id: Scalars["OID"]["input"];
  slideId: Scalars["OID"]["input"];
  text: Scalars["String"]["input"];
};

export type AddColumnBulletInput = {
  columnIndex: Scalars["Int"]["input"];
  id: Scalars["OID"]["input"];
  position?: InputMaybe<Scalars["Int"]["input"]>;
  slideId: Scalars["OID"]["input"];
  text: Scalars["String"]["input"];
};

export type AddHighlightInput = {
  id: Scalars["OID"]["input"];
  label: Scalars["String"]["input"];
  slideId: Scalars["OID"]["input"];
  sublabel?: InputMaybe<Scalars["String"]["input"]>;
  value: Scalars["String"]["input"];
};

export type AddIconListItemInput = {
  description?: InputMaybe<Scalars["String"]["input"]>;
  id: Scalars["OID"]["input"];
  slideId: Scalars["OID"]["input"];
  title: Scalars["String"]["input"];
};

export type AddLinkInput = {
  id: Scalars["OID"]["input"];
  slideId: Scalars["OID"]["input"];
  text: Scalars["String"]["input"];
};

export type AddMilestoneInput = {
  description?: InputMaybe<Scalars["String"]["input"]>;
  id: Scalars["OID"]["input"];
  period: Scalars["String"]["input"];
  slideId: Scalars["OID"]["input"];
  title: Scalars["String"]["input"];
};

export type AddProcessStepInput = {
  description?: InputMaybe<Scalars["String"]["input"]>;
  id: Scalars["OID"]["input"];
  slideId: Scalars["OID"]["input"];
  title: Scalars["String"]["input"];
};

export type AddSlideInput = {
  id: Scalars["OID"]["input"];
  position?: InputMaybe<Scalars["Int"]["input"]>;
  template: SlideTemplate | `${SlideTemplate}`;
};

export type AddTextItemInput = {
  id: Scalars["OID"]["input"];
  listField: TextListField | `${TextListField}`;
  position?: InputMaybe<Scalars["Int"]["input"]>;
  slideId: Scalars["OID"]["input"];
  text: Scalars["String"]["input"];
};

export type AgendaItem = {
  id: Scalars["OID"]["output"];
  title: Scalars["String"]["output"];
};

export type BulletColumn = {
  bulletItems: Array<TextItem>;
  title: Maybe<Scalars["String"]["output"]>;
};

export type ChecklistItem = {
  checked: Scalars["Boolean"]["output"];
  id: Scalars["OID"]["output"];
  text: Scalars["String"]["output"];
};

export type DeleteAgendaItemInput = {
  id: Scalars["OID"]["input"];
  slideId: Scalars["OID"]["input"];
};

export type DeleteChecklistItemInput = {
  id: Scalars["OID"]["input"];
  slideId: Scalars["OID"]["input"];
};

export type DeleteColumnBulletInput = {
  columnIndex: Scalars["Int"]["input"];
  id: Scalars["OID"]["input"];
  slideId: Scalars["OID"]["input"];
};

export type DeleteHighlightInput = {
  id: Scalars["OID"]["input"];
  slideId: Scalars["OID"]["input"];
};

export type DeleteIconListItemInput = {
  id: Scalars["OID"]["input"];
  slideId: Scalars["OID"]["input"];
};

export type DeleteLinkInput = {
  id: Scalars["OID"]["input"];
  slideId: Scalars["OID"]["input"];
};

export type DeleteMilestoneInput = {
  id: Scalars["OID"]["input"];
  slideId: Scalars["OID"]["input"];
};

export type DeleteProcessStepInput = {
  id: Scalars["OID"]["input"];
  slideId: Scalars["OID"]["input"];
};

export type DeleteSlideInput = {
  slideId: Scalars["OID"]["input"];
};

export type DeleteTextItemInput = {
  id: Scalars["OID"]["input"];
  listField: TextListField | `${TextListField}`;
  slideId: Scalars["OID"]["input"];
};

export type DuplicateSlideInput = {
  id: Scalars["OID"]["input"];
  slideId: Scalars["OID"]["input"];
};

export type HighlightItem = {
  id: Scalars["OID"]["output"];
  label: Scalars["String"]["output"];
  sublabel: Maybe<Scalars["String"]["output"]>;
  value: Scalars["String"]["output"];
};

export type IconListItem = {
  description: Maybe<Scalars["String"]["output"]>;
  id: Scalars["OID"]["output"];
  title: Scalars["String"]["output"];
};

export type Link = {
  id: Scalars["OID"]["output"];
  text: Scalars["String"]["output"];
};

export type MilestoneItem = {
  description: Maybe<Scalars["String"]["output"]>;
  id: Scalars["OID"]["output"];
  period: Scalars["String"]["output"];
  title: Scalars["String"]["output"];
};

export type ProcessStep = {
  description: Maybe<Scalars["String"]["output"]>;
  id: Scalars["OID"]["output"];
  title: Scalars["String"]["output"];
};

export type ReorderAgendaItemsInput = {
  itemIds: Array<Scalars["OID"]["input"]>;
  slideId: Scalars["OID"]["input"];
};

export type ReorderChecklistItemsInput = {
  itemIds: Array<Scalars["OID"]["input"]>;
  slideId: Scalars["OID"]["input"];
};

export type ReorderColumnBulletsInput = {
  bulletIds: Array<Scalars["OID"]["input"]>;
  columnIndex: Scalars["Int"]["input"];
  slideId: Scalars["OID"]["input"];
};

export type ReorderHighlightsInput = {
  highlightIds: Array<Scalars["OID"]["input"]>;
  slideId: Scalars["OID"]["input"];
};

export type ReorderIconListItemsInput = {
  itemIds: Array<Scalars["OID"]["input"]>;
  slideId: Scalars["OID"]["input"];
};

export type ReorderLinksInput = {
  linkIds: Array<Scalars["OID"]["input"]>;
  slideId: Scalars["OID"]["input"];
};

export type ReorderMilestonesInput = {
  milestoneIds: Array<Scalars["OID"]["input"]>;
  slideId: Scalars["OID"]["input"];
};

export type ReorderProcessStepsInput = {
  slideId: Scalars["OID"]["input"];
  stepIds: Array<Scalars["OID"]["input"]>;
};

export type ReorderSlidesInput = {
  slideIds: Array<Scalars["OID"]["input"]>;
};

export type ReorderTextItemsInput = {
  itemIds: Array<Scalars["OID"]["input"]>;
  listField: TextListField | `${TextListField}`;
  slideId: Scalars["OID"]["input"];
};

export type SetColumnTitleInput = {
  columnIndex: Scalars["Int"]["input"];
  slideId: Scalars["OID"]["input"];
  title: Scalars["String"]["input"];
};

export type SetPresentationInfoInput = {
  author?: InputMaybe<Scalars["String"]["input"]>;
  date?: InputMaybe<Scalars["String"]["input"]>;
  title?: InputMaybe<Scalars["String"]["input"]>;
};

export type SetSlideTemplateInput = {
  slideId: Scalars["OID"]["input"];
  template: SlideTemplate | `${SlideTemplate}`;
};

export type Slide = {
  agendaItems: Array<AgendaItem>;
  bigNumber: Maybe<Scalars["String"]["output"]>;
  bulletItems: Array<TextItem>;
  checklistItems: Array<ChecklistItem>;
  codeContent: Maybe<Scalars["String"]["output"]>;
  columns: Array<BulletColumn>;
  description: Maybe<Scalars["String"]["output"]>;
  footerLeft: Maybe<Scalars["String"]["output"]>;
  footerRight: Maybe<Scalars["String"]["output"]>;
  highlights: Array<HighlightItem>;
  iconListItems: Array<IconListItem>;
  id: Scalars["OID"]["output"];
  imageUrl: Maybe<Scalars["String"]["output"]>;
  leftText: Maybe<Scalars["String"]["output"]>;
  leftTitle: Maybe<Scalars["String"]["output"]>;
  links: Array<Link>;
  milestones: Array<MilestoneItem>;
  processSteps: Array<ProcessStep>;
  quoteText: Maybe<Scalars["String"]["output"]>;
  rightText: Maybe<Scalars["String"]["output"]>;
  rightTitle: Maybe<Scalars["String"]["output"]>;
  slogan: Maybe<Scalars["String"]["output"]>;
  speakerName: Maybe<Scalars["String"]["output"]>;
  speakerRole: Maybe<Scalars["String"]["output"]>;
  steps: Array<TextItem>;
  subtitle: Maybe<Scalars["String"]["output"]>;
  supertitle: Maybe<Scalars["String"]["output"]>;
  template: SlideTemplate | `${SlideTemplate}`;
  title: Maybe<Scalars["String"]["output"]>;
};

export type SlideTemplate =
  | "AGENDA"
  | "BEFORE_AFTER"
  | "BIG_IMAGE_CAPTION"
  | "BIG_NUMBER"
  | "BULLETS_IMAGE"
  | "CHART_PLACEHOLDER"
  | "CHECKLIST"
  | "CODE_BLOCK"
  | "CONTACT_CARD"
  | "DATA_TABLE"
  | "FEATURE_GRID"
  | "ICON_LIST"
  | "ICON_SLOGAN"
  | "IMAGE_BULLETS"
  | "IMAGE_GRID"
  | "LOGO_ONLY"
  | "NUMBERED_STEPS"
  | "PRICING_TIERS"
  | "PROCESS_TIMELINE"
  | "QUOTE"
  | "ROADMAP"
  | "SECTION_DIVIDER_CENTERED"
  | "SECTION_DIVIDER_LEFT"
  | "SPLIT_HIGHLIGHT"
  | "STATS_METRICS"
  | "TAGS_ECOSYSTEM"
  | "TEAM_GRID"
  | "TESTIMONIAL"
  | "THANK_YOU"
  | "THREE_COLUMN_BULLETS"
  | "TITLE"
  | "TITLE_PRIMARY"
  | "TWO_COLUMN_TEXT"
  | "TWO_IMAGES";

export type TextItem = {
  id: Scalars["OID"]["output"];
  text: Scalars["String"]["output"];
};

export type TextListField = "BULLET_ITEMS" | "STEPS";

export type UpdateAgendaItemInput = {
  id: Scalars["OID"]["input"];
  slideId: Scalars["OID"]["input"];
  title: Scalars["String"]["input"];
};

export type UpdateChecklistItemInput = {
  checked?: InputMaybe<Scalars["Boolean"]["input"]>;
  id: Scalars["OID"]["input"];
  slideId: Scalars["OID"]["input"];
  text?: InputMaybe<Scalars["String"]["input"]>;
};

export type UpdateColumnBulletInput = {
  columnIndex: Scalars["Int"]["input"];
  id: Scalars["OID"]["input"];
  slideId: Scalars["OID"]["input"];
  text: Scalars["String"]["input"];
};

export type UpdateHighlightInput = {
  id: Scalars["OID"]["input"];
  label?: InputMaybe<Scalars["String"]["input"]>;
  slideId: Scalars["OID"]["input"];
  sublabel?: InputMaybe<Scalars["String"]["input"]>;
  value?: InputMaybe<Scalars["String"]["input"]>;
};

export type UpdateIconListItemInput = {
  description?: InputMaybe<Scalars["String"]["input"]>;
  id: Scalars["OID"]["input"];
  slideId: Scalars["OID"]["input"];
  title?: InputMaybe<Scalars["String"]["input"]>;
};

export type UpdateLinkInput = {
  id: Scalars["OID"]["input"];
  slideId: Scalars["OID"]["input"];
  text: Scalars["String"]["input"];
};

export type UpdateMilestoneInput = {
  description?: InputMaybe<Scalars["String"]["input"]>;
  id: Scalars["OID"]["input"];
  period?: InputMaybe<Scalars["String"]["input"]>;
  slideId: Scalars["OID"]["input"];
  title?: InputMaybe<Scalars["String"]["input"]>;
};

export type UpdateProcessStepInput = {
  description?: InputMaybe<Scalars["String"]["input"]>;
  id: Scalars["OID"]["input"];
  slideId: Scalars["OID"]["input"];
  title?: InputMaybe<Scalars["String"]["input"]>;
};

export type UpdateSlideContentInput = {
  bigNumber?: InputMaybe<Scalars["String"]["input"]>;
  codeContent?: InputMaybe<Scalars["String"]["input"]>;
  description?: InputMaybe<Scalars["String"]["input"]>;
  footerLeft?: InputMaybe<Scalars["String"]["input"]>;
  footerRight?: InputMaybe<Scalars["String"]["input"]>;
  imageUrl?: InputMaybe<Scalars["String"]["input"]>;
  leftText?: InputMaybe<Scalars["String"]["input"]>;
  leftTitle?: InputMaybe<Scalars["String"]["input"]>;
  quoteText?: InputMaybe<Scalars["String"]["input"]>;
  rightText?: InputMaybe<Scalars["String"]["input"]>;
  rightTitle?: InputMaybe<Scalars["String"]["input"]>;
  slideId: Scalars["OID"]["input"];
  slogan?: InputMaybe<Scalars["String"]["input"]>;
  speakerName?: InputMaybe<Scalars["String"]["input"]>;
  speakerRole?: InputMaybe<Scalars["String"]["input"]>;
  subtitle?: InputMaybe<Scalars["String"]["input"]>;
  supertitle?: InputMaybe<Scalars["String"]["input"]>;
  title?: InputMaybe<Scalars["String"]["input"]>;
};

export type UpdateTextItemInput = {
  id: Scalars["OID"]["input"];
  listField: TextListField | `${TextListField}`;
  slideId: Scalars["OID"]["input"];
  text: Scalars["String"]["input"];
};
