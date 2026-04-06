import { EditableText } from "../EditableText.js";
import type { SlideTemplateProps } from "./shared.js";

export function ImageGridSlide({ slide, onUpdateContent }: SlideTemplateProps) {
  return (
    <div className="slide-pad">
      <EditableText
        value={slide.title}
        onCommit={(v) => onUpdateContent("title", v)}
        placeholder="Image Gallery"
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
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <div
            key={n}
            className="img-placeholder"
            style={{ borderRadius: 8, minHeight: 120 }}
          >
            IMG {n}
          </div>
        ))}
      </div>
    </div>
  );
}
