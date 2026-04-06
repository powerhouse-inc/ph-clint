import { generateId } from "document-model/core";
import { EditableText } from "../EditableText.js";
import type { SlideTemplateProps } from "./shared.js";

const PROGRESS_COLORS = [
  "var(--primary)",
  "var(--success)",
  "var(--progress)",
  "var(--todo)",
];

export function ChecklistSlide({
  slide,
  onUpdateContent,
  onAddChecklistItem,
  onUpdateChecklistItem,
  onDeleteChecklistItem,
}: SlideTemplateProps) {
  const total = slide.checklistItems.length;
  const checked = slide.checklistItems.filter((i) => i.checked).length;
  const pct = total > 0 ? Math.round((checked / total) * 100) : 0;

  return (
    <div className="slide-split">
      {/* Left: checklist items */}
      <div
        className="slide-half"
        style={{ flex: 1, gap: 12, padding: "32px 24px 32px 32px" }}
      >
        <EditableText
          value={slide.title}
          onCommit={(v) => onUpdateContent("title", v)}
          placeholder="Checklist"
          tag="h3"
          style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            flex: 1,
          }}
        >
          {slide.checklistItems.map((item) => (
            <div
              key={item.id}
              className="list-item-wrapper"
              style={{ alignItems: "center", gap: 10 }}
            >
              <button
                onClick={() =>
                  onUpdateChecklistItem?.(item.id, item.text, !item.checked)
                }
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 4,
                  border: item.checked ? "none" : "1.5px solid var(--border)",
                  background: item.checked ? "var(--success)" : "transparent",
                  color: "#fff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10,
                  flexShrink: 0,
                }}
              >
                {item.checked ? "✓" : ""}
              </button>
              <EditableText
                value={item.text}
                onCommit={(v) =>
                  onUpdateChecklistItem?.(item.id, v, item.checked)
                }
                placeholder="Checklist item"
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  flex: 1,
                  textDecoration: item.checked ? "line-through" : "none",
                  opacity: item.checked ? 0.5 : 1,
                }}
              />
              <button
                className="item-delete"
                onClick={() => onDeleteChecklistItem?.(item.id)}
                title="Remove"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <button
          className="add-item-btn"
          onClick={() => onAddChecklistItem?.(generateId(), "New item")}
          style={{ alignSelf: "flex-start" }}
        >
          + Add item
        </button>
      </div>

      {/* Right: progress sidebar */}
      <div
        className="accent-surface"
        style={{
          width: "35%",
          flexShrink: 0,
          padding: 24,
          margin: "24px 24px 24px 0",
          display: "flex",
          flexDirection: "column",
          gap: 20,
          borderRadius: 10,
        }}
      >
        <h4
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "var(--primary)",
            margin: 0,
          }}
        >
          Progress
        </h4>

        {/* Overall progress */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <ProgressBar label="Overall" value={pct} color={PROGRESS_COLORS[0]} />
          <ProgressBar
            label="Design"
            value={
              total > 0
                ? Math.round(
                    (Math.min(checked, Math.ceil(total * 0.4)) /
                      Math.ceil(total * 0.4)) *
                      100,
                  )
                : 0
            }
            color={PROGRESS_COLORS[1]}
          />
          <ProgressBar
            label="Engineering"
            value={
              total > 0
                ? Math.round(
                    (Math.min(checked, Math.ceil(total * 0.6)) /
                      Math.ceil(total * 0.6)) *
                      100,
                  )
                : 0
            }
            color={PROGRESS_COLORS[2]}
          />
          <ProgressBar
            label="QA"
            value={
              total > 0
                ? Math.round(
                    (Math.min(checked, Math.ceil(total * 0.3)) /
                      Math.ceil(total * 0.3)) *
                      100,
                  )
                : 0
            }
            color={PROGRESS_COLORS[3]}
          />
        </div>
      </div>
    </div>
  );
}

function ProgressBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 10,
          fontWeight: 600,
        }}
      >
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div
        style={{
          height: 6,
          borderRadius: 3,
          background: "var(--muted)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${value}%`,
            borderRadius: 3,
            background: color,
            transition: "width 0.3s ease",
          }}
        />
      </div>
    </div>
  );
}
