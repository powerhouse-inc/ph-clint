import { EditableText } from "../EditableText.js";
import type { SlideTemplateProps } from "./shared.js";

export function TestimonialSlide({
  slide,
  onUpdateContent,
}: SlideTemplateProps) {
  return (
    <div className="slide-split">
      <div
        className="slide-half"
        style={{
          background: "var(--accent)",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div
          className="avatar"
          style={{
            width: 80,
            height: 80,
            background: "var(--primary)",
            fontSize: 28,
          }}
        >
          {(slide.speakerName ?? "T")[0]?.toUpperCase()}
        </div>
      </div>
      <div className="slide-half" style={{ justifyContent: "center", gap: 16 }}>
        <div
          style={{
            fontSize: 36,
            color: "var(--primary)",
            lineHeight: 1,
            opacity: 0.4,
          }}
        >
          "
        </div>
        <EditableText
          value={slide.quoteText}
          onCommit={(v) => onUpdateContent("quoteText", v)}
          placeholder="An amazing testimonial about the product or service."
          tag="p"
          style={{
            fontSize: 14,
            lineHeight: 1.7,
            fontStyle: "italic",
            color: "var(--foreground-70)",
          }}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <EditableText
            value={slide.speakerName}
            onCommit={(v) => onUpdateContent("speakerName", v)}
            placeholder="John Doe"
            style={{ fontSize: 13, fontWeight: 700 }}
          />
          <EditableText
            value={slide.speakerRole}
            onCommit={(v) => onUpdateContent("speakerRole", v)}
            placeholder="CEO, Company"
            style={{ fontSize: 11, color: "var(--muted-foreground)" }}
          />
        </div>
      </div>
    </div>
  );
}
