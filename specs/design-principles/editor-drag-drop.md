# Drag & Drop in Powerhouse Editors — Implementation Guide

## The Problem

Editors run inside Connect, which wraps the entire editor area in a `DropZoneWrapper` component (from `@powerhousedao/design-system/connect`). This DropZone:

1. Only accepts `.phd`, `.phdm`, and `.zip` files
2. Sets `dropEffect = "none"` (blocked cursor) for all other file types
3. Calls `event.stopPropagation()` on `dragover`, preventing further handling
4. Shows a full-screen overlay for valid Powerhouse document drops

If your editor needs to accept arbitrary file drops (images, PDFs, etc.), you must bypass Connect's DropZone.

## How Connect's DropZone Works

### DOM hierarchy

```
DropZoneWrapper (div[data-drop-zone="root"])  -- bubble-phase handlers
  └── ... Connect layout (sidebar, content) ...
       └── DocumentEditor
            └── Your editor root div
                 └── Your drop target (e.g., PromptInput form)
```

### Event flow

DOM events bubble **upward** (inner → outer). So drag events hit your editor first, then bubble to DropZone. DropZone's `useDrop` hook attaches React event handlers (bubble phase) that:

- `onDragOver`: calls `preventDefault()` + `stopPropagation()`, then checks `isValidDropContent()`. If the file is not `.phd/.phdm/.zip`, sets `dropEffect = "none"`.
- `onDrop`: filters files by extension, only processes matching ones.
- `onDragEnter`/`onDragLeave`: tracks nested drag depth for overlay visibility.

### Key insight

Since your editor is a **descendant** of DropZone, your event handlers fire **before** DropZone's. Calling `stopPropagation()` in your editor prevents DropZone from ever seeing the event.

## Solution Pattern

### Step 1: Intercept drag events at the editor root

Attach all four drag event handlers to your editor's root `div`. For events carrying files, call `stopPropagation()` to block DropZone, and `preventDefault()` where needed:

```tsx
// editor.tsx
import { useCallback, useRef, useState, type DragEvent } from 'react';

const [isDragOver, setIsDragOver] = useState(false);
const dragDepthRef = useRef(0);

const onEditorDragOver = useCallback((e: DragEvent) => {
  if (e.dataTransfer.types.includes('Files')) {
    e.preventDefault();   // Signal "this is a valid drop target"
    e.stopPropagation();  // Block DropZone from setting dropEffect="none"
  }
}, []);

const onEditorDragEnter = useCallback((e: DragEvent) => {
  if (e.dataTransfer.types.includes('Files')) {
    e.stopPropagation();
    dragDepthRef.current += 1;
    if (dragDepthRef.current === 1) setIsDragOver(true);
  }
}, []);

const onEditorDragLeave = useCallback((e: DragEvent) => {
  if (e.dataTransfer.types.includes('Files')) {
    e.stopPropagation();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) setIsDragOver(false);
  }
}, []);

const onEditorDrop = useCallback((e: DragEvent) => {
  if (e.dataTransfer.types.includes('Files')) {
    e.preventDefault();   // Prevent browser from opening the file
    e.stopPropagation();  // Block DropZone
    dragDepthRef.current = 0;
    setIsDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      // Forward files to your handler
      handleFiles(e.dataTransfer.files);
    }
  }
}, []);

return (
  <div
    onDragOver={onEditorDragOver}
    onDrop={onEditorDrop}
    onDragEnter={onEditorDragEnter}
    onDragLeave={onEditorDragLeave}
  >
    {isDragOver && <DropOverlay />}
    {/* ... editor content ... */}
  </div>
);
```

### Step 2: Depth counter for flicker-free overlay

When the cursor moves over child elements, `dragenter`/`dragleave` fire for each boundary crossing. Without a depth counter, the overlay would flicker on and off. The pattern:

- `dragenter`: increment depth, show overlay when depth goes from 0 → 1
- `dragleave`: decrement depth, hide overlay when depth goes from 1 → 0
- `drop`: reset depth to 0, hide overlay

### Step 3: Drop overlay

Show a visual indicator during drag. Use `pointer-events-none` so the overlay doesn't interfere with the drop event reaching the root div:

```tsx
{isDragOver && (
  <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center bg-black/40">
    <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-primary/60 bg-background/90 px-10 py-8 shadow-lg">
      <PaperclipIcon className="size-10 text-primary" />
      <p className="text-base font-medium text-foreground">Drop files to attach</p>
      <p className="text-sm text-muted-foreground">Files will be added to your message</p>
    </div>
  </div>
)}
```

Using `bg-background/90` and theme colors (`text-foreground`, `text-primary`, etc.) ensures the overlay looks correct in both light and dark mode.

### Step 4: Bridging to child component state (PromptInput example)

If your file handler lives inside a child component's React context (e.g., `PromptInput`'s `usePromptInputAttachments().add`), you can't call it directly from the editor root. Use a ref bridge:

```tsx
// editor.tsx — expose a ref for the child to populate
const addFilesRef = useRef<((files: FileList) => void) | null>(null);

// In onEditorDrop:
addFilesRef.current?.(e.dataTransfer.files);

// Pass to child:
<ChatInputBar addFilesRef={addFilesRef} />
```

```tsx
// ChatInputBar.tsx — bridge component inside PromptInput's context
function DropBridge({ addFilesRef }: {
  addFilesRef?: MutableRefObject<((files: FileList) => void) | null>
}) {
  const { add } = usePromptInputAttachments();
  useEffect(() => {
    if (addFilesRef) addFilesRef.current = add;
    return () => { if (addFilesRef) addFilesRef.current = null; };
  }, [add, addFilesRef]);
  return null;
}

// Inside PromptInput's children:
<PromptInput onSubmit={handleSubmit} multiple>
  <DropBridge addFilesRef={addFilesRef} />
  {/* ... */}
</PromptInput>
```

## Common Pitfalls

### Don't use `globalDrop` with `stopPropagation`

`PromptInput`'s `globalDrop` prop attaches drop handlers on `document`. But `stopPropagation()` at the editor root prevents events from reaching `document`. These two approaches are incompatible — use the ref bridge instead.

### Must `preventDefault` on both `dragover` AND `drop`

- `dragover`: Without `preventDefault`, the browser signals "drop not allowed" and the `drop` event won't fire at all.
- `drop`: Without `preventDefault`, the browser opens the dropped file in a new tab.

### Only intercept file drags

Always gate on `e.dataTransfer.types.includes('Files')`. Other drag types (e.g., Connect's internal `UI_NODE` for sidebar items) should bubble through to DropZone normally.

### `onDragEnter` doesn't need `preventDefault`

Only `dragover` and `drop` need `preventDefault`. For `dragenter` and `dragleave`, `stopPropagation` is sufficient.

## Reference Implementation

See `editors/chat-session-editor/editor.tsx` and `editors/chat-session-editor/components/ChatInputBar.tsx` in `clint-common` for the complete working implementation.
