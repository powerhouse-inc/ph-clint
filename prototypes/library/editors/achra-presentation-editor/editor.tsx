import { useState, useCallback } from "react";
import { generateId } from "document-model/core";
import { useSelectedAchraPresentationDocument } from "@powerhousedao/agent-manager/document-models/achra-presentation";
import {
  addSlide,
  deleteSlide,
  duplicateSlide,
  updateSlideContent,
  addTextItem,
  updateTextItem,
  deleteTextItem,
  addProcessStep,
  updateProcessStep,
  deleteProcessStep,
  addAgendaItem,
  updateAgendaItem,
  deleteAgendaItem,
  addMilestone,
  updateMilestone,
  deleteMilestone,
  addLink,
  updateLink,
  deleteLink,
  setColumnTitle,
  addColumnBullet,
  updateColumnBullet,
  deleteColumnBullet,
  addChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
  addIconListItem,
  updateIconListItem,
  deleteIconListItem,
  addHighlight,
  updateHighlight,
  deleteHighlight,
  setPresentationInfo,
} from "../../document-models/achra-presentation/gen/creators.js";
import type { SlideTemplate } from "../../document-models/achra-presentation/gen/schema/types.js";
import { AchraIcon } from "./components/AchraLogo.js";
import { AchraStyles } from "./components/AchraStyles.js";
import { SlidePanel } from "./components/SlidePanel.js";
import { SlideCanvas } from "./components/SlideCanvas.js";
import { TemplatePicker } from "./components/TemplatePicker.js";
import { EditableText } from "./components/EditableText.js";
import { PresentMode } from "./components/PresentMode.js";

export default function Editor() {
  const [document, dispatch] = useSelectedAchraPresentationDocument();
  const [selectedSlideId, setSelectedSlideId] = useState<string | null>(null);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [presenting, setPresenting] = useState(false);

  const state = document?.state.global;
  const slides = state?.slides ?? [];
  const selectedSlide =
    slides.find((s) => s.id === selectedSlideId) ?? slides[0] ?? null;

  // Auto-select first slide if none selected
  if (selectedSlide && selectedSlideId !== selectedSlide.id) {
    setSelectedSlideId(selectedSlide.id);
  }

  const handleAddSlide = useCallback(
    (template: SlideTemplate) => {
      if (!dispatch) return;
      const id = generateId();
      dispatch(addSlide({ id, template }));
      setSelectedSlideId(id);
      setShowTemplatePicker(false);
    },
    [dispatch],
  );

  const handleDeleteSlide = useCallback(
    (slideId: string) => {
      if (!dispatch) return;
      dispatch(deleteSlide({ slideId }));
      if (selectedSlideId === slideId) {
        const idx = slides.findIndex((s) => s.id === slideId);
        const next = slides[idx + 1] ?? slides[idx - 1];
        setSelectedSlideId(next?.id ?? null);
      }
    },
    [dispatch, selectedSlideId, slides],
  );

  const handleDuplicateSlide = useCallback(
    (slideId: string) => {
      if (!dispatch) return;
      const id = generateId();
      dispatch(duplicateSlide({ id, slideId }));
      setSelectedSlideId(id);
    },
    [dispatch],
  );

  const handleUpdateContent = useCallback(
    (field: string, value: string) => {
      if (!dispatch || !selectedSlide) return;
      dispatch(
        updateSlideContent({ slideId: selectedSlide.id, [field]: value }),
      );
    },
    [dispatch, selectedSlide],
  );

  if (!document || !state) return null;

  return (
    <div
      className="achra-editor"
      style={{
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <AchraStyles />
      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "8px 16px",
          borderBottom: "1px solid #D7D8D9",
          background: "#FCFCFC",
          flexShrink: 0,
        }}
      >
        <AchraIcon size={24} />
        <EditableText
          value={state.title}
          onCommit={(v) => dispatch(setPresentationInfo({ title: v }))}
          placeholder="Presentation Title"
          style={{ fontSize: 14, fontWeight: 600, color: "#343839" }}
        />
        <span style={{ color: "#D7D8D9" }}>|</span>
        <EditableText
          value={state.author}
          onCommit={(v) => dispatch(setPresentationInfo({ author: v }))}
          placeholder="Author"
          style={{ fontSize: 12, color: "#9EA0A1" }}
        />
        <EditableText
          value={state.date}
          onCommit={(v) => dispatch(setPresentationInfo({ date: v }))}
          placeholder="Date"
          style={{ fontSize: 12, color: "#9EA0A1" }}
        />
        <div style={{ flex: 1 }} />
        <button
          onClick={() => slides.length > 0 && setPresenting(true)}
          disabled={slides.length === 0}
          style={{
            padding: "6px 16px",
            borderRadius: 6,
            border: "none",
            background: slides.length > 0 ? "#7A3AFF" : "#D7D8D9",
            color: "#FFF",
            fontSize: 12,
            fontWeight: 600,
            cursor: slides.length > 0 ? "pointer" : "default",
            fontFamily: "'Inter', sans-serif",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span style={{ fontSize: 14 }}>&#9654;</span>
          Present
        </button>
      </div>

      {/* Main area */}
      <div
        style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}
      >
        <SlidePanel
          slides={slides}
          selectedSlideId={selectedSlide?.id ?? null}
          onSelectSlide={setSelectedSlideId}
          onDeleteSlide={handleDeleteSlide}
          onDuplicateSlide={handleDuplicateSlide}
          onOpenTemplatePicker={() => setShowTemplatePicker(true)}
        />

        {selectedSlide ? (
          <SlideCanvas
            slide={selectedSlide}
            onUpdateContent={handleUpdateContent}
            onAddTextItem={(listField, id, text) =>
              dispatch(
                addTextItem({ slideId: selectedSlide.id, id, listField, text }),
              )
            }
            onUpdateTextItem={(listField, id, text) =>
              dispatch(
                updateTextItem({
                  slideId: selectedSlide.id,
                  id,
                  listField,
                  text,
                }),
              )
            }
            onDeleteTextItem={(listField, id) =>
              dispatch(
                deleteTextItem({ slideId: selectedSlide.id, id, listField }),
              )
            }
            onAddProcessStep={(id, title) =>
              dispatch(addProcessStep({ slideId: selectedSlide.id, id, title }))
            }
            onUpdateProcessStep={(id, title, description) =>
              dispatch(
                updateProcessStep({
                  slideId: selectedSlide.id,
                  id,
                  title,
                  description,
                }),
              )
            }
            onDeleteProcessStep={(id) =>
              dispatch(deleteProcessStep({ slideId: selectedSlide.id, id }))
            }
            onAddAgendaItem={(id, title) =>
              dispatch(addAgendaItem({ slideId: selectedSlide.id, id, title }))
            }
            onUpdateAgendaItem={(id, title) =>
              dispatch(
                updateAgendaItem({ slideId: selectedSlide.id, id, title }),
              )
            }
            onDeleteAgendaItem={(id) =>
              dispatch(deleteAgendaItem({ slideId: selectedSlide.id, id }))
            }
            onAddMilestone={(id, period, title) =>
              dispatch(
                addMilestone({ slideId: selectedSlide.id, id, period, title }),
              )
            }
            onUpdateMilestone={(id, period, title, description) =>
              dispatch(
                updateMilestone({
                  slideId: selectedSlide.id,
                  id,
                  period,
                  title,
                  description,
                }),
              )
            }
            onDeleteMilestone={(id) =>
              dispatch(deleteMilestone({ slideId: selectedSlide.id, id }))
            }
            onAddLink={(id, text) =>
              dispatch(addLink({ slideId: selectedSlide.id, id, text }))
            }
            onUpdateLink={(id, text) =>
              dispatch(updateLink({ slideId: selectedSlide.id, id, text }))
            }
            onDeleteLink={(id) =>
              dispatch(deleteLink({ slideId: selectedSlide.id, id }))
            }
            onSetColumnTitle={(columnIndex, title) =>
              dispatch(
                setColumnTitle({
                  slideId: selectedSlide.id,
                  columnIndex,
                  title,
                }),
              )
            }
            onAddColumnBullet={(columnIndex, id, text) =>
              dispatch(
                addColumnBullet({
                  slideId: selectedSlide.id,
                  columnIndex,
                  id,
                  text,
                }),
              )
            }
            onUpdateColumnBullet={(columnIndex, id, text) =>
              dispatch(
                updateColumnBullet({
                  slideId: selectedSlide.id,
                  columnIndex,
                  id,
                  text,
                }),
              )
            }
            onDeleteColumnBullet={(columnIndex, id) =>
              dispatch(
                deleteColumnBullet({
                  slideId: selectedSlide.id,
                  columnIndex,
                  id,
                }),
              )
            }
            onAddChecklistItem={(id, text) =>
              dispatch(
                addChecklistItem({ slideId: selectedSlide.id, id, text }),
              )
            }
            onUpdateChecklistItem={(id, text, checked) =>
              dispatch(
                updateChecklistItem({
                  slideId: selectedSlide.id,
                  id,
                  text,
                  checked,
                }),
              )
            }
            onDeleteChecklistItem={(id) =>
              dispatch(deleteChecklistItem({ slideId: selectedSlide.id, id }))
            }
            onAddIconListItem={(id, title) =>
              dispatch(
                addIconListItem({ slideId: selectedSlide.id, id, title }),
              )
            }
            onUpdateIconListItem={(id, title, description) =>
              dispatch(
                updateIconListItem({
                  slideId: selectedSlide.id,
                  id,
                  title,
                  description,
                }),
              )
            }
            onDeleteIconListItem={(id) =>
              dispatch(deleteIconListItem({ slideId: selectedSlide.id, id }))
            }
            onAddHighlight={(id, value, label) =>
              dispatch(
                addHighlight({ slideId: selectedSlide.id, id, value, label }),
              )
            }
            onUpdateHighlight={(id, value, label, sublabel) =>
              dispatch(
                updateHighlight({
                  slideId: selectedSlide.id,
                  id,
                  value,
                  label,
                  sublabel,
                }),
              )
            }
            onDeleteHighlight={(id) =>
              dispatch(deleteHighlight({ slideId: selectedSlide.id, id }))
            }
          />
        ) : (
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#E8E8E8",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div style={{ fontSize: 48, opacity: 0.3 }}>◆</div>
            <p style={{ fontSize: 14, color: "#9EA0A1" }}>
              Add a slide to get started
            </p>
            <button
              onClick={() => setShowTemplatePicker(true)}
              style={{
                padding: "10px 24px",
                borderRadius: 8,
                border: "none",
                background: "#7A3AFF",
                color: "#FFF",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              + Add Slide
            </button>
          </div>
        )}
      </div>

      {showTemplatePicker && (
        <TemplatePicker
          onSelect={handleAddSlide}
          onClose={() => setShowTemplatePicker(false)}
        />
      )}

      {presenting && (
        <PresentMode
          slides={slides}
          initialSlideIndex={Math.max(
            0,
            slides.findIndex((s) => s.id === selectedSlide?.id),
          )}
          onExit={() => setPresenting(false)}
        />
      )}
    </div>
  );
}
