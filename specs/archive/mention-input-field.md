# Custom mention input field for agent-chat editor

## Problem

The current `ChatInput` uses `@rc-component/mentions`, which has three unfixable UX problems:

1. **Dropdown positioning is broken** — rc-mentions uses `@rc-component/trigger` to portal a dropdown to `document.body`. The portal wrapper div gets `position: static` and the dropdown gets `inset: -133px auto auto 174px`, resulting in the menu rendering at the bottom edge of the viewport (y=683 on a 720px screen) instead of above the textarea. The `placement="top"` prop is ignored. Neither `getPopupContainer` nor overflow changes on ancestor containers fix it — the trigger's position calculation is fundamentally wrong inside Connect's layout.

2. **No mention pills** — After selecting a mention, rc-mentions inserts plain text (`@Connect Agent`). There is no visual distinction between mention text and regular text in the input. Discord, Slack, and every modern chat app render accepted mentions as styled pills/chips inline in the input field.

3. **Measure element leaks visually** — rc-mentions renders an invisible "measure" div (`.rc-mentions-measure`) that becomes visible as a floating `@` character below the textarea.

## Goal

Replace `@rc-component/mentions` with a custom `MentionInput` component that:
- Renders accepted mentions as **inline pills** (colored background, avatar, non-editable)
- Shows a **dropdown above the input** triggered by `@`, positioned relative to the caret
- Tracks mention IDs cleanly without relying on text parsing

The reference UX is Discord's mention system (see `examples/06-connect-agent/agent-cli/discord-example.jpg`):
- User types `@` → dropdown appears above input with matching members
- Each row shows avatar, display name, and secondary identifier
- Arrow keys navigate, Enter/Tab selects
- Selected mention becomes an inline pill, cursor moves after it
- Backspace into a pill deletes it as a unit

## Design

### Architecture: contentEditable + custom dropdown

Use a `contentEditable` div as the input field. This allows mixing text nodes with non-editable pill `<span>` elements inline. A separate absolutely-positioned dropdown div renders above the input, anchored to the caret position.

**Why not a `<textarea>` + overlay?** Textareas can only hold plain text. Rendering pills would require a mirrored overlay div that stays perfectly in sync — fragile and complex. `contentEditable` is the standard approach (used by Discord, Slack, Linear, etc.).

### Component: `MentionInput`

```
editors/agent-chat-editor/components/MentionInput.tsx
```

**Props:**
```tsx
interface MentionInputProps {
  participants: ParticipantInfo[];   // from participants.ts
  onSubmit: (text: string, mentionedIds: string[]) => void;
  placeholder?: string;
}
```

**Internal model — token array:**

The component does NOT try to keep a parallel string state. Instead, it reads the DOM on submit to produce output:

- Walk `editorRef.childNodes`
- Text nodes → emit their `.textContent`
- Elements with `data-mention-id` → emit `@{name}` and collect the ID
- Everything else → emit `.textContent`

This means the DOM *is* the source of truth during editing. State is only derived on submit.

**Trigger detection:**

On every `input` event, check whether the caret is inside a text node where the text before the caret ends with `@` or `@<partial>` (preceded by whitespace or start-of-string). If so, open the dropdown with the query string. If the pattern breaks, close it.

**Pill insertion:**

When a mention is selected (Enter/Tab/click):
1. Find the `@query` text before the caret in the current text node
2. Split the text node: keep text before `@`, discard `@query`
3. Insert a non-editable pill span: `<span contenteditable="false" data-mention-id="..." data-mention-name="...">`
4. Insert a space text node after the pill
5. Place caret after the space

**Pill structure (HTML):**
```html
<span class="mention-pill" contenteditable="false"
      data-mention-id="connect-agent" data-mention-name="Connect Agent">
  <img src="..." class="mention-pill-avatar" />
  <span>@Connect Agent</span>
</span>
```

**Dropdown positioning:**

Insert a zero-width space at the caret, measure its `getBoundingClientRect()` relative to the editor's rect, remove it. Position the dropdown with `bottom: editorHeight - caretTop + gap` and `left: caretLeft`. This anchors the dropdown above and left-aligned to where the user typed `@`.

### Component: `MentionInputTest`

```
editors/agent-chat-editor/components/MentionInputTest.tsx
```

Standalone test harness with hardcoded participants and a submit log. Rendered inside the editor when a "Test mentions" toggle is clicked. This allows iterating on the component in the live Connect environment without needing the full agent pipeline.

### CSS (in editor.tsx `<style>` tag)

```css
/* ── MentionInput ── */
.mention-input-wrapper {
  position: relative;     /* anchor for dropdown */
}

.mention-input-editor {
  /* Same dimensions/border as current .chat-mentions-textarea */
  min-height: 60px;
  max-height: 150px;
  overflow-y: auto;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  line-height: 1.5;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  outline: none;
  white-space: pre-wrap;
  word-break: break-word;
}
.mention-input-editor:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
}
/* Placeholder via :empty + data attribute */
.mention-input-editor[data-empty="true"]:not(:focus)::before {
  content: attr(aria-placeholder);
  color: #9ca3af;
  pointer-events: none;
}

/* Inline pill */
.mention-pill {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  background: rgba(59,130,246,0.15);
  color: #1d4ed8;
  font-weight: 600;
  font-size: 0.8125rem;
  padding: 1px 6px 1px 2px;
  border-radius: 4px;
  vertical-align: baseline;
  user-select: all;         /* backspace deletes whole pill */
  cursor: default;
}
.mention-pill-avatar {
  width: 16px;
  height: 16px;
  border-radius: 50%;
}

/* Dropdown */
.mention-dropdown {
  position: absolute;
  bottom: ...;              /* set via inline style */
  left: ...;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
  max-height: 220px;
  overflow-y: auto;
  z-index: 100;
  min-width: 220px;
  padding: 4px 0;
}
.mention-dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 0.875rem;
}
.mention-dropdown-item.active {
  background: #eff6ff;
}
.mention-dropdown-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
}
.mention-dropdown-badge {        /* "agent" badge */
  font-size: 0.6875rem;
  padding: 1px 6px;
  background: #dbeafe;
  color: #1e40af;
  border-radius: 4px;
  margin-left: auto;
}
```

## Integration into ChatInput

Once MentionInput works standalone:

1. Replace the `<Mentions>` component in `ChatInput.tsx` with `<MentionInput>`
2. Wire `onSubmit` → existing `handleSend` (which calls `onSend` with `id`, `sender`, `text`, `mentioned`, `when`)
3. Remove `@rc-component/mentions` dependency from `package.json`
4. Remove `rc-mentions.d.ts` type shim
5. Remove the `.rc-mentions-*` CSS rules from editor.tsx `<style>` tag

The `MentionInput.onSubmit` callback receives `(text: string, mentionedIds: string[])` — the same shape ChatInput already needs. The wrapping (generateId, sender, when) stays in ChatInput.

## Edge cases to handle

- **Paste** — When pasting text containing `@Name`, don't auto-create pills. Only create pills through the dropdown selection flow. Paste should insert plain text.
- **Backspace into pill** — The pill uses `user-select: all` so pressing backspace when the caret is right after a pill selects the entire pill, next backspace deletes it. Test this.
- **Multiple mentions** — User can mention several participants in one message. Each pill tracks its own ID; duplicates are de-duped on submit.
- **Long names** — Pills should not line-break internally. If the editor wraps, pills flow like inline-block elements.
- **Empty submit** — If the editor only contains whitespace (no text, no pills), submit is a no-op.

## Files to create/modify

| File | Action |
|---|---|
| `components/MentionInput.tsx` | Create (exists as partial draft — rewrite) |
| `components/MentionInputTest.tsx` | Create (exists as partial draft — rewrite) |
| `editor.tsx` | Add test toggle button, add MentionInput CSS |
| `components/ChatInput.tsx` | Later: swap rc-mentions → MentionInput |
| `components/rc-mentions.d.ts` | Later: delete |
| `package.json` | Later: remove `@rc-component/mentions` |

## Development approach

1. **Build MentionInput + MentionInputTest** with CSS in editor.tsx `<style>` tag
2. **Wire test toggle** in editor toolbar so the test harness loads inside the editor view
3. **Iterate with Playwright** — open Connect, click "Test mentions", verify:
   - Type `@` → dropdown appears above input, not clipped
   - Arrow keys navigate, highlighted item tracks
   - Enter/Tab inserts a pill (colored background, avatar, name)
   - Caret is after the pill, can continue typing
   - Backspace deletes the pill as a unit
   - Ctrl+Enter submits, log shows correct text + mentioned IDs
   - Multiple pills work in the same message
4. **Swap into ChatInput** once the isolated component is solid
5. **Clean up** — remove rc-mentions, test harness toggle, old CSS

## Status

Ready to implement. Partial drafts of `MentionInput.tsx` and `MentionInputTest.tsx` exist from a prior interrupted session — they contain the right structure but need CSS wiring and testing.
