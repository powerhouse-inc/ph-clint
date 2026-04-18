# Skill 04 — Site Prototype

**ID:** `04-site-prototype`
**Purpose:** Build a serveable HTML website from approved messaging and design system.
**Default mode:** One-shot (content and design are decided — this is mechanical production)
**Prerequisites:** Approved messaging (`messaging/approved.md`), design system (`design-system/`)

## Preamble

```markdown
# Site Prototype

You are building the HTML website. The content is decided (`messaging/approved.md`). The visual system is decided (`design-system/`). Your job is to compose them into a serveable site.

## Before You Start

- Read `messaging/approved.md` — this is the literal blueprint. Every section listed there becomes a section on the site. Do not add sections. Do not remove sections. Do not rewrite copy.
- Read `design-system/` — use these components. Do not invent new visual patterns.
- If either is missing, tell the user which prerequisite skill to run.

## Critical Guards

1. **Separate WHAT from HOW.** This skill has three passes specifically to prevent mixing content and design decisions. Follow them in order:
   - **Structure pass:** HTML skeleton with semantic markup, section IDs, and placeholder text
   - **Copy pass:** Fill in actual text from approved messaging
   - **Trim pass:** Cut excess, polish visual presentation, verify all CTAs work

2. **No content changes during production.** The approved messaging is the spec. If you think something should be different, note it as a comment but implement what was approved. Content changes go back to skill 02.

3. **Assets within serve root.** Copy design-system assets into `site/`. All paths must be relative. `npx serve site/` must work with no external dependencies.

4. **Concise copy in HTML.** Even though you're implementing approved messaging, some copy will need to be shortened for visual context (headlines, button text, card descriptions). Shorten without changing meaning.

5. **Funnel links throughout.** Verify that every 2-3 sections has at least one CTA. Navigation should include a primary CTA button. Footer should have conversion links.

6. **Self-contained pages.** Each HTML file must include all necessary CSS (via link to shared stylesheet) and work independently. No JavaScript frameworks — vanilla HTML/CSS only, with minimal vanilla JS for interactions (mobile menu, smooth scroll, section collapse).
```

## Scenarios

### 00. Structure Pass

**Input:** Approved messaging structure, design system components
**Process:**
1. Create `site/index.html` with HTML skeleton:
   - Semantic elements (`header`, `nav`, `main`, `section`, `footer`)
   - Section IDs matching messaging outline numbering
   - Component classes from design system
   - Placeholder text: `[Section N: Title]` for each section
2. Copy design system assets to `site/`:
   - `site/css/variables.css`
   - `site/css/components.css`
   - `site/css/site.css` (page-level layout)
   - `site/assets/` (fonts, icons)
3. If multi-page: create subpage HTML files with same structure
4. Verify: `npx serve site/` renders skeleton correctly

**Output:** `site/` directory with HTML skeleton and CSS

**Guard check:** Does every section in `messaging/approved.md` have a corresponding HTML section? Are there any sections in HTML that aren't in the approved messaging?

### 01. Copy Pass

**Input:** Structured HTML from pass 00, approved messaging content
**Process:**
1. For each section, replace placeholder text with actual content from `messaging/approved.md`
2. Write headline text, body paragraphs, bullet points, table content
3. Add CTAs with appropriate link destinations
4. Add `alt` text for any images/icons
5. Verify: content matches approved messaging section-by-section

**Output:** Updated `site/` with full content

**Guard check:** Side-by-side comparison with `messaging/approved.md` — is every section accounted for? Has any content been added that wasn't in the approved messaging?

### 02. Trim Pass

**Input:** Full-content HTML from pass 01
**Process:**
1. Read through every page as the target audience would:
   - Is any section too long for scanning? Shorten.
   - Are there redundant paragraphs? Cut.
   - Do headlines communicate the key point without reading the body? If not, rewrite headline.
2. Verify visual presentation:
   - Components render correctly (compare with `design-system/preview.html`)
   - Responsive at 320px, 768px, 1440px
   - CTAs are visually prominent
   - Navigation works (anchor links, subpage links)
3. Verify funnel:
   - Count CTAs per page — at least one every 2-3 sections
   - Primary CTA visible without scrolling
   - Footer includes conversion links
4. Final asset check:
   - No external resource references
   - All images have alt text
   - All links resolve (relative paths within site/)

**Output:** Final `site/` directory, ready for preview

**Guard check:** Can you run `npx serve site/` and navigate the entire site without errors? Does every page load without external requests?

## Expected Outcome

`site/` directory contains a complete, self-contained, serveable website:
```
site/
├── index.html            # Homepage
├── css/
│   ├── variables.css     # Design system variables
│   ├── components.css    # Design system components
│   └── site.css          # Page-level layout
├── assets/
│   ├── fonts/            # Self-hosted fonts (if any)
│   └── icons/            # SVG icons
└── pages/                # Subpages (if multi-page)
    ├── component-a.html
    ├── component-b.html
    └── ...
```

Run `npx serve site/` to preview. Use `/preview-server-start --directory site` for the managed preview.
