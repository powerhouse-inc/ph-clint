# Copywriting Tasks — prototype-v2

Every content paragraph below needs to be replaced with production copy. The current text describes WHAT we want to say (messaging intent); the new copy should say it HOW a CTO/VP Engineering audience needs to hear it — concise, credible, no marketing fluff.

Reference the positioning brief (`../brief/`) for audience, emotional drivers, and tone guidance.

---

## index.html

### 1. Hero (Section 1)

| # | Element | Location | Current intent | Notes |
|---|---------|----------|---------------|-------|
| 1.1 | **Hero headline** | `h1.hero-title` (line 1108) | "AI-Native Operations. Private by Architecture." | Core positioning statement. Must land the dual promise (AI + privacy) in ≤8 words. |
| 1.2 | **Hero body paragraph** | `p.hero-body` (line 1109–1111) | Explains competitor pressure + Powerhouse as private AI infrastructure | First paragraph a CTO reads. Must hit emotional driver #1 (urgency) and #2 (caution). Keep ≤3 sentences. |
| 1.3 | **Hero funnel link** | `span.hero-funnel` (line 1116) | "Or start with an AI readiness assessment" | Secondary CTA micro-copy. Conversational nudge toward BAI. |

### 2. The Problem (Section 2)

| # | Element | Location | Current intent | Notes |
|---|---------|----------|---------------|-------|
| 2.1 | **Problem quote** | `p.problem-quote` (line 1126) | "Every AI vendor wants your data. Your regulators say no." | Provocative hook. Should feel like the CTO's inner monologue, not a tagline. |
| 2.2 | **Problem paragraph 1** | `p.problem-text` (line 1127–1129) | Enterprise AI stalling because deployment model is wrong — data must leave | The core problem statement. Establish credibility by naming the real blocker. |
| 2.3 | **Problem paragraph 2** | `p.problem-text` (line 1130–1132) | The result: stuck between consumer chatbots and year-long integrations | Consequence of the problem. Should feel like naming their lived experience. |
| 2.4 | **Problem paragraph 3** | `p.problem-text` (line 1133–1135) | Third path: make data AI-native without it leaving your environment | Transition to solution. Not a pitch — a reframe. |
| 2.5 | **Problem funnel link** | `a.funnel-link` (line 1136) | "Find out where you stand — get an AI readiness assessment" | Inline CTA after problem section. |

### 3. The Solution — Three Pillars (Section 3)

| # | Element | Location | Current intent | Notes |
|---|---------|----------|---------------|-------|
| 3.1 | **Section headline** | `h2.section-title` (line 1147) | "Private data. AI-native. Real-time." | Summarizes the three pillars in ≤6 words. |
| 3.2 | **Pillar 1: Private by Default — body** | `p.pillar-body` in `.pillar-card.private` (line 1152–1154) | Data stays on your infra, local models, commercial APIs with separation, no training | The privacy promise. Must be specific enough for a DPO to forward. |
| 3.3 | **Pillar 2: AI-Native — body** | `p.pillar-body` in `.pillar-card.ai-native` (line 1159–1161) | Existing systems → structured data layer, multi-agent, specification-driven, human approval | The AI story. Differentiate from "bolt-on AI" narrative. |
| 3.4 | **Pillar 3: Real-Time and Scalable — body** | `p.pillar-body` in `.pillar-card.realtime` (line 1166–1168) | Event sourcing, CQRS, real-time sync, horizontal scaling | The architecture story. For enterprise architects who read everything. |

### 4. Use Cases (Section 4)

| # | Element | Location | Current intent | Notes |
|---|---------|----------|---------------|-------|
| 4.1 | **Section headline** | `h2.section-title` (line 1180) | "Built for industries where confidentiality isn't optional." | |
| 4.2 | **Legal — body** | `p.use-case-body` (line 1186–1188) | Contract review, due diligence, local models, multi-agent, audit trail | Industry-specific scenario. Should feel like describing their actual workflow. |
| 4.3 | **Legal — link text 1** | `a` in `.use-case-links` (line 1190) | "Assess your AI readiness for legal operations" | |
| 4.4 | **Legal — link text 2** | `a` in `.use-case-links` (line 1191) | "See how Clint powers multi-agent legal workflows" | |
| 4.5 | **HR — body** | `p.use-case-body` (line 1198–1199) | Recruitment, employee records, PII protection, GDPR structural | |
| 4.6 | **HR — link text 1** | `a` in `.use-case-links` (line 1202) | "Assess your AI readiness for HR operations" | |
| 4.7 | **HR — link text 2** | `a` in `.use-case-links` (line 1203) | "See how Renown governs identity and PII access" | |
| 4.8 | **Procurement — body** | `p.use-case-body` (line 1210–1211) | Vendor eval, contract negotiation, spend analysis, data scoping | |
| 4.9 | **Procurement — link text 1** | `a` in `.use-case-links` (line 1214) | "Assess your AI readiness for procurement" | |
| 4.10 | **Procurement — link text 2** | `a` in `.use-case-links` (line 1215) | "See how Switchboard scopes data per integration" | |
| 4.11 | **Finance — body** | `p.use-case-body` (line 1222–1223) | Reporting, forecasting, audit prep, local models, append-only history | |
| 4.12 | **Finance — link text 1** | `a` in `.use-case-links` (line 1226) | "Assess your AI readiness for finance" | |
| 4.13 | **Finance — link text 2** | `a` in `.use-case-links` (line 1227) | "See how Connect provides audit-ready modules" | |

### 5. The Platform (Section 5)

| # | Element | Location | Current intent | Notes |
|---|---------|----------|---------------|-------|
| 5.1 | **Section headline** | `h2.section-title` (line 1241) | "Five components. Your architecture. Your brand." | |
| 5.2 | **Section subtitle** | `p.section-subtitle` (line 1242) | "Local, whitelabel components you own and operate — on your servers, under your control." | |
| 5.3 | **Clint — description** | `p.component-desc` (line 1249) | Define processes as typed schemas; generates console, MCP server, multi-agent harness | One-paragraph elevator pitch per component. |
| 5.4 | **Fusion — description** | `p.component-desc` (line 1257) | Modern intranet replacement; business data, workflows, dashboards, AI outputs | |
| 5.5 | **Connect — description** | `p.component-desc` (line 1265) | Browser-based workspace; structured business objects; human oversight of AI | |
| 5.6 | **Switchboard — description** | `p.component-desc` (line 1273) | GraphQL + MCP endpoints; existing system integration; data scope boundaries | |
| 5.7 | **Renown — description** | `p.component-desc` (line 1281) | Unified identity for humans + agents; attributed actions; enterprise SSO | |

### 5b. Architecture Diagram (Section 5b)

| # | Element | Location | Current intent | Notes |
|---|---------|----------|---------------|-------|
| 5b.1 | **Section headline** | `h2.section-title` (line 1293) | "From existing systems to AI-native operations." | |
| 5b.2 | **Diagram caption** | `p.arch-caption` (line 1391) | Narrative walkthrough of how the five components connect | Should read as a brief architecture explainer for someone scanning the diagram. |

### 6. Integration & Data Isolation (Section 6)

| # | Element | Location | Current intent | Notes |
|---|---------|----------|---------------|-------|
| 6.1 | **Section headline** | `h2.section-title` (line 1403) | "Connect everything. Expose nothing." | |
| 6.2 | **Parallel adoption — heading** | `h3` (line 1407) | "Parallel adoption, not rip-and-replace" | |
| 6.3 | **Parallel adoption — body** | `p` (line 1408) | Doesn't replace existing systems; runs alongside; existing workflows continue | Key objection handler: "do I have to rip out SAP?" |
| 6.4 | **Data boundary — heading** | `h3` (line 1410) | "Every integration is a data boundary" | |
| 6.5 | **Data boundary — body** | `p` (line 1411) | Each connection defines scope; HR agent ≠ finance data; isolation at integration level | |
| 6.6 | **Tiered AI card — title** | `h3.tier-title` (line 1415) | "Tiered AI Model Access" | |
| 6.7 | **Local Models — description** | `.tier-item-desc` (line 1420) | Most sensitive data; open-source models; nothing leaves your network | |
| 6.8 | **Frontier Models — description** | `.tier-item-desc` (line 1427) | Less sensitive; censored summaries, redacted extracts | |
| 6.9 | **General Models — description** | `.tier-item-desc` (line 1434) | Non-confidential; drafting, formatting, research | |
| 6.10 | **Tier footer** | `.tier-footer` (line 1437) | "Your DPO defines the tiers. The architecture enforces them." | Punchy summary line. |
| 6.11 | **Integration funnel link** | `a.funnel-link` (line 1440) | "Need help mapping your data flows and privacy tiers? Start with a BAI assessment" | |

### 7. Privacy & Compliance (Section 7)

| # | Element | Location | Current intent | Notes |
|---|---------|----------|---------------|-------|
| 7.1 | **Section headline** | `h2.section-title` (line 1450) | "Built into the architecture. Not bolted on." | |
| 7.2 | **Section subtitle** | `p.section-subtitle` (line 1451) | "The section the CTO sends to the DPO, legal counsel, and compliance team." | Meta-instruction for forwarding. Unusual — validate in copy review. |
| 7.3 | **Data Residency — body** | `p.privacy-card-body` (line 1456) | All data on your infra; self-host or Vetra Cloud; no replication unless configured | |
| 7.4 | **Immutable Audit Trail — body** | `p.privacy-card-body` (line 1460) | Every op cryptographically signed; history IS the data structure; SOX/GDPR/HIPAA | |
| 7.5 | **Ready for What's Coming — body** | `p.privacy-card-body` (line 1464) | EU AI Act, data provenance, algorithmic accountability; already structurally ready | Forward-looking compliance argument. Should feel prescient, not speculative. |
| 7.6 | **Data Portability — body** | `p.privacy-card-body` (line 1468) | JSON data, TypeScript schemas, open source; everything comes with you | |
| 7.7 | **Privacy funnel link** | `a.funnel-link` (line 1471) | "Get a privacy impact analysis for your AI initiative" | |

### 8. Cloud & Ecosystem (Section 8)

| # | Element | Location | Current intent | Notes |
|---|---------|----------|---------------|-------|
| 8.1 | **Section headline** | `h2.section-title` (line 1483) | "The infrastructure and community behind the platform." | |
| 8.2 | **Section subtitle** | `p.section-subtitle` (line 1484) | Clarifies: above = what you own locally; this = cloud services + ecosystem | |
| 8.3 | **Vetra — description** | `p.eco-desc` (line 1492) | Platform infrastructure for dev, hosting, packages | |
| 8.4 | **Vetra — feature list** (4 items) | `ul.eco-features` (lines 1494–1497) | Managed cloud, registry, pre-configured agents, dev tooling | Each bullet is a separate copy item. |
| 8.5 | **Achra — description** | `p.eco-desc` (line 1507) | Builder and operator marketplace | |
| 8.6 | **Achra — feature list** (3 items) | `ul.eco-features` (lines 1509–1511) | Implementation partners, pre-built solutions, BAI team | Each bullet is a separate copy item. |

### 9. Technical Reference (Section 10 in HTML)

| # | Element | Location | Current intent | Notes |
|---|---------|----------|---------------|-------|
| 9.1 | **Section headline** | `h2.section-title` (line 1527) | "Scannable reference for architecture review." | |
| 9.2 | **Tech specs table** (10 rows) | `table.specs-table tbody` (lines 1536–1545) | Data privacy, AI integration, Integration, Data model, Identity, Scalability, Sync, Compliance, Stack, Deployment | Each row's "Detail" cell is a separate copy item. Dense, factual. For enterprise architect's evaluation doc. |

### 10. Comparison Table (Section 11 in HTML)

| # | Element | Location | Current intent | Notes |
|---|---------|----------|---------------|-------|
| 10.1 | **Section headline** | `h2.section-title` (line 1557) | "The 'safe choice' isn't safe." | Provocative framing. Must not feel arrogant. |
| 10.2 | **Comparison intro paragraph** | `p.comparison-intro` (line 1558–1559) | Incumbents are bolting AI onto legacy architectures + processing your data | Sets up the comparison table. |
| 10.3 | **Comparison table** (8 rows × 2 cols) | `table.comparison-table tbody` (lines 1570–1577) | Data privacy, AI readiness, Agent control, Integration, Time to value, Compliance, Regulatory readiness, Vendor lock-in — each with "Cloud AI" vs "Powerhouse" | 16 individual cell copy items. Must be fair, not strawman. |

### 11. Why Powerhouse (Section 12 in HTML)

| # | Element | Location | Current intent | Notes |
|---|---------|----------|---------------|-------|
| 11.1 | **Section headline** | `h2.section-title` (line 1589) | "We build on what we ship." | |
| 11.2 | **Who We Are — body** | `p.why-card-body` in `.why-card.origin` (line 1594) | MakerDAO origin, reactive doc architecture born from that, open-source since 2021 | Origin story. Must be concise and credibility-building. |
| 11.3 | **We Run on Our Own Stack — body** | `p.why-card-body` (line 1598) | Achra + Vetra are Powerhouse apps; demos show production systems | Dogfooding argument. |
| 11.4 | **Your Team Already Knows the Stack — body** | `p.why-card-body` (line 1602) | TypeScript, React, GraphQL, Node.js — mainstream stack | Talent/adoption risk mitigation. |
| 11.5 | **Early Means Advantage — body** | `p.why-card-body` (line 1606) | Direct access, co-creation partnership, feature requests → roadmap, reference architecture | The frontier positioning pitch. |
| 11.6 | **Open Source Is Your Insurance — body** | `p.why-card-body` (line 1610) | JSON data, TypeScript schemas, open source; no lock-in | Exit strategy / vendor risk mitigation. |

### 12. Get Started / CTA (Section 13 in HTML)

| # | Element | Location | Current intent | Notes |
|---|---------|----------|---------------|-------|
| 12.1 | **CTA headline** | `h2.cta-title` (line 1622) | "Three ways to move." | Should convey momentum, not pressure. |
| 12.2 | **CTA subtitle** | `p.cta-subtitle` (line 1623) | "Whether you want a live demo, a structured assessment, or to start building — there's a clear next step." | |
| 12.3 | **See It Live — description** | `p.cta-option-desc` (line 1628) | Request a demo; platform running in production; map architecture to your operations | |
| 12.4 | **Assess Your Readiness — description** | `p.cta-option-desc` (line 1633) | AI readiness assessment; 2–3 week data flow audit; prioritized roadmap; no commitment | Key conversion path. Must feel low-risk, high-value. |
| 12.5 | **Explore the Platform — description** | `p.cta-option-desc` (line 1638) | Dev environment, registry, docs, managed hosting | |
| 12.6 | **Find Implementation Partners — description** | `p.cta-option-desc` (line 1643) | Builders and service providers in Powerhouse network | |
| 12.7 | **Contact line** | `p.cta-contact` (line 1648) | "Or talk to us directly: hello@powerhouse.inc" | |

---

## clint.html

### C1. Hero

| # | Element | Current intent | Notes |
|---|---------|---------------|-------|
| C1.1 | **Hero role line** | "AI Agent Infrastructure for Private Operations" | One-line positioning. |
| C1.2 | **Hero body** (line 39–41) | Define processes as typed schemas → console + MCP + multi-agent; sandboxed, local models, audit trails | Product elevator pitch. ≤3 sentences. |

### C2. What It Does

| # | Element | Current intent | Notes |
|---|---------|---------------|-------|
| C2.1 | **Section headline** | "One definition. Five interfaces." | |
| C2.2 | **Section subtitle** | "A single set of typed command definitions — derived from your business schemas — automatically produces:" | |
| C2.3 | **Card 1: CLI — description** | "Scriptable automation for IT teams and CI/CD pipelines." | |
| C2.4 | **Card 2: Interactive Console — description** | "REPL with auto-completion, parameter prompting, and persistent sessions." | |
| C2.5 | **Card 3: MCP Server — description** | "Model Context Protocol endpoints that any AI agent or tool can call." | |
| C2.6 | **Card 4: Multi-Agent Harness — description** | "Orchestrate multiple AI agents, each with scoped permissions and dedicated skills." | |
| C2.7 | **Card 5: Whitelabel Product — description** | "Your brand, your naming, your identity. Operators see an internal tool, not a vendor product." | |

### C3. Core Capabilities

| # | Element | Current intent | Notes |
|---|---------|---------------|-------|
| C3.1 | **Section headline** | "Enterprise-grade AI agent infrastructure." | |
| C3.2 | **Specification-Driven AI — body** (line 95) | Agents follow structured playbooks, not open-ended prompts; multi-step workflows; when to escalate | |
| C3.3 | **Multi-Agent Orchestration — body** (line 99) | Multiple specialized agents; concurrent; sandboxed per scope/permissions/model tier | |
| C3.4 | **Agent Sandboxing — body** (line 103) | Declarative permission boundaries; data, operations, model, inter-agent | |
| C3.5 | **Routine Loop — body** (line 107) | Continuous execution; event/timer/condition triggers; work items → commands/prompts/skills | |
| C3.6 | **Streaming Output — body** (line 111) | Incremental rendering; tool calls distinct; structured outputs per interface | |
| C3.7 | **Conversation Memory — body** (line 115) | Thread-based; cross-session; operators resume complex workflows | |

### C4. Integration Architecture

| # | Element | Current intent | Notes |
|---|---------|---------------|-------|
| C4.1 | **Section headline** | "Two-way MCP. Full platform integration." | |
| C4.2 | **MCP Server — body** (line 130) | Every command auto-available as MCP tool; external agents, IDEs call business ops | |
| C4.3 | **MCP Client — body** (line 133) | Connects to external MCP servers; dynamic tool discovery; agents adapt | |
| C4.4 | **Switchboard Integration — body** (line 137) | Clint as MCP client to Switchboard; data boundaries respected | |
| C4.5 | **Reactor Integration — body** (line 140) | Subscribe to doc changes; dispatch operations; events → triggers; auto-loaded skills | |

### C5. Enterprise Value

| # | Element | Current intent | Notes |
|---|---------|---------------|-------|
| C5.1 | **Section headline** | "Built for production. Built for compliance." | |
| C5.2 | **Private AI Operations — body** (line 155) | Agents on your infra; sensitive data with local models; sandboxing per agent | |
| C5.3 | **Auditable Agent Behavior — body** (line 159) | Every action typed, append-only, signed, timestamped, attributed | |
| C5.4 | **Whitelabel Ownership — body** (line 163) | Your tool, your brand; IT governance evaluates a tool your team owns | |
| C5.5 | **Incremental Adoption — body** (line 167) | Start without AI — pure command automation; add agents later | |

### C6. CTA

| # | Element | Current intent | Notes |
|---|---------|---------------|-------|
| C6.1 | **CTA headline** | "Evaluate Clint for your operations" | |
| C6.2 | **CTA body** (line 196) | BAI team assesses how Clint maps to your processes, data sensitivity, existing systems | |

---

## connect.html

### CO1. Hero

| # | Element | Current intent | Notes |
|---|---------|---------------|-------|
| CO1.1 | **Hero role line** | "The Operator Workspace" | |
| CO1.2 | **Hero body** (line 38) | Browser-based; structured business data; workflow views; real-time collab; human oversight of AI | |

### CO2. What Connect Does

| # | Element | Current intent | Notes |
|---|---------|---------------|-------|
| CO2.1 | **Section headline** | "Where your teams do the work." | |
| CO2.2 | **Structured Business Data — body** (line 55) | Typed schemas; invoices, contracts, expense reports; valid by construction | |
| CO2.3 | **Drive Apps — body** (line 59) | Specialized workflow interfaces overlaying file system; standardized processes | |
| CO2.4 | **Real-Time Collaboration — body** (line 63) | Op-based sync; multiple users; attributed, versioned, mergeable | |
| CO2.5 | **Human Oversight of AI — body** (line 67) | Agents act on same data; operators see what agents did; review/approve/reject | |
| CO2.6 | **Offline-Capable — body** (line 71) | Local-first; works without network; queue and sync | |
| CO2.7 | **Cryptographic Verification — body** (line 75) | Every op signed; offline-verifiable; tamper-proof as inherent property | |

### CO3. Pre-Built Modules

| # | Element | Current intent | Notes |
|---|---------|---------------|-------|
| CO3.1 | **Section headline** | "Ready-to-use business modules." | |
| CO3.2 | **Section subtitle** | "Available through the Vetra package registry. Use as-is, customize, or build your own." | |
| CO3.3 | **Finance & Billing — body** | "Chart of accounts, transaction ledgers, billing statements, payment terms, expense reporting" | |
| CO3.4 | **Reporting — body** | "Invoices, expense reports, period snapshots" | |
| CO3.5 | **Work Management — body** | "Scope of work, RFPs, workstreams" | |
| CO3.6 | **Services — body** | "Service offerings, subscriptions, resource tracking, templates" | |
| CO3.7 | **Teams & Networks — body** | "Builder profiles, registries, organizational profiles" | |
| CO3.8 | **Treasury — body** | "Revenue distribution" | |

### CO4. CTA

| # | Element | Current intent | Notes |
|---|---------|---------------|-------|
| CO4.1 | **CTA headline** | "Evaluate Connect for your organization" | |
| CO4.2 | **CTA body** (line 135) | BAI team assesses how Connect maps to workflows, doc types, collab requirements | |

---

## fusion.html

### F1. Hero

| # | Element | Current intent | Notes |
|---|---------|---------------|-------|
| F1.1 | **Hero role line** | "Your Internal Platform, AI-Integrated" | |
| F1.2 | **Hero body** (line 38) | Replace legacy intranet, departmental portals, scattered tools; unified, branded, AI-integrated | |

### F2. What Fusion Does

| # | Element | Current intent | Notes |
|---|---------|---------------|-------|
| F2.1 | **Section headline** | "The modern enterprise intranet — except it actually works." | |
| F2.2 | **Section subtitle** (line 51) | Next.js internal platform framework; connects to Switchboard; presents data, workflows, dashboards, AI output | |
| F2.3 | **What It Replaces — body** (line 56) | SharePoint-style portals, scattered dashboards, unmaintained internal tools | |
| F2.4 | **What It Provides — body** (line 60) | Unified workspace, per-dept customization, AI outputs alongside live data, whitelabel | |

### F3. Architecture

| # | Element | Current intent | Notes |
|---|---------|---------------|-------|
| F3.1 | **Section headline** | "Switchboard-backed. Standards-based." | |
| F3.2 | **Switchboard-Backed — body** (line 74) | Reads/writes through GraphQL API; auth/scoping/audit at Switchboard layer | |
| F3.3 | **Customizable Modules — body** (line 78) | Department-specific modules: finance, HR, procurement, legal | |
| F3.4 | **Verification and Audit — body** (line 82) | Users inspect verification trail; AI content attributed and traceable | |
| F3.5 | **Extensible — body** (line 86) | Standard Next.js dev; React/TypeScript; no proprietary framework | |

### F4. Use Cases

| # | Element | Current intent | Notes |
|---|---------|---------------|-------|
| F4.1 | **Section headline** | "Enterprise-grade internal applications." | |
| F4.2 | **Executive Dashboards — body** (line 100) | Real-time overview; financials, headcount, project status, compliance metrics; AI summaries | |
| F4.3 | **Department Portals — body** (line 104) | HR self-service, procurement tracking, legal status, finance reporting | |
| F4.4 | **Audit & Compliance Views — body** (line 108) | Inspectable operation history; export audit trails | |
| F4.5 | **Stakeholder Reporting — body** (line 112) | External-facing views: investor dashboards, partner portals, client status pages | |

### F5. CTA

| # | Element | Current intent | Notes |
|---|---------|---------------|-------|
| F5.1 | **CTA headline** | "Evaluate Fusion for your organization" | |
| F5.2 | **CTA body** (line 136) | BAI team assesses internal platform needs, departmental workflows, reporting | |

---

## switchboard.html

### S1. Hero

| # | Element | Current intent | Notes |
|---|---------|---------------|-------|
| S1.1 | **Hero role line** | "API & Integration Hub" | |
| S1.2 | **Hero body** (line 38) | System boundary for existing systems, AI agents, and apps; GraphQL + MCP auto-generated; data scoping, auth, audit | |

### S2. What Switchboard Does

| # | Element | Current intent | Notes |
|---|---------|---------------|-------|
| S2.1 | **Section headline** | "Connect everything. Control everything." | |
| S2.2 | **Section subtitle** | "Switchboard serves three audiences simultaneously." | |
| S2.3 | **For AI Agents — body** (line 56) | Every op as MCP tool; typed, permission-scoped interfaces; no custom adapter | |
| S2.4 | **For Existing Systems — body** (line 60) | GraphQL API; ERP, HRIS, doc mgmt, email, financial; explicit data flows | |
| S2.5 | **For Applications — body** (line 64) | Fusion, Connect, custom apps; auth + scoping + real-time sync at this layer | |

### S3. Integration Architecture

| # | Element | Current intent | Notes |
|---|---------|---------------|-------|
| S3.1 | **Section headline** | "Standards-based. Scope-defined. Auto-generated." | |
| S3.2 | **Standards-Based Connectivity — body** (line 78) | GraphQL + MCP auto-generated from schemas; API surface updates automatically | |
| S3.3 | **Data Scoping per Integration — body** (line 82) | Each connection defines scope; no blanket access; declarative and auditable | |
| S3.4 | **Multi-Layered Data Access — body** (line 86) | Operational, historical, analytical data | |
| S3.5 | **Downstream Automation — body** (line 90) | Doc change events → Clint triggers, dashboard updates, webhooks, agent follow-up | |

### S4. Data Isolation Role

| # | Element | Current intent | Notes |
|---|---------|---------------|-------|
| S4.1 | **Section headline** | "Central to the privacy architecture." | |
| S4.2 | **Tiered AI Model Routing — body** (line 104) | Data scoping controls what reaches which AI model tier | |
| S4.3 | **Agent Permission Enforcement — body** (line 108) | Agent identity → which endpoints accessible; enforced at API boundary | |
| S4.4 | **Cross-System Boundary — body** (line 112) | Data doesn't auto-flow between systems; each path explicit | |
| S4.5 | **Audit at the Boundary — body** (line 116) | Every API call logged: caller, operation, data, timestamp | |

### S5. Target Audiences Table

| # | Element | Current intent | Notes |
|---|---------|---------------|-------|
| S5.1 | **Section headline** | "Who uses Switchboard." | |
| S5.2 | **Table** (4 rows) | Data engineers, Software engineers, Integration engineers, AI/ML teams — each with description | 4 copy items. |

### S6. CTA

| # | Element | Current intent | Notes |
|---|---------|---------------|-------|
| S6.1 | **CTA headline** | "Evaluate Switchboard for your integration landscape" | |
| S6.2 | **CTA body** (line 161) | BAI maps existing systems, data flows, privacy requirements to Switchboard architecture | |

---

## renown.html

### R1. Hero

| # | Element | Current intent | Notes |
|---|---------|---------------|-------|
| R1.1 | **Hero role line** | "Identity for Agents and Users" | |
| R1.2 | **Hero body** (line 38) | Unified identity for every actor; every action attributed; every permission scoped; every boundary enforced | |

### R2. What Renown Does

| # | Element | Current intent | Notes |
|---|---------|---------------|-------|
| R2.1 | **Section headline** | "One identity layer. Humans and machines." | |
| R2.2 | **Unified Identity Model — body** (line 55) | Every actor has Renown identity with permissions; same framework for all | |
| R2.3 | **Cryptographic Attribution — body** (line 59) | Every op signed; who did it with crypto proof; agent actions distinguishable | |
| R2.4 | **Scoped Authorization — body** (line 63) | Declarative, granular permissions; applies uniformly | |
| R2.5 | **Access Control — body** (line 67) | Auth + access gating for docs, drives, workflows; hierarchies, stage gates | |

### R3. Agent Identity

| # | Element | Current intent | Notes |
|---|---------|---------------|-------|
| R3.1 | **Section headline** | "Why agents need identity." | |
| R3.2 | **Section subtitle** | "When AI agents operate on business data, the compliance question is always: 'who did this, and were they authorized?'" | |
| R3.3 | **Distinct Agent Identities — body** (line 82) | Own identity separate from configuring human; actions attributed to agent | |
| R3.4 | **Permission Boundaries — body** (line 86) | Data access scope, allowed ops, AI model tier; enforced by Switchboard | |
| R3.5 | **Audit Distinction — body** (line 90) | Immutable history distinguishes human vs agent; filter/inspect/report independently | |
| R3.6 | **Agent-to-Agent Trust — body** (line 97) | Renown governs trust relationships; data flow between scopes; escalation auth | |
| R3.7 | **Contribution-Based Reputation — body** (line 101) | Tracks verified contributions; builds profile for trust/access decisions | |

### R4. Enterprise Identity Integration

| # | Element | Current intent | Notes |
|---|---------|---------------|-------|
| R4.1 | **Section headline** | "From cryptographic identity to enterprise SSO." | |
| R4.2 | **Current Capabilities — body** (line 115) | Ethereum-based auth; pseudonymous profiles; per-doc/drive access; cross-org identity | |
| R4.3 | **Enterprise SSO Roadmap — body** (line 119) | SAML (Azure AD, Okta, Ping); OIDC; directory sync; co-creation priority | Must be honest about roadmap vs current. |

### R5. CTA

| # | Element | Current intent | Notes |
|---|---------|---------------|-------|
| R5.1 | **CTA headline** | "Evaluate Renown for your identity requirements" | |
| R5.2 | **CTA body** (line 144) | BAI assesses IAM infra, agent auth needs, compliance requirements | |

---

## Summary

| Page | Copy items |
|------|-----------|
| index.html | 72 |
| clint.html | 24 |
| connect.html | 18 |
| fusion.html | 16 |
| switchboard.html | 18 |
| renown.html | 17 |
| **Total** | **165** |

Each item above is a discrete content block that needs production copywriting. Technical specs tables and comparison tables contain multiple cells listed as single items — actual word count will be higher than item count suggests.
