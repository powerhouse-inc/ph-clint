import type {
  Slide,
  SlideTemplate,
} from "../../../../document-models/achra-presentation/gen/schema/types.js";

export type SlideTemplateProps = {
  slide: Slide;
  onUpdateContent: (field: string, value: string) => void;
  onAddTextItem?: (
    listField: "BULLET_ITEMS" | "STEPS",
    id: string,
    text: string,
  ) => void;
  onUpdateTextItem?: (
    listField: "BULLET_ITEMS" | "STEPS",
    id: string,
    text: string,
  ) => void;
  onDeleteTextItem?: (listField: "BULLET_ITEMS" | "STEPS", id: string) => void;
  onAddProcessStep?: (id: string, title: string) => void;
  onUpdateProcessStep?: (
    id: string,
    title: string,
    description?: string,
  ) => void;
  onDeleteProcessStep?: (id: string) => void;
  onAddAgendaItem?: (id: string, title: string) => void;
  onUpdateAgendaItem?: (id: string, title: string) => void;
  onDeleteAgendaItem?: (id: string) => void;
  onAddMilestone?: (id: string, period: string, title: string) => void;
  onUpdateMilestone?: (
    id: string,
    period?: string,
    title?: string,
    description?: string,
  ) => void;
  onDeleteMilestone?: (id: string) => void;
  onAddLink?: (id: string, text: string) => void;
  onUpdateLink?: (id: string, text: string) => void;
  onDeleteLink?: (id: string) => void;
  onSetColumnTitle?: (columnIndex: number, title: string) => void;
  onAddColumnBullet?: (columnIndex: number, id: string, text: string) => void;
  onUpdateColumnBullet?: (
    columnIndex: number,
    id: string,
    text: string,
  ) => void;
  onDeleteColumnBullet?: (columnIndex: number, id: string) => void;
  onAddChecklistItem?: (id: string, text: string) => void;
  onUpdateChecklistItem?: (
    id: string,
    text?: string,
    checked?: boolean,
  ) => void;
  onDeleteChecklistItem?: (id: string) => void;
  onAddIconListItem?: (id: string, title: string) => void;
  onUpdateIconListItem?: (
    id: string,
    title?: string,
    description?: string,
  ) => void;
  onDeleteIconListItem?: (id: string) => void;
  onAddHighlight?: (id: string, value: string, label: string) => void;
  onUpdateHighlight?: (
    id: string,
    value?: string,
    label?: string,
    sublabel?: string,
  ) => void;
  onDeleteHighlight?: (id: string) => void;
};

export const TEMPLATE_LABELS: Record<SlideTemplate, string> = {
  TITLE: "Title",
  TITLE_PRIMARY: "Title (Primary)",
  SECTION_DIVIDER_CENTERED: "Section Divider (Centered)",
  SECTION_DIVIDER_LEFT: "Section Divider (Left)",
  BULLETS_IMAGE: "Bullets + Image",
  IMAGE_BULLETS: "Image + Bullets",
  STATS_METRICS: "Stats / Metrics",
  TWO_COLUMN_TEXT: "Two-Column Text",
  QUOTE: "Quote",
  PROCESS_TIMELINE: "Process / Timeline",
  FEATURE_GRID: "Feature Grid",
  BIG_IMAGE_CAPTION: "Big Image + Caption",
  BEFORE_AFTER: "Before vs After",
  CHART_PLACEHOLDER: "Chart",
  AGENDA: "Agenda",
  TEAM_GRID: "Team Grid",
  THREE_COLUMN_BULLETS: "Three-Column Bullets",
  BIG_NUMBER: "Big Number",
  IMAGE_GRID: "Image Grid",
  ROADMAP: "Roadmap",
  PRICING_TIERS: "Pricing Tiers",
  TESTIMONIAL: "Testimonial",
  NUMBERED_STEPS: "Numbered Steps",
  CODE_BLOCK: "Code Block",
  DATA_TABLE: "Data Table",
  CHECKLIST: "Checklist",
  TWO_IMAGES: "Two Images",
  ICON_LIST: "Icon List",
  SPLIT_HIGHLIGHT: "Split + Highlight",
  TAGS_ECOSYSTEM: "Tags / Ecosystem",
  CONTACT_CARD: "Contact Card",
  THANK_YOU: "Thank You",
  LOGO_ONLY: "Logo Only",
  ICON_SLOGAN: "Icon + Slogan",
};

export const TEMPLATE_CATEGORIES: Array<{
  label: string;
  templates: SlideTemplate[];
}> = [
  {
    label: "Title & Branding",
    templates: [
      "TITLE",
      "TITLE_PRIMARY",
      "THANK_YOU",
      "LOGO_ONLY",
      "ICON_SLOGAN",
    ],
  },
  {
    label: "Structure & Flow",
    templates: [
      "SECTION_DIVIDER_CENTERED",
      "SECTION_DIVIDER_LEFT",
      "PROCESS_TIMELINE",
      "AGENDA",
      "ROADMAP",
    ],
  },
  {
    label: "Text & Lists",
    templates: [
      "BULLETS_IMAGE",
      "IMAGE_BULLETS",
      "TWO_COLUMN_TEXT",
      "THREE_COLUMN_BULLETS",
      "NUMBERED_STEPS",
      "CHECKLIST",
      "ICON_LIST",
      "SPLIT_HIGHLIGHT",
    ],
  },
  {
    label: "Data & Metrics",
    templates: [
      "STATS_METRICS",
      "CHART_PLACEHOLDER",
      "BIG_NUMBER",
      "DATA_TABLE",
    ],
  },
  {
    label: "Visual & Media",
    templates: [
      "BIG_IMAGE_CAPTION",
      "BEFORE_AFTER",
      "IMAGE_GRID",
      "TWO_IMAGES",
    ],
  },
  {
    label: "People & Quotes",
    templates: ["QUOTE", "TEAM_GRID", "TESTIMONIAL", "CONTACT_CARD"],
  },
  {
    label: "Showcase",
    templates: [
      "FEATURE_GRID",
      "PRICING_TIERS",
      "CODE_BLOCK",
      "TAGS_ECOSYSTEM",
    ],
  },
];

// Fixed color cycle for positional coloring
export const POSITION_COLORS = [
  { bg: "var(--primary-30)", fg: "var(--primary)" },
  { bg: "var(--progress-30)", fg: "var(--progress)" },
  { bg: "var(--success-30)", fg: "var(--success)" },
  { bg: "var(--todo-30)", fg: "var(--todo)" },
  { bg: "var(--yellow-30)", fg: "var(--yellow)" },
  { bg: "var(--purple-30)", fg: "var(--purple)" },
];

export const POSITION_ICONS = ["◆", "★", "⚙", "⚖", "◈", "✦"];
