import type { AchraPresentationStructureFlowOperations } from "@powerhousedao/agent-manager/document-models/achra-presentation";

export const achraPresentationStructureFlowOperations: AchraPresentationStructureFlowOperations =
  {
    addProcessStepOperation(state, action) {
      const slide = state.slides.find((s) => s.id === action.input.slideId);
      if (!slide) return;
      slide.processSteps.push({
        id: action.input.id,
        title: action.input.title,
        description: action.input.description || null,
      });
    },

    updateProcessStepOperation(state, action) {
      const slide = state.slides.find((s) => s.id === action.input.slideId);
      if (!slide) return;
      const step = slide.processSteps.find((s) => s.id === action.input.id);
      if (!step) return;
      if (action.input.title) step.title = action.input.title;
      if (
        action.input.description !== undefined &&
        action.input.description !== null
      )
        step.description = action.input.description;
    },

    deleteProcessStepOperation(state, action) {
      const slide = state.slides.find((s) => s.id === action.input.slideId);
      if (!slide) return;
      const idx = slide.processSteps.findIndex((s) => s.id === action.input.id);
      if (idx !== -1) slide.processSteps.splice(idx, 1);
    },

    reorderProcessStepsOperation(state, action) {
      const slide = state.slides.find((s) => s.id === action.input.slideId);
      if (!slide) return;
      const map = new Map(slide.processSteps.map((s) => [s.id, s]));
      const reordered = action.input.stepIds
        .map((id) => map.get(id))
        .filter(Boolean);
      slide.processSteps.length = 0;
      slide.processSteps.push(...(reordered as typeof slide.processSteps));
    },

    addAgendaItemOperation(state, action) {
      const slide = state.slides.find((s) => s.id === action.input.slideId);
      if (!slide) return;
      slide.agendaItems.push({
        id: action.input.id,
        title: action.input.title,
      });
    },

    updateAgendaItemOperation(state, action) {
      const slide = state.slides.find((s) => s.id === action.input.slideId);
      if (!slide) return;
      const item = slide.agendaItems.find((i) => i.id === action.input.id);
      if (!item) return;
      item.title = action.input.title;
    },

    deleteAgendaItemOperation(state, action) {
      const slide = state.slides.find((s) => s.id === action.input.slideId);
      if (!slide) return;
      const idx = slide.agendaItems.findIndex((i) => i.id === action.input.id);
      if (idx !== -1) slide.agendaItems.splice(idx, 1);
    },

    reorderAgendaItemsOperation(state, action) {
      const slide = state.slides.find((s) => s.id === action.input.slideId);
      if (!slide) return;
      const map = new Map(slide.agendaItems.map((i) => [i.id, i]));
      const reordered = action.input.itemIds
        .map((id) => map.get(id))
        .filter(Boolean);
      slide.agendaItems.length = 0;
      slide.agendaItems.push(...(reordered as typeof slide.agendaItems));
    },

    addMilestoneOperation(state, action) {
      const slide = state.slides.find((s) => s.id === action.input.slideId);
      if (!slide) return;
      slide.milestones.push({
        id: action.input.id,
        period: action.input.period,
        title: action.input.title,
        description: action.input.description || null,
      });
    },

    updateMilestoneOperation(state, action) {
      const slide = state.slides.find((s) => s.id === action.input.slideId);
      if (!slide) return;
      const ms = slide.milestones.find((m) => m.id === action.input.id);
      if (!ms) return;
      if (action.input.period) ms.period = action.input.period;
      if (action.input.title) ms.title = action.input.title;
      if (
        action.input.description !== undefined &&
        action.input.description !== null
      )
        ms.description = action.input.description;
    },

    deleteMilestoneOperation(state, action) {
      const slide = state.slides.find((s) => s.id === action.input.slideId);
      if (!slide) return;
      const idx = slide.milestones.findIndex((m) => m.id === action.input.id);
      if (idx !== -1) slide.milestones.splice(idx, 1);
    },

    reorderMilestonesOperation(state, action) {
      const slide = state.slides.find((s) => s.id === action.input.slideId);
      if (!slide) return;
      const map = new Map(slide.milestones.map((m) => [m.id, m]));
      const reordered = action.input.milestoneIds
        .map((id) => map.get(id))
        .filter(Boolean);
      slide.milestones.length = 0;
      slide.milestones.push(...(reordered as typeof slide.milestones));
    },
  };
