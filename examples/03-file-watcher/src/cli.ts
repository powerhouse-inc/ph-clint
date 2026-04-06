import { defineCli } from 'ph-clint';
import { z } from 'zod';
import { build } from './commands/build.js';
import { watch } from './commands/watch.js';
import { status } from './commands/status.js';
import { fileChangeTrigger } from './trigger.js';

const configSchema = z.object({
  watchDir: z.string().default('./src').describe('Directory to watch'),
  buildCommand: z.string().default('npm run build').describe('Build command to execute'),
});

const cli = defineCli({
  name: 'watcher',
  version: '1.0.0',
  description: 'A file watcher that triggers builds on changes',
  configSchema,
  commands: [build, watch, status],
  triggers: [fileChangeTrigger],
  routine: {
    tickInterval: 1000,
    idleInterval: 500,
  },
  interactive: {
    welcome: 'File Watcher — /watch to start, /status to check',
  },
});

cli.run(process.argv);
