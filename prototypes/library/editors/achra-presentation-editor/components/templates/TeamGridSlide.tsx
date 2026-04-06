import { EditableText } from "../EditableText.js";
import type { SlideTemplateProps } from "./shared.js";
import { POSITION_COLORS } from "./shared.js";

export function TeamGridSlide({ slide, onUpdateContent }: SlideTemplateProps) {
  return (
    <div className="slide-pad">
      <EditableText
        value={slide.title}
        onCommit={(v) => onUpdateContent("title", v)}
        placeholder="Our Team"
        tag="h3"
        style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}
      />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16,
          flex: 1,
          alignContent: "center",
        }}
      >
        {[0, 1, 2, 3].map((i) => {
          const color = POSITION_COLORS[i % POSITION_COLORS.length];
          return (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
              }}
            >
              <div
                className="avatar"
                style={{
                  width: 56,
                  height: 56,
                  background: color.fg,
                  fontSize: 18,
                }}
              >
                {String.fromCharCode(65 + i)}
              </div>
              <span style={{ fontSize: 12, fontWeight: 700 }}>Team Member</span>
              <span style={{ fontSize: 10, color: "var(--muted-foreground)" }}>
                Role
              </span>
            </div>
          );
        })}
      </div>
      <EditableText
        value={slide.description}
        onCommit={(v) => onUpdateContent("description", v)}
        placeholder="Team description or notes"
        tag="p"
        style={{
          fontSize: 11,
          color: "var(--foreground-70)",
          textAlign: "center",
        }}
      />
    </div>
  );
}
