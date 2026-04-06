import { EditableText } from "../EditableText.js";
import { AchraLogo } from "../AchraLogo.js";
import type { SlideTemplateProps } from "./shared.js";

export function TitlePrimarySlide({
  slide,
  onUpdateContent,
}: SlideTemplateProps) {
  return (
    <div
      style={{ background: "var(--primary)", color: "#FCFCFC", height: "100%" }}
    >
      <div className="slide-pad">
        <div style={{ marginBottom: "auto", alignSelf: "flex-start" }}>
          <AchraLogo width={100} variant="white" />
        </div>
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 12,
          }}
        >
          <EditableText
            value={slide.supertitle}
            onCommit={(v) => onUpdateContent("supertitle", v)}
            placeholder="Welcome"
            tag="p"
            style={{
              fontSize: 11,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: 3,
              opacity: 0.7,
            }}
          />
          <EditableText
            value={slide.title}
            onCommit={(v) => onUpdateContent("title", v)}
            placeholder="Presentation Title Here"
            tag="h1"
            style={{ fontSize: 36, fontWeight: 700, lineHeight: 1.15 }}
          />
          <EditableText
            value={slide.subtitle}
            onCommit={(v) => onUpdateContent("subtitle", v)}
            placeholder="Subtitle or short description"
            tag="p"
            style={{
              fontSize: 12,
              lineHeight: 1.5,
              maxWidth: "65%",
              opacity: 0.7,
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 10,
            opacity: 0.5,
            fontWeight: 500,
          }}
        >
          <EditableText
            value={slide.footerLeft}
            onCommit={(v) => onUpdateContent("footerLeft", v)}
            placeholder="Author Name"
          />
          <EditableText
            value={slide.footerRight}
            onCommit={(v) => onUpdateContent("footerRight", v)}
            placeholder="Date"
          />
        </div>
      </div>
    </div>
  );
}
