import { defineCommand } from 'ph-clint';
import { z } from 'zod';
import type { Task } from '../types.js';

export const done = defineCommand({
  id: 'done',
  description: 'Mark a task as completed',
  inputSchema: z.object({
    title: z.string().describe('Task title (partial match)'),
  }),
  execute: async ({ title }, { workspace }) => {
    const tasks = await workspace.loadJsonObject<Task[]>('tasks.json', []);
    const task = tasks.find(t =>
      t.title.toLowerCase().includes(title.toLowerCase()) && !t.done
    );

    if (!task) {
      return { text: `No open task matching "${title}"` };
    }

    task.done = true;
    await workspace.storeJsonObject('tasks.json', tasks);
    return { text: `Completed: ${task.title}`, data: task };
  },
});
