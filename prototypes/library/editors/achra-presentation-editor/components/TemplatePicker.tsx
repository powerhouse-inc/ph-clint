import type { SlideTemplate } from "../../../document-models/achra-presentation/gen/schema/types.js";
import { TEMPLATE_CATEGORIES, TEMPLATE_LABELS } from "./templates/shared.js";

interface TemplatePickerProps {
  onSelect: (template: SlideTemplate) => void;
  onClose: () => void;
}

export function TemplatePicker({ onSelect, onClose }: TemplatePickerProps) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        fontFamily: "'Inter', sans-serif",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#FCFCFC",
          borderRadius: 12,
          padding: 32,
          maxWidth: 720,
          maxHeight: "80vh",
          overflowY: "auto",
          boxShadow: "0 16px 48px rgba(0,0,0,0.2)",
          width: "90%",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#343839" }}>
            Add Slide
          </h2>
          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "none",
              fontSize: 20,
              color: "#9EA0A1",
              cursor: "pointer",
              padding: 4,
            }}
          >
            ×
          </button>
        </div>

        {TEMPLATE_CATEGORIES.map((category) => (
          <div key={category.label} style={{ marginBottom: 24 }}>
            <h3
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 2,
                color: "#7A3AFF",
                marginBottom: 12,
              }}
            >
              {category.label}
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                gap: 8,
              }}
            >
              {category.templates.map((template) => {
                const isPrimary =
                  template === "TITLE_PRIMARY" ||
                  template === "QUOTE" ||
                  template === "BIG_NUMBER";
                return (
                  <button
                    key={template}
                    onClick={() => onSelect(template)}
                    style={{
                      border: "1px solid #D7D8D9",
                      borderRadius: 8,
                      padding: 12,
                      background: isPrimary ? "#7A3AFF" : "#FCFCFC",
                      color: isPrimary ? "#FCFCFC" : "#343839",
                      cursor: "pointer",
                      textAlign: "left",
                      fontFamily: "'Inter', sans-serif",
                      transition: "border-color 0.15s, box-shadow 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#7A3AFF";
                      e.currentTarget.style.boxShadow =
                        "0 0 0 1px rgba(122,58,255,0.3)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#D7D8D9";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <span style={{ fontSize: 12, fontWeight: 600 }}>
                      {TEMPLATE_LABELS[template]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
