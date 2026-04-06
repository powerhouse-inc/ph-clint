import { EditableText } from "../EditableText.js";
import { AchraLogo } from "../AchraLogo.js";
import type { SlideTemplateProps } from "./shared.js";

export function QuoteSlide({ slide, onUpdateContent }: SlideTemplateProps) {
  return (
    <div
      className="slide-pad primary-bg"
      style={{
        position: "relative",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
      }}
    >
      <div style={{ position: "absolute", top: 24, left: 24 }}>
        <AchraLogo width={100} variant="white" />
      </div>
      <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1, color: "rgba(255, 255, 255, 0.2)" }}>"</div>
      <EditableText
        value={slide.quoteText}
        onCommit={(v) => onUpdateContent("quoteText", v)}
        placeholder="Your inspiring quote goes here."
        tag="h2"
        style={{
          fontSize: 22,
          fontWeight: 600,
          lineHeight: 1.5,
          maxWidth: "80%",
          fontStyle: "italic",
        }}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 4,
          marginTop: 24,
        }}
      >
        <EditableText
          value={slide.speakerName}
          onCommit={(v) => onUpdateContent("speakerName", v)}
          placeholder="Speaker Name"
          style={{ fontSize: 13, fontWeight: 700 }}
        />
        <EditableText
          value={slide.speakerRole}
          onCommit={(v) => onUpdateContent("speakerRole", v)}
          placeholder="Role / Title"
          style={{ fontSize: 11, color: "rgba(252, 252, 252, 0.6)" }}
        />
      </div>
    </div>
  );
}
