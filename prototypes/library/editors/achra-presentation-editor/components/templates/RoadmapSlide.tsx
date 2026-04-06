import { generateId } from "document-model/core";
import { EditableText } from "../EditableText.js";
import { AchraLogo } from "../AchraLogo.js";
import type { SlideTemplateProps } from "./shared.js";
import { POSITION_COLORS } from "./shared.js";

export function RoadmapSlide({
  slide,
  onUpdateContent,
  onAddMilestone,
  onUpdateMilestone,
  onDeleteMilestone,
}: SlideTemplateProps) {
  return (
    <div className="slide-pad" style={{ position: "relative" }}>
      <div
        style={{
          position: "absolute",
          top: 24,
          right: 24,
        }}
      >
        <AchraLogo width={100} variant="dark" />
      </div>
      <EditableText
        value={slide.title}
        onCommit={(v) => onUpdateContent("title", v)}
        placeholder="Roadmap"
        tag="h3"
        style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          flex: 1,
        }}
      >
        {slide.milestones.map((ms, i) => {
          const color = POSITION_COLORS[i % POSITION_COLORS.length];
          return (
            <div
              key={ms.id}
              className="list-item-wrapper"
              style={{
                flexDirection: "row",
                alignItems: "stretch",
                gap: 0,
                background: color.bg,
                borderRadius: "0 8px 8px 0",
                borderLeft: `4px solid ${color.fg}`,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                }}
              >
                <EditableText
                  value={ms.period}
                  onCommit={(v) =>
                    onUpdateMilestone?.(
                      ms.id,
                      v,
                      ms.title,
                      ms.description ?? undefined,
                    )
                  }
                  placeholder="Q1 2026"
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: color.fg,
                  }}
                />
                <EditableText
                  value={ms.title}
                  onCommit={(v) =>
                    onUpdateMilestone?.(
                      ms.id,
                      ms.period,
                      v,
                      ms.description ?? undefined,
                    )
                  }
                  placeholder="Milestone title"
                  tag="h4"
                  style={{ fontSize: 13, fontWeight: 700 }}
                />
                <EditableText
                  value={ms.description}
                  onCommit={(v) =>
                    onUpdateMilestone?.(ms.id, ms.period, ms.title, v)
                  }
                  placeholder="Description"
                  tag="p"
                  style={{
                    fontSize: 11,
                    lineHeight: 1.5,
                    color: "var(--foreground-70)",
                  }}
                />
              </div>
              <button
                className="item-delete"
                onClick={() => onDeleteMilestone?.(ms.id)}
                title="Remove"
                style={{ alignSelf: "flex-start", margin: 8 }}
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
      <button
        className="add-item-btn"
        onClick={() => onAddMilestone?.(generateId(), "Q1", "New milestone")}
        style={{ alignSelf: "flex-start" }}
      >
        + Add milestone
      </button>
    </div>
  );
}
