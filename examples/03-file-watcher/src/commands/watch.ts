import { defineCommand } from 'ph-clint';
import { z } from 'zod';

export const watch = defineCommand({
  id: 'watch',
  description: 'Start watching for file changes',
  inputSchema: z.object({}),
  execute: async (_, { routine }) => {
    routine!.start();
    return { text: 'Watching for changes...' };
  },
});
