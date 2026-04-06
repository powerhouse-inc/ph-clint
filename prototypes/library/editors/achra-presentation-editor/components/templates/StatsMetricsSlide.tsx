import { generateId } from "document-model/core";
import { EditableText } from "../EditableText.js";
import { AchraIcon } from "../AchraLogo.js";
import type { SlideTemplateProps } from "./shared.js";
import { POSITION_COLORS } from "./shared.js";

export function StatsMetricsSlide({
  slide,
  onUpdateContent,
  onAddHighlight,
  onUpdateHighlight,
  onDeleteHighlight,
}: SlideTemplateProps) {
  return (
    <div className="slide-pad" style={{ position: "relative" }}>
      <div style={{ position: "absolute", top: 24, right: 24 }}>
        <AchraIcon size={28} />
      </div>
      <EditableText
        value={slide.supertitle}
        onCommit={(v) => onUpdateContent("supertitle", v)}
        placeholder="Performance"
        tag="p"
        style={{
          fontSize: 11,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: 3,
          color: "var(--muted-foreground)",
          marginBottom: 4,
        }}
      />
      <EditableText
        value={slide.title}
        onCommit={(v) => onUpdateContent("title", v)}
        placeholder="Key Metrics"
        tag="h3"
        style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}
      />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 16,
          flex: 1,
          alignContent: "center",
        }}
      >
        {slide.highlights.map((h, i) => {
          const color = POSITION_COLORS[i % POSITION_COLORS.length];
          return (
            <div
              key={h.id}
              className="list-item-wrapper card-surface"
              style={{
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                padding: 20,
                gap: 8,
              }}
            >
              <EditableText
                value={h.value}
                onCommit={(v) =>
                  onUpdateHighlight?.(h.id, v, h.label, h.sublabel ?? undefined)
                }
                placeholder="42"
                tag="h2"
                style={{ fontSize: 32, fontWeight: 700, color: color.fg }}
              />
              <EditableText
                value={h.label}
                onCommit={(v) =>
                  onUpdateHighlight?.(h.id, h.value, v, h.sublabel ?? undefined)
                }
                placeholder="Metric"
                style={{ fontSize: 11, fontWeight: 500, color: "var(--foreground-70)", marginTop: 6 }}
              />
              {h.sublabel !== null && (
                <EditableText
                  value={h.sublabel}
                  onCommit={(v) =>
                    onUpdateHighlight?.(h.id, h.value, h.label, v)
                  }
                  placeholder="Subtitle"
                  style={{ fontSize: 10, color: "var(--muted-foreground)" }}
                />
              )}
              <button
                className="item-delete"
                onClick={() => onDeleteHighlight?.(h.id)}
                title="Remove"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
      <button
        className="add-item-btn"
        onClick={() => onAddHighlight?.(generateId(), "0", "Metric")}
        style={{ alignSelf: "flex-start" }}
      >
        + Add metric
      </button>
    </div>
  );
}
