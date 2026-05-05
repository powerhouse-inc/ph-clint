# shadcn + AI Elements Editor Setup — Lessons Learnt

## Project Context
- Vetra/Powerhouse reactor package (`clint-common`)
- TypeScript with `nodenext` module resolution, `strict: true`
- Tailwind v4 (imported via `style.css`)
- Editor lives under `editors/<name>/` with codegen-generated `module.ts` and `editor.tsx`

## Phase 1: Creating the Editor Document via MCP

### Steps that work:
1. `getDocumentModelSchema` with `type: "powerhouse/document-editor"`
2. `getDrives` → find `vetra-{hash}` drive
3. `createDocument` with `documentType: "powerhouse/document-editor"`, `driveId`, `name`
4. `addActions` with THREE actions in one batch:
   - `SET_EDITOR_NAME` — use kebab-case (e.g., `"chat-session-editor"`)
   - `ADD_DOCUMENT_TYPE` — needs `id` (arbitrary OID) and `documentType` (e.g., `"powerhouse/chat-session"`)
   - `SET_EDITOR_STATUS` — **MUST set to `"CONFIRMED"`** or codegen won't run
5. Wait ~3 seconds, then check `editors/` for generated files

### What codegen produces:
- `editors/<name>/editor.tsx` — boilerplate editor (edit this)
- `editors/<name>/module.ts` — **DO NOT EDIT** (auto-generated, registers the editor)
- `editors/editors.ts` — **DO NOT EDIT** (auto-updated to include the new editor)

### No hooks folder is generated
The document hook (e.g., `useSelectedChatSessionDocument`) lives in `document-models/<model>/v1/hooks.ts`, NOT in an `editors/hooks/` folder.

## Phase 2: shadcn / AI Elements Installation

### shadcn `init` does NOT work in this project
```
Error: We could not detect a supported framework
```
This is because it's not a Next.js/Vite app — it's a Powerhouse reactor package. **Manual setup is required.**

### Manual setup checklist:
1. **Install deps**: `pnpm add class-variance-authority clsx tailwind-merge lucide-react tw-animate-css`
2. **Create `components.json`** in project root (see template below)
3. **Create `lib/utils.ts`** with the `cn()` helper
4. **Update `style.css`** with shadcn CSS variables and `@import 'tw-animate-css'`
5. **Add `@/*` path alias** to `tsconfig.json` (but see path alias caveat below)

### `components.json` template for this project:
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "style.css",
    "baseColor": "neutral",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/editors/<name>/components",
    "utils": "@/editors/<name>/lib/utils",
    "ui": "@/editors/<name>/components/ui",
    "lib": "@/editors/<name>/lib",
    "hooks": "@/editors/<name>/hooks"
  },
  "iconLibrary": "lucide"
}
```

### CSS variables: full shadcn theme block needed
The `style.css` must include:
- `@import 'tw-animate-css';` (after `@import 'tailwindcss'`)
- `@custom-variant dark (&:is(.dark *));`
- `@theme inline { ... }` block with all `--color-*` and `--radius-*` mappings
- `:root { ... }` and `.dark { ... }` blocks with oklch color values
- `@layer base { * { @apply border-border outline-ring/50; } body { @apply bg-background text-foreground; } }`

## Phase 2b: AI Elements (Vercel's AI chat components)

### Installation command:
```bash
npx ai-elements@latest add conversation message reasoning tool prompt-input
```
**NOT** via `npx shadcn@latest add` — the AI Elements have their own CLI.

### Component names that exist:
`conversation`, `message`, `reasoning`, `tool`, `prompt-input`, `code-block`, `shimmer`

### Component name that does NOT exist:
`loader` — there is no `loader` component in the AI Elements registry. Causes a hard error if included.

### Where files land:
- **UI primitives** → `editors/<name>/components/ui/` (button, badge, tooltip, collapsible, etc.)
- **AI Elements** → `components/ai-elements/` (at project root, NOT inside editor dir)

### CRITICAL: Move AI Elements into the editor directory
The CLI puts them in `components/ai-elements/` at project root. **Move them** into `editors/<name>/components/ai-elements/` so all editor code is co-located and imports work with relative paths.

### Dependencies auto-installed by AI Elements:
- `ai` (Vercel AI SDK — needed for types like `UIMessage`, `ToolUIPart`)
- `use-stick-to-bottom` (auto-scroll for Conversation)
- `streamdown` + `@streamdown/cjk`, `@streamdown/code`, `@streamdown/math`, `@streamdown/mermaid` (markdown rendering)
- `@radix-ui/react-use-controllable-state` (Reasoning toggle)

## Phase 3: Import Path Hell (the biggest time sink)

### Problem 1: `@/` path alias doesn't resolve with `nodenext`
The AI Elements CLI generates imports like:
```ts
import { Button } from "@/editors/chat-session-editor/components/ui/button"
```
With `moduleResolution: "nodenext"`, this fails because:
- The `@/*` path alias requires `baseUrl` (deprecated in TS 7.0) OR works without it in TS 5.0+
- Even with the alias resolving, `nodenext` requires `.js` extensions on imports — shadcn components don't use them

### Solution: Rewrite ALL imports to relative paths with `.js` extensions
After installation, run a bulk find-and-replace across all generated files:
- `@/editors/<name>/components/ui/button` → `../ui/button.js` (from ai-elements dir) or `./button.js` (from ui dir)
- `@/editors/<name>/lib/utils` → `../../lib/utils.js` (from ai-elements or ui dir)
- `./shimmer` → `./shimmer.js` (relative imports within ai-elements also missing extensions)
- `./code-block` → `./code-block.js`

**Files to fix (counts from our install):**
- 7 ai-elements files (conversation, message, reasoning, tool, code-block, shimmer, prompt-input)
- 11 ui files (button, badge, tooltip, separator, select, spinner, textarea, input, dropdown-menu, hover-card, button-group, dialog, command, input-group, collapsible)

### Problem 2: Deep module path imports don't resolve via tsconfig paths
```ts
// WRONG — tsconfig maps "document-models/*" to "./document-models/*/index.ts"
import type { AgentInfo } from "document-models/chat-session/v1/gen/schema/types.js"

// CORRECT — use the tsconfig alias which resolves to the barrel export
import type { AgentInfo } from "document-models/chat-session"
```
All types and action creators are re-exported through the barrel. Use the short path.

### Problem 3: `baseUrl` deprecation warning
Adding `"baseUrl": "."` to tsconfig triggers:
```
Option 'baseUrl' is deprecated and will stop functioning in TypeScript 7.0
```
Since the `@/*` alias is only needed for the AI Elements CLI install step (and we rewrite all imports to relative paths afterward), **you can remove `baseUrl` and the `@/*` path** after fixing imports. Or just leave it — it still works in TS 5.x/6.x.

## Phase 4: TypeScript Errors

### Index signature mismatch
If you have a `Record<string, unknown> & { id: string; type: ... }` intersection type and try to pass a concrete interface to it, TS complains:
```
Type 'MyInterface' is not assignable to type 'Record<string, unknown>'.
  Index signature for type 'string' is missing in type 'MyInterface'.
```
**Fix**: Add `[key: string]: unknown;` to the concrete interface.

### `@typescript-eslint/no-base-to-string`
`String(value ?? '')` where `value: unknown` triggers this lint error because an object's default `toString()` produces `[object Object]`.
**Fix**: Create a `str()` helper:
```ts
function str(v: unknown): string {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  return JSON.stringify(v);
}
```

## Phase 5: AI Elements Types vs Document Model Types

The AI Elements components use Vercel AI SDK types (`UIMessage`, `ToolUIPart`, `DynamicToolUIPart`). Our document model has its own types (`Message`, `ContentPart`, etc.).

**Do NOT try to convert between them.** Instead:
- Use the **low-level primitives** from AI Elements: `Message`, `MessageContent`, `Conversation`, `ConversationContent`, `Reasoning`, `ReasoningTrigger`, `ReasoningContent`, `Tool`, `ToolHeader`, `ToolContent`, `ToolInput`, `ToolOutput`, `MessageResponse`
- These accept plain props (strings, ReactNode) — no need for `UIMessage`
- Write wrapper components (e.g., `ContentPartRenderer`, `MessageBubble`) that bridge your document types to these primitives
- For `ToolHeader`, use `type="dynamic-tool"` with explicit `toolName` and `state` props

### Tool state mapping:
| Document model state | AI Elements `ToolPart["state"]` |
|---|---|
| Tool call with no result yet | `"input-available"` |
| Tool call with result | `"output-available"` |
| Tool call with error result | `"output-error"` |

## Recommended File Structure

```
editors/<name>/
  editor.tsx              ← main editor (edit codegen output)
  module.ts               ← DO NOT EDIT (codegen)
  lib/
    utils.ts              ← cn() helper
  components/
    AgentInfoHeader.tsx
    ConversationView.tsx
    MessageBubble.tsx
    ContentPartRenderer.tsx
    SessionStatusBar.tsx
    ai-elements/          ← moved from project root
      conversation.tsx
      message.tsx
      reasoning.tsx
      tool.tsx
      code-block.tsx
      shimmer.tsx
      prompt-input.tsx
    ui/                   ← shadcn primitives (installed by ai-elements CLI)
      button.tsx
      badge.tsx
      collapsible.tsx
      tooltip.tsx
      ...etc
    test-pane/
      TestPane.tsx
      ModuleTabs.tsx
      OperationForm.tsx
      ContentPartBuilder.tsx
      OperationLog.tsx
      operations.ts
```

## Quick Checklist for Future Editors

1. Create editor document via MCP → confirm status
2. Wait for codegen
3. `pnpm add class-variance-authority clsx tailwind-merge lucide-react tw-animate-css`
4. Create `components.json`, `lib/utils.ts`
5. Update `style.css` with shadcn theme variables
6. `npx ai-elements@latest add <components>` (no `loader`!)
7. Move `components/ai-elements/` into editor directory
8. Rewrite ALL `@/` imports to relative paths with `.js` extensions
9. Use short barrel imports for document model types (`"document-models/<name>"`)
10. Run `npm run tsc` and `npm run lint:fix`
