# ph-clint Feature-to-Business-Case Mapping

**Systematic reference: how each ph-clint feature contributes to the enterprise process automation value proposition.**

Each entry maps a framework feature (numbered per `features.md`) to the business value it unlocks for the consultancy engagement and the client outcome.

---

## Core Design: Dual-Mode Operation

| | |
|---|---|
| **Feature** | Command mode (`cli cmd --args`) and interactive mode (REPL with `/cmd` syntax) from one codebase |
| **Consultancy value** | Deliver two interfaces — scriptable automation and operator workspace — without doubling development effort |
| **Client outcome** | IT teams script batch jobs in CI/CD; operations staff work interactively in the REPL. Same tool, same commands, no training gap |
| **ERP parallel** | Replaces both the ERP's batch processing layer and its interactive transaction screens |

## Core Design: Testability

| | |
|---|---|
| **Feature** | Injectable I/O boundaries; three-level testing (unit, integration, E2E) without mocks |
| **Consultancy value** | Deliver auditable, regression-safe automation to regulated industries — every command path is testable |
| **Client outcome** | Change requests and process updates ship with automated tests; SOX/compliance auditors get evidence of control coverage |
| **ERP parallel** | Replaces manual UAT cycles that typically follow ERP configuration changes |

---

## Feature 1: Fast Startup via Lazy Loading

| | |
|---|---|
| **Feature** | Heavy dependencies (AI SDKs, document libraries) load only when the invoking command runs |
| **Consultancy value** | CLI stays responsive even as the command set grows across engagement phases |
| **Client outcome** | Sub-second startup for operators; no penalty for having 50+ business commands available |
| **ERP parallel** | Eliminates the "loading modules" wait that plagues traditional ERP clients |

## Feature 2: Workspace, Context, and Configuration

| | |
|---|---|
| **Feature** | Workspace separation, 6-layer config resolution, auto-derived env vars, first-run prompting |
| **Consultancy value** | Deploy the same CLI across dev/staging/prod with environment-specific config — no code forks |
| **Client outcome** | Each business unit gets its own workspace with local config; global policies live in user config; CI/CD overrides via env vars. First-run onboarding is frictionless |
| **ERP parallel** | Replaces ERP client/company/plant configuration hierarchies with a simpler, file-based model that version control understands |

## Feature 3: Unified Subcommands

| | |
|---|---|
| **Feature** | One command definition serves command mode, REPL, MCP, and agent tools |
| **Consultancy value** | Define a business operation once; it appears everywhere without adapter code |
| **Client outcome** | "Create purchase order" works the same whether typed in a terminal, spoken to the AI assistant, or called by an automated trigger |
| **ERP parallel** | Replaces the ERP pattern of separate transaction codes, API endpoints, and batch programs for the same operation |

## Feature 4: Auto-Completion

| | |
|---|---|
| **Feature** | Shell completion (bash/zsh/fish) in command mode; inline completion in REPL |
| **Consultancy value** | Reduces operator training time — the CLI teaches itself |
| **Client outcome** | Operators discover available commands and valid parameters without documentation; fewer input errors |
| **ERP parallel** | Replaces F4 help / search help in SAP-style systems with modern shell-native discovery |

## Feature 5: Zod-Based Command Definitions

| | |
|---|---|
| **Feature** | Commands defined as Zod schemas, compatible with Mastra tools, MCP tools, and Powerhouse document operations |
| **Consultancy value** | Generate commands directly from document model schemas — the data model *is* the command set |
| **Client outcome** | When the business process changes, update the schema and regenerate; no hand-written command code to maintain |
| **ERP parallel** | Replaces ABAP/X++ function modules, BAPI definitions, and OData service definitions with a single typed schema |

## Feature 6: Auto-Generated Help

| | |
|---|---|
| **Feature** | Help text derived entirely from Zod schemas — descriptions, types, defaults, constraints |
| **Consultancy value** | Documentation is always current; no separate doc-writing phase in the engagement |
| **Client outcome** | `--help` is the single source of truth; operators never encounter stale runbooks |
| **ERP parallel** | Replaces the ERP help system that is notoriously out of sync with customized implementations |

## Feature 7: Interactive Parameter Prompting

| | |
|---|---|
| **Feature** | Missing mandatory parameters trigger guided prompts in REPL; configurable prompting for defaults and optional fields |
| **Consultancy value** | Complex business transactions (multi-field purchase orders, approval workflows) become guided experiences without building custom forms |
| **Client outcome** | Operators are walked through required fields step by step; error rates on data entry drop |
| **ERP parallel** | Replaces screen-based transaction entry with a conversational input model |

## Feature 8: Structured and Streaming Output

| | |
|---|---|
| **Feature** | Commands return typed result objects; streaming via AsyncGenerator; transport-specific rendering |
| **Consultancy value** | Agent responses stream in real-time; batch processing reports render as tables; same data feeds a chat UI or JSON API |
| **Client outcome** | Operators see live progress on long-running operations (imports, reconciliations); downstream systems consume structured JSON |
| **ERP parallel** | Replaces ALV grid reports and spool output with modern, multi-format rendering |

## Feature 9: Background Processes

| | |
|---|---|
| **Feature** | Built-in child process management for long-running commands and persistent services |
| **Consultancy value** | Run data migrations, batch reconciliations, or dev servers alongside the interactive session |
| **Client outcome** | Operators launch a nightly sync and continue working; service health is visible in the same interface |
| **ERP parallel** | Replaces batch job scheduling (SM36/SM37 in SAP) with an integrated, observable process model |

## Feature 10: Interrupt and Cancellation

| | |
|---|---|
| **Feature** | Escape cancels foreground operations gracefully; AbortSignal propagation through the execution chain |
| **Consultancy value** | Operators can safely stop a running process without killing the session or corrupting state |
| **Client outcome** | No more "locked transactions" or zombie batch jobs; cancellation is clean and auditable |
| **ERP parallel** | Replaces the ERP pattern of "call your basis admin to kill the session" |

## Feature 11: Event Handlers

| | |
|---|---|
| **Feature** | Pluggable event listeners for document changes, process lifecycle, webhooks, timers |
| **Consultancy value** | Wire up business events (invoice received, approval granted, threshold breached) without custom middleware |
| **Client outcome** | The system reacts to business events in real time, not on batch schedules |
| **ERP parallel** | Replaces ERP workflow triggers and Business Event System with a lightweight, composable event model |

## Feature 12: Routine Loop

| | |
|---|---|
| **Feature** | Tick-based execution loop with pluggable triggers (event, timer, condition), work queue, and state machine |
| **Consultancy value** | Autonomous process automation without an external orchestrator (Airflow, Step Functions, etc.) |
| **Client outcome** | "When a PO arrives, validate budget, route for approval, notify the requester" — runs continuously, handles errors gracefully, works with or without AI |
| **ERP parallel** | Replaces the combination of batch scheduling + workflow engine + custom ABAP jobs with a single, testable loop |

## Feature 13: Middleware and Lifecycle Hooks

| | |
|---|---|
| **Feature** | Pre/post/error hooks on command execution; global or per-command; composable and ordered |
| **Consultancy value** | Add auth checks, audit logging, input sanitization, and permission gates as cross-cutting concerns |
| **Client outcome** | Every business operation is automatically logged and authorized without modifying individual command implementations |
| **ERP parallel** | Replaces authorization objects, BAdIs, and user exits with composable middleware |

## Feature 14: Default Interface

| | |
|---|---|
| **Feature** | Welcome message, input field, discoverable commands via auto-completion and help |
| **Consultancy value** | First impression is polished and branded; no "blank screen" onboarding problem |
| **Client outcome** | Operators open the tool and immediately see what they can do — zero training for basic discovery |
| **ERP parallel** | Replaces the ERP launchpad / favorites / transaction code memorization |

## Feature 15: Agent Skills

| | |
|---|---|
| **Feature** | Handlebars markdown templates with build-time config injection; multi-step task guides for agents |
| **Consultancy value** | Encode domain expertise (the consultancy's IP) as structured skills that agents follow reliably |
| **Client outcome** | The AI assistant doesn't hallucinate process steps — it follows the consultancy-authored playbook for "process a vendor invoice" or "reconcile intercompany balances" |
| **ERP parallel** | Replaces paper-based SOPs and tribal knowledge with machine-executable process definitions |

## Feature 16: Default Subcommand (Agent Prompt)

| | |
|---|---|
| **Feature** | Bare text input routes to an AI agent that interprets intent and invokes typed commands |
| **Consultancy value** | Natural language becomes a first-class interface to every business operation |
| **Client outcome** | Operators type "show me all pending invoices over 10k" instead of memorizing command syntax |
| **ERP parallel** | Replaces transaction code lookup with conversational interaction |

## Feature 17: Session and Conversation Memory

| | |
|---|---|
| **Feature** | Thread-based conversation history; resumable sessions across CLI invocations |
| **Consultancy value** | Agents maintain context across multi-step business processes (e.g., a procurement cycle spanning days) |
| **Client outcome** | "Continue where we left off" — operators resume complex workflows without re-explaining context |
| **ERP parallel** | Replaces the ERP "variant" / "save as draft" pattern with persistent conversational state |

## Feature 18: Configuration and Theming

| | |
|---|---|
| **Feature** | Whitelabel identity — name, version, branding, colors, behavior — all configurable |
| **Consultancy value** | Deliver a client-branded tool, not a generic framework; reinforces ownership and adoption |
| **Client outcome** | The tool looks and feels like the client's own product; IT governance sees an internal tool, not an external dependency |
| **ERP parallel** | Replaces the ERP vendor's branding with the client's identity |

## Feature 19: CLI Scaffolding and Code Generation

| | |
|---|---|
| **Feature** | Generate a complete CLI project from config + command schemas; incremental regeneration; extension points |
| **Consultancy value** | Reduce Phase 2 delivery from weeks to days; schema changes regenerate the CLI without manual rework |
| **Client outcome** | Process changes are cheap — update the model, regenerate, test, deploy. No "change request to the ERP vendor" cycle |
| **ERP parallel** | Replaces the ERP customization/upgrade dilemma with a generative model where customization *is* the standard path |

## Feature 20: Transport-Agnostic Input

| | |
|---|---|
| **Feature** | Same command core accepts input from terminal, chat UI, Slack, MCP client, or programmatic API |
| **Consultancy value** | One engagement produces interfaces for every channel the client uses — no separate integrations |
| **Client outcome** | Finance team uses the REPL; warehouse team uses Slack; executives use a chat UI; CI/CD uses the CLI — all hitting the same commands and data |
| **ERP parallel** | Replaces the ERP's siloed interfaces (GUI, web, mobile, EDI) with a single command layer that adapts to any surface |

---

## Summary: Feature Coverage by Business Concern

| Business concern | Features that address it |
|---|---|
| Operator productivity | 1, 4, 6, 7, 14, 16 |
| Process automation | 9, 11, 12, 13 |
| AI integration | 5, 15, 16, 17 |
| Data integrity and compliance | Testability, 2, 10, 13 |
| Multi-channel access | 3, 8, 20 |
| Rapid delivery and maintainability | 5, 6, 19 |
| Client ownership and branding | 2, 18 |
| Incremental adoption (no-AI to full-AI) | 3, 12 (works without agent), 15, 16 |
