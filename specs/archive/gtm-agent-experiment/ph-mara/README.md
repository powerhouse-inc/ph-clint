# ph-mara — Marketing Research & Assets

## What It Is

ph-mara is a ph-clint CLI agent that turns research materials into a complete go-to-market (GTM) package: positioning brief, approved messaging, HTML website prototype, and slide deck. It encodes a proven 5-conversation process — originally run manually for Powerhouse's enterprise site — into structured, repeatable agent skills.

## Why It Exists

The enterprise site process (documented in `specs/enterprise/`) produced strong results but required many mid-course corrections:

- Messaging that led with technology instead of audience concerns
- Positioning that overclaimed maturity
- Site copy that was too long and marketing-speak
- Design that didn't separate content decisions from visual ones
- Slides with fake metrics

Each correction became a **guard** in ph-mara's skills, so the agent avoids these mistakes by default.

## What Goes In

- **Research materials**: URLs, PDFs, documents, codebases describing the product/service
- **Target audience**: Who you're selling to, their role, their concerns
- **Key message**: The core value proposition (refined through guided discovery)

## What Comes Out

1. **Positioning brief** — Audience analysis, SWOT, emotional drivers, vendor checklist
2. **Approved messaging** — Iteratively refined site outline with versioned change logs
3. **HTML website prototype** — Self-contained, serveable site with design system
4. **Slide deck** — Presentation following the emotional driver arc

All outputs are self-contained files in the workspace, serveable via the built-in preview server.

## Architecture

Follows the `05-ph-rupert` pattern exactly:

- **CLI**: `defineCli()` with commands, service, agent, skills
- **Agent**: Mastra-based with GTMStrategist profile, conversation memory, demo mode fallback
- **Skills**: 6 sequential skills (research → messaging → design system → site → presentation → QA)
- **Service**: Preview server (`npx serve`) for reviewing HTML outputs
- **No Powerhouse integration**: Pure Mastra + filesystem agent for content production

```
specs/mara/
├── package.json / tsconfig.json / jest.config.js
├── scripts/build-skills.ts
├── src/
│   ├── main.ts              # Entry point
│   ├── cli.ts               # defineCli() — commands, service, agent
│   ├── config.ts            # CLI_NAME, schemas
│   ├── commands/             # init-project, add-source, list-sources
│   ├── services/             # preview-server
│   └── agents/               # agent-mara, demo-agent
├── prompts/
│   ├── agent-profiles/       # GTMStrategist.md
│   ├── skills-tpl/           # 01-research through 06-visual-qa
│   └── skills-ext/           # playwright-cli (reused)
└── templates/workspace/      # Scaffold template
```

## Related Files

| Document | Purpose |
|---|---|
| [context-brief.md](context-brief.md) | Full context: what, why, lessons learned |
| [implementation-plan.md](implementation-plan.md) | Phased build plan with verification |
| [skills/](skills/) | Detailed skill specifications (one per skill) |
| [agent-profile.md](agent-profile.md) | GTMStrategist agent profile draft |
| `specs/enterprise/` | Source process logs and iterations |
