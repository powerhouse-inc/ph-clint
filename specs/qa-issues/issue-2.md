Issue: Multi-turn agent conversations are impossible in CLI command mode because thread IDs are not surfaced

  Expected behavior: When a user sends a message to the agent via CLI command mode (node dist/main.js "Create a document model for a todo list"), the agent's response should
  include the thread ID so the user can continue the conversation with --resume <thread-id>. This is critical for multi-turn workflows like document modeling, where the agent
  proposes a schema, the user confirms, and the agent implements — a sequence that requires at least 2-3 turns.

  Current behavior: Each CLI invocation starts a completely fresh conversation with no memory of previous turns. The --resume <thread-id> flag is documented in --help and accepted
  as an option, but after the agent responds, no thread ID is printed. The user has no way to discover what thread ID was assigned to the conversation they just had. When I tried
  sending "Yes, proceed" as a follow-up, the agent had no context and asked me to explain what I wanted from scratch.

  Suggested fix: After the agent completes its response in CLI command mode, print the thread ID in a format that's easy to copy:
  Thread: <thread-id> (continue with: vetra-mastra --resume <thread-id> "your message")
  This likely needs to happen in the ph-clint framework's CLI command mode handler, after the agent response stream completes. The thread ID should come from the Mastra agent's
  conversation/thread management.
