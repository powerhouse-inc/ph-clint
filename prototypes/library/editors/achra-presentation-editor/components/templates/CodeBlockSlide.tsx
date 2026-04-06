import { EditableText } from "../EditableText.js";
import type { SlideTemplateProps } from "./shared.js";

export function CodeBlockSlide({ slide, onUpdateContent }: SlideTemplateProps) {
  return (
    <div className="slide-split">
      {/* Left: text content */}
      <div
        className="slide-half"
        style={{
          width: "40%",
          flexShrink: 0,
          gap: 12,
          justifyContent: "center",
          padding: "32px 24px 32px 32px",
        }}
      >
        <EditableText
          value={slide.supertitle}
          onCommit={(v) => onUpdateContent("supertitle", v)}
          placeholder="Developer Experience"
          tag="p"
          style={{
            fontSize: 11,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: 3,
            color: "var(--muted-foreground)",
          }}
        />
        <EditableText
          value={slide.title}
          onCommit={(v) => onUpdateContent("title", v)}
          placeholder="Simple API"
          tag="h3"
          style={{ fontSize: 20, fontWeight: 700 }}
        />
        <EditableText
          value={slide.subtitle}
          onCommit={(v) => onUpdateContent("subtitle", v)}
          placeholder="Get up and running with just a few lines of code."
          tag="p"
          style={{
            fontSize: 12,
            lineHeight: 1.6,
            color: "var(--foreground-70)",
          }}
        />
      </div>

      {/* Right: code block */}
      <div
        style={{
          flex: 1,
          display: "flex",
          padding: "24px 24px 24px 0",
        }}
      >
        <div className="code-block" style={{ flex: 1 }}>
          <EditableText
            value={slide.codeContent}
            onCommit={(v) => onUpdateContent("codeContent", v)}
            placeholder={
              "// Your code here\nfunction hello() {\n  return 'world';\n}"
            }
            tag="div"
            style={{
              whiteSpace: "pre",
              fontFamily: "'SF Mono', 'Fira Code', monospace",
              fontSize: 11,
              lineHeight: 1.7,
              minHeight: "100%",
            }}
          />
        </div>
      </div>
    </div>
  );
}
