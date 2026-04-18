# Skill 03 — Design System

**ID:** `03-design-system`
**Purpose:** Define visual identity and build a reusable component library for the site prototype.
**Default mode:** Discovery (explain options, let user choose direction)
**Prerequisite:** Approved messaging (`messaging/approved.md`)

## Preamble

```markdown
# Design System

You are creating the visual foundation for the site. This is a DESIGN exercise, not a content exercise. The content is already decided (in `messaging/approved.md`). You are deciding HOW it looks.

## Before You Start

- Read `messaging/approved.md` — the approved site structure and content
- Read `research/audience.md` — the target audience informs design tone
- Check if the product has existing brand assets (logo, colors, fonts) in the sources

## Critical Guards

1. **Derive from brand and audience, not from templates.** The design system should feel like it belongs to this specific product and audience. Enterprise audience = credibility signals (restraint, precision, whitespace). Consumer audience = engagement signals (color, motion, imagery). Don't apply a generic template.

2. **All assets within serve root.** Every file the site needs (CSS, fonts, icons, images) must be in the `design-system/` directory or will be copied to `site/`. No external CDN links, no Google Fonts URLs. Self-contained.

3. **Component library, not page designs.** Build reusable pieces (buttons, cards, sections, navigation, footer, tables, code blocks) that the site prototype will compose. Don't design specific pages here.

4. **Mobile-responsive by default.** Every component must work at 320px, 768px, and 1440px. Use CSS that adapts, not separate mobile styles.

5. **Accessibility baseline.** Minimum 4.5:1 contrast ratio for body text, 3:1 for large text. Semantic HTML in component examples. Keyboard-navigable interactive elements.
```

## Scenarios

### 00. Define Visual Identity

**Input:** Brand assets from sources, audience profile, approved messaging tone
**Process:**
1. Propose 2-3 visual directions with rationale tied to audience
2. Each direction: color palette (primary, secondary, accent, neutrals), typography (headings, body, mono), spacing scale, border/shadow style
3. User selects a direction (or hybrid)
4. Produce the identity spec

**Output:** `design-system/identity.md` + `design-system/variables.css`

```css
/* design-system/variables.css */
:root {
  --color-primary: ...;
  --color-secondary: ...;
  --color-accent: ...;
  --color-bg: ...;
  --color-surface: ...;
  --color-text: ...;
  --color-text-muted: ...;
  --font-heading: ...;
  --font-body: ...;
  --font-mono: ...;
  --space-xs: ...;
  --space-sm: ...;
  /* etc. */
}
```

**Guard check:** Are colors derived from brand/audience (not arbitrary)? Do contrast ratios meet minimums? Are fonts self-hosted or system fonts (no external URLs)?

### 01. Build Component Library

**Input:** Visual identity (`design-system/identity.md`, `design-system/variables.css`)
**Process:**
1. Build each component as standalone HTML + CSS:
   - Navigation (header with logo, links, CTA button)
   - Hero section (headline, subheadline, CTA, optional image area)
   - Content section (heading, body, optional aside)
   - Feature grid (2-3 column responsive grid of feature cards)
   - CTA banner (mid-page conversion block)
   - Comparison table (responsive, collapses to cards on mobile)
   - Footer (links, contact, legal)
   - Code block (syntax-highlighted, copyable)
   - Quote/testimonial block
   - Icon set (inline SVG or embedded, NOT external)
2. Each component gets an example HTML file showing usage
3. Produce a combined `design-system/preview.html` showing all components

**Output:** `design-system/` directory:
```
design-system/
├── identity.md           # Visual identity rationale
├── variables.css         # CSS custom properties
├── components.css        # All component styles
├── preview.html          # All components rendered
├── assets/               # Self-contained assets
│   ├── fonts/            # If custom fonts
│   └── icons/            # SVG icons
└── examples/             # Per-component HTML examples
```

**Guard check:** Does `preview.html` render correctly when served with `npx serve design-system/`? Do all components use CSS variables (not hardcoded values)? Are there any external resource references?

## Expected Outcome

`design-system/` directory contains a complete, self-contained visual identity and component library. The site prototype (skill 04) will compose these components — it should not need to invent any new visual patterns.
