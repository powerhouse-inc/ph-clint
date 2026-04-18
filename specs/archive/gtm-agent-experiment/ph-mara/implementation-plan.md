# ph-mara Implementation Plan

## File Inventory

```
specs/mara/
├── package.json
├── tsconfig.json
├── jest.config.js
├── scripts/
│   └── build-skills.ts
├── src/
│   ├── main.ts
│   ├── cli.ts
│   ├── config.ts
│   ├── commands/
│   │   ├── init-project.ts
│   │   ├── add-source.ts
│   │   └── list-sources.ts
│   ├── services/
│   │   └── preview-server.ts
│   └── agents/
│       ├── agent-mara.ts
│       └── demo-agent.ts
├── prompts/
│   ├── agent-profiles/
│   │   └── GTMStrategist.md
│   ├── skills-tpl/
│   │   ├── 01-research/
│   │   │   ├── .preamble.md
│   │   │   ├── 00.discover-audience.md
│   │   │   ├── 01.analyze-product.md
│   │   │   ├── 02.map-emotional-drivers.md
│   │   │   ├── 03.swot-analysis.md
│   │   │   ├── 04.vendor-reliability.md
│   │   │   └── .result.md
│   │   ├── 02-messaging/
│   │   │   ├── .preamble.md
│   │   │   ├── 00.draft-site-outline.md
│   │   │   ├── 01.review-and-iterate.md
│   │   │   ├── 02.finalize-messaging.md
│   │   │   └── .result.md
│   │   ├── 03-design-system/
│   │   │   ├── .preamble.md
│   │   │   ├── 00.define-visual-identity.md
│   │   │   ├── 01.build-component-library.md
│   │   │   └── .result.md
│   │   ├── 04-site-prototype/
│   │   │   ├── .preamble.md
│   │   │   ├── 00.structure-pass.md
│   │   │   ├── 01.copy-pass.md
│   │   │   ├── 02.trim-pass.md
│   │   │   └── .result.md
│   │   ├── 05-presentation/
│   │   │   ├── .preamble.md
│   │   │   ├── 00.plan-narrative-arc.md
│   │   │   ├── 01.produce-slides.md
│   │   │   └── .result.md
│   │   └── 06-visual-qa/
│   │       ├── .preamble.md
│   │       ├── 00.screenshot-audit.md
│   │       ├── 01.fix-issues.md
│   │       ├── 02.verify-fixes.md
│   │       └── .result.md
│   └── skills-ext/
│       └── playwright-cli/        # Symlink or copy from ph-rupert
├── templates/
│   └── workspace/
│       ├── sources.json
│       └── .gitkeep files for output dirs
└── tests/
    ├── commands.test.ts
    ├── cli.test.ts
    └── preview-server.test.ts
```

---

## Phase 1 — Project Scaffold

### Goal
Buildable package with working `ph-mara --help`.

### Files

**package.json**
```json
{
  "name": "@powerhousedao/mara-cli",
  "version": "0.0.1",
  "type": "module",
  "bin": { "ph-mara": "./dist/main.js" },
  "scripts": {
    "build:skills": "tsx scripts/build-skills.ts",
    "build": "pnpm build:skills && tsc",
    "dev": "tsx src/main.ts",
    "test": "NODE_OPTIONS='--experimental-vm-modules' jest --detectOpenHandles"
  },
  "dependencies": {
    "@mastra/core": "^1.22.0",
    "@mastra/libsql": "^1.7.4",
    "@mastra/loggers": "^1.1.0",
    "@mastra/mcp": "^1.4.1",
    "@mastra/memory": "^1.13.1",
    "ph-clint": "file:../../packages/ph-clint",
    "zod": "^4.3.6"
  },
  "devDependencies": {
    "@types/jest": "^29.5.14",
    "@types/node": "^22.15.0",
    "jest": "^30.0.0-beta.3",
    "ph-clint-dev": "file:../../packages/ph-clint-dev",
    "ts-jest": "^29.4.0",
    "tsx": "^4.19.4",
    "typescript": "^6.0.0"
  }
}
```

**src/config.ts**
```typescript
export const CLI_NAME = 'ph-mara';
export const CLI_VERSION = '0.0.1';

// PROJECT_ROOT from import.meta.url (same pattern as ph-rupert)

export const configSchema = z.object({
  model: z.string().default('anthropic/claude-sonnet-4-6'),
  premiumModel: z.string().default('anthropic/claude-opus-4-6'),
  previewPort: z.number().default(3000),
  screenshotWidth: z.number().default(1440),
  screenshotHeight: z.number().default(900),
  animationWait: z.number().default(2000),  // ms to wait for animations before screenshot
});

export const secretsSchema = z.object({
  apiKey: z.string().optional(),
});
```

**src/cli.ts** — Minimal `defineCli()` with no commands yet, just name/version/description/config.

**src/main.ts** — `#!/usr/bin/env node` + `cli.run(process.argv)`

**tsconfig.json** — Same as ph-rupert (ES2022, Node16, strict).

**jest.config.js** — Same as ph-rupert (ts-jest/esm preset).

### Verification
```bash
cd specs/mara && pnpm install && pnpm build
node dist/main.js --help
# Output: ph-mara help text with version
```

---

## Phase 2 — Commands

### Goal
Working project initialization and source management.

### Commands

**init-project** (`src/commands/init-project.ts`)
```typescript
inputSchema: z.object({
  name: z.string().describe('Project name'),
  audience: z.string().optional().describe('Target audience description'),
  message: z.string().optional().describe('Key message or value proposition'),
})
```

Creates workspace structure:
```
{workdir}/{name}/
├── sources.json          # { sources: [], audience: "", message: "" }
├── research/             # Positioning brief outputs
├── messaging/            # Site outline versions
├── design-system/        # Colors, typography, components
├── site/                 # HTML prototype
├── deck/                 # Slide deck
└── screenshots/          # Visual QA captures
```

Idempotent — checks for existing valid project before creating.

**add-source** (`src/commands/add-source.ts`)
```typescript
inputSchema: z.object({
  type: z.enum(['url', 'pdf', 'document', 'codebase', 'notes']),
  path: z.string().describe('URL or file path'),
  description: z.string().optional().describe('What this source contains'),
})
```

Appends to `sources.json`. Validates URL reachability or file existence.

**list-sources** (`src/commands/list-sources.ts`)
```typescript
inputSchema: z.object({})  // no params
```

Reads and formats `sources.json` as a table.

### Verification
```bash
ph-mara init-project --name acme-launch
ph-mara add-source --type url --path https://example.com --description "Product page"
ph-mara add-source --type pdf --path ./whitepaper.pdf --description "Technical whitepaper"
ph-mara list-sources
# Output: formatted table with 2 sources
```

---

## Phase 3 — Preview Service

### Goal
Live preview server for HTML outputs.

### Service Definition

**preview-server** (`src/services/preview-server.ts`)
```typescript
export const previewServer = defineService<Config>({
  id: 'preview-server',
  name: 'Preview Server',
  command: (params) => `npx serve ${params?.directory ?? 'site'} -l ${params?.port ?? 3000}`,
  paramsSchema: z.object({
    directory: z.string().default('site'),
    port: z.coerce.number().optional(),
  }),
  env: () => ({}),
  readiness: {
    patterns: [{
      name: 'serve-url',
      pattern: /Local:\s*(http:\/\/localhost:\d+)/,
      captures: { 'preview-url': { group: 1, type: 'website' } },
    }],
    timeout: 15_000,
  },
  preflight: [
    checkWorkdir(
      (cwd) => fs.existsSync(path.join(cwd, 'index.html')),
      'No index.html found in serve directory',
      'Run /04-site-prototype first to generate the site',
    ),
    checkPort((ctx) => (ctx.params?.port as number) ?? 3000, 'Preview Server'),
  ],
  shutdown: { signal: 'SIGTERM', timeout: 5_000 },
});
```

### Verification
```bash
# Create a test index.html in site/
ph-mara preview-server-start --directory site/
# Wait for ready event → captures URL
ph-mara preview-server-stop
```

---

## Phase 4 — Agent Integration

### Goal
Working agent with conversation memory and demo mode.

### Files

**agent-mara.ts** (`src/agents/agent-mara.ts`)

Follows `agent-rupert.ts` pattern:
- `createAgentMara()` — Mastra agent factory with workspace, memory, skills
- `createAgent()` — ph-clint agent loader (returns demo agent if no API key)
- No MCP client (unlike ph-rupert, mara doesn't need dynamic tool discovery)
- Workspace: `LocalFilesystem` + `LocalSandbox` pointed at the GTM project directory
- Memory: LibSQL store for conversation continuity across sessions
- maxSteps: 50 (content production needs room but less than dev work)

**demo-agent.ts** (`src/agents/demo-agent.ts`)

Same pattern as ph-rupert's demo agent:
- Tracks conversation history per threadId
- Explains available commands and skills
- Guides user through the GTM workflow in demo mode

### CLI Wiring

```typescript
// In cli.ts
cli.setAgentLoader(createAgent);
```

Agent profile and skills wired via `prompts` config in `defineCli()`.

### Verification
```bash
# Without API key:
ph-mara
# → REPL with demo agent responding
# → "Hello! I'm Mara in demo mode..."

# With API key:
PH_MARA_API_KEY=sk-... ph-mara
# → REPL with live agent
# → Bare text routes to agent
```

---

## Phase 5 — Skills 01-02 (Research + Messaging)

### Goal
Discovery and strategy skills with guard rails.

### Agent Profile

**GTMStrategist.md** — See [agent-profile.md](agent-profile.md) for full draft.

### Skills

**01-research** — See [skills/01-research.md](skills/01-research.md)
- 5 scenarios: discover audience, analyze product, map emotional drivers, SWOT, vendor reliability
- Guards: audience-first (not product-first), honest weakness assessment, no inflated scores

**02-messaging** — See [skills/02-messaging.md](skills/02-messaging.md)
- 3 scenarios: draft outline, review & iterate, finalize
- Guards: lead with audience concerns, include changelog, concise copy, no maturity overclaiming

### Build Script

**scripts/build-skills.ts** — Same pattern as ph-rupert:
```typescript
import { buildSkills } from 'ph-clint-dev';
import { cli } from '../src/cli.js';

const result = buildSkills({
  include: [path.join(PROJECT_ROOT, 'prompts')],
  context: { agentName: '{{AGENT_NAME}}' },
  output: [
    path.join(PROJECT_ROOT, 'gen'),
    path.join(PROJECT_ROOT, 'dist', 'gen'),
  ],
  cli,
});
```

### Verification
```bash
pnpm build:skills
# → gen/skills/ contains compiled 01-research and 02-messaging

ph-mara  # Enter REPL
> /01-research
# → Agent begins guided discovery process
```

---

## Phase 6 — Skills 03-04 (Design System + Site Prototype)

### Goal
Production skills with three-pass site process.

### Skills

**03-design-system** — See [skills/03-design-system.md](skills/03-design-system.md)
- 2 scenarios: define visual identity, build component library
- Guards: derive from brand/audience (not generic), all assets in serve root

**04-site-prototype** — See [skills/04-site-prototype.md](skills/04-site-prototype.md)
- 3 scenarios: structure pass, copy pass, trim pass
- Guards: separate WHAT from HOW, concise copy, funnel CTAs throughout, assets within serve root
- Three-pass process ensures content decisions happen before visual polish

### Verification
```bash
ph-mara  # Enter REPL
> /03-design-system
# → Produces design-system/ directory with CSS, component examples

> /04-site-prototype
# → Produces site/ directory with serveable HTML
# → preview-server-start works on the output
```

---

## Phase 7 — Skills 05-06 (Presentation + Visual QA)

### Goal
Delivery skills with screenshot automation.

### Skills

**05-presentation** — See [skills/05-presentation.md](skills/05-presentation.md)
- 2 scenarios: plan narrative arc, produce slides
- Guards: no fake metrics, forwardable slides, emotional driver arc from research

**06-visual-qa** — See [skills/06-visual-qa.md](skills/06-visual-qa.md)
- 3 scenarios: screenshot audit, fix issues, verify fixes
- Guards: wait for animations, check multiple widths, contrast ratios, plan 2-3 passes
- Uses playwright-cli skill (reused from ph-rupert via skills-ext/)

### Verification
```bash
ph-mara  # Enter REPL
> /05-presentation
# → Produces deck/ directory with HTML slides

> /06-visual-qa
# → Takes screenshots, identifies issues, produces fix report
```

---

## Phase 8 — End-to-End Tests

### Goal
Comprehensive test coverage for commands, service, and CLI routing.

### Test Files

**tests/commands.test.ts** — Unit tests
- `init-project`: creates workspace structure, idempotent on re-run
- `add-source`: appends to sources.json, validates paths
- `list-sources`: formats output correctly, handles empty sources

**tests/preview-server.test.ts** — Integration tests
- Service starts and captures URL from readiness pattern
- Service stops cleanly
- Preflight fails without index.html

**tests/cli.test.ts** — Integration tests
- `--help` output includes all commands
- `--version` returns correct version
- Command routing works (init-project, add-source, list-sources)
- Service commands auto-generated (preview-server-start, preview-server-stop)

### Verification
```bash
pnpm test
# All tests pass
```

---

## Implementation Order & Dependencies

```
Phase 1 (scaffold) ──→ Phase 2 (commands) ──→ Phase 3 (service)
                                                      │
Phase 4 (agent) ←─────────────────────────────────────┘
      │
      ├──→ Phase 5 (skills 01-02)
      ├──→ Phase 6 (skills 03-04)
      └──→ Phase 7 (skills 05-06)
                    │
                    └──→ Phase 8 (e2e tests)
```

Phases 5-7 can be developed in parallel once Phase 4 is complete, but should be tested in sequence (each skill builds on prior skill outputs).

---

## Code Patterns to Follow

### From ph-rupert (copy and adapt)

| Pattern | Source | Adaptation |
|---|---|---|
| CLI definition | `05-ph-rupert/src/cli.ts` | Remove Powerhouse-specific services/events |
| Config schemas | `05-ph-rupert/src/config.ts` | Replace with mara-specific fields |
| Service definition | `05-ph-rupert/src/services/reactor-project.ts` | Simplify to `npx serve` wrapper |
| Agent factory | `05-ph-rupert/src/agents/agent-rupert.ts` | Remove MCP client, simplify workspace |
| Demo agent | `05-ph-rupert/src/agents/demo-agent.ts` | Change guidance text to GTM workflow |
| Build script | `05-ph-rupert/scripts/build-skills.ts` | Simplify template vars (no ports/URLs) |
| Skill preamble | `05-ph-rupert/prompts/skills-tpl/document-modeling/.preamble.md` | Rewrite for GTM domain |

### New patterns

| Pattern | Description |
|---|---|
| `sources.json` | Simple JSON file for tracking research inputs (not a Powerhouse document) |
| Three-pass site build | Structure → copy → trim (encoded in skill 04 scenarios) |
| Versioned messaging | Each iteration saved as `messaging/v{N}.md` with changelog |
| Guard encoding | Preamble rules derived from enterprise process corrections |
