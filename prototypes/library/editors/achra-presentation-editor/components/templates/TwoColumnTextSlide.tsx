import { EditableText } from "../EditableText.js";
import { AchraIcon } from "../AchraLogo.js";
import type { SlideTemplateProps } from "./shared.js";

export function TwoColumnTextSlide({
  slide,
  onUpdateContent,
}: SlideTemplateProps) {
  return (
    <div className="slide-pad" style={{ position: "relative" }}>
      <div style={{ position: "absolute", top: 24, right: 24 }}>
        <AchraIcon size={28} />
      </div>
      <EditableText
        value={slide.title}
        onCommit={(v) => onUpdateContent("title", v)}
        placeholder="Two-Column Title"
        tag="h3"
        style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}
      />
      <div className="divider-bar" />
      <div style={{ display: "flex", gap: 32, flex: 1, marginTop: 16 }}>
        <div
          style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}
        >
          <EditableText
            value={slide.leftTitle}
            onCommit={(v) => onUpdateContent("leftTitle", v)}
            placeholder="Left Column Title"
            tag="h4"
            style={{ fontSize: 14, fontWeight: 700, color: "var(--primary)" }}
          />
          <EditableText
            value={slide.leftText}
            onCommit={(v) => onUpdateContent("leftText", v)}
            placeholder="Left column content goes here. Click to edit."
            tag="p"
            style={{
              fontSize: 12,
              lineHeight: 1.7,
              color: "var(--foreground-70)",
            }}
          />
        </div>
        <div style={{ width: 1, background: "var(--border)" }} />
        <div
          style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}
        >
          <EditableText
            value={slide.rightTitle}
            onCommit={(v) => onUpdateContent("rightTitle", v)}
            placeholder="Right Column Title"
            tag="h4"
            style={{ fontSize: 14, fontWeight: 700, color: "var(--primary)" }}
          />
          <EditableText
            value={slide.rightText}
            onCommit={(v) => onUpdateContent("rightText", v)}
            placeholder="Right column content goes here. Click to edit."
            tag="p"
            style={{
              fontSize: 12,
              lineHeight: 1.7,
              color: "var(--foreground-70)",
            }}
          />
        </div>
      </div>
    </div>
  );
}
