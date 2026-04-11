# Preliminary Discovery Report

## Task Under Test
Create a local-first platform connected with a switchboard backend running a new reactor package "assistant" with a todo list document model.

## What I Understood From Help Alone
- vetra-mastra is a dev tool for building Reactor packages and Fusion projects in the Powerhouse ecosystem
- It manages two dev servers: Vetra (Switchboard backend) and Fusion (Next.js frontend)
- An AI agent with 6 skills assists with document modeling, editor creation, and project management
- Key workflow: init reactor package → start vetra → model documents → init fusion → start fusion

## What I Got Wrong / Couldn't Figure Out
- **Execution order**: I guessed correctly (init → start vetra → agent work → init fusion → start fusion), but the help doesn't document this workflow anywhere
- **`--version dev` scope**: I assumed it was needed on vetra-start too; user clarified it's only needed on reactor-package-init
- **Switchboard**: Never defined in help. fusion-project-start references `--switchboardUrl` but there's no explanation of what Switchboard is or that vetra-start runs it
- **What valid `--version` values are**: Help says "Powerhouse version (overrides config)" — no enum, no examples. User had to tell me to use "dev"
- **Which agent skill covers the task**: 6 skills listed with short descriptions, but I couldn't confidently map "create a todo list document model" to a specific skill

## What The Help Text Was Missing
1. A workflow overview — what order to run things in for common tasks
2. Definition of core concepts (Reactor package, Fusion project, Switchboard, document model)
3. Valid values for `--version` (should be an enum or at least list examples)
4. Relationship between vetra-start and the Switchboard
5. Which skill to use for which task type

## Ideal Execution Scenario (from user)
1. `reactor-package-init --name assistant --version dev`
2. `vetra-start` (no --version dev)
3. Ask agent to create a simple todo list document model in the assistant package
4. `fusion-project-init --name <name>`
5. `fusion-project-start`
6. Verify: fusion talks to switchboard running assistant package with todo list model

## Self-Documentation Quality Signal
The CLI has good structural self-documentation (every command has help, options are described, config is well-documented). However, it lacks **workflow-level documentation** — a user can understand individual commands but cannot piece together the end-to-end flow. The `--version` option is a notable gap: it's a critical parameter with no guidance on valid values. Error messages will be evaluated during testing.
