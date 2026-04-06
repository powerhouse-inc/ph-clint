#!/usr/bin/env node

import { defineCli } from 'ph-clint';
import { z } from 'zod';
import { add } from './commands/add.js';
import { list } from './commands/list.js';
import { done } from './commands/done.js';
import { remove } from './commands/remove.js';

const configSchema = z.object({
  defaultPriority: z.enum(['low', 'medium', 'high']).default('medium')
    .describe('Default priority for new tasks'),
});

const cli = defineCli({
  name: 'tasks',
  version: '1.0.0',
  description: 'A simple task tracker',
  configSchema,
  commands: [add, list, done, remove],
  interactive: {
    welcome: 'Task Tracker — type /help for commands',
  },
});

cli.run(process.argv);
