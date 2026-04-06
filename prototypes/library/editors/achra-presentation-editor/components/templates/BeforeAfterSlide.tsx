import { EditableText } from "../EditableText.js";
import type { SlideTemplateProps } from "./shared.js";

export function BeforeAfterSlide({
  slide,
  onUpdateContent,
}: SlideTemplateProps) {
  return (
    <div className="slide-pad">
      <EditableText
        value={slide.title}
        onCommit={(v) => onUpdateContent("title", v)}
        placeholder="Before vs After"
        tag="h3"
        style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}
      />
      <div style={{ display: "flex", gap: 16, flex: 1 }}>
        <div
          style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}
        >
          <span
            className="tag-pill"
            style={{
              background: "var(--destructive-30)",
              color: "var(--destructive)",
              alignSelf: "flex-start",
            }}
          >
            Before
          </span>
          <EditableText
            value={slide.leftTitle}
            onCommit={(v) => onUpdateContent("leftTitle", v)}
            placeholder="Before state"
            tag="h4"
            style={{ fontSize: 14, fontWeight: 700 }}
          />
          <EditableText
            value={slide.leftText}
            onCommit={(v) => onUpdateContent("leftText", v)}
            placeholder="Describe the before state"
            tag="p"
            style={{
              fontSize: 12,
              lineHeight: 1.7,
              color: "var(--foreground-70)",
              flex: 1,
            }}
          />
        </div>
        <div style={{ width: 2, background: "var(--border)" }} />
        <div
          style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}
        >
          <span
            className="tag-pill"
            style={{
              background: "var(--success-30)",
              color: "var(--success)",
              alignSelf: "flex-start",
            }}
          >
            After
          </span>
          <EditableText
            value={slide.rightTitle}
            onCommit={(v) => onUpdateContent("rightTitle", v)}
            placeholder="After state"
            tag="h4"
            style={{ fontSize: 14, fontWeight: 700 }}
          />
          <EditableText
            value={slide.rightText}
            onCommit={(v) => onUpdateContent("rightText", v)}
            placeholder="Describe the after state"
            tag="p"
            style={{
              fontSize: 12,
              lineHeight: 1.7,
              color: "var(--foreground-70)",
              flex: 1,
            }}
          />
        </div>
      </div>
    </div>
  );
}
