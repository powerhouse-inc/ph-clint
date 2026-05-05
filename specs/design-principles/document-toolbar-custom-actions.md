# Feature Request: Custom Action Buttons in DocumentToolbar

## Summary

Two small additions to `DocumentToolbar`:

1. **`customActions`** -- editor-defined action buttons rendered inline in the toolbar row alongside the built-in controls (undo, redo, export, history, close).
2. **`borderless`** -- removes the toolbar's border and border-radius so it can sit flush against the editor content without a visual card outline.

## Motivation

Editors need editor-specific toolbar actions (e.g., dark mode toggle, test pane toggle, AI settings). Currently, the only options are:

1. **`children` prop** -- renders below the toolbar bar, not inline with buttons
2. **Separate status bar** -- works but splits the UI, wastes vertical space
3. **CSS hacks** -- absolute positioning to overlay into the toolbar; fragile

A first-class `customActions` API would keep editor-specific controls visually consistent with the built-in toolbar buttons.

Additionally, some editors use a full-bleed layout where the toolbar's default `rounded-xl border border-gray-200` card styling looks out of place. A `borderless` flag lets editors opt into a flat toolbar that blends into the surrounding UI.

## Current Architecture

**Source**: `packages/design-system/src/connect/components/document-toolbar/document-toolbar.tsx`

The toolbar renders a three-section flexbox row:

```
┌──────────────────────────────────────────────────────────────┐
│  [Undo] [Redo] [Export]    Document Name    [SB] [H] [T] [X] │
│  ← left section →         ← center →       ← right section → │
└──────────────────────────────────────────────────────────────┘
```

**Left section** (`enabledControls`-driven):
```tsx
<div className="flex items-center gap-x-2">
  {enabledControls.includes("undo") && <button>...</button>}
  {enabledControls.includes("redo") && <button>...</button>}
  {enabledControls.includes("export") && <button>...</button>}
</div>
```

**Center section** (document name, editable on double-click):
```tsx
<div className="flex items-center">
  <h1>{documentName}</h1>
</div>
```

**Right section** (action buttons + close):
```tsx
<div className="flex items-center gap-x-2">
  {!isSwitchboardLinkDisabled && <button>...</button>}
  {enabledControls.includes("history") && <button>...</button>}
  {enabledControls.includes("timeline") && <button>...</button>}
  <button aria-label="Close document">...</button>
</div>
```

**Props type** (`DocumentToolbarBaseProps`):
```typescript
type DocumentToolbarControl = "undo" | "redo" | "export" | "history" | "timeline";

type DocumentToolbarBaseProps = ComponentPropsWithoutRef<"div"> & {
  className?: string;
  enabledControls?: DocumentToolbarControl[];
  disableRevisionHistory?: boolean;
  onSwitchboardLinkClick?: () => void;
  onExport?: (document: PHDocument) => void;
  initialTimelineVisible?: boolean;
  defaultTimelineVisible?: boolean;
};
```

**Button styling convention** (all toolbar buttons use this pattern):
```tsx
<button
  className={twMerge(
    "grid size-8 place-items-center rounded-lg border border-gray-200 bg-white",
    disabled ? "cursor-not-allowed" : "cursor-pointer active:opacity-70",
  )}
  onClick={handler}
  disabled={disabled}
>
  <Icon name="..." size={16} className={disabled ? "text-gray-500" : "text-gray-900"} />
</button>
```

## Proposed API

Add a `customActions` prop accepting a typed array of action descriptors. The toolbar renders them as buttons matching the existing button style, ensuring visual consistency without editors needing to know internal styling details.

### Type Definition

```typescript
type CustomToolbarAction = {
  /** Unique key for React rendering */
  id: string;
  /** Icon element rendered inside the button (16px recommended) */
  icon: ReactNode;
  /** Tooltip text and accessible label */
  title: string;
  /** Click handler */
  onClick: () => void;
  /** Disables the button */
  disabled?: boolean;
  /** Toggleable active state -- applies a highlighted style */
  active?: boolean;
  /** Which section to place the button in. Default: 'right' */
  position?: 'left' | 'right';
};

type DocumentToolbarBaseProps = ComponentPropsWithoutRef<"div"> & {
  className?: string;
  enabledControls?: DocumentToolbarControl[];
  disableRevisionHistory?: boolean;
  onSwitchboardLinkClick?: () => void;
  onExport?: (document: PHDocument) => void;
  initialTimelineVisible?: boolean;
  defaultTimelineVisible?: boolean;
  customActions?: CustomToolbarAction[];   // <-- NEW
  /** Removes the border and border-radius from the toolbar bar. Default: false */
  borderless?: boolean;                    // <-- NEW
};
```

### Rendering

Custom actions render in the left or right section based on `position`. In the right section they appear before the close button. In the left section they appear after export.

```tsx
// Helper used in both sections:
const renderCustomActions = (side: 'left' | 'right') =>
  customActions
    ?.filter((a) => (a.position ?? 'right') === side)
    .map((action) => (
      <button
        key={action.id}
        className={twMerge(
          "grid size-8 place-items-center rounded-lg border border-gray-200 bg-white",
          action.disabled
            ? "cursor-not-allowed"
            : "cursor-pointer active:opacity-70",
          action.active && "bg-blue-50 border-blue-300",
        )}
        onClick={action.onClick}
        disabled={action.disabled}
        title={action.title}
        aria-pressed={action.active}
      >
        {action.icon}
      </button>
    ));
```

### Usage Example

```tsx
import { DocumentToolbar } from '@powerhousedao/design-system/connect';
import { MoonIcon, SunIcon, PanelRightOpenIcon, PanelRightCloseIcon } from 'lucide-react';

<DocumentToolbar
  borderless
  customActions={[
    {
      id: 'dark-mode',
      icon: isDark ? <SunIcon size={16} /> : <MoonIcon size={16} />,
      title: 'Toggle Dark Mode',
      onClick: toggleDarkMode,
      active: isDark,
    },
    {
      id: 'test-pane',
      icon: showTestPane
        ? <PanelRightCloseIcon size={16} />
        : <PanelRightOpenIcon size={16} />,
      title: 'Toggle Test Pane',
      onClick: toggleTestPane,
      active: showTestPane,
    },
  ]}
/>
```

Result:
```
┌────────────────────────────────────────────────────────────────────────┐
│  [Undo] [Redo] [Export]   Document Name   [SB] [H] [Dark] [Test] [X] │
└────────────────────────────────────────────────────────────────────────┘
```

## Implementation Diff

Changes needed in `document-toolbar.tsx`:

```diff
+type CustomToolbarAction = {
+  id: string;
+  icon: React.ReactNode;
+  title: string;
+  onClick: () => void;
+  disabled?: boolean;
+  active?: boolean;
+  position?: 'left' | 'right';
+};
+
 type DocumentToolbarBaseProps = ComponentPropsWithoutRef<"div"> & {
   className?: string;
   enabledControls?: DocumentToolbarControl[];
   disableRevisionHistory?: boolean;
   onSwitchboardLinkClick?: () => void;
   onExport?: (document: PHDocument) => void;
   initialTimelineVisible?: boolean;
   defaultTimelineVisible?: boolean;
+  customActions?: CustomToolbarAction[];
+  borderless?: boolean;
 };

 export const DocumentToolbar: React.FC<DocumentToolbarProps> = (props) => {
   const {
     onClose,
     children,
     onExport,
     className,
     document: _document,
     onSwitchboardLinkClick,
     enabledControls = ["undo", "redo", "export", "history"],
     defaultTimelineVisible = true,
     disableRevisionHistory = false,
     initialTimelineVisible = false,
+    customActions,
+    borderless = false,
     ...containerProps
   } = props;

+  const renderCustomActions = (side: 'left' | 'right') =>
+    customActions
+      ?.filter((a) => (a.position ?? 'right') === side)
+      .map((action) => (
+        <button
+          key={action.id}
+          className={twMerge(
+            "grid size-8 place-items-center rounded-lg border border-gray-200 bg-white",
+            action.disabled
+              ? "cursor-not-allowed"
+              : "cursor-pointer active:opacity-70",
+            action.active && "bg-blue-50 border-blue-300",
+          )}
+          onClick={action.onClick}
+          disabled={action.disabled}
+          title={action.title}
+          aria-pressed={action.active}
+        >
+          {action.icon}
+        </button>
+      ));

   // ... existing code ...

   // ... existing code ...

       <div
         className={twMerge(
-          "flex h-12 w-full items-center justify-between rounded-xl border border-gray-200 bg-slate-50 px-4",
+          "flex h-12 w-full items-center justify-between bg-slate-50 px-4",
+          !borderless && "rounded-xl border border-gray-200",
           className,
         )}
       >

         {/* Left section */}
         <div className="flex items-center gap-x-2">
           {enabledControls.includes("undo") && /* ... */}
           {enabledControls.includes("redo") && /* ... */}
           {enabledControls.includes("export") && /* ... */}
+          {renderCustomActions('left')}
         </div>

         {/* ... center section unchanged ... */}

         {/* Right section */}
         <div className="flex items-center gap-x-2">
           {/* ... switchboard, history, timeline buttons ... */}
+          {renderCustomActions('right')}
           <button
             id="close-document-button"
             aria-label="Close document"
             // ...
           >
```

## Dark Mode Consideration

The toolbar currently uses hardcoded Tailwind classes (`bg-slate-50`, `bg-white`, `border-gray-200`, `text-gray-500`, `text-gray-900`). Editors that support dark mode must add CSS overrides for these (see `style.css` in `clint-common` for the workaround). A separate enhancement could convert these to CSS custom properties or Tailwind's `dark:` variant, but that's a larger change and out of scope here.

## Related Components

- **`EditorActionButtons`** (`packages/design-system/src/connect/components/editor-action-buttons/editor-action-buttons.tsx`): A lighter alternative that renders just action buttons (switchboard, history, timeline, close) without undo/redo/export or the document name. It should also accept `customActions` for consistency.

- **`EditorUndoRedoButtons`**: Standalone undo/redo buttons component. No changes needed.
