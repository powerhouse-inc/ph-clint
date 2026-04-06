import { EditableText } from "../EditableText.js";
import { AchraLogo } from "../AchraLogo.js";
import type { SlideTemplateProps } from "./shared.js";

export function TitleSlide({ slide, onUpdateContent }: SlideTemplateProps) {
  return (
    <div className="slide-pad">
      <div style={{ marginBottom: "auto", alignSelf: "flex-start" }}>
        <AchraLogo width={100} variant="dark" />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <EditableText
          value={slide.supertitle}
          onCommit={(v) => onUpdateContent("supertitle", v)}
          placeholder="Presentation Title"
          tag="p"
          style={{
            fontSize: 11,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: 3,
            color: "var(--muted-foreground)",
          }}
        />
        <EditableText
          value={slide.title}
          onCommit={(v) => onUpdateContent("title", v)}
          placeholder="Build the Future"
          tag="h1"
          style={{ fontSize: 32, fontWeight: 700, lineHeight: 1.2 }}
        />
        <EditableText
          value={slide.subtitle}
          onCommit={(v) => onUpdateContent("subtitle", v)}
          placeholder="A short description of the presentation topic."
          tag="p"
          style={{
            fontSize: 13,
            lineHeight: 1.5,
            maxWidth: "70%",
            color: "var(--foreground-70)",
          }}
        />
      </div>
      <div className="slide-footer">
        <EditableText
          value={slide.footerLeft}
          onCommit={(v) => onUpdateContent("footerLeft", v)}
          placeholder="Author"
        />
        <EditableText
          value={slide.footerRight}
          onCommit={(v) => onUpdateContent("footerRight", v)}
          placeholder="Date"
        />
      </div>
    </div>
  );
}
