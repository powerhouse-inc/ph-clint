# Skill: skill-authoring

## Why This Skill Exists

Skills are what make ph-clint agents specialized rather than generic. A skill packages domain expertise into a structured, multi-phase workflow that the agent follows. Without skills, the agent relies solely on its base training — it might know TypeScript but won't know the specific patterns, constraints, and workflows of a particular domain.

This is the meta-skill: it teaches the agent how to create new skills for itself or other agents. The existing ph-rupert skills (document-modeling, document-editor-creation) are the reference implementations. Understanding the build pipeline (skills-tpl → buildSkills → gen/ → prompts.artifacts → runtime install) is essential because the files the author writes are Handlebars templates, not the final output.

## What The Skill Covers

- Template skill structure (skills-tpl/): .preamble.md, numbered sections, .result.md, .cli-docs.md
- External skill structure (skills-ext/): SKILL.md with frontmatter, references/
- Handlebars template variables and helpers
- Agent profile composition (agent-profiles/ sections)
- PromptsConfig on defineCli: artifacts, agents, skills
- Build pipeline: buildSkills() from ph-clint-dev
- Skill installation and lock file
- SKILL.md frontmatter format
- .cli-docs.md for injected context

## What The Skill Does NOT Cover

- The content of specific domain skills (that's the skill author's domain expertise)
- Agent integration setup (see `agent-integration`)
- Handlebars internals beyond the 8 standard helpers

## File Plan

### .preamble.md (~130 lines)

Skill system architecture:
- Two kinds of skill sources:
  - **Template skills** (`skills-tpl/`): multi-section folders compiled at build time. Each numbered section file becomes a reference document. A SKILL.md is generated with frontmatter + optional preamble + links to references. Handlebars templates are compiled with build-time context variables.
  - **External skills** (`skills-ext/`): pre-written SKILL.md + references/ directory, copied as-is. Used for third-party or pre-built skills (e.g., playwright-cli).

Template skill folder anatomy:
- `.preamble.md` (required, 80-150 lines): Domain knowledge, design principles, do/don't rules. Always included in SKILL.md body. Keep it focused — heavy reference material goes in section files.
- `.cli-docs.md` (optional): API reference context rendered through Handlebars. Can reference `{{commands.*}}`, `{{services.*}}`, `{{config.*}}`. Compiled and placed alongside the skill for agent reference.
- `.result.md` (optional): 2-5 lines defining the expected outcome. Anchors the agent's definition of done.
- `NN.phase-name.md` (one or more): Step-by-step instructions for each phase. Numbered for ordering. Compiled into `references/` in output. The agent reads these on demand.

SKILL.md frontmatter:
```yaml
---
name: skill-id
description: "One-line description"
metadata:
  author: Powerhouse
  version: "1.0.0"
compatibility: "Node.js >=22.13, pnpm"
---
```

Agent profiles:
- `agent-profiles/` contains composable instruction sections
- Each section is a .md file (potentially with Handlebars)
- PromptsConfig.agents maps agent IDs to `{ name, sections, skills }`:
  - `sections`: list of profile file names (without extension) to compose into instructions
  - `skills`: list of skill IDs assigned to this agent
- `getAgentInstructions(agentId)` loads and concatenates the section files

Build pipeline:
- `buildSkills()` from ph-clint-dev processes the prompts/ directory
- It compiles Handlebars, generates SKILL.md files from template skills, copies external skills
- Output goes to gen/ and dist/gen/ (or configured output directories)
- PromptsConfig.artifacts points to these output directories — first existing wins at runtime
- Skills are auto-installed to workspace on first CLI run (checked via skills-lock.json hashes)

Handlebars context:
- Build-time variables: `{{workspaceDir}}`, `{{connectPort}}`, `{{switchboardPort}}`, custom variables
- Runtime variables in SKILL.md: `{{commands.commandId.id}}`, `{{services.serviceId.mcpPrefix}}`
- 8 standard helpers: formatDate, join, exists, eq, uppercase, lowercase, hasItems, default

Pitfalls:
- Writing a skill without .preamble.md — the agent has no grounding before starting phases
- Making the preamble too long (>150 lines) — it's always in context, consuming tokens
- Putting step-by-step instructions in the preamble — those belong in section files
- Forgetting to add the skill to PromptsConfig.skills — it won't get a CLI command
- Forgetting to assign the skill to an agent in PromptsConfig.agents — it won't be in the agent's tool set
- Using Handlebars variables that aren't provided in the build context — renders as empty string

### .cli-docs.md

Extract from HTML docs:
- `PromptsConfig` interface (artifacts, agents, skills)
- `AgentProfileConfig` type
- `SkillConfig` type (description, inputSchema, instructionTemplate)
- `readSkills()`, `installSkills()`
- `createSkillCommands()`, `isSkillInvocation()`, `DEFAULT_SKILL_INSTRUCTION`
- `renderSkillTemplate()`, `extractTemplateVars()`, `registerDefaultHelpers()`
- Template helpers table (all 8)
- `SkillInfo` and `SkillInvocation` types

### .result.md

> Skill is authored with preamble, phases, and optional .cli-docs.md. Build pipeline compiles it into gen/. PromptsConfig references it in artifacts and assigns it to an agent. The skill appears as a CLI command and the agent can invoke it.

### 00.design-skill.md

Phase: Plan the skill's scope and structure.

Steps:
- Define the skill's purpose: what workflow does it guide the agent through?
- Identify the target audience: who invokes this skill and with what prompt?
- Determine phases: what are the sequential steps from start to deliverable?
- Determine mode variants (if any): expert/discovery/one-shot or similar
- Identify .cli-docs.md needs: which commands, services, and APIs does the agent need reference to?
- Identify template variables: what build-time or runtime values are needed?
- Draft the .result.md: what does "done" look like?

### 01.write-template-skill.md

Phase: Create the skills-tpl/ folder structure.

Steps:
- Create `prompts/skills-tpl/{skill-id}/`
- Write `.preamble.md` (80-150 lines):
  - Open with skill purpose and briefing header
  - Design principles and constraints for this domain
  - Common patterns and anti-patterns
  - Do not include step-by-step instructions (those go in section files)
- Write numbered section files (`00.phase-name.md`, `01.phase-name.md`, ...):
  - Each file is one phase of the workflow
  - Include sub-steps with clear expected outcomes
  - Reference template variables: `{{commands.cmdId.id}}`, `{{services.svcId.mcpPrefix}}`
  - Keep each section self-contained — the agent reads them individually
- Write `.result.md` (2-5 lines): expected deliverable
- Write `.cli-docs.md` (optional): API reference context, rendered through Handlebars

### 02.write-external-skill.md

Phase: Create a skills-ext/ skill from a pre-written SKILL.md.

Steps:
- Create `prompts/skills-ext/{skill-id}/`
- Write `SKILL.md` with YAML frontmatter (name, description, metadata)
- Write the skill body as markdown (can include Handlebars if build pipeline processes it)
- Create `references/` directory for supporting documents
- Add reference documents: one file per topic the agent might need
- External skills are copied as-is — no section-to-references compilation
- Use for: third-party skills, pre-written comprehensive guides, skills without phases

### 03.compose-agent-profile.md

Phase: Write agent profile sections and configure assignments.

Steps:
- Create `prompts/agent-profiles/{SectionName}.md` for each composable section
- Sections can use Handlebars for conditional content (`{{#if hasReactor}}`)
- Configure in PromptsConfig:
  ```
  agents: {
    'my-agent': {
      name: 'MyAgentProfile',
      sections: ['AgentBase', 'DomainExpert'],
      skills: ['skill-a', 'skill-b'],
    }
  }
  ```
- `sections` names map to file names in agent-profiles/ (without .md extension)
- `skills` lists the skill IDs this agent can use
- `getAgentInstructions('my-agent')` concatenates all section files into the system prompt

### 04.configure-build.md

Phase: Set up the build pipeline and runtime configuration.

Steps:
- Create `scripts/build-skills.ts`:
  ```
  import { buildSkills } from 'ph-clint-dev';
  buildSkills({
    include: [path.join(PROJECT_ROOT, 'prompts')],
    context: { workspaceDir, connectPort, switchboardPort },
    output: [path.join(PROJECT_ROOT, 'gen'), path.join(PROJECT_ROOT, 'dist', 'gen')],
    cli,
  });
  ```
- Add `"build:skills": "tsx scripts/build-skills.ts"` to package.json
- In codegen projects: the `@clint:begin prompts` marker region contains the `prompts` config. Update `project-spec.json` with skill assignments and run `{{commands.clint-project-regen.id}}` to regenerate. Never hand-edit marker regions.
- In manual projects: configure PromptsConfig on defineCli directly
- Validate: run build, verify gen/ output, start CLI, verify `/skill-id` command appears
- Use `extractTemplateVars(template)` to validate all variables are provided in context

## Research Before Writing

| What | Where |
|------|-------|
| PromptsConfig type | `packages/ph-clint/src/core/types.ts` (search `PromptsConfig`) |
| SkillConfig, AgentProfileConfig | `packages/ph-clint/src/core/types.ts` |
| readSkills implementation | `packages/ph-clint/src/core/skills.ts` |
| installSkills implementation | `packages/ph-clint/src/core/init.ts` |
| Skill command generation | `packages/ph-clint/src/core/skill-commands.ts` |
| Template rendering | `packages/ph-clint/src/core/templates.ts` |
| buildSkills (ph-clint-dev) | `packages/ph-clint-dev/src/skills/` — the build pipeline |
| Example 05 prompts structure | `examples/05-ph-rupert/prompts/` — full reference |
| Example 05 skill config | `examples/05-ph-rupert/src/cli.ts` — PromptsConfig |
| Example 05 build script | `examples/05-ph-rupert/scripts/build-skills.ts` |
| skills-lock.json format | `examples/05-ph-rupert/prompts/skills-lock.json` |
| Compiled output | `examples/05-ph-rupert/gen/skills/` (after build) |
| HTML docs section | `packages/ph-clint/docs/index.html` — "Skill Templates" section |
