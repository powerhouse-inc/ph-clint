import { defineCommand } from '../framework.js';
import { z } from 'zod';
import type { Task } from '../types.js';

export const list = defineCommand({
  id: 'list',
  description: 'List all tasks',
  inputSchema: z.object({
    filter: z.enum(['all', 'open', 'done']).default('open').describe('Filter tasks'),
  }),
  execute: async ({ filter }, { workspace }) => {
    const tasks = await workspace.loadJsonObject<Task[]>('tasks.json', []);
    const filtered = filter === 'all'
      ? tasks
      : tasks.filter(t => (filter === 'done') ? t.done : !t.done);

    if (filtered.length === 0) {
      return { text: 'No tasks found.', data: [] };
    }

    return {
      text: filtered
        .map(t => `${t.done ? '[x]' : '[ ]'} ${t.title} (${t.priority})`)
        .join('\n'),
      data: filtered,
    };
  },
});
