# enterprise.powerhouse.io/connect — Connect Subpage

**Navigation:** Enterprise Home > Platform > Connect

**Page purpose:** Explain Connect as the operator workspace for hands-on business data management and collaboration.

---

## 1. Hero

**Headline:** "Connect — The Operator Workspace"

**Subhead:** A browser-based environment where teams create, edit, and collaborate on structured business data. Workflow-specific views, real-time collaboration, and built-in human oversight of AI agent actions — all on your infrastructure.

**CTA:** "Request a Demo" / "Back to Platform Overview"

---

## 2. What Connect Does

**"Where your teams do the work."**

Connect is the hands-on workspace for teams that work directly with business data — creating documents, processing workflows, and collaborating with colleagues and AI agents.

**Core capabilities:**

### Structured business data

Every business object in Connect follows a typed schema — invoices, contracts, expense reports, scope-of-work documents, builder profiles. Schemas enforce consistency: the data is always valid by construction, not by manual validation. Under the hood, it's JSON with an append-only operation history.

### Drive apps and workflow views

Files and folders are familiar but inefficient for business processes. Connect's **drive apps** overlay the file system with specialized workflow interfaces — standardized best-practice processes presented directly, rather than leaving operators to organize their own folder hierarchies. Different workflows for different business functions, all drawing from the same data.

### Real-time collaboration

Documents synchronize across users and devices through their operation histories. Multiple team members can work on the same business objects simultaneously. Changes are attributed, versioned, and mergeable — git-like collaboration for business data.

### Human oversight of AI

AI agents operating through Clint act on the same business data visible in Connect. Operators see what agents have done, can review agent-generated changes, approve or reject operations, and maintain oversight of autonomous processes. The workspace makes AI actions transparent and controllable.

### Offline-capable

Local-first architecture means Connect works without a network connection. Operations are queued locally and synchronized when connectivity returns. No data loss, no interrupted workflows.

---

## 3. Architecture

### Document models

Business objects are defined by **document models** — schemas that specify the shape of the data and the exact operations that can modify it. Operations have well-defined parameters and built-in business logic, guaranteeing the document state always stays consistent. Models are reusable across the organization and publishable to the Vetra package registry.

### Flexible storage

Documents can be stored wherever your requirements dictate: local filesystem, PostgreSQL, browser-local storage (pglite), or on-chain. The same document works with any storage backend — choose based on your residency, performance, and compliance needs.

### Cryptographic verification

Every operation is signed by its author — human or agent. The full history is offline-verifiable without trusting a central authority. This provides a tamper-proof audit trail as an inherent property of the data, not an add-on log.

### End-to-end encryption

Documents shared between contributors are encrypted and cryptographically signed. Pseudonymous identities (via Renown) ensure attribution without unnecessary exposure.

---

## 4. Pre-Built Business Modules

Connect ships with a growing library of document models for common enterprise domains, available through the Vetra package registry:

- **Finance & Billing** — Chart of accounts, transaction ledgers, billing statements, payment terms, expense reporting
- **Reporting** — Invoices, expense reports, period snapshots
- **Work Management** — Scope of work, RFPs, workstreams
- **Services** — Service offerings, subscriptions, resource tracking, templates
- **Teams & Networks** — Builder profiles, registries, organizational profiles
- **Treasury** — Revenue distribution

Each module includes the document model (schema + operations), an editor UI, and API definitions. Use as-is, customize, or build your own.

---

## 5. Technical Details

| Characteristic | Detail |
|---|---|
| **Type** | Browser-based workspace application |
| **Data model** | Typed documents (JSON) with schema-enforced operations and append-only history |
| **Storage** | Pluggable adapters: filesystem, PostgreSQL, pglite, in-memory, blockchain |
| **Collaboration** | Real-time operation-based sync; branch/merge conflict resolution |
| **Security** | Cryptographic operation signing; end-to-end encryption; per-drive authorization |
| **Offline** | Local-first — full functionality without network; sync on reconnect |
| **Extensibility** | Custom document models, editors, and drive apps via Vetra packages |

---

## 6. Get Started

**Evaluate Connect for your organization** — The BAI team can assess how Connect maps to your team workflows, document types, and collaboration requirements.
-> bai.powerhouse.io

**Explore available modules** — Browse the Vetra package registry for pre-built business modules.
-> vetra.io

**Request a demo** — See Connect in action with real business workflows.
-> Request a Demo
