# enterprise.powerhouse.io — Vendor Reliability Checklist

**Context:** The CTO's mental checklist when evaluating whether Powerhouse is a reliable stack/provider. Scored honestly with arguments for and against, plus how enterprise.powerhouse.io should address each concern.

---

## 1. Proven in production?

**Score:** Weak-Medium

**For:** Powerhouse dogfoods its own stack: Achra and Vetra are built on the reactive document architecture, Connect, and Switchboard. This is real production usage — not a side project, but the company's own commercial platforms. Demos can show this concretely. Sky/MakerDAO has engaged with the technology (validates market interest) but is not a production deployment to cite.

**Against:** No external production clients. Dogfooding is credible for developer tools but a CTO will note the gap between "the vendor uses it" and "a company like mine uses it." Demos convince in a meeting; they don't survive a procurement committee's reference check call.

**How to address:** Lead with dogfooding and live demos. Achra and Vetra *are* the reference deployments. Mention Sky as an engagement, not a case study. Be honest that early enterprise clients are design partners. The demo needs to be exceptional — it carries the weight that reference clients would normally carry.

---

## 2. Will the company exist in 3 years?

**Score:** Medium

**For:** Open source neutralizes this architecturally — if Powerhouse disappears, the code, your data (JSON), and your document models remain. You're not locked to a hosted service.

**Against:** Doesn't fully eliminate the concern: who maintains the open source? Community is early-stage. A CTO still prefers a vendor that's clearly funded and growing.

**How to address:** Lead with the architectural argument (open source = insurance). Acknowledge the company is early but growing. Don't fabricate stability signals.

---

## 3. Can I hire people who know this?

**Score:** Medium

**For:** The stack is TypeScript, React, GraphQL, Node.js, Zod — all mainstream. The Powerhouse-specific layer (document models, reducers) is thin and learnable. BAI and Achra network provide access to experienced practitioners.

**Against:** "Reactive document architecture" is proprietary terminology. No one has it on LinkedIn. Ramp-up cost and key-person risk during early adoption.

**How to address:** Frame as "your team already knows the stack — the Powerhouse layer is a pattern, not a new language." BAI/Achra as the bridge for the learning curve. Early movers build expertise before the talent market catches up.

---

## 4. Documentation and learning material?

**Score:** Medium+

**For:** Vetra Academy exists. Vetra Docs (forthcoming) will compile API references, architecture guides, and skill-based tutorials. Document model specifications also generate reference documentation.

**Against:** Not mature yet. Enterprise CTOs expect Stripe-level docs.

**How to address:** Include Vetra Docs as a real section. Having something live before the first enterprise conversation is a prerequisite. First version can be compiled from Academy and skills information with generative AI.

---

## 5. Support model?

**Score:** Medium

**For:** BAI team offers professional support with agreed SLAs — not just project delivery but ongoing operational support. Achra marketplace connects to additional service providers.

**Against:** Not operating today as a formal support offering. First client will be the proving ground.

**How to address:** Position honestly: enterprise support through BAI with contractual SLAs. Don't pretend there's a 24/7 NOC. Early clients get white-glove attention from the core team — that's the advantage of being early.

---

## 6. Is the open source healthy?

**Score:** Weak-Medium

**For:** Active development, real production usage (dogfooding), open repositories. Achra/Vetra ecosystem designed to grow the contributor base.

**Against:** Community is small compared to established infrastructure projects.

**How to address:** Don't overclaim community size. Focus on architectural independence from community health: you can fork, you own your data, the format is JSON. Community is a bonus, not the safety net.

---

## 7. Integration with existing systems?

**Score:** Medium

**For:** GraphQL and MCP are standards-based. Clint generates MCP servers from document models. Document models can mirror existing data structures.

**Against:** No pre-built connectors for SAP, Salesforce, ServiceNow. "Standards-based" means the client or BAI builds the integration.

**How to address:** Be honest: Powerhouse is the new data layer, not a drop-in replacement. Integration with legacy systems is a BAI engagement deliverable, not out-of-the-box.

---

## 8. Migration path?

**Score:** Medium

**For:** BAI's audit phase explicitly addresses data flow mapping and migration planning. The document model approach supports parallel adoption — run alongside legacy systems, don't rip and replace.

**Against:** Migration is always client-specific. No generic migration tools.

**How to address:** Position as "parallel adoption, not rip-and-replace." BAI handles migration planning. Don't promise automated migration.

---

## 9. Reference architectures?

**Score:** Weak

**For:** Enterprise proposal spec and feature-business mapping show the thinking exists. BAI has the methodology.

**Against:** No published reference architectures for traditional enterprise verticals.

**How to address:** Content gap that can be filled. Create 2-3 reference architectures for credible verticals. With co-creation positioning, this becomes: "We co-create *your* reference architecture."

---

## 10. Operational support (2am call)?

**Score:** Medium

**For:** BAI offers contractual SLAs. The architecture reduces incidents: local-first (no single point of failure), append-only (no data corruption), document independence (failures are isolated).

**Against:** No existing on-call infrastructure.

**How to address:** Split: (1) architecture is inherently more resilient, (2) BAI provides operational support with SLAs. Early clients get core team attention.

---

## Summary

**Can argue confidently:** 3 (mainstream stack), 4 (docs coming), 7 (standards-based APIs), 8 (parallel adoption)

**Can argue honestly:** 1 (dogfooding + demos), 2 (open source insurance), 5 (BAI SLAs), 6 (architectural independence), 10 (resilient architecture + BAI)

**Need to build before first client:** 9 (reference architectures — content work, not engineering)

**Overarching framing:** This is frontier technology. The CTO buying this isn't looking for the safe choice — they're looking for competitive advantage. Early access, co-creation partnership, direct access to the builders. The reliability story is honest, not inflated.
