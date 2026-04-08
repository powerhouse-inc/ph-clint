Issue: The agent's skills are invisible in help output — users don't know what the agent can do

  Expected behavior: The --help output (and/or the interactive mode welcome screen) should inform the user about the agent's installed skills alongside the available commands. A
  user scanning the help should understand that this CLI has an AI agent with specific capabilities (document modeling, editor creation, fusion development, etc.) and know how to
  invoke them. The skills are the agent's primary value — they represent what the agent is actually good at, beyond just running CLI commands.

  Current behavior: The root --help lists 18 commands but makes no mention of agent skills, the agent itself (beyond the tagline "with AI agent"), or how to interact with the
  agent. The interactive mode welcome screen lists 6 shortcut commands but also doesn't mention skills. The 7 installed skills (document-modeling, document-editor-creation,
  fusion-development, fusion-project-management, handle-stakeholder-message, project-management, reactor-package-project-management) are only discoverable by reading README.md or
  source code. During black-box testing, I could not figure out that document modeling was possible, let alone that the agent had a dedicated skill for it.

  Suggested fix: Add a "Skills" or "Agent" section to the root --help output, similar to how the "Configuration" section is already shown. For example:
  Agent Skills:
    document-modeling                 Design document model schemas and operations
    document-editor-creation          Build React editors for document models
    fusion-development                Implement Fusion UI pages
    fusion-project-management         Initialize and manage Fusion projects
    handle-stakeholder-message        Triage stakeholder messages
    project-management                General project management
    reactor-package-project-management  Manage Reactor packages

    Send a message:  vetra-mastra "Create a document model for invoices"
    Interactive mode: vetra-mastra -i
  The skill names and descriptions are already available from the SKILL.md frontmatter (name and description fields) and the skill paths are known from defineCli({ skillSources }).
   This could be a ph-clint framework feature: auto-appending installed skills to the help output, similar to how it already appends the configuration section.
