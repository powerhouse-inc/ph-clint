import { generateId } from "document-model/core";
import { EditableText } from "../EditableText.js";
import { EditableList } from "../EditableList.js";
import type { SlideTemplateProps } from "./shared.js";

export function SplitHighlightSlide({
  slide,
  onUpdateContent,
  onAddTextItem,
  onUpdateTextItem,
  onDeleteTextItem,
  onAddHighlight,
  onUpdateHighlight,
  onDeleteHighlight,
}: SlideTemplateProps) {
  return (
    <div className="slide-split">
      <div className="slide-half" style={{ gap: 12 }}>
        <EditableText
          value={slide.title}
          onCommit={(v) => onUpdateContent("title", v)}
          placeholder="Key Points"
          tag="h3"
          style={{ fontSize: 20, fontWeight: 700 }}
        />
        <ul className="bullet-list" style={{ flex: 1 }}>
          <EditableList
            items={slide.bulletItems}
            onAdd={(id, text) => onAddTextItem?.("BULLET_ITEMS", id, text)}
            onUpdate={(id, text) =>
              onUpdateTextItem?.("BULLET_ITEMS", id, text)
            }
            onDelete={(id) => onDeleteTextItem?.("BULLET_ITEMS", id)}
            placeholder="Bullet point"
            addLabel="+ Add bullet"
          />
        </ul>
      </div>
      <div
        className="slide-half accent-surface"
        style={{
          margin: 16,
          borderRadius: 10,
          gap: 16,
          justifyContent: "center",
        }}
      >
        {slide.highlights.map((h) => (
          <div
            key={h.id}
            className="list-item-wrapper"
            style={{
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              gap: 4,
            }}
          >
            <EditableText
              value={h.value}
              onCommit={(v) =>
                onUpdateHighlight?.(h.id, v, h.label, h.sublabel ?? undefined)
              }
              placeholder="99%"
              tag="h2"
              style={{ fontSize: 28, fontWeight: 700, color: "var(--primary)" }}
            />
            <EditableText
              value={h.label}
              onCommit={(v) =>
                onUpdateHighlight?.(h.id, h.value, v, h.sublabel ?? undefined)
              }
              placeholder="Metric label"
              style={{ fontSize: 12, fontWeight: 600 }}
            />
            <button
              className="item-delete"
              onClick={() => onDeleteHighlight?.(h.id)}
              title="Remove"
            >
              ×
            </button>
          </div>
        ))}
        <button
          className="add-item-btn"
          onClick={() => onAddHighlight?.(generateId(), "0", "Label")}
        >
          + Add highlight
        </button>
      </div>
    </div>
  );
}
