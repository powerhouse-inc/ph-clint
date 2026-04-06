import { EditableText } from "../EditableText.js";
import type { SlideTemplateProps } from "./shared.js";

export function ChartPlaceholderSlide({
  slide,
  onUpdateContent,
}: SlideTemplateProps) {
  return (
    <div className="slide-pad">
      <EditableText
        value={slide.title}
        onCommit={(v) => onUpdateContent("title", v)}
        placeholder="Chart Title"
        tag="h3"
        style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}
      />
      <EditableText
        value={slide.description}
        onCommit={(v) => onUpdateContent("description", v)}
        placeholder="Description of the data shown"
        tag="p"
        style={{
          fontSize: 12,
          color: "var(--foreground-70)",
          marginBottom: 16,
        }}
      />
      <div
        className="accent-surface"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          borderRadius: 10,
        }}
      >
        <div style={{ fontSize: 36, opacity: 0.3 }}>📊</div>
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "var(--muted-foreground)",
          }}
        >
          CHART PLACEHOLDER
        </span>
        <span style={{ fontSize: 10, color: "var(--muted-foreground)" }}>
          Replace with your chart image
        </span>
      </div>
    </div>
  );
}
