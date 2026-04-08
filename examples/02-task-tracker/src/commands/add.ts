import { defineCommand } from 'ph-clint';
import { z } from 'zod';
import type { Task } from '../types.js';

export const add = defineCommand({
  id: 'add',
  description: 'Add a new task',
  inputSchema: z.object({
    title: z.string().describe('Task title'),
    priority: z.enum(['low', 'medium', 'high']).optional().describe('Task priority'),
    due: z.string().optional().describe('Due date (YYYY-MM-DD)'),
  }),
  prompt: {
    promptForDefaults: false,
    promptOptional: ['priority'],
  },
  execute: async ({ title, priority, due }, { workspace, config }) => {
    const tasks = await workspace.loadJsonObject<Task[]>('tasks.json', []);
    const task: Task = {
      id: crypto.randomUUID(),
      title,
      priority: priority ?? (config.defaultPriority as Task['priority']),
      due: due ?? null,
      done: false,
    };
    tasks.push(task);
    await workspace.storeJsonObject('tasks.json', tasks);
    return { text: `Added: ${task.title} [${task.priority}]`, data: task };
  },
});
