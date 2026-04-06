import { generateId } from "document-model/core";
import { EditableText } from "../EditableText.js";
import { AchraIcon } from "../AchraLogo.js";
import type { SlideTemplateProps } from "./shared.js";
import { POSITION_COLORS, POSITION_ICONS } from "./shared.js";

export function IconListSlide({
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
        placeholder="Key Features"
        tag="h3"
        style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 20,
          flex: 1,
        }}
      >
        {slide.iconListItems.map((item, i) => {
          const color = POSITION_COLORS[i % POSITION_COLORS.length];
          return (
            <div
              key={item.id}
              className="list-item-wrapper"
              style={{ gap: 16, alignItems: "flex-start" }}
            >
              <div
                className="icon-circle"
                style={{
                  background: color.bg,
                  color: color.fg,
                  fontSize: 14,
                  width: 40,
                  height: 40,
                  flexShrink: 0,
                }}
              >
                {POSITION_ICONS[i % POSITION_ICONS.length]}
              </div>
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                }}
              >
                <EditableText
                  value={item.title}
                  onCommit={(v) =>
                    onUpdateIconListItem?.(
                      item.id,
                      v,
                      item.description ?? undefined,
                    )
                  }
                  placeholder="Feature title"
                  tag="h4"
                  style={{ fontSize: 14, fontWeight: 700 }}
                />
                <EditableText
                  value={item.description}
                  onCommit={(v) =>
                    onUpdateIconListItem?.(item.id, item.title, v)
                  }
                  placeholder="Brief description"
                  tag="p"
                  style={{
                    fontSize: 12,
                    lineHeight: 1.5,
                    color: "var(--foreground-70)",
                  }}
                />
              </div>
              <button
                className="item-delete"
                onClick={() => onDeleteIconListItem?.(item.id)}
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
        onClick={() => onAddIconListItem?.(generateId(), "New feature")}
        style={{ alignSelf: "flex-start" }}
      >
        + Add item
      </button>
    </div>
  );
}
