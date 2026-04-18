# ph-mara Context Brief

## Origin Story

ph-mara encodes a real marketing process that played out over 5 conversations in April 2026. The goal was to produce an enterprise marketing package for Powerhouse — a platform for building AI-native business operations with privacy-by-architecture.

The process worked. It produced:
- A positioning brief (audience analysis, SWOT, emotional drivers, vendor reliability checklist)
- 7 messaging iterations (v1 through v7 of the site outline)
- 3 HTML site prototypes (homepage + 5 component subpages)
- A slide deck following the emotional driver narrative arc

But it required constant steering. Each correction represented a pattern that should have been encoded upfront. ph-mara captures these patterns as agent skills with built-in guards.

## The Process It Encodes

### Phase 1: Research & Discovery

**What happened:** The agent analyzed Powerhouse's product suite, identified the target market (Legal, HR, Procurement, Finance — industries where data confidentiality is non-negotiable), and mapped the audience (CTO/VP Engineering under pressure from board to adopt AI while avoiding disasters).

**Key discovery — emotional drivers:** The CTO's concern hierarchy became the narrative backbone:
1. "We need to move on AI — now" (board/competitive urgency)
2. "But if I move wrong, it's my neck" (career risk)
3. "Our data isn't ready" (the real blocker — structure before intelligence)
4. "We can't hand our IP to a vendor" (privacy constraint)
5. "We can't add another lock-in layer" (vendor lock-in fear)
6. "We need to prove this is auditable" (compliance requirement)

**What went wrong:**
- Initial analysis was too feature-focused, not audience-focused
- SWOT overclaimed strengths and minimized weaknesses
- Vendor checklist initially gave inflated scores

**Lesson → Guard:** Research must lead with audience concerns, not product features. Be honest about weaknesses — frontier positioning is more credible than false maturity.

### Phase 2: Messaging Iteration

**What happened:** 7 versions of the site outline, each addressing feedback:

| Version | Key Change | Trigger |
|---|---|---|
| v1 | Architecture-first, feature comparison | Initial draft |
| v2 | "The Real Blocker" section (driver 3) | Too technical upfront |
| v3 | "Frontier" positioning, demo as primary CTA | Overclaimed maturity |
| v4 | Industry-specific, privacy elevated | Generic messaging |
| v5 | Integration & Data Isolation centrepiece | Missing parallel adoption |
| v6 | Use cases section, component subpages | Needed depth without cluttering homepage |
| v7 | EU AI Act, incumbent comparison, origin story | Missing regulatory tailwind and credibility signals |

**What went wrong:**
- Early versions led with technology ("here's what our stack does") instead of audience concerns ("here's what keeps you up at night")
- "Proven at Scale" section was dishonest — no external production clients yet
- Messaging kept adding length instead of editing for concision
- Each version didn't clearly document what changed and why

**Lesson → Guard:** Lead with the audience's problem, not your solution. Don't claim maturity you don't have. Every iteration must include a changelog. Shorter is better — if a section doesn't earn its place, cut it.

### Phase 3: Design System & Site Production

**What happened:** A design system was created (colors, typography, spacing, components), then applied to produce an HTML site with homepage + 5 component subpages (Clint, Fusion, Connect, Switchboard, Renown).

**What went wrong:**
- Content decisions and visual decisions were mixed — arguments about copy happened during CSS work
- Assets (images, icons) referenced paths outside the serve root
- Copy was too long on every page — marketing-speak instead of concise technical messaging
- CTAs were concentrated at bottom instead of distributed throughout the funnel

**Lesson → Guard:** Separate WHAT (content/structure) from HOW (visual/CSS). All assets must be within the serve root. Copy must be concise — enterprise CTOs scan, they don't read. Funnel links (demo CTAs) throughout every section, not just at the end.

### Phase 4: Presentation

**What happened:** A slide deck was produced following the emotional driver arc from the research phase.

**What went wrong:**
- Initial slides included fabricated metrics ("30% faster deployment")
- Slides weren't self-contained enough to forward to colleagues
- Presentation assumed live demo availability

**Lesson → Guard:** No fake metrics — only cite real, verifiable data. Every slide must be forwardable (self-contained with context). Don't assume live demo; include screenshots.

### Phase 5: Visual QA

**What happened:** Screenshots were taken of the HTML site using Playwright, visual issues were identified and fixed (contrast problems, text orphans, broken layouts at various widths).

**What went wrong:**
- Screenshots taken before animations completed showed partial renders
- Some contrast issues only visible at certain viewport widths
- QA cycle needed multiple passes

**Lesson → Guard:** Wait for animations before screenshotting. Check at multiple widths. Check contrast ratios programmatically, not just visually. Plan for 2-3 QA passes.

## The Product Being Marketed (Powerhouse)

While ph-mara is product-agnostic (it works for any product/service), understanding the enterprise process requires knowing what was being marketed:

**Powerhouse** is a platform for building AI-native business operations where data stays private. Key components:
- **Connect** — Browser-based structured data workspace (operator tool)
- **Switchboard** — API & integration hub (GraphQL + MCP, auto-generated from schemas)
- **Clint** — AI agent infrastructure (one definition → CLI, console, MCP, multi-agent)
- **Fusion** — Internal enterprise platform (replaces legacy intranets)
- **Renown** — Identity for agents and users (cryptographic attribution)
- **Vetra** — Developer ecosystem (hosting, packages, tooling)
- **Achra** — Builders marketplace (implementation partners, BAI services)

**Target audience:** CTOs/VP Engineering in regulated industries (Legal, HR, Finance, Procurement) evaluating AI adoption while navigating privacy, compliance, and vendor lock-in concerns.

**Key positioning:** "Private by Architecture" — not a policy layer but structural privacy (local-first storage, local models for sensitive data, tiered model access). Frontier technology with co-creation partnership positioning (honest about maturity, direct access to builders).

## What ph-mara Generalizes

The enterprise process was Powerhouse-specific. ph-mara extracts the reusable pattern:

| Enterprise-specific | ph-mara generalized |
|---|---|
| Powerhouse product suite | Any product/service (loaded as research sources) |
| CTO in regulated industry | Any target audience (discovered through research skill) |
| Emotional driver hierarchy | Audience concern mapping (skill 01 output) |
| 7 messaging iterations | Iterative messaging with changelogs (skill 02) |
| Monochrome enterprise design | Design system derived from brand/audience (skill 03) |
| Homepage + component subpages | Site structure from messaging (skill 04) |
| Emotional arc slide deck | Presentation following discovered narrative (skill 05) |
| Playwright QA | Visual QA with screenshot automation (skill 06) |

## Technical Context

ph-mara is built on `ph-clint` (the CLI framework) following the `05-ph-rupert` pattern:

- **No Powerhouse integration** — Unlike ph-rupert, mara doesn't need the Reactor/document model. It's a pure Mastra + filesystem agent.
- **Mastra agent** with conversation memory (LibSQL), workspace isolation, and skill-based prompting
- **Demo mode** fallback when no API key is configured
- **Preview server** (npx serve) for reviewing HTML outputs
- **Build-time skill compilation** from Handlebars templates

The skills are the core intellectual property — they encode the process knowledge and guards that make the output consistently good without mid-course corrections.
