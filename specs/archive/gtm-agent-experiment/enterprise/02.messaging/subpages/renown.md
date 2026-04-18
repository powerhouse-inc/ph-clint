# enterprise.powerhouse.io/renown — Renown Subpage

**Navigation:** Enterprise Home > Platform > Renown

**Page purpose:** Explain Renown as the customizable identity solution governing both human users and AI agents.

---

## 1. Hero

**Headline:** "Renown — Identity for Agents and Users"

**Subhead:** Unified identity management for every actor in your system — human operators, AI agents, external integrations, and partner organizations. Every action attributed, every permission scoped, every boundary enforced.

**CTA:** "Request a Demo" / "Back to Platform Overview"

---

## 2. What Renown Does

**"One identity layer. Humans and machines."**

Renown is the identity substrate that governs who can do what across the entire Powerhouse platform. It provides verified identity, scoped authorization, and cryptographic attribution for every actor — whether that's a human operator, an AI agent, an external integration, or a partner organization.

### Unified identity model

Every actor in the system — human or machine — has a Renown identity with defined permissions. An HR operator, a contract review agent, a Switchboard integration from your HRIS, and a partner organization's data feed all operate under the same identity and authorization framework.

### Cryptographic attribution

Every operation in the system is signed with the actor's identity. The audit trail records not just *what* happened, but *who* did it — with cryptographic proof. Agent actions are attributed to the specific agent identity, distinguishable from human actions at the data level.

### Scoped authorization

Permissions are declarative and granular:
- Which data an actor can read
- Which operations an actor can perform
- Which drives and documents are accessible
- Which other actors they can interact with

Authorization applies uniformly to humans and agents. An AI agent's scope is defined the same way as a human operator's — through Renown identity and permissions.

### Access control for documents and drives

Renown handles authentication and access gating for specific documents, drives, and workflows. Establish hierarchies, stage gates, and checks-and-balances for business processes. Control who can initiate, review, approve, or reject operations.

---

## 3. Agent Identity

### Why agents need identity

When AI agents operate on business data, the compliance question is always: "who did this, and were they authorized?" Renown answers this by treating agents as first-class identity holders:

- **Distinct agent identities** — Each agent has its own Renown identity, separate from the human who configured it. Actions are attributed to the agent, not the human.
- **Permission boundaries** — Agent permissions define data access scope, allowed operations, and AI model tier. Enforced by Switchboard at the API boundary.
- **Audit distinction** — The immutable operation history distinguishes human actions from agent actions. Compliance teams can filter, inspect, and report on agent behavior independently.

### Agent-to-agent trust

When multiple agents operate in a multi-agent workflow, Renown governs the trust relationships:
- Which agents can communicate with each other
- What data can flow between agent scopes
- How escalation from agent to human is authenticated

---

## 4. Enterprise Identity Integration

### Current capabilities

- Cryptographic identity with Ethereum-based authentication
- Pseudonymous contributor profiles
- Per-document and per-drive access control
- Cross-organizational identity for partner collaboration

### Enterprise SSO roadmap

Renown is designed as the extension point for enterprise identity infrastructure. The architecture supports:
- **SAML integration** — Connect to your existing identity provider (Azure AD, Okta, Ping)
- **OIDC integration** — OpenID Connect for modern SSO flows
- **Directory service sync** — Map organizational structure (departments, roles, teams) to Renown permissions

SSO adapters are on the near-term roadmap. For early enterprise clients, this is a co-creation priority — your identity requirements shape the implementation.

### Contribution-based reputation

Renown tracks verified contributions across the platform — project delivery, document edits, workflow completions. Over time, this builds a contribution-based profile that can inform trust decisions, access escalation, and talent discovery within and across organizations.

---

## 5. Technical Details

| Characteristic | Detail |
|---|---|
| **Identity model** | Unified identity for humans, agents, integrations, and partner organizations |
| **Authentication** | Cryptographic signing (Ethereum-based); SSO (SAML, OIDC) on roadmap |
| **Authorization** | Declarative, per-actor scoping: data access, operations, drives, inter-actor communication |
| **Attribution** | Cryptographic operation signing; every action traceable to a verified identity |
| **Agent support** | First-class agent identities with distinct permissions and audit trails |
| **Cross-org** | Trust boundaries for partner organizations and external contributors |
| **Reputation** | Contribution tracking across projects and workflows |

---

## 6. Get Started

**Evaluate Renown for your identity requirements** — The BAI team can assess how Renown maps to your existing IAM infrastructure, agent authorization needs, and compliance requirements.
-> bai.powerhouse.io

**Explore the platform** — Developer documentation and identity integration guides.
-> vetra.io

**Request a demo** — See Renown's unified identity model for humans and agents.
-> Request a Demo
