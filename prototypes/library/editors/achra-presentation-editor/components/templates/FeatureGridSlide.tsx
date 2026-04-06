import { generateId } from "document-model/core";
import { EditableText } from "../EditableText.js";
import { AchraIcon } from "../AchraLogo.js";
import type { SlideTemplateProps } from "./shared.js";
import { POSITION_COLORS, POSITION_ICONS } from "./shared.js";

export function FeatureGridSlide({
  slide,
  onUpdateContent,
  onAddIconListItem,
  onUpdateIconListItem,
  onDeleteIconListItem,
}: SlideTemplateProps) {
  return (
    <div className="slide-pad" style={{ position: "relative" }}>
      <div style={{ position: "absolute", top: 24, right: 24 }}>
        <AchraIcon size={28} />
      </div>
      <EditableText
        value={slide.title}
        onCommit={(v) => onUpdateContent("title", v)}
        placeholder="Features"
        tag="h3"
        style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}
      />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 12,
          flex: 1,
        }}
      >
        {slide.iconListItems.map((item, i) => {
          const color = POSITION_COLORS[i % POSITION_COLORS.length];
          return (
            <div
              key={item.id}
              className="list-item-wrapper card-surface"
              style={{
                flexDirection: "column",
                padding: 16,
                gap: 8,
                alignItems: "flex-start",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  width: "100%",
                }}
              >
                <div
                  className="icon-circle"
                  style={{
                    background: color.bg,
                    color: color.fg,
                    fontSize: 14,
                  }}
                >
                  {POSITION_ICONS[i % POSITION_ICONS.length]}
                </div>
                <button
                  className="item-delete"
                  onClick={() => onDeleteIconListItem?.(item.id)}
                  title="Remove"
                >
                  ×
                </button>
              </div>
              <EditableText
                value={item.title}
                onCommit={(v) =>
                  onUpdateIconListItem?.(
                    item.id,
                    v,
                    item.description ?? undefined,
                  )
                }
                placeholder="Feature"
                tag="h4"
                style={{ fontSize: 12, fontWeight: 700 }}
              />
              <EditableText
                value={item.description}
                onCommit={(v) => onUpdateIconListItem?.(item.id, item.title, v)}
                placeholder="Description"
                tag="p"
                style={{
                  fontSize: 10,
                  lineHeight: 1.5,
                  color: "var(--foreground-70)",
                }}
              />
            </div>
          );
        })}
      </div>
      <button
        className="add-item-btn"
        onClick={() => onAddIconListItem?.(generateId(), "New feature")}
        style={{ alignSelf: "flex-start" }}
      >
        + Add feature
      </button>
    </div>
  );
}
