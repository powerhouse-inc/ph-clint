# Phase 5 — Clint Agent profile + skills

**Goal:** Give Clint an AI agent personality that can manage and develop ph-clint implementation projects on the user's behalf.

## 5.1 Agent profile

Location: `packages/ph-clint-cli/ph-clint-cli/prompts/agent-profiles/ClintAgent.md`

Builds on `AgentBase.md` (shipped with ph-clint when reactor is configured — auto-provisioned per the framework). The ClintAgent profile explains:
- How to read the `ph-clint-project` document to understand what the user wants.
- How to call Clint's own commands (`/init`, `/add-command`, `/add-service`, `/enable-powerhouse`, …).
- The invariant that ALL spec changes go through the document editor, not direct file edits.

## 5.2 Skills (authored in `prompts/skills-tpl/`)

In-scope for this phase:

| Skill | Purpose |
|---|---|
| `project-planning` | Walk the user through feature selection; translate requirements into `ph-clint-project` document actions |
| `add-feature` | Enable Powerhouse/Mastra/routine on an existing project; run the appropriate document operations |

Additional skills (`add-command`, `add-service`, `publish-project`, `develop-document-model`, …) will be layered in a future phase once these two are solid. Keeping the skill set small lets us validate the end-to-end spec-doc → regen loop before scaling surface area.

Each skill's `prompts/skills-tpl/{skill-id}/` folder follows example 05's structure: `.preamble.md`, `00.*.md`, `01.*.md`, `.result.md`, `.cli-docs.md`.

## 5.3 Agent setup

Location: `packages/ph-clint-cli/ph-clint-cli/src/agents/clint.ts`

Mirrors example 05's `agent-rupert.ts`:
- Uses `@mastra/core` `Agent` with `@mastra/memory` + `@mastra/libsql`.
- Loads `gen/agent-profiles/ClintAgent.md` compiled from `prompts/`.
- Tools: the Clint commands + MCP tools from Clint's own Switchboard (for document ops) + the impl project's Switchboard when Service B is running.
- Workspace rooted at the impl project directory.

## 5.4 Wire skills into `cli.ts`

```ts
prompts: {
  sources: [
    path.join(PROJECT_ROOT, 'gen', 'skills'),
    path.join(PROJECT_ROOT, 'dist', 'gen', 'skills'),
  ],
  agents: {
    'clint-agent': {
      name: 'ClintAgent',
      sections: ['AgentBase.md', 'ClintAgent.md'],
      skills: ['project-planning', 'add-feature'],
    },
  },
  skills: {
    'project-planning': { description: '...', inputSchema: z.object({ mode: z.enum(['expert','discovery','one-shot']).default('expert') }) },
    'add-feature': { description: '...', inputSchema: z.object({ mode: z.enum(['expert','discovery','one-shot']).default('expert') }) },
  },
}
```

## 5.5 Deliverables of Phase 5

- `ph-clint` REPL launches with the Clint agent available via default-subcommand (bare text) prompt routing.
- `/project-planning` can walk a fresh user through `init` end-to-end without writing files directly (all via spec-doc operations).
- `/add-feature` can flip a feature toggle on an existing project — e.g. "turn on Powerhouse" — by dispatching the matching document operations; the routine then regenerates the impl project (triggering the flat→split migration when applicable).
