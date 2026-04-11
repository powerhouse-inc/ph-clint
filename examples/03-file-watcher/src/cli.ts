import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { defineCli } from 'ph-clint';
import { z } from 'zod';
import { build } from './commands/build.js';
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
  commands: [build],
  triggers: [fileChangeTrigger],
  routine: {
    id: 'watcher',
    label: 'File Watcher',
    tickInterval: 1000,
    idleInterval: 500,
    projectScanner: {
      isProjectFolder: (p) => existsSync(join(p, 'src')),
    },
  },
  interactive: {
    welcome: 'File Watcher — /watcher-start to begin, /watcher-ps to check',
  },
});

cli.run(process.argv);
