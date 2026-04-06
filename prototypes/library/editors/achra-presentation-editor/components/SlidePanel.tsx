import type { Slide } from "../../../document-models/achra-presentation/gen/schema/types.js";
import { SlideThumbnail } from "./SlideThumbnail.js";

interface SlidePanelProps {
  slides: Slide[];
  selectedSlideId: string | null;
  onSelectSlide: (id: string) => void;
  onDeleteSlide: (id: string) => void;
  onDuplicateSlide: (id: string) => void;
  onOpenTemplatePicker: () => void;
}

export function SlidePanel({
  slides,
  selectedSlideId,
  onSelectSlide,
  onDeleteSlide,
  onDuplicateSlide,
  onOpenTemplatePicker,
}: SlidePanelProps) {
  return (
    <div
      style={{
        width: 192,
        minWidth: 192,
        borderRight: "1px solid #D7D8D9",
        background: "#F5F5F7",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div
        style={{
          padding: "12px 12px 8px",
          fontSize: 11,
          fontWeight: 600,
          color: "#9EA0A1",
          textTransform: "uppercase",
          letterSpacing: 1,
        }}
      >
        Slides ({slides.length})
      </div>
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          padding: "0 8px 8px",
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        {slides.map((slide, index) => (
          <SlideThumbnail
            key={slide.id}
            slide={slide}
            index={index}
            isSelected={slide.id === selectedSlideId}
            onClick={() => onSelectSlide(slide.id)}
            onDelete={() => onDeleteSlide(slide.id)}
            onDuplicate={() => onDuplicateSlide(slide.id)}
          />
        ))}
      </div>
      <div style={{ padding: 8, borderTop: "1px solid #D7D8D9" }}>
        <button
          onClick={onOpenTemplatePicker}
          style={{
            width: "100%",
            padding: "8px 0",
            border: "1px dashed #7A3AFF",
            borderRadius: 6,
            background: "none",
            color: "#7A3AFF",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          + Add Slide
        </button>
      </div>
    </div>
  );
}
