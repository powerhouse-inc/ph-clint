# Skill 06 — Visual QA

**ID:** `06-visual-qa`
**Purpose:** Screenshot HTML outputs, identify visual issues, fix them, and verify fixes.
**Default mode:** One-shot (mechanical QA process)
**Prerequisites:** Site prototype (`site/`) and/or presentation deck (`deck/`)
**External skill:** `playwright-cli` (reused from ph-rupert via `skills-ext/`)

## Preamble

```markdown
# Visual QA

You are performing visual quality assurance on the HTML outputs (site and/or deck). You will take screenshots, identify issues, fix them, and verify the fixes.

## Before You Start

- Ensure the preview server is running: `/preview-server-start --directory site`
- Verify playwright-cli is available (bundled via skills-ext/)
- Plan for 2-3 QA passes — you will NOT catch everything on the first pass

## Critical Guards

1. **Wait for animations before screenshotting.** Use the `animationWait` config value (default 2000ms) to pause after page load before capturing. CSS transitions, fade-ins, and layout shifts need time to complete. A screenshot of a half-animated page is useless.

2. **Check multiple widths.** Screenshot at minimum three viewport widths:
   - Mobile: 375px (iPhone SE)
   - Tablet: 768px (iPad)
   - Desktop: 1440px (standard laptop)
   Some issues only appear at specific widths (text overflow, image scaling, navigation collapse).

3. **Check contrast ratios programmatically.** Don't rely on visual inspection alone. For key text elements, verify:
   - Body text: minimum 4.5:1 ratio against background
   - Large text (>18px or >14px bold): minimum 3:1 ratio
   - CTA buttons: text must meet contrast requirements against button background

4. **Check for text orphans.** Single words on their own line at the end of paragraphs or headlines look unprofessional. Identify and fix with `white-space: nowrap` on the last two words or by adjusting copy length.

5. **Plan for multiple passes.** Fixes can introduce new issues (especially responsive fixes). After each fix round, re-screenshot and re-check. Typically 2-3 passes are needed.

6. **Document every issue.** Create an issue log with: location (page + section), viewport width, description, screenshot filename, fix applied, verification status.
```

## Scenarios

### 00. Screenshot Audit

**Input:** Running preview server URL, target pages
**Process:**
1. List all HTML pages to audit (index.html + subpages + deck)
2. For each page, at each viewport width (375, 768, 1440):
   - Navigate to page
   - Wait `animationWait` milliseconds
   - Take full-page screenshot
   - Save as `screenshots/{page}-{width}px.png`
3. Review each screenshot for issues:
   - **Layout:** Overlapping elements, horizontal overflow, broken grid
   - **Typography:** Orphans, widows, truncated text, unreadable sizes
   - **Contrast:** Text hard to read against background
   - **Images/icons:** Missing, stretched, pixelated, wrong size
   - **Navigation:** Menu overflow, broken links, CTA visibility
   - **Spacing:** Inconsistent margins/padding, cramped or sparse sections
   - **Responsive:** Elements that don't adapt properly
4. Create issue log

**Output:** `screenshots/` directory with images + `screenshots/issues.md`

```markdown
# Visual QA — Pass 1

## Issues Found

### Issue 1: {Description}
- **Page:** {filename}
- **Width:** {viewport}
- **Screenshot:** {filename.png}
- **Severity:** {critical/moderate/minor}
- **Fix:** {proposed fix}

### Issue 2: ...

## Summary
- Critical: {N}
- Moderate: {N}
- Minor: {N}
```

**Guard check:** Were screenshots taken at all three widths? Was animation wait applied? Are issues described specifically enough to fix (not "looks wrong" but "heading overlaps CTA button at 375px")?

### 01. Fix Issues

**Input:** Issue log from pass 00
**Process:**
1. Address issues by severity (critical first, then moderate, then minor)
2. For each fix:
   - Identify the CSS/HTML change needed
   - Apply the fix
   - Note what was changed in the issue log
3. Prefer CSS fixes over HTML restructuring
4. Prefer responsive CSS (`@media` queries) over hiding elements
5. Test fixes don't break other viewport widths (a mobile fix shouldn't break desktop)

**Output:** Updated `site/` and/or `deck/` files, updated `screenshots/issues.md` with fix notes

**Guard check:** For each fix, was the impact on other viewports considered? Were CSS fixes preferred over structural HTML changes?

### 02. Verify Fixes

**Input:** Fixed HTML, issue log
**Process:**
1. Re-screenshot all pages at all widths (same process as pass 00)
2. Save as `screenshots/{page}-{width}px-pass{N}.png`
3. Verify each issue from the log is resolved
4. Check for regression: did any fix introduce a new issue?
5. If new issues found: add to log, fix, and run another verification pass
6. Continue until all issues are resolved or only minor/acceptable issues remain

**Output:** Updated `screenshots/` with verification images, final `screenshots/issues.md`

```markdown
# Visual QA — Final

## Pass 1: {N} issues found
## Pass 2: {N} fixed, {N} new issues
## Pass 3: All resolved

## Remaining (accepted)
- {Minor issues accepted with rationale}

## Final Screenshots
- {List of final verification screenshots}
```

**Guard check:** Were verification screenshots taken AFTER fixes (not reusing old ones)? Were at least 2 passes completed? Is the issue log complete with resolution status for every item?

## Expected Outcome

`screenshots/` directory contains:
- Screenshots at multiple viewports and passes
- Complete issue log with resolution status
- Final verification screenshots confirming fixes

All HTML outputs (`site/` and `deck/`) are visually polished and responsive at 375px, 768px, and 1440px.
