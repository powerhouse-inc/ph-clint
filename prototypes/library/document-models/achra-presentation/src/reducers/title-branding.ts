import type { AchraPresentationTitleBrandingOperations } from "@powerhousedao/agent-manager/document-models/achra-presentation";

export const achraPresentationTitleBrandingOperations: AchraPresentationTitleBrandingOperations =
  {
    addLinkOperation(state, action) {
      const slide = state.slides.find((s) => s.id === action.input.slideId);
      if (!slide) return;
      slide.links.push({
        id: action.input.id,
        text: action.input.text,
      });
    },

    updateLinkOperation(state, action) {
      const slide = state.slides.find((s) => s.id === action.input.slideId);
      if (!slide) return;
      const link = slide.links.find((l) => l.id === action.input.id);
      if (!link) return;
      link.text = action.input.text;
    },

    deleteLinkOperation(state, action) {
      const slide = state.slides.find((s) => s.id === action.input.slideId);
      if (!slide) return;
      const idx = slide.links.findIndex((l) => l.id === action.input.id);
      if (idx !== -1) slide.links.splice(idx, 1);
    },

    reorderLinksOperation(state, action) {
      const slide = state.slides.find((s) => s.id === action.input.slideId);
      if (!slide) return;
      const map = new Map(slide.links.map((l) => [l.id, l]));
      const reordered = action.input.linkIds
        .map((id) => map.get(id))
        .filter(Boolean);
      slide.links.length = 0;
      slide.links.push(...(reordered as typeof slide.links));
    },
  };
