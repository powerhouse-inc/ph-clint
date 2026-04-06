import type { Slide } from "../../../document-models/achra-presentation/gen/schema/types.js";
import { TEMPLATE_LABELS } from "./templates/shared.js";

interface SlideThumbnailProps {
  slide: Slide;
  index: number;
  isSelected: boolean;
  onClick: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

export function SlideThumbnail({
  slide,
  index,
  isSelected,
  onClick,
  onDelete,
  onDuplicate,
}: SlideThumbnailProps) {
  const isPrimary =
    slide.template === "TITLE_PRIMARY" ||
    slide.template === "QUOTE" ||
    slide.template === "BIG_NUMBER";

  return (
    <div
      onClick={onClick}
      style={{
        padding: 4,
        borderRadius: 6,
        border: isSelected ? "2px solid #7A3AFF" : "2px solid transparent",
        cursor: "pointer",
        transition: "border-color 0.15s",
      }}
    >
      <div
        style={{
          width: 160,
          height: 90,
          borderRadius: 4,
          overflow: "hidden",
          background: isPrimary ? "#7A3AFF" : "#FCFCFC",
          border: "1px solid #D7D8D9",
          display: "flex",
          flexDirection: "column",
          padding: "8px 10px",
          gap: 4,
          position: "relative",
        }}
      >
        <span
          style={{
            fontSize: 7,
            fontWeight: 700,
            color: isPrimary ? "rgba(255,255,255,0.5)" : "#9EA0A1",
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          {TEMPLATE_LABELS[slide.template]}
        </span>
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            color: isPrimary ? "#FCFCFC" : "#343839",
            lineHeight: 1.2,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {slide.title || slide.quoteText || slide.slogan || "Untitled"}
        </span>
        {slide.subtitle && (
          <span
            style={{
              fontSize: 7,
              color: isPrimary ? "rgba(255,255,255,0.6)" : "rgba(52,56,57,0.5)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {slide.subtitle}
          </span>
        )}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 4,
          padding: "0 2px",
        }}
      >
        <span style={{ fontSize: 10, color: "#9EA0A1", fontWeight: 500 }}>
          {index + 1}
        </span>
        <div style={{ display: "flex", gap: 4 }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate();
            }}
            title="Duplicate"
            style={{
              border: "none",
              background: "none",
              cursor: "pointer",
              fontSize: 12,
              color: "#9EA0A1",
              padding: 2,
            }}
          >
            ⧉
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title="Delete"
            style={{
              border: "none",
              background: "none",
              cursor: "pointer",
              fontSize: 12,
              color: "#EA4335",
              padding: 2,
            }}
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
