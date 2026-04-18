# Speaker Notes & Presenter Guidance

**Context:** This deck is presented by a Powerhouse / BAI team member to a CTO or VP Engineering, typically after or alongside a live demo. The audience has a data privacy constraint and board-level pressure to adopt AI.

---

## Pacing

- **Act 1 (slides 1–5):** 3–4 minutes. Move quickly through the pressure framing. The CTO already feels this — don't lecture, validate.
- **Act 2 (slides 6–14):** 8–10 minutes. This is the core. Pause on the architecture diagram (slide 12) and tiered model access (slide 14). If demoing live, transition to demo after slide 9.
- **Act 3 (slides 15–16):** 2–3 minutes. Pick the vertical closest to the audience's industry and lead with it. Skip or skim the other.
- **Act 4 (slides 17–19):** 3–4 minutes. Frame as "what you'll forward to your DPO." The comparison table is the slide they'll photograph.
- **Act 5 (slides 20–22):** 2–3 minutes. Honest, not salesy. The co-creation slide (22) is where you make the partnership pitch.
- **Act 6 (slides 23–25):** 1–2 minutes. End with the BAI assessment as the low-commitment next step.

**Total:** 20–25 minutes without demo, 35–40 minutes with demo.

---

## Key Talking Points per Slide

### Slide 3 — The CTO's Dilemma
"You're under pressure from both sides. The board wants an AI strategy yesterday. But you know that moving recklessly — data breaches, compliance violations, vendor lock-in — that's on you personally. And when you actually try, you discover the third problem: your data isn't ready for AI."

### Slide 5 — There's a Third Path
"We're not asking you to rip out your existing systems. Powerhouse runs alongside what you have — a structured layer that makes your existing data AI-accessible, on your infrastructure, at your pace."

### Slide 8 — AI-Native
"This isn't 'add a chatbot to your intranet.' Every business object in the system is automatically an AI endpoint. Agents follow structured playbooks — specification-driven, not open-ended prompts. And every autonomous action can require human approval."

### Slide 12 — Architecture Diagram
"This is the slide your enterprise architect will want to study. [Walk through the flow.] The key thing to notice: every data boundary is defined at the integration level, not layered on as policy. Renown governs identity across everything — humans and agents get the same permission model."

### Slide 14 — Tiered Model Access
"Not all data should reach the same AI model. Your DPO defines the tiers — what stays on local models, what can reach commercial APIs in censored form, what's fine for general-purpose. The architecture enforces it. This isn't a policy document — it's how the data flows."

### Slide 19 — Comparison Table
"Your existing vendors — Microsoft, Salesforce, SAP — they're adding AI to their platforms. But they're bolting it onto architectures that were never designed for machine interaction. And they're processing your data on their infrastructure. We're not saying they're bad — we're saying the architecture is fundamentally different."

### Slide 22 — Early Means Advantage
"We're honest about where we are. This is frontier technology. You won't find us in a Gartner quadrant. What you get instead: your feature requests go directly to the engineering team. Your deployment becomes a reference architecture. You get a head start before your competitors adopt the same approach."

### Slide 24 — The BAI Engagement
"The assessment is 2–3 weeks. We map your data flows, classify sensitivity, score AI readiness, and produce a prioritized roadmap. No commitment beyond that. Most CTOs start here because it answers the question the board is asking — 'what's our AI strategy?' — with a concrete, defensible plan."

---

## Objection Handling

**"You don't have enterprise clients yet."**
→ "That's right. Achra and Vetra are our production deployments — same stack. Early enterprise clients are design partners. That means your requirements shape the product. Your team gets direct access to the builders, not a support ticket queue."

**"My team doesn't know this stack."**
→ "Your team knows TypeScript, React, GraphQL. The Powerhouse-specific layer is a design pattern, not a new language. And BAI handles the initial implementation — your team ramps up on a running system, not a tutorial."

**"What if Powerhouse disappears?"**
→ "Everything is open source. Your data is JSON. Your schemas are TypeScript definitions you own. There's no hosted service you can't replicate. Open source isn't a marketing choice — it's the architectural answer to vendor risk."

**"We're already evaluating Microsoft Copilot / Salesforce Einstein."**
→ "Those work well for general productivity tasks. But they process your data on their infrastructure. For the data that makes your business yours — privileged communications, personnel records, negotiation positions, board-level financials — you need a different architecture. They bolt AI onto legacy. Powerhouse is AI-native from the data layer."
