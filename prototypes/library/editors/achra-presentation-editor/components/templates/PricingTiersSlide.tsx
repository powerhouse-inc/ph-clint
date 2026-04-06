import { EditableText } from "../EditableText.js";
import { EditableList } from "../EditableList.js";
import type { SlideTemplateProps } from "./shared.js";
import { POSITION_COLORS } from "./shared.js";

export function PricingTiersSlide({
  slide,
  onUpdateContent,
  onSetColumnTitle,
  onAddColumnBullet,
  onUpdateColumnBullet,
  onDeleteColumnBullet,
}: SlideTemplateProps) {
  const emptyCol = {
    title: null,
    bulletItems: [] as Array<{ id: string; text: string }>,
  };
  const columns =
    slide.columns.length >= 3
      ? slide.columns
      : [
          ...slide.columns,
          ...Array.from({ length: 3 - slide.columns.length }, () => emptyCol),
        ];

  return (
    <div className="slide-pad">
      <EditableText
        value={slide.title}
        onCommit={(v) => onUpdateContent("title", v)}
        placeholder="Pricing Plans"
        tag="h3"
        style={{
          fontSize: 20,
          fontWeight: 700,
          textAlign: "center",
          marginBottom: 16,
        }}
      />
      <div style={{ display: "flex", gap: 16, flex: 1 }}>
        {columns.slice(0, 3).map((col, i) => {
          const isMiddle = i === 1;
          const color = POSITION_COLORS[i % POSITION_COLORS.length];
          return (
            <div
              key={i}
              className="card-surface"
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                padding: 20,
                gap: 12,
                borderTop: `3px solid ${color.fg}`,
                ...(isMiddle
                  ? { boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }
                  : {}),
              }}
            >
              <EditableText
                value={col.title}
                onCommit={(v) => onSetColumnTitle?.(i, v)}
                placeholder={["Basic", "Pro", "Enterprise"][i]}
                tag="h4"
                style={{ fontSize: 14, fontWeight: 700, color: color.fg }}
              />
              <div
                className="divider-bar"
                style={{
                  width: "100%",
                  height: 1,
                  background: "var(--border)",
                }}
              />
              <ul className="bullet-list" style={{ flex: 1 }}>
                <EditableList
                  items={col.bulletItems}
                  onAdd={(id, text) => onAddColumnBullet?.(i, id, text)}
                  onUpdate={(id, text) => onUpdateColumnBullet?.(i, id, text)}
                  onDelete={(id) => onDeleteColumnBullet?.(i, id)}
                  placeholder="Feature"
                  addLabel="+ Add"
                />
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
