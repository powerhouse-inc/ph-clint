import { defineCommand } from '../framework.js';
import { z } from 'zod';
import type { Task } from '../types.js';

export const remove = defineCommand({
  id: 'remove',
  description: 'Remove a task',
  inputSchema: z.object({
    title: z.string().describe('Task title (partial match)'),
  }),
  execute: async ({ title }, { workspace }) => {
    const tasks = await workspace.loadJsonObject<Task[]>('tasks.json', []);
    const index = tasks.findIndex(t =>
      t.title.toLowerCase().includes(title.toLowerCase())
    );

    if (index === -1) {
      return { text: `No task matching "${title}"` };
    }

    const [removed] = tasks.splice(index, 1);
    await workspace.storeJsonObject('tasks.json', tasks);
    return { text: `Removed: ${removed!.title}`, data: removed };
  },
});
