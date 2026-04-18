# ph-clint for Enterprise Process Automation

**A consultancy offering for replacing legacy ERP workflows with AI-native, document-driven automation — powered by the Powerhouse stack.**

---

## The Problem: Intelligence Lock-In and Legacy Rigidity

Enterprise companies run on ERP systems that were designed for a pre-AI world. Business logic is buried in opaque modules, operational data is trapped in proprietary formats, and process changes require expensive vendor engagements. When these organizations try to adopt AI, they face a hard choice: hand their data and processes to external AI vendors (losing control of what makes them unique), or bolt chatbots onto systems that were never designed for machine interaction.

As [BAI by Powerhouse](https://bai.powerhouse.io/) frames it: *"In the age of AI, companies risk outsourcing the intelligence that makes them unique."* The answer is not more SaaS — it is a structured data layer that keeps processes, data, and decision-making in-house while making them AI-readable.

## The Approach: Data Layer First, Then Agents

A consultancy team using ph-clint and the Powerhouse stack follows a four-phase engagement model that mirrors BAI's methodology.

### Phase 1 — Audit and Model (Weeks 1–3)

Map the client's core business processes (procurement, invoicing, approvals, reporting) and identify where data lives today — ERP exports, spreadsheets, email threads, legacy databases. For each process, define a **Powerhouse document model**: a typed, versioned, cryptographically verifiable data structure with an append-only operation history. This is the "AI-readable business data" layer that BAI identifies as the prerequisite for everything else.

**Deliverable:** A set of document model schemas (Zod-based) covering the client's critical workflows, plus a data migration plan from legacy sources.

### Phase 2 — Build the CLI Harness (Weeks 3–5)

Using ph-clint, generate a **branded CLI tool** for the client from the document models created in Phase 1. Each document operation (create invoice, approve expense, update forecast) becomes a CLI command — automatically, from the Zod schemas. The same command definitions work as:

- **Terminal commands** for ops teams and scripts (`erp-next invoice create --vendor Acme`)
- **REPL commands** for interactive operator sessions (`/invoice list --status pending`)
- **MCP tools** that any AI agent can call without custom integration
- **Agent skills** that teach the embedded AI assistant how to perform domain workflows step-by-step

This is not a prototype — it is a production-grade interface with auto-completion, help generation, streaming output, config management, and workspace isolation, all derived from the same schemas.

### Phase 3 — Add Intelligence (Weeks 5–8)

With the structured data layer and CLI harness in place, layer in AI agents via Mastra integration:

- **Process agents** that monitor document changes through the routine loop (e.g., "when a new purchase order arrives, validate it against budget thresholds and flag exceptions")
- **Conversational assistants** that let operators interact with business data in natural language, backed by the full set of typed commands as agent tools
- **Workflow triggers** that fire on document events, timers, or conditions — driving autonomous processing without custom orchestration code

Provider flexibility is built in: sensitive financial data stays on local models; general-purpose tasks use commercial APIs. The client's data never leaves their infrastructure for model training. AI agents are sandboxed from live systems — they operate through the document layer, not directly on databases.

### Phase 4 — Operationalize (Weeks 8–10)

Deploy the solution with clear success metrics tied to the pre-engagement audit:

- Reduction in manual processing time (BAI's reference: 65% reduction in invoice review)
- Error rates on data entry and approvals
- Time-to-resolution for exceptions and escalations
- Agent autonomy rate (percentage of routine items handled without human intervention)

The CLI harness runs as a background service with the routine loop, processing work items continuously. Operators interact through the REPL or a connected chat UI. Everything is auditable — every document change is an operation in an append-only history.

## Why ph-clint Is the Right Foundation

| Consultancy need | ph-clint capability |
|---|---|
| Rapid delivery from domain models | Auto-generated CLI from Zod schemas — commands, help, validation, prompting |
| Client branding and ownership | Whitelabel framework — client gets their own named tool, not a vendor product |
| Multiple user surfaces | Same commands work in terminal, chat UI, Slack, MCP — one codebase |
| Autonomous processing | Routine loop with pluggable triggers, no external orchestrator needed |
| AI without lock-in | Mastra integration with swappable providers; data sovereignty by architecture |
| Auditability and compliance | Powerhouse document models with cryptographic verification and operation history |
| Testability and reliability | Three-level testing (unit/integration/E2E) built into the framework, 95% coverage target |
| Incremental adoption | Works without AI (pure command automation first), agents added later |

## Engagement Model for Consultancies

A team of 2–3 engineers can deliver a Phase 1–4 engagement in 10 weeks. The engagement produces:

1. **Document models** — Typed schemas for the client's core business objects, reusable across the Powerhouse ecosystem (22+ pre-built modules available as starting points for finance, billing, reporting, work management)
2. **A branded CLI tool** — The client's own process automation interface, fully owned and extensible
3. **Agent configurations** — Trained skills and workflow triggers tailored to the client's processes
4. **Runbooks** — Operator documentation generated from the same schemas that drive the CLI

Post-engagement, the client can extend the system independently — adding commands, triggers, and agent skills — because the framework is designed for generation, not hand-crafting. The consultancy retains a maintenance relationship, but the client is never locked in.

## The Vision Alignment

This model directly implements BAI's four pillars:

1. **AI-Readable Business Data** — Document models transform locked processes into structured, queryable, AI-accessible data
2. **Provider Flexibility** — Mastra's pluggable LLM backend; local models for sensitive workflows, commercial APIs for the rest
3. **Data Sovereignty by Architecture** — Workspace isolation, local-first document storage, no third-party training on client data
4. **Clear Success Metrics** — Pre-engagement audits and measurable outcomes baked into the methodology

The result: enterprise companies get the benefits of modern AI-driven process automation without surrendering control of their data, their processes, or the intelligence that differentiates their business.
