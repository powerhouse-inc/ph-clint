import type { SlideTemplateProps } from "./templates/shared.js";
import { SlideRenderer } from "./SlideRenderer.js";

type SlideCanvasProps = SlideTemplateProps;

export function SlideCanvas(props: SlideCanvasProps) {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#E8E8E8",
        overflow: "auto",
        padding: 32,
      }}
    >
      <div
        style={{
          boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
          borderRadius: 4,
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        <SlideRenderer {...props} />
      </div>
    </div>
  );
}
