import type { Slide, TextListField } from "../../gen/schema/types.js";
import type { AchraPresentationTextListsOperations } from "@powerhousedao/agent-manager/document-models/achra-presentation";

function getTextList(slide: Slide, field: TextListField) {
  return field === "BULLET_ITEMS" ? slide.bulletItems : slide.steps;
}

export const achraPresentationTextListsOperations: AchraPresentationTextListsOperations =
  {
    addTextItemOperation(state, action) {
      const slide = state.slides.find((s) => s.id === action.input.slideId);
      if (!slide) return;
      const list = getTextList(slide, action.input.listField);
      const item = { id: action.input.id, text: action.input.text };
      const pos = action.input.position;
      if (pos !== undefined && pos !== null && pos >= 0 && pos <= list.length) {
        list.splice(pos, 0, item);
      } else {
        list.push(item);
      }
    },

    updateTextItemOperation(state, action) {
      const slide = state.slides.find((s) => s.id === action.input.slideId);
      if (!slide) return;
      const list = getTextList(slide, action.input.listField);
      const item = list.find((i) => i.id === action.input.id);
      if (!item) return;
      item.text = action.input.text;
    },

    deleteTextItemOperation(state, action) {
      const slide = state.slides.find((s) => s.id === action.input.slideId);
      if (!slide) return;
      const list = getTextList(slide, action.input.listField);
      const idx = list.findIndex((i) => i.id === action.input.id);
      if (idx !== -1) list.splice(idx, 1);
    },

    reorderTextItemsOperation(state, action) {
      const slide = state.slides.find((s) => s.id === action.input.slideId);
      if (!slide) return;
      const list = getTextList(slide, action.input.listField);
      const map = new Map(list.map((i) => [i.id, i]));
      const reordered = action.input.itemIds
        .map((id) => map.get(id))
        .filter(Boolean);
      list.length = 0;
      list.push(...(reordered as typeof list));
    },

    setColumnTitleOperation(state, action) {
      const slide = state.slides.find((s) => s.id === action.input.slideId);
      if (!slide) return;
      const { columnIndex, title } = action.input;
      while (slide.columns.length <= columnIndex) {
        slide.columns.push({ title: null, bulletItems: [] });
      }
      slide.columns[columnIndex].title = title;
    },

    addColumnBulletOperation(state, action) {
      const slide = state.slides.find((s) => s.id === action.input.slideId);
      if (!slide) return;
      const { columnIndex, id, text, position } = action.input;
      while (slide.columns.length <= columnIndex) {
        slide.columns.push({ title: null, bulletItems: [] });
      }
      const list = slide.columns[columnIndex].bulletItems;
      const item = { id, text };
      if (
        position !== undefined &&
        position !== null &&
        position >= 0 &&
        position <= list.length
      ) {
        list.splice(position, 0, item);
      } else {
        list.push(item);
      }
    },

    updateColumnBulletOperation(state, action) {
      const slide = state.slides.find((s) => s.id === action.input.slideId);
      if (!slide) return;
      const col = slide.columns[action.input.columnIndex];
      if (!col) return;
      const item = col.bulletItems.find((i) => i.id === action.input.id);
      if (!item) return;
      item.text = action.input.text;
    },

    deleteColumnBulletOperation(state, action) {
      const slide = state.slides.find((s) => s.id === action.input.slideId);
      if (!slide) return;
      const col = slide.columns[action.input.columnIndex];
      if (!col) return;
      const idx = col.bulletItems.findIndex((i) => i.id === action.input.id);
      if (idx !== -1) col.bulletItems.splice(idx, 1);
    },

    reorderColumnBulletsOperation(state, action) {
      const slide = state.slides.find((s) => s.id === action.input.slideId);
      if (!slide) return;
      const col = slide.columns[action.input.columnIndex];
      if (!col) return;
      const map = new Map(col.bulletItems.map((i) => [i.id, i]));
      const reordered = action.input.bulletIds
        .map((id) => map.get(id))
        .filter(Boolean);
      col.bulletItems.length = 0;
      col.bulletItems.push(...(reordered as typeof col.bulletItems));
    },

    addChecklistItemOperation(state, action) {
      const slide = state.slides.find((s) => s.id === action.input.slideId);
      if (!slide) return;
      slide.checklistItems.push({
        id: action.input.id,
        text: action.input.text,
        checked: action.input.checked ?? false,
      });
    },

    updateChecklistItemOperation(state, action) {
      const slide = state.slides.find((s) => s.id === action.input.slideId);
      if (!slide) return;
      const item = slide.checklistItems.find((i) => i.id === action.input.id);
      if (!item) return;
      if (action.input.text !== undefined && action.input.text !== null)
        item.text = action.input.text;
      if (action.input.checked !== undefined && action.input.checked !== null)
        item.checked = action.input.checked;
    },

    deleteChecklistItemOperation(state, action) {
      const slide = state.slides.find((s) => s.id === action.input.slideId);
      if (!slide) return;
      const idx = slide.checklistItems.findIndex(
        (i) => i.id === action.input.id,
      );
      if (idx !== -1) slide.checklistItems.splice(idx, 1);
    },

    reorderChecklistItemsOperation(state, action) {
      const slide = state.slides.find((s) => s.id === action.input.slideId);
      if (!slide) return;
      const map = new Map(slide.checklistItems.map((i) => [i.id, i]));
      const reordered = action.input.itemIds
        .map((id) => map.get(id))
        .filter(Boolean);
      slide.checklistItems.length = 0;
      slide.checklistItems.push(...(reordered as typeof slide.checklistItems));
    },

    addIconListItemOperation(state, action) {
      const slide = state.slides.find((s) => s.id === action.input.slideId);
      if (!slide) return;
      slide.iconListItems.push({
        id: action.input.id,
        title: action.input.title,
        description: action.input.description || null,
      });
    },

    updateIconListItemOperation(state, action) {
      const slide = state.slides.find((s) => s.id === action.input.slideId);
      if (!slide) return;
      const item = slide.iconListItems.find((i) => i.id === action.input.id);
      if (!item) return;
      if (action.input.title) item.title = action.input.title;
      if (
        action.input.description !== undefined &&
        action.input.description !== null
      )
        item.description = action.input.description;
    },

    deleteIconListItemOperation(state, action) {
      const slide = state.slides.find((s) => s.id === action.input.slideId);
      if (!slide) return;
      const idx = slide.iconListItems.findIndex(
        (i) => i.id === action.input.id,
      );
      if (idx !== -1) slide.iconListItems.splice(idx, 1);
    },

    reorderIconListItemsOperation(state, action) {
      const slide = state.slides.find((s) => s.id === action.input.slideId);
      if (!slide) return;
      const map = new Map(slide.iconListItems.map((i) => [i.id, i]));
      const reordered = action.input.itemIds
        .map((id) => map.get(id))
        .filter(Boolean);
      slide.iconListItems.length = 0;
      slide.iconListItems.push(...(reordered as typeof slide.iconListItems));
    },

    addHighlightOperation(state, action) {
      const slide = state.slides.find((s) => s.id === action.input.slideId);
      if (!slide) return;
      slide.highlights.push({
        id: action.input.id,
        value: action.input.value,
        label: action.input.label,
        sublabel: action.input.sublabel || null,
      });
    },

    updateHighlightOperation(state, action) {
      const slide = state.slides.find((s) => s.id === action.input.slideId);
      if (!slide) return;
      const h = slide.highlights.find((i) => i.id === action.input.id);
      if (!h) return;
      if (action.input.value) h.value = action.input.value;
      if (action.input.label) h.label = action.input.label;
      if (action.input.sublabel !== undefined && action.input.sublabel !== null)
        h.sublabel = action.input.sublabel;
    },

    deleteHighlightOperation(state, action) {
      const slide = state.slides.find((s) => s.id === action.input.slideId);
      if (!slide) return;
      const idx = slide.highlights.findIndex((i) => i.id === action.input.id);
      if (idx !== -1) slide.highlights.splice(idx, 1);
    },

    reorderHighlightsOperation(state, action) {
      const slide = state.slides.find((s) => s.id === action.input.slideId);
      if (!slide) return;
      const map = new Map(slide.highlights.map((i) => [i.id, i]));
      const reordered = action.input.highlightIds
        .map((id) => map.get(id))
        .filter(Boolean);
      slide.highlights.length = 0;
      slide.highlights.push(...(reordered as typeof slide.highlights));
    },
  };
