# Agent Chat @mention styling and positioning issues

## Problem

The @mention feature in the agent-chat editor (example 06, agent-app) has two visual issues:

1. **Mention dropdown positioning** — The rc-mentions dropdown renders crammed at the bottom of the screen. With `placement="top"` set, it should appear above the input, but either the popup container is clipped by the chat layout's `overflow: hidden` on the flex container, or the absolute positioning doesn't account for the input's position within the scrollable layout.

2. **Mention tags lack styling in message bubbles** — When a message with `mentioned` IDs is displayed, the mention indicator (`@ Alice`) renders below the bubble as plain small text. The `@name` text within the message body itself has no visual distinction (no highlight, no color) — it looks identical to surrounding text.

## Expected behavior

- The mention dropdown should appear above the input with enough room to show options, not clipped or off-screen.
- Mentioned names in message text should be visually distinct (e.g. colored, bold, or highlighted) so readers can see at a glance who was tagged.

## Root cause analysis

### Dropdown positioning
The chat layout in `editor.tsx` uses `overflow: hidden` on the main flex container (`overflow-hidden flex-1 flex flex-col`). The rc-mentions dropdown is positioned by `@rc-component/trigger` using absolute positioning relative to the cursor in the textarea. When the popup renders inside an `overflow: hidden` ancestor, it gets clipped. Possible fixes:
- Use `getPopupContainer` prop to render the dropdown into `document.body` (portal approach)
- Change the overflow strategy on the chat container (e.g. `overflow: visible` on the input area)

### Message text styling
The current implementation stores plain text (rc-mentions inserts the display name as-is). The `mentioned` array holds participant IDs separately. To highlight @names in the message body, the renderer needs to scan the text for `@{participantName}` substrings and wrap matches in styled spans. This logic doesn't exist yet — the `renderMessageContent` function just joins text chunks and renders them as-is.

## Files involved

- `editors/agent-chat-editor/editor.tsx` — scoped CSS for `.rc-mentions-dropdown`, overflow on chat container
- `editors/agent-chat-editor/components/ChatInput.tsx` — Mentions component props (`getPopupContainer`, `placement`)
- `editors/agent-chat-editor/components/ChatMessages.tsx` — `renderMessageContent` needs inline @mention highlighting

## Status

Deferred — will address after ph-clint core functionality improvements.
