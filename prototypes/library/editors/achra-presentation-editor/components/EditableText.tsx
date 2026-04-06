import { useRef, useCallback, useEffect, type ElementType } from "react";
import { useIsPresenting } from "./PresentContext.js";

interface EditableTextProps {
  value: string | null;
  onCommit: (newValue: string) => void;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  tag?: "span" | "div" | "p" | "h1" | "h2" | "h3" | "h4" | "h5";
  readOnly?: boolean;
}

export function EditableText({
  value,
  onCommit,
  placeholder = "Click to edit",
  className,
  style,
  tag = "span",
  readOnly,
}: EditableTextProps) {
  const Tag = tag as ElementType;
  const presenting = useIsPresenting();
  const isReadOnly = readOnly || presenting;
  const ref = useRef<HTMLDivElement>(null);
  const lastCommitted = useRef(value ?? "");

  useEffect(() => {
    if (ref.current && ref.current.textContent !== (value ?? "")) {
      ref.current.textContent = value ?? "";
    }
  }, [value]);

  const handleBlur = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const newValue = el.textContent ?? "";
    if (newValue !== lastCommitted.current) {
      lastCommitted.current = newValue;
      onCommit(newValue);
    }
  }, [onCommit]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      ref.current?.blur();
    }
    if (e.key === "Escape") {
      const el = ref.current;
      if (el) {
        el.textContent = lastCommitted.current;
        el.blur();
      }
    }
  }, []);

  if (isReadOnly) {
    return (
      <Tag className={className} style={style}>
        {value || ""}
      </Tag>
    );
  }

  return (
    <Tag
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      data-placeholder={placeholder}
      className={className}
      style={style}
    >
      {value ?? ""}
    </Tag>
  );
}
