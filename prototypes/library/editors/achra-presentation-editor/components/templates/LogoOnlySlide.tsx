import { EditableText } from "../EditableText.js";
import { AchraLogo } from "../AchraLogo.js";
import type { SlideTemplateProps } from "./shared.js";

export function LogoOnlySlide({ slide, onUpdateContent }: SlideTemplateProps) {
  return (
    <div
      className="slide-pad"
      style={{
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        background: "var(--accent)",
      }}
    >
      <AchraLogo width={200} variant="dark" />
      <EditableText
        value={slide.subtitle}
        onCommit={(v) => onUpdateContent("subtitle", v)}
        placeholder="www.example.com"
        tag="p"
        style={{
          fontSize: 12,
          color: "var(--muted-foreground)",
          marginTop: 16,
        }}
      />
    </div>
  );
}
