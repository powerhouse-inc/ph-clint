import type { Command, CommandContext } from '../../core/types.js';

/**
 * Convert ph-clint commands to Mastra tool definitions.
 *
 * The returned tools are passed to the Agent constructor so the agent
 * can call ph-clint commands during conversation.
 */
export async function commandsToMastraTools(
  commands: Command[],
  context: CommandContext,
) {
  const { createTool } = await import('@mastra/core/tools');

  const tools: Record<string, ReturnType<typeof createTool>> = {};
  for (const cmd of commands) {
    tools[cmd.id] = createTool({
      id: cmd.id,
      description: cmd.description,
      inputSchema: cmd.inputSchema,
      execute: async (input: unknown) => {
        return cmd.execute(input, context);
      },
    });
  }
  return tools;
}
