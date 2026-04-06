import { generateId } from "document-model/core";
import { EditableText } from "../EditableText.js";
import { AchraLogo } from "../AchraLogo.js";
import type { SlideTemplateProps } from "./shared.js";

export function AgendaSlide({
  slide,
  onUpdateContent,
  onAddAgendaItem,
  onUpdateAgendaItem,
  onDeleteAgendaItem,
}: SlideTemplateProps) {
  return (
    <div className="slide-split">
      {/* Purple left panel */}
      <div
        className="slide-half"
        style={{
          background: "var(--primary)",
          color: "#FCFCFC",
          justifyContent: "flex-end",
          width: "35%",
          flexShrink: 0,
          padding: 32,
          gap: 8,
        }}
      >
        <AchraLogo width={100} variant="white" />
        <div style={{ marginTop: "auto" }}>
          <EditableText
            value={slide.supertitle}
            onCommit={(v) => onUpdateContent("supertitle", v)}
            placeholder="Overview"
            tag="p"
            style={{
              fontSize: 11,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: 3,
              opacity: 0.7,
            }}
          />
          <EditableText
            value={slide.title}
            onCommit={(v) => onUpdateContent("title", v)}
            placeholder="Agenda"
            tag="h2"
            style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.2 }}
          />
        </div>
      </div>

      {/* Right panel with numbered items */}
      <div
        className="slide-half"
        style={{
          flex: 1,
          justifyContent: "center",
          gap: 0,
          padding: "32px 40px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            justifyContent: "center",
          }}
        >
          {slide.agendaItems.map((item, i) => (
            <div key={item.id}>
              <div
                className="list-item-wrapper"
                style={{
                  gap: 16,
                  alignItems: "center",
                  padding: "14px 0",
                }}
              >
                <span
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: "var(--primary)",
                    minWidth: 32,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <EditableText
                  value={item.title}
                  onCommit={(v) => onUpdateAgendaItem?.(item.id, v)}
                  placeholder="Agenda item"
                  style={{ fontSize: 14, fontWeight: 600, flex: 1 }}
                />
                <button
                  className="item-delete"
                  onClick={() => onDeleteAgendaItem?.(item.id)}
                  title="Remove"
                >
                  ×
                </button>
              </div>
              {i < slide.agendaItems.length - 1 && (
                <div
                  style={{
                    height: 1,
                    background: "var(--border)",
                    marginLeft: 48,
                  }}
                />
              )}
            </div>
          ))}
        </div>
        <button
          className="add-item-btn"
          onClick={() => onAddAgendaItem?.(generateId(), "New agenda item")}
          style={{ alignSelf: "flex-start", marginLeft: 48 }}
        >
          + Add agenda item
        </button>
      </div>
    </div>
  );
}
