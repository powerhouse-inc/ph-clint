import { EditableText } from "../EditableText.js";
import { AchraLogo } from "../AchraLogo.js";
import type { SlideTemplateProps } from "./shared.js";

export function SectionDividerCentered({
  slide,
  onUpdateContent,
}: SlideTemplateProps) {
  return (
    <div
      className="slide-pad"
      style={{
        position: "relative",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
      }}
    >
      <div style={{ position: "absolute", top: 24, left: 28 }}>
        <AchraLogo width={100} variant="dark" />
      </div>
      <EditableText
        value={slide.supertitle}
        onCommit={(v) => onUpdateContent("supertitle", v)}
        placeholder="Section 01"
        tag="p"
        style={{
          fontSize: 11,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: 3,
          color: "var(--primary)",
          marginBottom: 12,
        }}
      />
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
        placeholder="Brief description of this section."
        tag="p"
        style={{
          fontSize: 12,
          marginTop: 8,
          maxWidth: "60%",
          color: "var(--foreground-70)",
        }}
      />
    </div>
  );
}
