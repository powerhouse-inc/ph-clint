import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { defineCli } from '@powerhousedao/ph-clint';
import { build } from './commands/build.js';
import { fileChangeTrigger } from './trigger.js';
import { configSchema } from './framework.js';

const cli = defineCli({
  name: 'watcher',
  version: '1.0.0',
  description: 'A file watcher that triggers builds on changes',
  configSchema,
  commands: [build],
  triggers: [fileChangeTrigger],
  routine: {
    id: 'watcher',
    name: 'File Watcher',
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
