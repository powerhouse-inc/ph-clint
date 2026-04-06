import { EditableText } from "../EditableText.js";
import type { SlideTemplateProps } from "./shared.js";

export function BigImageCaptionSlide({
  slide,
  onUpdateContent,
}: SlideTemplateProps) {
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div className="img-placeholder" style={{ flex: 1 }}>
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
      <div
        style={{
          padding: "16px 40px",
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        <EditableText
          value={slide.title}
          onCommit={(v) => onUpdateContent("title", v)}
          placeholder="Image Caption Title"
          tag="h4"
          style={{ fontSize: 14, fontWeight: 700 }}
        />
        <EditableText
          value={slide.description}
          onCommit={(v) => onUpdateContent("description", v)}
          placeholder="A description of the image above."
          tag="p"
          style={{
            fontSize: 11,
            lineHeight: 1.5,
            color: "var(--foreground-70)",
          }}
        />
      </div>
    </div>
  );
}
