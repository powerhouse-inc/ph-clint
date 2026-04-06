import React from "react";
import { generateId } from "document-model/core";
import { EditableText } from "../EditableText.js";
import { AchraIcon } from "../AchraLogo.js";
import type { SlideTemplateProps } from "./shared.js";
import { POSITION_COLORS } from "./shared.js";

export function ProcessTimelineSlide({
  slide,
  onUpdateContent,
  onAddProcessStep,
  onUpdateProcessStep,
  onDeleteProcessStep,
}: SlideTemplateProps) {
  return (
    <div className="slide-pad" style={{ position: "relative" }}>
      <div style={{ position: "absolute", top: 24, right: 24 }}>
        <AchraIcon size={28} />
      </div>
      <EditableText
        value={slide.title}
        onCommit={(v) => onUpdateContent("title", v)}
        placeholder="Process Overview"
        tag="h3"
        style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}
      />
      <EditableText
        value={slide.description}
        onCommit={(v) => onUpdateContent("description", v)}
        placeholder="Brief description of this process"
        tag="p"
        style={{
          fontSize: 12,
          color: "var(--foreground-70)",
          marginBottom: 16,
        }}
      />
      <div
        style={{
          display: "flex",
          flex: 1,
          alignItems: "flex-start",
          paddingTop: 8,
        }}
      >
        {slide.processSteps.map((step, i) => {
          const color = POSITION_COLORS[i % POSITION_COLORS.length];
          return (
            <React.Fragment key={step.id}>
              {i > 0 && (
                <div
                  style={{
                    width: 32,
                    height: 2,
                    background: "var(--border)",
                    marginTop: 19,
                    flexShrink: 0,
                  }}
                />
              )}
              <div
                className="list-item-wrapper"
                style={{
                  flex: 1,
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  gap: 8,
                }}
              >
                <div
                  className="icon-circle"
                  style={{
                    background: color.bg,
                    color: color.fg,
                    fontSize: 13,
                    fontWeight: 700,
                    width: 36,
                    height: 36,
                  }}
                >
                  {i + 1}
                </div>
                <EditableText
                  value={step.title}
                  onCommit={(v) =>
                    onUpdateProcessStep?.(
                      step.id,
                      v,
                      step.description ?? undefined,
                    )
                  }
                  placeholder="Step title"
                  tag="h4"
                  style={{ fontSize: 12, fontWeight: 700 }}
                />
                <EditableText
                  value={step.description}
                  onCommit={(v) =>
                    onUpdateProcessStep?.(step.id, step.title, v)
                  }
                  placeholder="Step description"
                  tag="p"
                  style={{
                    fontSize: 10,
                    lineHeight: 1.5,
                    color: "var(--foreground-70)",
                  }}
                />
                <button
                  className="item-delete"
                  onClick={() => onDeleteProcessStep?.(step.id)}
                  title="Remove"
                >
                  ×
                </button>
              </div>
            </React.Fragment>
          );
        })}
      </div>
      <button
        className="add-item-btn"
        onClick={() => onAddProcessStep?.(generateId(), "New step")}
        style={{ alignSelf: "flex-start" }}
      >
        + Add step
      </button>
    </div>
  );
}
