import { EditableText } from "../EditableText.js";
import { EditableList } from "../EditableList.js";
import { AchraIcon } from "../AchraLogo.js";
import type { SlideTemplateProps } from "./shared.js";

const COLUMN_DIVIDER_COLORS = [
  "var(--primary)",
  "var(--success)",
  "var(--progress)",
];

export function ThreeColumnBulletsSlide({
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
    <div className="slide-pad" style={{ position: "relative" }}>
      <div style={{ position: "absolute", top: 24, right: 24 }}>
        <AchraIcon size={28} />
      </div>
      <EditableText
        value={slide.title}
        onCommit={(v) => onUpdateContent("title", v)}
        placeholder="Three Columns"
        tag="h3"
        style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}
      />
      <div style={{ display: "flex", gap: 24, flex: 1 }}>
        {columns.slice(0, 3).map((col, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <div
              style={{
                width: 40,
                height: 4,
                marginBottom: 8,
                background:
                  COLUMN_DIVIDER_COLORS[i % COLUMN_DIVIDER_COLORS.length],
                borderRadius: 2,
              }}
            />
            <EditableText
              value={col.title}
              onCommit={(v) => onSetColumnTitle?.(i, v)}
              placeholder={`Column ${i + 1}`}
              tag="h4"
              style={{ fontSize: 13, fontWeight: 700 }}
            />
            <ul className="bullet-list">
              <EditableList
                items={col.bulletItems}
                onAdd={(id, text) => onAddColumnBullet?.(i, id, text)}
                onUpdate={(id, text) => onUpdateColumnBullet?.(i, id, text)}
                onDelete={(id) => onDeleteColumnBullet?.(i, id)}
                placeholder="Bullet point"
                addLabel="+ Add"
              />
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
