# Skill 02 — Messaging

**ID:** `02-messaging`
**Purpose:** Draft, iterate, and finalize site messaging based on the positioning brief.
**Default mode:** Expert (messaging requires user approval at each iteration)
**Prerequisite:** Skill 01 outputs in `research/`

## Preamble

```markdown
# Messaging & Site Outline

You are building the site messaging — the structure and content of every section, page, and CTA. This is a content exercise, NOT a design exercise. You are deciding WHAT to say, not HOW it looks.

## Before You Start

- Read the full positioning brief in `research/` (all 5 files)
- If the positioning brief doesn't exist or is incomplete, tell the user to run `/01-research` first
- Review `sources.json` for any partner/ecosystem sites whose messaging you should NOT duplicate

## Critical Guards

1. **Lead with audience concerns, not product features.** The hero section must address what keeps the audience up at night. The product is the answer, not the opening.

2. **Include a changelog with every version.** Every iteration is saved as `messaging/v{N}.md` with a changelog at the top: what changed, why, and what prompted the change. This prevents regression and creates an audit trail.

3. **Concise copy.** Enterprise decision-makers scan. Every sentence must earn its place. If you can say it in one sentence, don't use three. If a section doesn't serve the narrative arc, cut it.

4. **Don't overclaim maturity.** If the product is early-stage, say "frontier technology" not "proven at scale." If there are no external clients, don't have a "Trusted By" section. Use language that's honest about where the product is.

5. **Don't duplicate partner site content.** If the product has ecosystem sites (developer platform, marketplace, etc.), the main site should funnel TO them, not reproduce their content. Each site has a job — don't blur the boundaries.

6. **Funnel links throughout.** CTAs should appear throughout the content, not just at the bottom. Every section that establishes a concern should offer a path to resolution. The reader should never scroll more than 2 sections without seeing an actionable next step.

7. **Document what changed.** Between versions, explicitly list: sections added, sections removed, sections rewritten, and WHY for each change. This is how you track messaging convergence.
```

## Scenarios

### 00. Draft Site Outline

**Input:** Positioning brief (`research/`), source materials
**Process:**
1. Map the emotional driver arc to site sections (each driver becomes a narrative beat)
2. Define section hierarchy: hero → problem → solution → proof → details → conversion
3. For each section: write a 2-3 sentence summary of what it says and why it's there
4. Identify page structure: single-page vs. multi-page, subpages needed
5. Place CTAs: identify every conversion moment

**Output:** `messaging/v1.md`
```markdown
# Site Outline v1

## Changelog
- v1: Initial draft based on positioning brief

## Structure
{Single-page / multi-page with subpages}

## Sections

### 1. Hero
**Says:** {2-3 sentences}
**Why here:** {narrative reason}
**CTA:** {action + destination}

### 2. ...
```

**Guard check:** Does the hero lead with an audience concern? Is every section justified by the narrative arc? Are CTAs distributed throughout?

### 01. Review & Iterate

**Input:** Current version, user feedback
**Process:**
1. Read the current version and the user's feedback
2. Identify which concerns the feedback addresses (too technical? too long? wrong emphasis?)
3. Apply changes, maintaining narrative coherence
4. Log every change in the changelog with rationale
5. Save as next version number

**Output:** `messaging/v{N}.md` (incremented version)

This scenario repeats as many times as needed. Each iteration should converge — changes should get smaller. If changes are getting larger, the positioning brief may need revision (go back to skill 01).

**Guard check:** Does the changelog clearly document what changed and why? Are changes converging (getting smaller)? Is the copy getting shorter, not longer?

### 02. Finalize Messaging

**Input:** Approved version (user confirms)
**Process:**
1. User explicitly approves a version ("v5 is approved" or "this is good")
2. Create `messaging/approved.md` as a copy of the approved version
3. Add a final section to approved.md: "Implementation Notes" listing any design/production considerations raised during iteration
4. Summarize the full iteration arc: how many versions, what the major pivots were, what the final positioning is

**Output:** `messaging/approved.md`

**Guard check:** Was explicit user approval received? Does the approved version still follow all guards (concise, audience-first, honest)?

## Expected Outcome

`messaging/` directory contains:
- `v1.md` through `v{N}.md` — Full iteration history with changelogs
- `approved.md` — The final approved messaging, ready for design and production

The approved messaging is the blueprint for the site. Skill 04 (site prototype) implements it literally — no content changes during production.
