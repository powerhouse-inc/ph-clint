import { EditableText } from "../EditableText.js";
import { AchraLogo } from "../AchraLogo.js";
import type { SlideTemplateProps } from "./shared.js";

export function BigNumberSlide({ slide, onUpdateContent }: SlideTemplateProps) {
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
      <EditableText
        value={slide.supertitle}
        onCommit={(v) => onUpdateContent("supertitle", v)}
        placeholder="Metric Label"
        tag="p"
        style={{
          fontSize: 11,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: 3,
          color: "rgba(252, 252, 252, 0.65)",
        }}
      />
      <EditableText
        value={slide.bigNumber}
        onCommit={(v) => onUpdateContent("bigNumber", v)}
        placeholder="42M"
        tag="h1"
        style={{
          fontSize: 80,
          fontWeight: 700,
          lineHeight: 1,
          marginTop: 8,
          marginBottom: 8,
        }}
      />
      <EditableText
        value={slide.subtitle}
        onCommit={(v) => onUpdateContent("subtitle", v)}
        placeholder="A brief context for this number"
        tag="p"
        style={{ fontSize: 14, lineHeight: 1.5, color: "rgba(252, 252, 252, 0.65)", maxWidth: "60%" }}
      />
    </div>
  );
}
