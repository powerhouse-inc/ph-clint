# Skill 05 — Presentation

**ID:** `05-presentation`
**Purpose:** Produce a slide deck that follows the emotional driver narrative arc.
**Default mode:** One-shot (narrative arc and content are established — production is mechanical)
**Prerequisites:** Positioning brief (`research/`), approved messaging (`messaging/approved.md`), site prototype (`site/`)

## Preamble

```markdown
# Presentation Deck

You are building a slide deck for presenting the product to the target audience. The deck follows the emotional driver arc discovered in the research phase — it mirrors the audience's internal monologue from urgency to trust.

## Before You Start

- Read `research/emotional-drivers.md` — the narrative arc drives slide order
- Read `research/audience.md` — tone and depth calibrated to audience
- Read `messaging/approved.md` — content drawn from approved messaging
- Optionally review `site/` for visual consistency

## Critical Guards

1. **No fake metrics.** Never include statistics, percentages, or quantitative claims that aren't sourced from real, verifiable data. "Saves time" is acceptable. "Saves 40% of time" is not (unless you can cite the source). This is the single most important guard — fake metrics destroy credibility with technical audiences.

2. **Forwardable slides.** Every slide must be understandable without a presenter. Include enough context that if someone forwards the deck to a colleague, each slide communicates its point independently. No "as I mentioned" references to prior verbal context.

3. **Follow the emotional driver arc.** Slide order follows the audience's concern hierarchy from `research/emotional-drivers.md`. Don't reorganize for "logical flow" — the emotional flow IS the logical flow for persuasion.

4. **Concise content per slide.** Maximum 6 bullet points per slide. Maximum 10 words per bullet. If a concept needs more explanation, use the speaker notes area or split into two slides.

5. **Include screenshots, not live demos.** Don't assume the presenter will have a live demo available. Include screenshots from `site/` or product screenshots from sources. Every visual must be a static file in the deck.

6. **Design consistency with site.** Use the same color palette, typography, and tone as the site. The deck should feel like it belongs to the same brand.
```

## Scenarios

### 00. Plan Narrative Arc

**Input:** Emotional drivers, audience profile, approved messaging
**Process:**
1. Map each emotional driver to 2-4 slides:
   - **Driver slide:** State the concern in the audience's words
   - **Response slide(s):** Show how the product addresses it
   - **Proof slide:** Evidence (demo screenshot, architecture diagram, case reference)
2. Add framing slides:
   - Opening: Who we are, what we do (1-2 slides)
   - Bridge: "Here's what we're hearing from teams like yours"
   - Closing: Next steps, CTA (1-2 slides)
3. Plan total slide count (target: 15-25 slides for 20-30 minute presentation)
4. Create slide outline with title and 1-sentence purpose for each

**Output:** `deck/outline.md`

**Guard check:** Does slide order match emotional driver order? Is every slide justified by the narrative? Are there any slides that exist "because presentations have them" (generic mission slides, team photos) rather than because they serve the narrative?

### 01. Produce Slides

**Input:** Slide outline, design system, site screenshots
**Process:**
1. Create HTML slide deck (self-contained, printable):
   - Each slide is a full-viewport `<section>` with print-page-break
   - Navigation: arrow keys or click to advance
   - Design: use site's CSS variables and component styles
2. For each slide:
   - Write headline (5-8 words, communicates the key point)
   - Write content (bullets, diagram, or screenshot)
   - Add speaker notes in `<aside>` (what the presenter should say)
3. Take screenshots from `site/` for product visuals (use playwright-cli)
4. Embed all assets (inline SVG, base64 images, or relative paths within `deck/`)

**Output:** `deck/` directory:
```
deck/
├── outline.md            # Slide outline with narrative mapping
├── index.html            # Full slide deck (navigable)
├── css/
│   └── deck.css          # Slide-specific styles (imports design system vars)
├── assets/
│   └── screenshots/      # Product screenshots from site
└── print.html            # Print-optimized version (optional)
```

**Guard check:** Open `deck/index.html` — can you navigate through all slides? Does every slide make sense without a presenter? Are there any unsubstantiated metrics or claims?

## Expected Outcome

`deck/` directory contains a self-contained, navigable HTML slide deck that:
- Follows the emotional driver arc from research
- Contains no fake metrics
- Works as a forwardable document (each slide is self-contained)
- Uses the same visual identity as the site
- Includes product screenshots rather than assuming live demos
