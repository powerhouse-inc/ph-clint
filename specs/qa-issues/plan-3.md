Plan: Show agent skills in help output

## Problem

The `--help` output lists 18 commands but makes no mention of the agent, its skills, or how to
interact with it. The 7 installed skills are only discoverable by reading source code or
README.md. Users have no idea what the agent can do.

## Analysis

This belongs in the **ph-clint library** as a framework feature. The library already:
- Knows about `skillSources` (passed to `defineCli()`)
- Auto-injects the `init` command that installs skills from those sources
- Generates help output in `generateHelp()` (cli.ts:248-270)

The skill metadata (name, description) is available in each skill's `SKILL.md` frontmatter.
The library just needs to read it and append a section to help output.

### Where skills are stored

Skills live in `skillSources` directories as `{skillName}/SKILL.md` files. The frontmatter has:
```yaml
---
name: document-modeling
description: Design document model schemas and operations
...
---
```

### Design considerations

1. **Parse at help-generation time, not at startup** — skills may be installed lazily (after
   `init` runs), so read from disk when help is requested.
2. **Read from skillSources, not from installed location** — the source directories are always
   available; the installed location (`.ph/{name}/.mastra/skills/`) may not exist yet.
3. **Include agent usage hint** — users need to know HOW to talk to the agent, not just what
   skills exist.
4. **Also update interactive welcome** — the welcome screen should mention skills or at least
   hint that the agent has capabilities beyond the listed commands.
5. **Also update cli-docs** — the agent's own help tool should include skills so the agent
   knows its own capabilities.

## Plan

### Step 1 — Add skill metadata reader to the library

Create a utility function in `packages/ph-clint/src/core/skills.ts`:

```ts
interface SkillInfo {
  name: string;
  description: string;
}

function readSkillsFromSources(skillSources: string[]): SkillInfo[]
```

This function:
- Scans each source directory for `*/SKILL.md` files
- Parses YAML frontmatter to extract `name` and `description`
- Deduplicates by name (first source wins)
- Returns sorted list

Keep it simple — just read frontmatter with a regex, no YAML parser dependency needed.
The frontmatter format is `---\nkey: value\n---` and we only need two fields.

### Step 2 — Add "Agent Skills" section to generateHelp() (cli.ts)

In `generateHelp()`, after the Commands section and before Configuration, add:

```
Agent Skills:
  document-modeling               Design document model schemas and operations
  document-editor-creation        Build React editors for document models
  ...

  Send a message:   vetra-mastra "your request"
  Interactive mode:  vetra-mastra -i
```

Only show this section when `skillSources` is defined and skills are found. The usage hint
section only shows when `agentLoader` is also set.

### Step 3 — Update cli-docs command (help-command.ts)

The `cli-docs` command captures Commander's help output, which won't include our custom skills
section (it's in `generateHelp()`, not Commander). Two options:

**Option A**: Have `cli-docs` call `generateHelp()` directly instead of going through Commander.
**Option B**: Append skills info separately in `cli-docs`.

Option A is cleaner — `cli-docs` already calls `cli.run(['node', name, 'help'])` to capture
Commander output, but `generateHelp()` is our own function that produces better output anyway.
However, `cli-docs` doesn't currently have access to `generateHelp()`.

Simplest approach: expose `generateHelp` and `generateCommandHelp` on the `Cli` object, then
have `cli-docs` use them directly. These are already defined inside `defineCli`; just add them
to the returned `Cli` interface.

### Step 4 — Optionally enhance interactive welcome

Add a line to the interactive welcome template area showing skill count or a hint:

```
  Agent: Mastra + openrouter/anthropic/claude-sonnet-4-20250514 (7 skills)
```

This is a minor enhancement — the skills section in `--help` is the primary fix. The welcome
screen change is optional and can be done in the 05b example's `welcome` callback without
library changes.

### Step 5 — Tests

- **Unit test**: `readSkillsFromSources` with a fixture directory containing test SKILL.md files.
- **Unit test**: `generateHelp()` includes "Agent Skills:" section when skillSources has skills.
- **Unit test**: `generateHelp()` omits the section when no skillSources or no skills found.
- **Integration test**: `vetra-mastra --help` output includes all 7 skill names.

## Scope

- **Library changes**:
  - New: `packages/ph-clint/src/core/skills.ts` (skill metadata reader)
  - Modified: `packages/ph-clint/src/core/cli.ts` (`generateHelp` adds skills section)
  - Optionally: `packages/ph-clint/src/core/help-command.ts` (use `generateHelp` directly)
  - Types: expose `generateHelp`/`generateCommandHelp` on `Cli` if updating cli-docs
- **05b changes**: None required (library reads from skillSources automatically).
  Optional: update welcome callback to show skill count.
- **Risk**: Low. The skills section is additive — existing help output is unchanged, a new
  section is appended. The frontmatter reader is simple file I/O with a regex.
