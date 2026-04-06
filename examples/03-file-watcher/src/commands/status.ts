import { defineCommand } from 'ph-clint';
import { z } from 'zod';

export const status = defineCommand({
  id: 'status',
  description: 'Show watcher and build status',
  inputSchema: z.object({}),
  execute: async (_, { routine, processes }) => {
    const running = processes!.list().filter(p => p.status === 'running');
    return {
      text: [
        `Routine: ${routine!.status}`,
        `Running processes: ${running.length}`,
      ].join('\n'),
    };
  },
});
