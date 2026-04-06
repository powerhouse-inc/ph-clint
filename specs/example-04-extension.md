agent-rupert-cli vs example 04: Feature Comparison

  ┌──────────────────────────────────────┬───────────────────────────────────────────┬────────────────────────────────┬──────────────┐
  │               Feature                │             agent-rupert-cli              │           example 04           │     Gap      │
  ├──────────────────────────────────────┼───────────────────────────────────────────┼────────────────────────────────┼──────────────┤
  │ CLI modes (command, REPL)            │ Yes                                       │ Yes                            │ -            │
  ├──────────────────────────────────────┼───────────────────────────────────────────┼────────────────────────────────┼──────────────┤
  │ Agent streaming                      │ Yes                                       │ Yes                            │ -            │
  ├──────────────────────────────────────┼───────────────────────────────────────────┼────────────────────────────────┼──────────────┤
  │ Tool calling                         │ Yes                                       │ Yes                            │ -            │
  ├──────────────────────────────────────┼───────────────────────────────────────────┼────────────────────────────────┼──────────────┤
  │ defaultCommand routing               │ Yes                                       │ Yes                            │ -            │
  ├──────────────────────────────────────┼───────────────────────────────────────────┼────────────────────────────────┼──────────────┤
  │ --resume thread ID                   │ Yes                                       │ Yes                            │ -            │
  ├──────────────────────────────────────┼───────────────────────────────────────────┼────────────────────────────────┼──────────────┤
  │ Stream chunk formatting              │ Yes (colors)                              │ Yes (no colors)                │ Minor        │
  ├──────────────────────────────────────┼───────────────────────────────────────────┼────────────────────────────────┼──────────────┤
  │ ASCII logo welcome                   │ Yes                                       │ Yes                            │ -            │
  ├──────────────────────────────────────┼───────────────────────────────────────────┼────────────────────────────────┼──────────────┤
  │ Mode indicator in welcome            │ No                                        │ Yes                            │ 04 is ahead  │
  ├──────────────────────────────────────┼───────────────────────────────────────────┼────────────────────────────────┼──────────────┤
  │ .env loading                         │ dotenv                                    │ Manual parser                  │ -            │
  ├──────────────────────────────────────┼───────────────────────────────────────────┼────────────────────────────────┼──────────────┤
  │ Conversation memory (persistent)     │ LibSQL via Mastra Memory                  │ In-memory only                 │ Big gap      │
  ├──────────────────────────────────────┼───────────────────────────────────────────┼────────────────────────────────┼──────────────┤
  │ Thread resume actually loads history │ Yes (LibSQL)                              │ Flag passed but no persistence │ Big gap      │
  ├──────────────────────────────────────┼───────────────────────────────────────────┼────────────────────────────────┼──────────────┤
  │ Markdown rendering                   │ marked + marked-terminal                  │ ph-clint built-in              │ -            │
  ├──────────────────────────────────────┼───────────────────────────────────────────┼────────────────────────────────┼──────────────┤
  │ Lazy Mastra loading                  │ Dynamic import (~0.3s vs 0.8s)            │ Static import                  │ Gap          │
  ├──────────────────────────────────────┼───────────────────────────────────────────┼────────────────────────────────┼──────────────┤
  │ Multiple agents / --agent flag       │ Yes (weather, reactor, fusion)            │ Single agent                   │ Moderate     │
  ├──────────────────────────────────────┼───────────────────────────────────────────┼────────────────────────────────┼──────────────┤
  │ Colored stream output                │ Green tools, red errors, dim meta         │ Plain text                     │ Gap          │
  ├──────────────────────────────────────┼───────────────────────────────────────────┼────────────────────────────────┼──────────────┤
  │ Config layers                        │ 3-layer (defaults → .env → settings.json) │ configSchema only              │ Gap          │
  ├──────────────────────────────────────┼───────────────────────────────────────────┼────────────────────────────────┼──────────────┤
  │ Workspace (.ph/ directory)           │ Yes                                       │ Not used                       │ Gap          │
  ├──────────────────────────────────────┼───────────────────────────────────────────┼────────────────────────────────┼──────────────┤
  │ MCP server transport                 │ HTTP/HTTPS + stdio                        │ Not in scope (example 08)      │ Expected     │
  ├──────────────────────────────────────┼───────────────────────────────────────────┼────────────────────────────────┼──────────────┤
  │ Service/process management           │ CLIExecutor + ServiceExecutor             │ Not in scope (example 05)      │ Expected     │
  ├──────────────────────────────────────┼───────────────────────────────────────────┼────────────────────────────────┼──────────────┤
  │ Skills/prompts system                │ Handlebars templates                      │ Not in scope                   │ Expected     │
  ├──────────────────────────────────────┼───────────────────────────────────────────┼────────────────────────────────┼──────────────┤
  │ Observability/tracing                │ DuckDB + Mastra Studio                    │ None                           │ Out of scope │
  └──────────────────────────────────────┴───────────────────────────────────────────┴────────────────────────────────┴──────────────┘

  Features that make sense to add to example 04

  These fit the "chat assistant" scope without bleeding into later examples (05-08):

  High value

  1. Persistent conversation memory — The --resume flag exists but doesn't actually persist anything. Wire up @mastra/memory (already a dependency) with LibSQL
  so threads survive across sessions.
  2. Colored stream output — Tool calls in green, errors in red, metadata dim. Small effort, big UX improvement.
  3. Workspace directory — Use .ph/cli/assist/ to store the memory database and session state. This is a core ph-clint concept that should appear here.

  Medium value

  4. Lazy Mastra loading — Dynamic import() for the Mastra path so assist --help and assist search don't pay the Mastra startup cost.
  5. Settings file — Load user config from .ph/cli/assist/settings.json alongside env vars. Demonstrates the config layer system.
  6. Resume hint on exit — Print assist -i --resume <thread-id> when leaving the REPL, so the user knows how to come back.

  Lower priority (nice-to-have)

  7. Multiple agents / --agent flag — Not essential for a single-purpose chat assistant, but shows the pattern.
  8. Real search/summarize implementations — Replace stubs with actual API calls (e.g., DuckDuckGo search, URL fetch + extract). Makes the demo actually useful.

  What would you like to pursue?

✻ Brewed for 2m 17s · 1 background task still running (↓ to manage)

❯ Yeah implement all of them. But it's the agent that should be calling the CLI tools... are we passing the tools to Mastra? Let's not make them dependent on an 
 external API like duckduckgo. Instead turn this library into the cli tool with its options defined as arguments: https://www.npmjs.com/package/image-to-ascii . 
 And the Mastra agent should call it based on an image URL for example.