import { generateId } from "document-model/core";
import { EditableText } from "../EditableText.js";
import type { SlideTemplateProps } from "./shared.js";
import { POSITION_COLORS } from "./shared.js";

export function TagsEcosystemSlide({
  slide,
  onUpdateContent,
  onAddLink,
  onUpdateLink,
  onDeleteLink,
}: SlideTemplateProps) {
  return (
    <div
      className="slide-pad"
      style={{
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
      }}
    >
      <EditableText
        value={slide.title}
        onCommit={(v) => onUpdateContent("title", v)}
        placeholder="Ecosystem"
        tag="h3"
        style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}
      />
      <EditableText
        value={slide.description}
        onCommit={(v) => onUpdateContent("description", v)}
        placeholder="Technologies, integrations, and partners"
        tag="p"
        style={{
          fontSize: 12,
          color: "var(--foreground-70)",
          marginBottom: 24,
        }}
      />
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          justifyContent: "center",
          maxWidth: "80%",
        }}
      >
        {slide.links.map((link, i) => {
          const color = POSITION_COLORS[i % POSITION_COLORS.length];
          return (
            <div
              key={link.id}
              className="list-item-wrapper"
              style={{ alignItems: "center" }}
            >
              <span
                className="tag-pill"
                style={{ background: color.bg, color: color.fg }}
              >
                <EditableText
                  value={link.text}
                  onCommit={(v) => onUpdateLink?.(link.id, v)}
                  placeholder="Tag"
                  style={{ fontSize: 11, fontWeight: 600 }}
                />
              </span>
              <button
                className="item-delete"
                onClick={() => onDeleteLink?.(link.id)}
                title="Remove"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
      <button
        className="add-item-btn"
        onClick={() => onAddLink?.(generateId(), "New tag")}
        style={{ marginTop: 16 }}
      >
        + Add tag
      </button>
    </div>
  );
}
