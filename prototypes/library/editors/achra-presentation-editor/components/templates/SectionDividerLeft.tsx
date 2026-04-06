import { EditableText } from "../EditableText.js";
import { AchraLogo } from "../AchraLogo.js";
import type { SlideTemplateProps } from "./shared.js";

export function SectionDividerLeft({
  slide,
  onUpdateContent,
}: SlideTemplateProps) {
  return (
    <div
      className="slide-pad"
      style={{
        position: "relative",
        justifyContent: "center",
        alignItems: "flex-start",
      }}
    >
      <div style={{ position: "absolute", top: 24, left: 28 }}>
        <AchraLogo width={100} variant="dark" />
      </div>
      <div className="divider-bar" style={{ marginBottom: 20 }} />
      <EditableText
        value={slide.title}
        onCommit={(v) => onUpdateContent("title", v)}
        placeholder="Section Title"
        tag="h2"
        style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.2 }}
      />
      <EditableText
        value={slide.description}
        onCommit={(v) => onUpdateContent("description", v)}
        placeholder="A short lead-in paragraph that sets context."
        tag="p"
        style={{
          fontSize: 12,
          marginTop: 10,
          maxWidth: "55%",
          lineHeight: 1.6,
          color: "var(--foreground-70)",
        }}
      />
    </div>
  );
}
