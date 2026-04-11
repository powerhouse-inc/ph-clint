# Preliminary Discovery Report

## Task Under Test
Create a document model for a todo list using vetra-cli, from workspace initialization through to viewing the result in Vetra Studio.

## What I Understood From Help Alone
- The CLI is for developing "Reactor" packages and "Fusion" projects in a Powerhouse ecosystem
- It manages local dev servers (Switchboard, Connect Studio, Fusion)
- There is an AI agent accessible via interactive mode (--interactive flag)
- The workflow starts with `init`, then scaffolding, then starting a dev server
- There are 5 config settings managed through layered config resolution

## What I Got Wrong / Couldn't Figure Out
1. **Document modeling is agent-driven**: No command mentions "document model" — this is done by asking the AI agent in interactive mode to use its "document-modeling skill". The help output gives zero indication that document modeling is a core workflow, despite it being the primary use case tested here.
2. **The agent is the primary interface for creative work**: The CLI commands handle infrastructure (init, start servers, scaffold), but the actual development work (designing document models) happens through natural language interaction with the agent. This is not communicated in the help text.
3. **Fusion is irrelevant to this flow**: The root help gives equal weight to Fusion and Reactor commands, but the document modeling workflow only involves Reactor packages and the Vetra Dev Server.
4. **Expected outcome includes a URL**: The workflow should end with a Vetra Studio URL where you can see the document model spec and test documents. This is not mentioned anywhere in help.

## What The Help Text Was Missing
1. **No workflow guidance**: The help lists commands but doesn't describe how they compose into workflows. A user has no way to know the sequence: init → reactor-package-init → vetra-start → agent interaction.
2. **No mention of agent skills**: The agent has a "document-modeling skill" but the help doesn't mention skills, document modeling, or what the agent can do.
3. **No domain explanation**: "Reactor package", "document model", "Switchboard", "Connect Studio" are domain terms used without definition.
4. **No indication of the agent's role**: The tagline says "with AI agent" but doesn't explain what the agent does or how to interact with it beyond the --interactive flag.

## Ideal Execution Scenario (from user)
1. `init` — set up the workspace
2. `reactor-package-init` — create a new Reactor package project
3. `vetra-start` — start the Vetra Dev Server on the created package project
4. Ask the agent to use its document-modeling skill to build a todo list document model
5. The agent should ask if it should also create an editor
6. The agent should check the schema and operations with the user before proceeding
7. Be presented with a Vetra Studio URL to see the document model spec and test documents

## Self-Documentation Quality Signal
**Weak for the primary workflow.** The CLI's help text is excellent for infrastructure commands (config is outstanding with examples, resolution order, and file locations). However, the core creative workflow — document modeling through the agent — is invisible in the help output. A new user would not know that document modeling exists, that it's done through the agent, or what the expected end-to-end flow looks like. The CLI presents itself as a project scaffolding tool rather than an AI-assisted document modeling environment.
