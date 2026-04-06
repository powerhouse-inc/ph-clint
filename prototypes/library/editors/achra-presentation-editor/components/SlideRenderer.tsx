import type { SlideTemplateProps } from "./templates/shared.js";
import { TitleSlide } from "./templates/TitleSlide.js";
import { TitlePrimarySlide } from "./templates/TitlePrimarySlide.js";
import { SectionDividerCentered } from "./templates/SectionDividerCentered.js";
import { SectionDividerLeft } from "./templates/SectionDividerLeft.js";
import { BulletsImageSlide } from "./templates/BulletsImageSlide.js";
import { ImageBulletsSlide } from "./templates/ImageBulletsSlide.js";
import { QuoteSlide } from "./templates/QuoteSlide.js";
import { TwoColumnTextSlide } from "./templates/TwoColumnTextSlide.js";
import { ProcessTimelineSlide } from "./templates/ProcessTimelineSlide.js";
import { AgendaSlide } from "./templates/AgendaSlide.js";
import { RoadmapSlide } from "./templates/RoadmapSlide.js";
import { ThreeColumnBulletsSlide } from "./templates/ThreeColumnBulletsSlide.js";
import { NumberedStepsSlide } from "./templates/NumberedStepsSlide.js";
import { ChecklistSlide } from "./templates/ChecklistSlide.js";
import { IconListSlide } from "./templates/IconListSlide.js";
import { SplitHighlightSlide } from "./templates/SplitHighlightSlide.js";
import { StatsMetricsSlide } from "./templates/StatsMetricsSlide.js";
import { BigNumberSlide } from "./templates/BigNumberSlide.js";
import { ChartPlaceholderSlide } from "./templates/ChartPlaceholderSlide.js";
import { DataTableSlide } from "./templates/DataTableSlide.js";
import { BigImageCaptionSlide } from "./templates/BigImageCaptionSlide.js";
import { BeforeAfterSlide } from "./templates/BeforeAfterSlide.js";
import { ImageGridSlide } from "./templates/ImageGridSlide.js";
import { TwoImagesSlide } from "./templates/TwoImagesSlide.js";
import { TeamGridSlide } from "./templates/TeamGridSlide.js";
import { TestimonialSlide } from "./templates/TestimonialSlide.js";
import { ContactCardSlide } from "./templates/ContactCardSlide.js";
import { FeatureGridSlide } from "./templates/FeatureGridSlide.js";
import { PricingTiersSlide } from "./templates/PricingTiersSlide.js";
import { CodeBlockSlide } from "./templates/CodeBlockSlide.js";
import { TagsEcosystemSlide } from "./templates/TagsEcosystemSlide.js";
import { ThankYouSlide } from "./templates/ThankYouSlide.js";
import { LogoOnlySlide } from "./templates/LogoOnlySlide.js";
import { IconSloganSlide } from "./templates/IconSloganSlide.js";
import { PlaceholderSlide } from "./templates/PlaceholderSlide.js";

const TEMPLATE_MAP: Record<string, React.ComponentType<SlideTemplateProps>> = {
  TITLE: TitleSlide,
  TITLE_PRIMARY: TitlePrimarySlide,
  SECTION_DIVIDER_CENTERED: SectionDividerCentered,
  SECTION_DIVIDER_LEFT: SectionDividerLeft,
  BULLETS_IMAGE: BulletsImageSlide,
  IMAGE_BULLETS: ImageBulletsSlide,
  QUOTE: QuoteSlide,
  TWO_COLUMN_TEXT: TwoColumnTextSlide,
  PROCESS_TIMELINE: ProcessTimelineSlide,
  AGENDA: AgendaSlide,
  ROADMAP: RoadmapSlide,
  THREE_COLUMN_BULLETS: ThreeColumnBulletsSlide,
  NUMBERED_STEPS: NumberedStepsSlide,
  CHECKLIST: ChecklistSlide,
  ICON_LIST: IconListSlide,
  SPLIT_HIGHLIGHT: SplitHighlightSlide,
  STATS_METRICS: StatsMetricsSlide,
  BIG_NUMBER: BigNumberSlide,
  CHART_PLACEHOLDER: ChartPlaceholderSlide,
  DATA_TABLE: DataTableSlide,
  BIG_IMAGE_CAPTION: BigImageCaptionSlide,
  BEFORE_AFTER: BeforeAfterSlide,
  IMAGE_GRID: ImageGridSlide,
  TWO_IMAGES: TwoImagesSlide,
  TEAM_GRID: TeamGridSlide,
  TESTIMONIAL: TestimonialSlide,
  CONTACT_CARD: ContactCardSlide,
  FEATURE_GRID: FeatureGridSlide,
  PRICING_TIERS: PricingTiersSlide,
  CODE_BLOCK: CodeBlockSlide,
  TAGS_ECOSYSTEM: TagsEcosystemSlide,
  THANK_YOU: ThankYouSlide,
  LOGO_ONLY: LogoOnlySlide,
  ICON_SLOGAN: IconSloganSlide,
};

export function SlideRenderer(props: SlideTemplateProps) {
  const Component = TEMPLATE_MAP[props.slide.template] ?? PlaceholderSlide;
  return (
    <div className="achra-slide">
      <Component {...props} />
    </div>
  );
}
