#!/usr/bin/env node

import { defineCli } from 'ph-clint';
import { greet } from './commands/greet.js';

const cli = defineCli({
  name: 'hello',
  version: '1.0.0',
  description: 'A minimal ph-clint example',
  commands: [greet],
  interactive: {
    welcome: 'Hello World CLI — type /help for commands',
  },
});

cli.run(process.argv);
