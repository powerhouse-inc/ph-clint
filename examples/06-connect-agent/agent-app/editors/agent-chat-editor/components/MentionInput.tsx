import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useImperativeHandle,
  forwardRef,
  type KeyboardEvent,
  type Ref,
} from "react";
import type { ParticipantInfo } from "./participants.js";

// ── Types ────────────────────────────────────────────────────────────────────

export interface MentionInputHandle {
  /** Programmatically trigger submit (used by Send button) */
  submit: () => void;
}

export interface MentionInputProps {
  /** Participants available for @mention (exclude the current sender) */
  participants: ParticipantInfo[];
  /** Called when user submits (Ctrl+Enter) */
  onSubmit: (text: string, mentionedIds: string[]) => void;
  placeholder?: string;
}

interface MentionToken {
  type: "mention";
  id: string;
  name: string;
}
interface TextToken {
  type: "text";
  text: string;
}
type Token = MentionToken | TextToken;

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Serialize tokens to plain text for submission */
function tokensToText(tokens: Token[]): string {
  return tokens.map((t) => (t.type === "mention" ? `@${t.name}` : t.text)).join("");
}

/** Extract mentioned IDs from tokens */
function tokensMentionIds(tokens: Token[]): string[] {
  const ids = new Set<string>();
  for (const t of tokens) {
    if (t.type === "mention") ids.add(t.id);
  }
  return [...ids];
}

/** Get caret pixel position inside a contentEditable */
function getCaretCoords(el: HTMLElement): { top: number; left: number; height: number } | null {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  const range = sel.getRangeAt(0).cloneRange();
  range.collapse(true);
  // Insert a zero-width char to measure
  const span = document.createElement("span");
  span.textContent = "\u200b";
  range.insertNode(span);
  const rect = span.getBoundingClientRect();
  const parentRect = el.getBoundingClientRect();
  const coords = {
    top: rect.top - parentRect.top,
    left: rect.left - parentRect.left,
    height: rect.height,
  };
  span.remove();
  // Normalize to merge adjacent text nodes
  el.normalize();
  return coords;
}

// ── Component ────────────────────────────────────────────────────────────────

export const MentionInput = forwardRef(function MentionInput(
  {
    participants,
    onSubmit,
    placeholder = "Type a message... Use @ to mention",
  }: MentionInputProps,
  ref: Ref<MentionInputHandle>,
) {
  const editorRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [dropdownPos, setDropdownPos] = useState<{ bottom: number; left: number }>({
    bottom: 0,
    left: 0,
  });
  const [isEmpty, setIsEmpty] = useState(true);

  // Filter participants by query
  const filtered = participants.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase()),
  );

  // Reset active index when filtered list changes
  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  // Scroll active dropdown item into view
  useEffect(() => {
    if (!showDropdown || !dropdownRef.current) return;
    const item = dropdownRef.current.children[activeIndex] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, showDropdown]);

  // ── Parse tokens from DOM ──────────────────────────────────────────────

  const parseTokens = useCallback((): Token[] => {
    const el = editorRef.current;
    if (!el) return [];
    const tokens: Token[] = [];

    const walkNodes = (parent: Node, addLeadingNewline: boolean) => {
      for (const node of parent.childNodes) {
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent || "";
          if (text) tokens.push({ type: "text", text });
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const elem = node as HTMLElement;
          const tag = elem.tagName;

          if (tag === "BR") {
            tokens.push({ type: "text", text: "\n" });
          } else if (elem.dataset.mentionId) {
            tokens.push({
              type: "mention",
              id: elem.dataset.mentionId,
              name: elem.dataset.mentionName || "",
            });
          } else if (tag === "DIV" || tag === "P") {
            // Block elements created by contentEditable for new lines
            if (addLeadingNewline && tokens.length > 0) {
              tokens.push({ type: "text", text: "\n" });
            }
            walkNodes(elem, false);
          } else {
            const text = elem.textContent || "";
            if (text) tokens.push({ type: "text", text });
          }
        }
      }
    };

    walkNodes(el, true);
    return tokens;
  }, []);

  // ── Submit helper ────────────────────────────────────────────────────

  const doSubmit = useCallback(() => {
    const tokens = parseTokens();
    const text = tokensToText(tokens).trim();
    if (!text) return;
    onSubmit(text, tokensMentionIds(tokens));
    if (editorRef.current) {
      editorRef.current.innerHTML = "";
      setIsEmpty(true);
    }
  }, [parseTokens, onSubmit]);

  useImperativeHandle(ref, () => ({ submit: doSubmit }), [doSubmit]);

  // ── Detect @ trigger ───────────────────────────────────────────────────

  const checkForTrigger = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || !editorRef.current) {
      setShowDropdown(false);
      return;
    }

    const range = sel.getRangeAt(0);
    const node = range.startContainer;

    // Only trigger in text nodes
    if (node.nodeType !== Node.TEXT_NODE) {
      setShowDropdown(false);
      return;
    }

    const text = node.textContent || "";
    const offset = range.startOffset;
    const before = text.slice(0, offset);

    // Find the last @ that starts a mention (preceded by start-of-text or whitespace)
    const match = before.match(/(^|[\s])@([^\s]*)$/);
    if (match) {
      setQuery(match[2]);
      setShowDropdown(true);

      // Position dropdown above the caret
      const coords = getCaretCoords(editorRef.current);
      if (coords) {
        const editorRect = editorRef.current.getBoundingClientRect();
        setDropdownPos({
          bottom: editorRect.height - coords.top + 4,
          left: coords.left - (match[2].length + 1) * 8, // rough char width
        });
      }
    } else {
      setShowDropdown(false);
    }
  }, []);

  // ── Insert mention pill ────────────────────────────────────────────────

  const insertMention = useCallback(
    (participant: ParticipantInfo) => {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0 || !editorRef.current) return;

      const range = sel.getRangeAt(0);
      const node = range.startContainer;

      if (node.nodeType !== Node.TEXT_NODE) return;

      const text = node.textContent || "";
      const offset = range.startOffset;
      const before = text.slice(0, offset);

      // Find the @query to replace
      const match = before.match(/(^|[\s])@([^\s]*)$/);
      if (!match) return;

      const atStart = before.length - match[0].length + (match[1] ? 1 : 0);
      const after = text.slice(offset);

      // Split text node: keep text before @, remove @query
      const beforeText = text.slice(0, atStart);
      const afterText = after;

      // Create the pill element
      const pill = document.createElement("span");
      pill.contentEditable = "false";
      pill.dataset.mentionId = participant.id;
      pill.dataset.mentionName = participant.name;
      pill.className = "mention-pill";
      pill.innerHTML = `<img src="${participant.avatar}" alt="" class="mention-pill-avatar" /><span>@${participant.name}</span>`;

      // Replace content
      const parent = node.parentNode!;
      const beforeNode = document.createTextNode(beforeText);
      const afterNode = document.createTextNode(afterText.startsWith(" ") ? afterText : " " + afterText);

      parent.insertBefore(beforeNode, node);
      parent.insertBefore(pill, node);
      parent.insertBefore(afterNode, node);
      parent.removeChild(node);

      // Place caret after the space following the pill
      const newRange = document.createRange();
      newRange.setStart(afterNode, afterText.startsWith(" ") ? 0 : 1);
      newRange.collapse(true);
      sel.removeAllRanges();
      sel.addRange(newRange);

      setShowDropdown(false);
      setQuery("");
      setIsEmpty(false);
      editorRef.current.focus();
    },
    [],
  );

  // ── Event handlers ─────────────────────────────────────────────────────

  const handleInput = useCallback(() => {
    checkForTrigger();
    const el = editorRef.current;
    if (el) {
      setIsEmpty(!el.textContent?.trim() && !el.querySelector(".mention-pill"));
    }
  }, [checkForTrigger]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (showDropdown && filtered.length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setActiveIndex((i) => (i + 1) % filtered.length);
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setActiveIndex((i) => (i - 1 + filtered.length) % filtered.length);
          return;
        }
        if (e.key === "Enter" || e.key === "Tab") {
          e.preventDefault();
          insertMention(filtered[activeIndex]);
          return;
        }
        if (e.key === "Escape") {
          e.preventDefault();
          setShowDropdown(false);
          return;
        }
      }

      // Backspace into a pill — delete it as a unit
      if (e.key === "Backspace" && editorRef.current) {
        const sel = window.getSelection();
        if (sel && sel.isCollapsed && sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          const { startContainer, startOffset } = range;

          let pillToRemove: HTMLElement | null = null;

          if (startContainer === editorRef.current) {
            // Caret is at the DIV level — check the node before the offset
            const nodeBefore = editorRef.current.childNodes[startOffset - 1] as HTMLElement | undefined;
            if (nodeBefore?.classList?.contains("mention-pill")) {
              pillToRemove = nodeBefore;
            }
          } else if (startContainer.nodeType === Node.TEXT_NODE && startOffset === 0) {
            // Caret is at the start of a text node — check the previous sibling
            const prev = startContainer.previousSibling as HTMLElement | null;
            if (prev?.classList?.contains("mention-pill")) {
              pillToRemove = prev;
            }
          }

          if (pillToRemove) {
            e.preventDefault();
            pillToRemove.remove();
            editorRef.current.normalize();
            setIsEmpty(!editorRef.current.textContent?.trim() && !editorRef.current.querySelector(".mention-pill"));
            return;
          }
        }
      }

      // Submit on Ctrl+Enter / Cmd+Enter
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        doSubmit();
        return;
      }

      // Prevent Enter from creating <br>/<div> — insert newline text node instead
      if (e.key === "Enter" && !e.shiftKey) {
        // Let Shift+Enter and plain Enter both insert a newline
        // (plain Enter in contentEditable creates a <div>, we want a <br>)
        // Actually, let the browser handle it — it inserts <br> in most cases
      }
    },
    [showDropdown, filtered, activeIndex, insertMention, doSubmit],
  );

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        editorRef.current &&
        !editorRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Prevent pill nodes from being edited
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    const observer = new MutationObserver(() => {
      // If a pill lost its structure, remove it
      for (const pill of el.querySelectorAll(".mention-pill")) {
        if (!pill.querySelector("span")) {
          pill.remove();
        }
      }
    });
    observer.observe(el, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="mention-input-wrapper">
      <div
        ref={editorRef}
        className="mention-input-editor"
        contentEditable
        role="textbox"
        aria-placeholder={placeholder}
        aria-multiline="true"
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        data-empty={isEmpty}
        suppressContentEditableWarning
      />

      {showDropdown && filtered.length > 0 && (
        <div
          ref={dropdownRef}
          className="mention-dropdown"
          style={{
            bottom: `${dropdownPos.bottom}px`,
            left: `${Math.max(0, dropdownPos.left)}px`,
          }}
        >
          {filtered.map((p, i) => (
            <div
              key={p.id}
              className={`mention-dropdown-item ${i === activeIndex ? "active" : ""}`}
              onMouseDown={(e) => {
                e.preventDefault(); // Don't blur the editor
                insertMention(p);
              }}
              onMouseEnter={() => setActiveIndex(i)}
            >
              <img src={p.avatar} alt={p.name} className="mention-dropdown-avatar" />
              <span className="mention-dropdown-name">{p.name}</span>
              {p.isAgent && <span className="mention-dropdown-badge">agent</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
