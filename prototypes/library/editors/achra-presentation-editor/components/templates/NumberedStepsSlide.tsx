import { EditableText } from "../EditableText.js";
import { EditableList } from "../EditableList.js";
import { AchraIcon } from "../AchraLogo.js";
import type { SlideTemplateProps } from "./shared.js";

export function NumberedStepsSlide({
  slide,
  onUpdateContent,
  onAddTextItem,
  onUpdateTextItem,
  onDeleteTextItem,
}: SlideTemplateProps) {
  return (
    <div className="slide-pad" style={{ position: "relative" }}>
      <div style={{ position: "absolute", top: 24, right: 24 }}>
        <AchraIcon size={28} />
      </div>
      <EditableText
        value={slide.title}
        onCommit={(v) => onUpdateContent("title", v)}
        placeholder="Step-by-Step Guide"
        tag="h3"
        style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}
      />
      <ol className="num-list" style={{ flex: 1 }}>
        <EditableList
          items={slide.steps}
          onAdd={(id, text) => onAddTextItem?.("STEPS", id, text)}
          onUpdate={(id, text) => onUpdateTextItem?.("STEPS", id, text)}
          onDelete={(id) => onDeleteTextItem?.("STEPS", id)}
          placeholder="Step description"
          addLabel="+ Add step"
        />
      </ol>
    </div>
  );
}
