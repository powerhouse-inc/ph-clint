import { EditableText } from "../EditableText.js";
import { EditableList } from "../EditableList.js";
import { AchraIcon } from "../AchraLogo.js";
import type { SlideTemplateProps } from "./shared.js";

export function BulletsImageSlide({
  slide,
  onUpdateContent,
  onAddTextItem,
  onUpdateTextItem,
  onDeleteTextItem,
}: SlideTemplateProps) {
  return (
    <div className="slide-split">
      <div
        className="slide-half"
        style={{ position: "relative", paddingRight: 20 }}
      >
        <div style={{ position: "absolute", top: 24, right: 20 }}>
          <AchraIcon size={28} />
        </div>
        <EditableText
          value={slide.title}
          onCommit={(v) => onUpdateContent("title", v)}
          placeholder="Key Points"
          tag="h3"
          style={{
            fontSize: 20,
            fontWeight: 700,
            lineHeight: 1.2,
            marginBottom: 16,
          }}
        />
        <ul className="bullet-list">
          <EditableList
            items={slide.bulletItems}
            onAdd={(id, text) => onAddTextItem?.("BULLET_ITEMS", id, text)}
            onUpdate={(id, text) =>
              onUpdateTextItem?.("BULLET_ITEMS", id, text)
            }
            onDelete={(id) => onDeleteTextItem?.("BULLET_ITEMS", id)}
            placeholder="Bullet point"
            addLabel="+ Add bullet"
          />
        </ul>
      </div>
      <div
        className="slide-half img-placeholder"
        style={{
          padding: 0,
          borderRadius: 0,
          background:
            "linear-gradient(135deg, var(--primary-30), var(--purple-30))",
        }}
      >
        {slide.imageUrl ? (
          <img
            src={slide.imageUrl}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          "IMAGE"
        )}
      </div>
    </div>
  );
}
