import type { SlideTemplateProps } from "./shared.js";
import { TEMPLATE_LABELS } from "./shared.js";

export function PlaceholderSlide({ slide }: SlideTemplateProps) {
  return (
    <div
      className="slide-pad"
      style={{
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
      }}
    >
      <div
        className="icon-circle"
        style={{
          background: "var(--primary-30)",
          color: "var(--primary)",
          fontSize: 20,
          width: 48,
          height: 48,
          marginBottom: 16,
        }}
      >
        ◆
      </div>
      <h3 style={{ fontSize: 20, fontWeight: 700 }}>
        {TEMPLATE_LABELS[slide.template]}
      </h3>
      <p
        style={{ fontSize: 12, color: "var(--muted-foreground)", marginTop: 8 }}
      >
        Template preview coming soon
      </p>
    </div>
  );
}
