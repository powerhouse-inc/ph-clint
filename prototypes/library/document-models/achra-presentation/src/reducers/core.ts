import type { Slide, SlideTemplate } from "../../gen/schema/types.js";
import type { AchraPresentationCoreOperations } from "@powerhousedao/agent-manager/document-models/achra-presentation";

function createEmptySlide(id: string, template: SlideTemplate): Slide {
  return {
    id,
    template,
    title: null,
    subtitle: null,
    supertitle: null,
    description: null,
    footerLeft: null,
    footerRight: null,
    imageUrl: null,
    quoteText: null,
    speakerName: null,
    speakerRole: null,
    bigNumber: null,
    codeContent: null,
    slogan: null,
    leftTitle: null,
    leftText: null,
    rightTitle: null,
    rightText: null,
    bulletItems: [],
    steps: [],
    processSteps: [],
    agendaItems: [],
    milestones: [],
    links: [],
    columns: [],
    checklistItems: [],
    iconListItems: [],
    highlights: [],
  };
}

export const achraPresentationCoreOperations: AchraPresentationCoreOperations =
  {
    setPresentationInfoOperation(state, action) {
      const { title, author, date } = action.input;
      if (title !== undefined && title !== null) state.title = title;
      if (author !== undefined && author !== null) state.author = author;
      if (date !== undefined && date !== null) state.date = date;
    },

    addSlideOperation(state, action) {
      const { id, template, position } = action.input;
      const slide = createEmptySlide(id, template);
      if (
        position !== undefined &&
        position !== null &&
        position >= 0 &&
        position <= state.slides.length
      ) {
        state.slides.splice(position, 0, slide);
      } else {
        state.slides.push(slide);
      }
    },

    deleteSlideOperation(state, action) {
      const idx = state.slides.findIndex((s) => s.id === action.input.slideId);
      if (idx === -1) return;
      state.slides.splice(idx, 1);
    },

    duplicateSlideOperation(state, action) {
      const { id, slideId } = action.input;
      const source = state.slides.find((s) => s.id === slideId);
      if (!source) return;
      const clone = JSON.parse(JSON.stringify(source)) as Slide;
      clone.id = id;
      const idx = state.slides.findIndex((s) => s.id === slideId);
      state.slides.splice(idx + 1, 0, clone);
    },

    reorderSlidesOperation(state, action) {
      const { slideIds } = action.input;
      const map = new Map(state.slides.map((s) => [s.id, s]));
      const reordered = slideIds
        .map((id) => map.get(id))
        .filter((s): s is Slide => s !== undefined);
      state.slides.length = 0;
      state.slides.push(...reordered);
    },

    setSlideTemplateOperation(state, action) {
      const slide = state.slides.find((s) => s.id === action.input.slideId);
      if (!slide) return;
      slide.template = action.input.template;
    },

    updateSlideContentOperation(state, action) {
      const { slideId, ...fields } = action.input;
      const slide = state.slides.find((s) => s.id === slideId);
      if (!slide) return;
      for (const [key, value] of Object.entries(fields)) {
        if (value !== undefined && value !== null) {
          (slide as Record<string, unknown>)[key] = value;
        }
      }
    },
  };
