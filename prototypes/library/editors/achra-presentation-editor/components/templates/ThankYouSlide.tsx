import { generateId } from "document-model/core";
import { EditableText } from "../EditableText.js";
import { AchraIcon } from "../AchraLogo.js";
import type { SlideTemplateProps } from "./shared.js";

export function ThankYouSlide({
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
      <AchraIcon size={80} />
      <EditableText
        value={slide.title}
        onCommit={(v) => onUpdateContent("title", v)}
        placeholder="Thank You"
        tag="h1"
        style={{
          fontSize: 32,
          fontWeight: 700,
          lineHeight: 1.2,
          marginTop: 16,
        }}
      />
      <EditableText
        value={slide.subtitle}
        onCommit={(v) => onUpdateContent("subtitle", v)}
        placeholder="Questions? Reach out below."
        tag="p"
        style={{
          fontSize: 13,
          color: "var(--foreground-70)",
          maxWidth: "50%",
          lineHeight: 1.5,
          marginTop: 12,
          marginBottom: 24,
        }}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 24,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {slide.links.map((link) => (
          <div
            key={link.id}
            className="list-item-wrapper"
            style={{ alignItems: "center" }}
          >
            <EditableText
              value={link.text}
              onCommit={(v) => onUpdateLink?.(link.id, v)}
              placeholder="contact@example.com"
              style={{ fontSize: 11, color: "var(--muted-foreground)", fontWeight: 500 }}
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
          onClick={() => onAddLink?.(generateId(), "example.com")}
        >
          + Add link
        </button>
      </div>
    </div>
  );
}
