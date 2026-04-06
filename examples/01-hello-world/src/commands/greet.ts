import { defineCommand } from 'ph-clint';
import { z } from 'zod';

export const greet = defineCommand({
  id: 'greet',
  description: 'Greet someone by name',
  inputSchema: z.object({
    name: z.string().describe('Name of the person to greet'),
    loud: z.boolean().default(false).describe('Shout the greeting'),
  }),
  execute: async ({ name, loud }) => {
    const msg = `Hello, ${name}!`;
    return loud ? msg.toUpperCase() : msg;
  },
});
