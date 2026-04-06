import { EditableText } from "../EditableText.js";
import type { SlideTemplateProps } from "./shared.js";

export function TwoImagesSlide({ slide, onUpdateContent }: SlideTemplateProps) {
  return (
    <div className="slide-pad">
      <EditableText
        value={slide.title}
        onCommit={(v) => onUpdateContent("title", v)}
        placeholder="Side by Side"
        tag="h3"
        style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}
      />
      <div style={{ display: "flex", gap: 16, flex: 1 }}>
        <div
          style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}
        >
          <div
            className="img-placeholder"
            style={{ flex: 1, borderRadius: 8, minHeight: 200 }}
          >
            IMAGE 1
          </div>
          <EditableText
            value={slide.leftTitle}
            onCommit={(v) => onUpdateContent("leftTitle", v)}
            placeholder="Caption 1"
            style={{ fontSize: 11, fontWeight: 600, textAlign: "center" }}
          />
        </div>
        <div
          style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}
        >
          <div
            className="img-placeholder"
            style={{ flex: 1, borderRadius: 8, minHeight: 200 }}
          >
            IMAGE 2
          </div>
          <EditableText
            value={slide.rightTitle}
            onCommit={(v) => onUpdateContent("rightTitle", v)}
            placeholder="Caption 2"
            style={{ fontSize: 11, fontWeight: 600, textAlign: "center" }}
          />
        </div>
      </div>
    </div>
  );
}
