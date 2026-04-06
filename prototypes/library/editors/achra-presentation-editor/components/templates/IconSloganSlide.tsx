import { EditableText } from "../EditableText.js";
import type { SlideTemplateProps } from "./shared.js";

export function IconSloganSlide({
  slide,
  onUpdateContent,
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
      <div
        className="icon-circle"
        style={{
          width: 64,
          height: 64,
          background: "var(--primary-30)",
          color: "var(--primary)",
          fontSize: 28,
          marginBottom: 16,
        }}
      >
        ◆
      </div>
      <EditableText
        value={slide.slogan}
        onCommit={(v) => onUpdateContent("slogan", v)}
        placeholder="Your Brand Slogan Here"
        tag="h2"
        style={{
          fontSize: 28,
          fontWeight: 700,
          lineHeight: 1.3,
          maxWidth: "70%",
        }}
      />
      <EditableText
        value={slide.subtitle}
        onCommit={(v) => onUpdateContent("subtitle", v)}
        placeholder="A supporting tagline"
        tag="p"
        style={{ fontSize: 13, color: "var(--foreground-70)", marginTop: 12 }}
      />
    </div>
  );
}
