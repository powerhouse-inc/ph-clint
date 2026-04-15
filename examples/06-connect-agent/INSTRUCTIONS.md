# 06-connect-agent

AI chat agent backed by Powerhouse documents, with both a CLI REPL and a Connect web UI.

## Architecture

```
agent-cli/          CLI + agent logic (Mastra agent, triggers, bridge)
agent-app/          Powerhouse Reactor Package (document models, editors, Connect UI)
cli-test/           Default workdir for test runs (created on first start)
```

The CLI starts three co-dependent services:
- **Reactor** — in-process document store with the `agent-chat` document model
- **Switchboard** — GraphQL + MCP endpoint on port 4801
- **Connect** — Vite dev server (web UI) on port 3000, served from `agent-app/`

## Prerequisites

```bash
# From repo root — build the ph-clint library first
cd packages/ph-clint && pnpm install && pnpm build

# Then install + build agent-app
cd examples/06-connect-agent/agent-app && pnpm install && pnpm build

# Then install + build agent-cli
cd examples/06-connect-agent/agent-cli && pnpm install && pnpm build
```

After adding **new source files** to `packages/ph-clint/`, re-run `pnpm install` in both `agent-app/` and `agent-cli/` (pnpm's `file:` protocol copies dist at install time).

## Running

```bash
cd examples/06-connect-agent/agent-cli

# Production (requires build first)
pnpm start
# or with explicit workdir:
node dist/main.js --workdir ../cli-test

# Development (no build needed)
pnpm dev
```

The CLI enters interactive REPL mode. Type messages directly to chat with the agent, or use `/help` for commands.

### LLM configuration

By default the agent runs in **demo mode** (canned responses). For real LLM responses:

```bash
export CONNECT_AGENT_API_KEY=sk-ant-...    # Anthropic API key
export CONNECT_AGENT_MODEL=anthropic/claude-haiku-4-5  # optional, this is the default
```

Config can also be set in `{workdir}/.ph/connect-agent.config.local.json`.

### Port conflicts

If ports 3000 or 4801 are already in use, the CLI will fail to start. Kill stale processes first:

```bash
lsof -i :3000 -t | xargs -r kill
lsof -i :4801 -t | xargs -r kill
```

## Using Connect (web UI)

Once the CLI is running, open http://localhost:3000 in a browser.

1. **Home screen** shows "Drive Explorer App" — this is the remote drive synced with Switchboard. Click it.
2. Inside the drive, click an existing `agent-chat` document to open the editor, or create a new one via the document type selector.
3. **New documents** require adding a stakeholder first (your chat identity). Click "Add New Stakeholder", enter a name, then select it.
4. Type a message and press **Ctrl+Enter** to send. The agent registers itself automatically on first interaction and responds.
5. Type `@` in the input to mention participants — the dropdown appears above the input.

## Testing with Playwright

The editors run inside Connect's Vite dev server, so Playwright is the primary tool for UI testing.

```bash
# Start the CLI first (see Running above), then in a separate terminal:
playwright-cli open --browser=chromium http://localhost:3000
```

### Clipboard access

To use the `{ }` button in Connect's revision history (copies document state JSON):

```js
await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
```

Then read it with:
```js
await page.evaluate(() => navigator.clipboard.readText());
```

### Typical test flow

1. Navigate: Home > Drive Explorer App > open/create agent-chat document
2. Add a stakeholder if the document is fresh
3. Type `@` to verify the mention dropdown appears
4. Select a mention, add text, press Ctrl+Enter
5. Check revision history for errors (click the clock icon in the toolbar)
6. Inspect document state via clipboard copy (the `{ }` button)

## Type checking

```bash
# Agent-app (editor code, document models)
cd examples/06-connect-agent/agent-app && pnpm run tsc

# Agent-cli
cd examples/06-connect-agent/agent-cli && pnpm build
```

## Agent-cli tests

```bash
cd examples/06-connect-agent/agent-cli && pnpm test
```

## Known issues

### Connect + Switchboard race condition

Connect's `createReactor()` tries to add the default remote drive on first load. If Switchboard isn't ready yet, the drive silently fails to add. The `window.ph.loading` guard prevents retry on subsequent loads.

**Workaround**: Close and reopen the browser (or clear IndexedDB for localhost:3000) after both services are confirmed up. A fresh browser session has no stale state. The CLI starts Switchboard first, but Connect's Vite server often becomes ready before Switchboard finishes binding.

See `specs/issues/connect-default-drive-race-condition.md` for root cause analysis.

### `ph connect` missing `--host` flag

Connect always binds to localhost. There is no `--host` flag to expose it on other interfaces. See `specs/issues/ph-connect-missing-host-flag.md`.

### @mention dropdown positioning

The mention dropdown renders near the bottom edge of the viewport instead of directly above the textarea. This is a CSS positioning issue with rc-mentions' `placement="top"` inside the chat layout. See `specs/issues/agent-chat-mention-styling.md`.
