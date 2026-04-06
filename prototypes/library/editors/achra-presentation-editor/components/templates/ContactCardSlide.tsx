import { generateId } from "document-model/core";
import { EditableText } from "../EditableText.js";
import type { SlideTemplateProps } from "./shared.js";

export function ContactCardSlide({
  slide,
  onUpdateContent,
  onAddLink,
  onUpdateLink,
  onDeleteLink,
}: SlideTemplateProps) {
  return (
    <div className="slide-split">
      <div
        className="slide-half"
        style={{
          background: "var(--primary)",
          color: "#FCFCFC",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div
          className="avatar"
          style={{
            width: 80,
            height: 80,
            background: "rgba(255,255,255,0.2)",
            fontSize: 28,
          }}
        >
          {(slide.title ?? "C")[0]?.toUpperCase()}
        </div>
      </div>
      <div className="slide-half" style={{ justifyContent: "center", gap: 12 }}>
        <EditableText
          value={slide.title}
          onCommit={(v) => onUpdateContent("title", v)}
          placeholder="Contact Name"
          tag="h3"
          style={{ fontSize: 22, fontWeight: 700 }}
        />
        <EditableText
          value={slide.subtitle}
          onCommit={(v) => onUpdateContent("subtitle", v)}
          placeholder="Role / Department"
          style={{ fontSize: 13, color: "var(--muted-foreground)" }}
        />
        <div
          className="divider-bar"
          style={{ marginTop: 8, marginBottom: 8 }}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {slide.links.map((link) => (
            <div
              key={link.id}
              className="list-item-wrapper"
              style={{ alignItems: "center" }}
            >
              <span
                style={{
                  fontSize: 12,
                  color: "var(--primary)",
                  marginRight: 8,
                }}
              >
                →
              </span>
              <EditableText
                value={link.text}
                onCommit={(v) => onUpdateLink?.(link.id, v)}
                placeholder="contact@example.com"
                style={{ fontSize: 12, color: "var(--foreground-70)", flex: 1 }}
              />
              <button
                className="item-delete"
                onClick={() => onDeleteLink?.(link.id)}
                title="Remove"
              >
                ×
              </button>
            </div>
          ))}
          <button
            className="add-item-btn"
            onClick={() => onAddLink?.(generateId(), "info@example.com")}
          >
            + Add link
          </button>
        </div>
      </div>
    </div>
  );
}
