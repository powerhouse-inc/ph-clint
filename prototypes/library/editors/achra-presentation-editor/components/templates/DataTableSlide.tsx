import { EditableText } from "../EditableText.js";
import type { SlideTemplateProps } from "./shared.js";

export function DataTableSlide({ slide, onUpdateContent }: SlideTemplateProps) {
  return (
    <div className="slide-pad">
      <EditableText
        value={slide.title}
        onCommit={(v) => onUpdateContent("title", v)}
        placeholder="Data Table"
        tag="h3"
        style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}
      />
      <div
        className="card-surface"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          padding: 24,
        }}
      >
        <div style={{ fontSize: 36, opacity: 0.3 }}>📋</div>
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "var(--muted-foreground)",
          }}
        >
          DATA TABLE
        </span>
        <span style={{ fontSize: 10, color: "var(--muted-foreground)" }}>
          Table content configured via structured data
        </span>
      </div>
      <EditableText
        value={slide.description}
        onCommit={(v) => onUpdateContent("description", v)}
        placeholder="Source or additional notes"
        tag="p"
        style={{ fontSize: 10, color: "var(--muted-foreground)", marginTop: 8 }}
      />
    </div>
  );
}
