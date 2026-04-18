# Skill 01 — Research

**ID:** `01-research`
**Purpose:** Analyze sources, discover the target audience, map their concerns, and produce a positioning brief.
**Default mode:** Expert (asks clarifying questions — audience discovery requires human input)

## Preamble

```markdown
# Research & Discovery

You are beginning the research phase of a go-to-market project. Your goal is to understand the product deeply, identify the target audience precisely, and map the concerns that will drive the messaging.

## Before You Start

- Read `sources.json` to see what research materials are available
- If no sources are registered, ask the user to add some with `/add-source`
- Confirm the target audience and key message with the user before proceeding

## Critical Guards

1. **Audience first, product second.** Your first output must be the audience analysis, not the product analysis. You cannot write effective messaging without knowing who you're talking to.

2. **Be honest about weaknesses.** When assessing the product, do not minimize gaps or inflate strengths. "No external production clients" is a fact, not a weakness to hide. Frontier positioning is more credible than false maturity.

3. **Lead with audience concerns.** The emotional driver map must start from what keeps the audience up at night, not from what the product does well. Map concerns first, then show how the product addresses them.

4. **Don't duplicate existing content.** If the product already has marketing sites (partner sites, ecosystem sites), note them but don't reproduce their messaging. Your job is to find the angle they're missing.

5. **Confirm before proceeding.** After the audience analysis, stop and confirm with the user that you've identified the right audience before moving to product analysis and SWOT.
```

## Scenarios

### 00. Discover Audience

**Input:** Research sources, optional audience hint from `sources.json`
**Process:**
1. Read all registered sources to understand the product domain
2. Identify the primary buyer persona (role, seniority, industry)
3. Map the pressure they're under (from above: board/exec, from within: team/operations, from outside: market/regulation)
4. Identify the secondary audiences (who else influences the decision)
5. Define the conversion goal (what action do you want them to take)

**Output:** `research/audience.md`
```markdown
# Target Audience

## Primary: {Role} at {Company Type}
- Pressure from above: ...
- Pressure from within: ...
- External pressure: ...
- Evaluating: ...

## Secondary: {Role}
- Focus: ...

## Conversion Goal
{What action, and where it leads}
```

**Guard check:** Does the audience description lead with their concerns, not the product's features? If the first paragraph mentions the product, rewrite it.

### 01. Analyze Product

**Input:** Research sources, confirmed audience
**Process:**
1. Map the product's capabilities to audience concerns (not the other way around)
2. Identify what's genuinely differentiated vs. table stakes
3. Note what's missing or immature — be specific
4. Identify existing marketing/positioning (partner sites, docs, etc.) and note gaps

**Output:** `research/product-analysis.md`

**Guard check:** Does the analysis distinguish between "genuinely differentiated" and "we also do this"? Are weaknesses stated plainly?

### 02. Map Emotional Drivers

**Input:** Audience analysis, product analysis
**Process:**
1. List 5-7 concerns the audience has, ordered by emotional intensity (what they feel first)
2. For each: the concern, why it's urgent, what they're afraid of getting wrong
3. Map each concern to how the product addresses it (or doesn't)
4. Identify the narrative arc: which concern do you lead with, how do you build trust, where do you ask for action

**Output:** `research/emotional-drivers.md`
```markdown
# Emotional Driver Map

## 1. "{Concern in their words}"
- Why urgent: ...
- Fear: ...
- Product response: ...

## 2. ...

## Narrative Arc
Lead with driver {N} because... Build through {N, N}... Convert at driver {N} because by then trust is established.
```

**Guard check:** Are the drivers in the audience's language, not marketing-speak? Does each driver have a genuine product response (even if partial)?

### 03. SWOT Analysis

**Input:** Product analysis, audience analysis, emotional drivers
**Process:**
1. Strengths: What's genuinely strong? Not "we have a great team" but specific architectural or strategic advantages
2. Weaknesses: What's honestly weak? State the gap and its impact. Score severity.
3. Opportunities: What external trends favor the product? Be specific (regulation, market shifts, technology adoption)
4. Threats: What could prevent adoption? Include inertia ("do nothing") as the biggest competitor

**Output:** `research/swot.md`

**Guard check:** Are strengths specific and defensible? Are weaknesses honest (not "we're too innovative")? Is the biggest threat "do nothing" / status quo inertia?

### 04. Vendor Reliability Checklist

**Input:** Product analysis, SWOT
**Process:**
1. Evaluate against 8-10 standard enterprise vendor questions (production track record, company viability, talent availability, documentation, support, open source health, integration story, migration path, reference architectures, operational support)
2. Score each honestly: Weak / Weak-Medium / Medium / Medium-Strong / Strong
3. For each score below Medium-Strong: explain the honest framing and what compensates

**Output:** `research/vendor-checklist.md`

**Guard check:** No score above Medium-Strong unless backed by concrete evidence. "Dogfooding" counts as Medium, not Strong. Honest framing for every gap.

## Expected Outcome

`research/` directory contains 5 files forming a complete positioning brief:
- `audience.md` — Who we're talking to and what they care about
- `product-analysis.md` — What we have and what we're missing
- `emotional-drivers.md` — The narrative arc from concern to trust
- `swot.md` — Honest assessment of position
- `vendor-checklist.md` — How we'd score on a standard vendor eval

The positioning brief is the foundation. No messaging, design, or production work begins until this is reviewed and approved.
