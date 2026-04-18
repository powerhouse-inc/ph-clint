# Enterprise Presentation Deck — Outline

**Purpose:** A 20–25 slide deck for CTO/VP Engineering meetings. Accompanies or follows a demo. Designed to be forwarded internally (to CIO, DPO, enterprise architect) with key sections standing alone.

**Audience:** Same as enterprise.powerhouse.io — CTO under dual pressure (board demands AI strategy + data privacy constraints).

**Conversion goal:** Book a BAI AI readiness assessment.

**Design system:** Uses slide templates from `03.design-system/presentation.html` — dark theme, Inter/Poppins, gradient accent (#00D4FF → #7A3AFF).

---

## Deck Structure

### Act 1 — The Pressure (slides 1–5)

Follow the emotional driver arc: urgency → caution → the real blocker.

| # | Slide | Type | Content |
|---|---|---|---|
| 1 | **Cover** | Title (gradient-bg) | "AI-Native Operations. Private by Architecture." / Powerhouse logo / presenter name + date |
| 2 | **The board is asking** | Section divider | "Your competitors are adopting AI. The board wants a strategy. The clock is ticking." — Set driver 1: urgency |
| 3 | **The CTO's dilemma** | Bullets + visual | Left: Three pressures — (1) Move fast or be late, (2) Move wrong and it's your neck, (3) Your data isn't ready. Right: visual/illustration |
| 4 | **The real blocker** | Content slide | "Every AI vendor wants your data. Your regulators say no." — Commercial AI = data leaves your environment. For legal, HR, finance, procurement: non-starter. Teams stuck between consumer chatbots and 18-month integration projects. |
| 5 | **There's a third path** | Content slide (gradient accent text) | "Infrastructure that makes your data AI-native — without it ever leaving your environment." Parallel adoption, not rip-and-replace. Transition to solution. |

### Act 2 — The Solution (slides 6–14)

Three pillars, then the platform components, then architecture.

| # | Slide | Type | Content |
|---|---|---|---|
| 6 | **Three pillars** | Section divider (centered) | "Private. AI-Native. Real-Time." |
| 7 | **Private by default** | Bullets + image | Your data stays on your infrastructure. Local models for sensitive workflows. Commercial APIs for general tasks. Tiered access — DPO defines tiers, architecture enforces them. No data used for model training. |
| 8 | **AI-native from the data layer** | Bullets + image | Existing systems connect to structured data layer. AI agents interact through typed interfaces. Specification-driven AI (playbooks, not open prompts). Human oversight: escalation when confidence is low. |
| 9 | **Real-time & scalable** | Bullets + image | Reactive architecture (event sourcing, CQRS). Independent consistency boundaries. Horizontal write scaling. Event-driven read models. |
| 10 | **The platform** | Section divider | "Five components. Your architecture. Your brand." — Local, whitelabel components you own and operate. |
| 11 | **Platform components** | 5-card grid | Clint (AI Agent Infra) / Fusion (Internal Platform) / Connect (Operator Workspace) / Switchboard (API & Integration) / Renown (Identity). One-liner each. |
| 12 | **How it fits together** | Architecture diagram | ASCII/visual from v7 section 5b: Existing Systems → Switchboard → Clint + Connect → Fusion, Renown governs identity across all. The "forwardable to enterprise architect" slide. |
| 13 | **Integration & data isolation** | Split slide | Left: "Parallel adoption" — runs alongside existing systems, no rip-and-replace. Right: "Every integration is a data boundary" — HR agent sees personnel, not financials; procurement agent sees vendors, not employee data. |
| 14 | **Tiered AI model access** | 3-tier diagram | Local models (most sensitive) → Frontier commercial (censored summaries) → General-purpose (non-confidential). Visual gradient from locked to open. |

### Act 3 — Use Cases (slides 15–16)

Industry-specific proof points. Keep tight — 2 slides, not 4.

| # | Slide | Type | Content |
|---|---|---|---|
| 15 | **Legal & HR** | Split slide | Left: Legal — contract review, due diligence, compliance monitoring on local models. Full audit trail. Right: HR — personnel data on-prem, GDPR structural, recruitment screening + policy compliance. |
| 16 | **Procurement & Finance** | Split slide | Left: Procurement — negotiation positions stay local, spend analysis, supplier risk. Right: Finance — board-level financials on local models, append-only audit trail, SOX-ready. |

### Act 4 — Trust & Compliance (slides 17–19)

The "forwardable" section — DPO, legal counsel, compliance team.

| # | Slide | Type | Content |
|---|---|---|---|
| 17 | **Privacy & compliance** | Section divider | "Built into the architecture. Not bolted on." |
| 18 | **Compliance by construction** | 4-point grid | Data residency (your infra) / Immutable audit trail (cryptographically signed, append-only) / Data portability (JSON, TypeScript, open source) / Regulatory readiness (EU AI Act, provenance, attribution). |
| 19 | **How this compares** | Comparison table | "Cloud AI + Legacy Systems" vs "Powerhouse" — 6 rows: data privacy, AI readiness, agent control, compliance, regulatory readiness, vendor lock-in. From v7 section 11. |

### Act 5 — Why Powerhouse (slides 20–22)

Credibility, honest positioning, co-creation framing.

| # | Slide | Type | Content |
|---|---|---|---|
| 20 | **Who we are** | Content + logo | Origin from MakerDAO operational infrastructure (2021). Open-source. We run on our own stack — Achra and Vetra are production Powerhouse applications. |
| 21 | **Your team already knows the stack** | Stats/metrics or bullets | TypeScript, React, GraphQL, Node.js, Zod. Mainstream talent pool. Powerhouse layer is a pattern, not a new language. Open source = your insurance policy. |
| 22 | **Early means advantage** | Content slide | Co-creation partnership: feature requests → engineering roadmap. Your deployment → reference architecture for your industry. Direct access to the builders. White-glove BAI support with contractual SLAs. |

### Act 6 — Next Steps (slides 23–25)

| # | Slide | Type | Content |
|---|---|---|---|
| 23 | **Three ways to move** | 3-card layout | (1) Request a Demo — see the platform running in production. (2) AI Readiness Assessment — 2–3 week BAI engagement, no commitment. (3) Explore — vetra.io for dev environment + docs. |
| 24 | **The BAI engagement** | Numbered list | Audit → Assess → Roadmap → Implement → Operate. Brief description of each phase. "Start with the assessment — no commitment beyond that." |
| 25 | **Close** | Title (gradient-bg) | "Start the conversation." / hello@powerhouse.inc / bai.powerhouse.io / Powerhouse logo |

---

## Appendix slides (optional, not presented)

For the enterprise architect who wants to go deeper after the meeting.

| # | Slide | Content |
|---|---|---|
| A1 | **Technical characteristics** | Full table from v7 section 10 — data privacy, AI integration, data model, identity, scalability, sync, compliance, stack, deployment |
| A2 | **Clint deep dive** | AI agent infrastructure details — routine loop, sandboxed agents, MCP generation, specification-driven skills |
| A3 | **Switchboard deep dive** | API & integration hub — GraphQL + MCP endpoints, data scoping, authorization, real-time sync |
| A4 | **Cloud & ecosystem** | Vetra (hosting, packages, AI agents, dev tooling) + Achra (marketplace, BAI, implementation partners) |

---

## Slide Design Notes

- **Forwardable sections:** Acts 4 (compliance) and the comparison table (slide 19) should be visually self-contained — a CTO will screenshot or PDF-export these for the DPO/legal team.
- **Architecture diagram (slide 12):** Most important visual in the deck. Must clearly show data flow and isolation boundaries. Consider full-bleed illustration.
- **Tiered model access (slide 14):** Visual must communicate graduated trust levels. Gradient from locked/local to open/commercial.
- **Comparison table (slide 19):** Use two-column layout with clear visual differentiation (muted left column for incumbents, accented right column for Powerhouse).
- **No fake metrics:** No invented user counts or response times. Use structural claims only.
- **Demo reference:** Slides 7–9 (three pillars) are where the presenter would pause for or reference a live demo. Mark with presenter notes.
