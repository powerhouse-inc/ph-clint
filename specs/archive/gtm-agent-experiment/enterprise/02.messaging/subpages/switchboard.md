# enterprise.powerhouse.io/switchboard — Switchboard Subpage

**Navigation:** Enterprise Home > Platform > Switchboard

**Page purpose:** Explain Switchboard as the API, integration, and data boundary layer for the enterprise platform.

---

## 1. Hero

**Headline:** "Switchboard — API & Integration Hub"

**Subhead:** The system boundary where your existing systems, AI agents, and applications interact with your Powerhouse data infrastructure. GraphQL and MCP endpoints auto-generated from your business schemas — with built-in data scoping, authorization, and audit trails.

**CTA:** "Request a Demo" / "Back to Platform Overview"

---

## 2. What Switchboard Does

**"Connect everything. Control everything."**

Switchboard is the integration and API layer of the Powerhouse platform. It serves three audiences simultaneously:

### For AI agents

Every business operation is exposed as an MCP (Model Context Protocol) tool endpoint. AI agents — whether managed by Clint, running in external platforms, or operating through IDE integrations — interact with your business data through typed, permission-scoped interfaces. No custom adapter per agent. No uncontrolled data access.

### For existing systems

Standards-based GraphQL API connects your ERP, HRIS, document management, email, and financial systems to the Powerhouse data layer. Each integration defines exactly what data flows in and out, creating natural boundaries for data access and AI processing.

### For applications

Fusion, Connect, and custom applications all consume data through Switchboard. Authorization, data scoping, real-time sync, and multi-tenant access are handled at this layer — applications inherit every privacy guarantee without implementing their own.

---

## 3. Integration Architecture

### Standards-based connectivity

GraphQL for structured queries and mutations. MCP for AI agent tool access. Both are auto-generated from your business schemas — when the schema changes, the API surface updates automatically. No hand-written API code to maintain.

### Data scoping per integration

Each connection to an external system or agent defines a scope:
- What data types are accessible
- What operations are permitted
- What data shape is exposed (full, summarized, redacted)

An HR integration sees personnel data. A procurement integration sees vendor data. A finance agent sees financial records. No integration has blanket access. Scoping is declarative and auditable.

### Multi-layered data access

Switchboard provides access to:
- **Operational data** — Current state of business objects
- **Historical data** — Full operation history for any document
- **Analytical data** — Read models and aggregations built by event-driven processors

### Downstream automation

Document change events flow through Switchboard to trigger:
- Clint routine loop work items
- Dashboard updates in Fusion
- Webhook notifications to external systems
- Agent-initiated follow-up operations

---

## 4. Data Isolation Role

Switchboard is central to the platform's data isolation model:

- **Tiered AI model routing** — Switchboard's data scoping controls what data reaches which AI model tier (local models for sensitive data, commercial APIs for sanitized summaries)
- **Agent permission enforcement** — Agent identity (via Renown) determines which Switchboard endpoints are accessible
- **Cross-system boundary** — Data from one system doesn't automatically flow to another; each integration path is explicit
- **Audit at the boundary** — Every API call through Switchboard is logged with caller identity, operation type, data accessed, and timestamp

---

## 5. Technical Details

| Characteristic | Detail |
|---|---|
| **APIs** | GraphQL (queries, mutations, subscriptions) + MCP (tool endpoints) |
| **Schema generation** | Auto-generated from business document model schemas |
| **Authorization** | Per-integration, per-user, per-agent scoping; Renown identity integration |
| **Data access** | Operational (current state), historical (operation history), analytical (read models) |
| **Sync** | Real-time document synchronization; multi-device, multi-user |
| **Multi-tenant** | Built-in tenant isolation for multi-department or multi-organization deployments |
| **Event system** | Document change events for downstream triggers and automation |
| **Deployment** | Self-hosted or Vetra Cloud |

---

## 6. Target Audiences

| Audience | How they use Switchboard |
|---|---|
| **Data engineers** | Navigate complete real-time organizational data; build analytical pipelines from document events |
| **Software engineers** | Consume structured, typed data for internal and external application development |
| **Integration engineers** | Connect existing enterprise systems with declarative data scoping |
| **AI/ML teams** | Access business data through MCP endpoints with privacy-tier-appropriate data shapes |

---

## 7. Get Started

**Evaluate Switchboard for your integration landscape** — The BAI team can map your existing systems, data flows, and privacy requirements to a Switchboard integration architecture.
-> bai.powerhouse.io

**Explore the API** — Developer documentation and schema references.
-> vetra.io

**Request a demo** — See Switchboard's integration and data isolation capabilities in action.
-> Request a Demo
