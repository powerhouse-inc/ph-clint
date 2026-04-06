#!/usr/bin/env node

import { Command } from 'commander';
import { getAllCommands } from './commands/registry.js';
import { printWelcome } from './welcome.js';

const program = new Command();

program
  .name('rupert')
  .description('A friendly CLI with greeting and text utilities')
  .version('1.0.0')
  .option('-i, --interactive', 'start an interactive session')
  .option('-a, --agent <name>', 'agent to use: reactor (default) or fusion', 'reactor')
  .option('--resume <thread-id>', 'resume a previous session')
  .argument('[prompt...]', 'prompt for the default agent');

// Auto-register all commands from the registry.
// Each command's .tsx wrapper is loaded dynamically to avoid pulling in
// heavy dependencies (Ink, React, Mastra) until the command actually runs.
for (const cmd of getAllCommands()) {
  program
    .command(cmd.name)
    .description(cmd.description)
    .argument(`${cmd.args}`, '')
    .action(async (arg?: string) => {
      const mod = await import(`./commands/${cmd.name}.js`);
      mod.run(arg);
    });
}

// Strip the leading '--' that pnpm/npm injects when forwarding args,
// otherwise Commander treats everything after it as positional operands.
const args = process.argv.slice(2);
if (args[0] === '--') {
  args.shift();
}

// Check if first non-option arg matches a subcommand
const subcommands = new Set(getAllCommands().map((c) => c.name).concat('help'));
const firstPositional = args.find((a) => !a.startsWith('-') && !args.includes('--resume'));
const isSubcommand = firstPositional && subcommands.has(firstPositional);

if (!isSubcommand) {
  // Extract options manually before Commander parses (to handle -i, --agent, --resume)
  const interactive = args.includes('-i') || args.includes('--interactive');
  let resumeId: string | undefined;
  for (let i = 0; i < args.length; i++) {
    if (args[i]!.startsWith('--resume=')) {
      resumeId = args[i]!.slice('--resume='.length);
      break;
    }
    if (args[i] === '--resume' && i + 1 < args.length) {
      resumeId = args[i + 1];
      break;
    }
  }

  // Extract --agent / -a value (supports --agent=foo, --agent foo, -a foo)
  let agentArg: string | undefined;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]!;
    if (arg.startsWith('--agent=')) {
      agentArg = arg.slice('--agent='.length);
      break;
    }
    if ((arg === '--agent' || arg === '-a') && i + 1 < args.length) {
      agentArg = args[i + 1];
      break;
    }
  }

  // Apply agent selection
  if (agentArg) {
    const { agentChoices, setDefaultAgent } = await import('./mastra/index.js');
    if (!(agentChoices as readonly string[]).includes(agentArg)) {
      console.error(`Unknown agent: ${agentArg}. Available: ${agentChoices.join(', ')}`);
      process.exit(1);
    }
    setDefaultAgent(agentArg as (typeof agentChoices)[number]);
  }

  // Collect prompt words (everything that isn't a flag or --resume/--agent value)
  const promptWords: string[] = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i]!;
    if (a === '--resume' || a === '--agent' || a === '-a') { i++; continue; }
    if (a.startsWith('--resume=') || a.startsWith('--agent=')) continue;
    if (a === '-i' || a === '--interactive') continue;
    if (a === '-V' || a === '--version') break;
    if (a === '-h' || a === '--help') break;
    if (!a.startsWith('-')) promptWords.push(a);
  }
  const prompt = promptWords.join(' ').trim();

  if (interactive) {
    printWelcome();
    const { startRepl } = await import('./repl/index.js');
    await startRepl(resumeId);
    process.exit(0);
  }

  if (prompt) {
    const { runPrompt } = await import('./commands/prompt.js');
    await runPrompt(prompt, resumeId);
    process.exit(0);
  }

  // No subcommand, no prompt, no flags → show welcome and start interactive
  printWelcome();
  const { startRepl: repl } = await import('./repl/index.js');
  await repl();
  process.exit(0);
}

program.parse(args, { from: 'user' });
