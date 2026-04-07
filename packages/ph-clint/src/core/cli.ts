import { Command as Commander } from 'commander';
import type {
  AgentProvider,
  Cli,
  CliOptions,
  Command,
  CommandContext,
  ConfigEnvVar,
  Routine,
  RunOptions,
} from './types.js';
import { formatStreamChunk } from './stream.js';
import { getSchemaFields } from './schema.js';
import { createMemoryWorkspace, createWorkspace } from './workspace.js';
import { getConfigEnvVars, resolveConfig } from './config.js';
import { resolveWorkdir } from './workdir.js';
import { createConfigCommand, generateConfigCommandHelp } from './config-command.js';
import { createRoutine } from './routine.js';
import { createEventBus } from './events.js';
import { createProcessManager } from './processes.js';
import { createReplSession } from '../interactive/session.js';
import { renderMarkdown } from '../interactive/markdown.js';

/**
 * Format a command result for output.
 * If the result has a `.text` string property, use that.
 * Otherwise, convert to string.
 */
function formatResult(result: unknown): string | undefined {
  if (result === undefined || result === null) return undefined;
  if (
    typeof result === 'object' &&
    result !== null &&
    'text' in result &&
    typeof (result as Record<string, unknown>).text === 'string'
  ) {
    return (result as Record<string, unknown>).text as string;
  }
  return String(result);
}

/**
 * Define a CLI — the top-level entry point.
 */
export function defineCli(options: CliOptions): Cli {
  const commandMap = new Map<string, Command>();
  for (const cmd of options.commands) {
    commandMap.set(cmd.id, cmd);
  }

  // Track config file path for the config command (set during run())
  let activeConfigFile: string | undefined;
  let activeWorkdir: string = process.cwd();

  // Auto-inject built-in config command when configSchema is present
  if (options.configSchema && !commandMap.has('config')) {
    const configCmd = createConfigCommand({
      cliName: options.name,
      configSchema: options.configSchema,
      implementationDefaults: options.configDefaults,
      // configFile is set lazily during run() via activeConfigFile
      get configFile() { return activeConfigFile; },
    });
    commandMap.set('config', configCmd);
  }

  // If triggers/routine config provided, create shared runtime services
  const hasTriggers = options.triggers && options.triggers.length > 0;
  const eventBus = hasTriggers ? createEventBus() : undefined;
  const processManager = hasTriggers ? createProcessManager() : undefined;
  let routine: Routine | undefined;

  if (hasTriggers) {
    routine = createRoutine({
      triggers: options.triggers!,
      commands: commandMap,
      tickInterval: options.routine?.tickInterval,
      idleInterval: options.routine?.idleInterval,
      eventBus,
      processManager,
    });
  }

  // Resolve agent provider from integrations for defaultCommand routing
  let agentProvider: AgentProvider | undefined;
  if (options.defaultCommand?.startsWith('agent:')) {
    const agentId = options.defaultCommand.slice('agent:'.length);
    for (const integration of options.integrations ?? []) {
      agentProvider = integration.agents?.find((a) => a.id === agentId);
      if (agentProvider) break;
    }
  }

  function getCommand(id: string): Command | undefined {
    return commandMap.get(id);
  }

  function listCommands(): Command[] {
    return [...commandMap.values()];
  }

  function buildContext(base?: CommandContext): CommandContext {
    const ctx = base ?? {
      workdir: process.cwd(),
      workspace: createMemoryWorkspace(),
      config: options.configSchema
        ? (options.configSchema.parse({}) as Record<string, unknown>)
        : {},
    };
    // Extend with runtime services if available
    if (routine) ctx.routine = routine;
    if (processManager) ctx.processes = processManager;
    if (eventBus) ctx.emit = (event: string, data?: unknown) => eventBus.emit(event, data);
    return ctx;
  }

  async function execute(
    commandId: string,
    args: Record<string, unknown>,
    context?: CommandContext,
  ): Promise<unknown> {
    const cmd = commandMap.get(commandId);
    if (!cmd) {
      throw new Error(`Unknown command: ${commandId}`);
    }
    const parsed = cmd.inputSchema.parse(args);
    const ctx = buildContext(context);
    return cmd.execute(parsed, ctx);
  }

  function parseArgs(
    commandId: string,
    argv: string[],
  ): Record<string, unknown> {
    const cmd = commandMap.get(commandId);
    if (!cmd) {
      throw new Error(`Unknown command: ${commandId}`);
    }

    const fields = getSchemaFields(cmd.inputSchema);
    const result: Record<string, unknown> = {};

    for (let i = 0; i < argv.length; i++) {
      const arg = argv[i]!;

      if (!arg.startsWith('--')) {
        throw new Error(`Unexpected argument: ${arg}`);
      }

      const flagName = arg.slice(2);
      const field = fields.find((f) => f.key === flagName);
      if (!field) {
        throw new Error(`Unknown option: ${arg}`);
      }

      if (field.baseType === 'boolean') {
        result[field.key] = true;
      } else {
        const nextArg = argv[i + 1];
        if (nextArg === undefined || nextArg.startsWith('--')) {
          throw new Error(`Missing value for ${arg}`);
        }
        result[field.key] = nextArg;
        i++;
      }
    }

    // Apply defaults for missing fields
    for (const field of fields) {
      if (field.key in result) continue;
      if (field.hasDefault) {
        result[field.key] = field.defaultValue;
      } else if (!field.isOptional) {
        throw new Error(`Missing required option: --${field.key}`);
      }
    }

    return result;
  }

  function generateHelp(): string {
    const lines: string[] = [];
    lines.push(`${options.name} v${options.version}`);
    lines.push('');
    lines.push(options.description);
    lines.push('');
    if (options.interactive) {
      lines.push('Options:');
      lines.push('  -i, --interactive    Start interactive REPL mode');
      lines.push('');
    }
    lines.push('Commands:');
    for (const cmd of commandMap.values()) {
      lines.push(`  ${cmd.id.padEnd(20)} ${cmd.description}`);
    }
    lines.push('');
    const configHelp = generateConfigHelp();
    if (configHelp) {
      lines.push(configHelp);
    }
    return lines.join('\n');
  }

  function generateConfigHelp(): string | undefined {
    if (!options.configSchema) return undefined;
    const envVars = configEnvVars();
    if (envVars.length === 0) return undefined;
    const fields = getSchemaFields(options.configSchema);

    const lines: string[] = [];
    lines.push('Configuration:');
    for (let i = 0; i < envVars.length; i++) {
      const ev = envVars[i]!;
      const field = fields[i];
      const parts: string[] = [`  ${ev.name}`];
      if (ev.description) parts.push(`  ${ev.description}`);
      if (field?.hasDefault) parts.push(`(default: ${JSON.stringify(field.defaultValue)})`);
      if (field && !field.isOptional && !field.hasDefault) parts.push('(required)');
      lines.push(parts.join('  '));
    }
    lines.push('');
    return lines.join('\n');
  }

  function generateCommandHelp(commandId: string): string {
    const cmd = commandMap.get(commandId);
    if (!cmd) {
      throw new Error(`Unknown command: ${commandId}`);
    }

    // Rich help page for the built-in config command
    if (commandId === 'config' && options.configSchema) {
      return generateConfigCommandHelp(options.name, options.configSchema, activeWorkdir);
    }

    const lines: string[] = [];
    lines.push(`${options.name} ${cmd.id}`);
    lines.push('');
    lines.push(cmd.description);
    lines.push('');
    lines.push('Options:');

    const fields = getSchemaFields(cmd.inputSchema);
    for (const field of fields) {
      const parts: string[] = [`  --${field.key}`];
      parts.push(field.description ?? '');
      if (field.hasDefault) {
        parts.push(`(default: ${JSON.stringify(field.defaultValue)})`);
      }
      if (!field.isOptional) {
        parts.push('(required)');
      }
      lines.push(parts.join('  '));
    }
    lines.push('');
    return lines.join('\n');
  }

  function generateCompletion(shell: string): string {
    const commandNames = [...commandMap.keys()].join(' ');
    if (shell === 'bash') {
      return [
        `# bash completion for ${options.name}`,
        `_${options.name}_completions() {`,
        `  local commands="${commandNames}"`,
        `  COMPREPLY=($(compgen -W "$commands" -- "\${COMP_WORDS[COMP_CWORD]}")`,
        `}`,
        `complete -F _${options.name}_completions ${options.name}`,
      ].join('\n');
    }
    if (shell === 'zsh') {
      return [
        `#compdef ${options.name}`,
        `_${options.name}() {`,
        `  local commands=(${commandNames})`,
        `  _describe 'command' commands`,
        `}`,
        `compdef _${options.name} ${options.name}`,
      ].join('\n');
    }
    if (shell === 'fish') {
      const lines = [`# fish completion for ${options.name}`];
      for (const name of commandMap.keys()) {
        lines.push(
          `complete -c ${options.name} -n '__fish_use_subcommand' -a '${name}'`,
        );
      }
      return lines.join('\n');
    }
    throw new Error(`Unsupported shell: ${shell}`);
  }

  function configEnvVars(): ConfigEnvVar[] {
    if (!options.configSchema) return [];
    return getConfigEnvVars(options.name, options.configSchema);
  }

  function buildProgram(
    stdout: (msg: string) => void,
    context: CommandContext,
  ): Commander {
    const program = new Commander();
    program
      .name(options.name)
      .version(options.version)
      .description(options.description)
      .exitOverride();

    if (options.interactive) {
      program.option('-i, --interactive', 'Start interactive REPL mode');
    }

    if (hasTriggers) {
      program.option('-w, --wait', 'Keep process alive with routine loop running');
    }

    if (agentProvider) {
      program.option('--resume <thread-id>', 'Resume a previous conversation');
    }

    // --workdir is available unless the implementation overrides it
    if (!options.workdir) {
      if (hasTriggers) {
        // -w is taken by --wait when triggers exist, so only offer long form
        program.option('--workdir <path>', 'Set the workspace directory');
      } else {
        program.option('-w, --workdir <path>', 'Set the workspace directory');
      }
    }

    if (options.configSchema) {
      program.option('-c, --config <path>', 'Load config from a JSON file (relative to cwd)');
    }

    for (const cmd of commandMap.values()) {
      const sub = program.command(cmd.id).description(cmd.description);

      const fields = getSchemaFields(cmd.inputSchema);
      for (const field of fields) {
        const desc = field.description ?? '';
        if (field.baseType === 'boolean') {
          sub.option(
            `--${field.key}`,
            desc,
            field.hasDefault ? (field.defaultValue as boolean) : false,
          );
        } else if (field.isOptional) {
          sub.option(
            `--${field.key} <value>`,
            desc,
            field.hasDefault ? String(field.defaultValue) : undefined,
          );
        } else {
          sub.requiredOption(`--${field.key} <value>`, desc);
        }
      }

      // Override help for the built-in config command with a rich help page
      if (cmd.id === 'config' && options.configSchema) {
        sub.helpInformation = () => generateConfigCommandHelp(options.name, options.configSchema!, activeWorkdir) + '\n';
      }

      sub.action(async (opts) => {
        const parsed = cmd.inputSchema.parse(opts);
        const result = await cmd.execute(parsed, context);
        const output = formatResult(result);
        if (output !== undefined) {
          stdout(renderMarkdown(output));
        }
      });
    }

    const configHelp = generateConfigHelp();
    if (configHelp) {
      program.addHelpText('after', '\n' + configHelp);
    }

    return program;
  }

  async function run(argv: string[], runOptions?: RunOptions): Promise<void> {
    const exit = runOptions?.exit ?? process.exit;
    const stdout = runOptions?.stdout ?? console.log;
    const stderr = runOptions?.stderr ?? console.error;

    // Extract --workdir and --config before Commander sees them
    const userArgs = argv.slice(2);
    let workdirFlag: string | undefined;
    let configFileFlag: string | undefined = runOptions?.configFile;
    {
      const wIdx = userArgs.indexOf('--workdir');
      const wShort = userArgs.indexOf('-w');
      // Only use -w for workdir if triggers are NOT present (since -w means --wait with triggers)
      const wdIdx = wIdx !== -1 ? wIdx : (!hasTriggers && wShort !== -1 ? wShort : -1);
      if (wdIdx !== -1 && wdIdx + 1 < userArgs.length) {
        workdirFlag = userArgs[wdIdx + 1];
      }
      const cIdx = userArgs.indexOf('--config');
      const cShort = userArgs.indexOf('-c');
      const cfIdx = cIdx !== -1 ? cIdx : (cShort !== -1 ? cShort : -1);
      if (cfIdx !== -1 && cfIdx + 1 < userArgs.length) {
        configFileFlag = userArgs[cfIdx + 1];
      }
    }

    // Resolve workdir: implementation override > --workdir flag > cwd
    const cwd = runOptions?.workdir ?? process.cwd();
    const workdir = resolveWorkdir({
      implementationOverride: options.workdir,
      cliFlag: workdirFlag,
      fallback: cwd,
    });

    // Update active state for the config command
    activeWorkdir = workdir;
    activeConfigFile = configFileFlag;

    // Context store lives at {workdir}/.ph/{cli-name}/
    const workspacePath = `${workdir}/.ph/${options.name}`;
    const workspace = createWorkspace(workspacePath);

    // Resolve config through 6 layers
    const config = options.configSchema
      ? resolveConfig({
          configSchema: options.configSchema,
          cliName: options.name,
          workdir,
          configFile: configFileFlag,
          cwd,
          implementationDefaults: options.configDefaults,
        })
      : {};
    const context = buildContext({ workdir, workspace, config });

    // Extract --resume <id> before Commander sees it
    let resumeId = runOptions?.resume;
    {
      const resumeIdx = userArgs.indexOf('--resume');
      if (resumeIdx !== -1 && resumeIdx + 1 < userArgs.length) {
        resumeId = userArgs[resumeIdx + 1];
      }
    }

    // Check for interactive mode (-i or --interactive)
    if (userArgs.includes('-i') || userArgs.includes('--interactive')) {
      if (!options.interactive) {
        stderr('Interactive mode is not configured for this CLI');
        exit(1);
        return;
      }

      const cliRef: Cli = {
        name: options.name,
        version: options.version,
        description: options.description,
        configSchema: options.configSchema,
        interactive: options.interactive,
        defaultCommand: options.defaultCommand,
        getCommand,
        listCommands,
        execute,
        parseArgs,
        generateHelp,
        generateCommandHelp,
        generateCompletion,
        configEnvVars,
        run,
        stopRoutine,
      };
      const session = createReplSession({
        cli: cliRef,
        context,
        agentProvider,
        threadId: resumeId,
      });

      if (runOptions?.interactiveInput) {
        // Headless mode for testing
        if (session.welcome) stdout(session.welcome);
        for await (const line of runOptions.interactiveInput) {
          const result = await session.processInput(line);
          if (result.type === 'exit') {
            if (result.text) stdout(result.text);
            break;
          }
          if (result.text) stdout(result.text);
        }
        exit(0);
      } else {
        // Ink REPL mode — lazy load to keep non-interactive startup fast
        const { startInkRepl } = await import('../interactive/start.js');
        await startInkRepl(session);
        exit(0);
      }
      return;
    }

    // Update the routine's context so it uses the resolved config/workspace
    if (routine) routine.setContext(context);

    // Detect --wait and --resume before Commander sees them (framework flags)
    const waitFlag = userArgs.includes('--wait') || (hasTriggers && userArgs.includes('-w'));
    let commandArgv = waitFlag
      ? argv.filter((a) => a !== '--wait' && (a !== '-w' || !hasTriggers))
      : [...argv];

    // Strip framework flags and their values from argv before Commander sees them
    {
      const frameworkFlags = ['--resume', '--workdir', '--config', '-c'];
      // Only strip -w for workdir when triggers aren't present (otherwise -w means --wait)
      if (!hasTriggers) frameworkFlags.push('-w');
      const filtered: string[] = [];
      for (let i = 0; i < commandArgv.length; i++) {
        if (frameworkFlags.includes(commandArgv[i]!) && i + 1 < commandArgv.length) {
          i++; // skip the flag and its value
        } else {
          filtered.push(commandArgv[i]!);
        }
      }
      commandArgv = filtered;
    }

    // Check if the first non-flag arg is a registered subcommand
    // If not, and we have a defaultCommand, treat remaining args as an agent prompt
    const nonFlagArgs = commandArgv.slice(2).filter((a) => !a.startsWith('-'));
    const firstArg = nonFlagArgs[0];
    const isSubcommand = firstArg && commandMap.has(firstArg);

    if (!isSubcommand && agentProvider && nonFlagArgs.length > 0) {
      // Agent prompt in command mode
      const prompt = nonFlagArgs.join(' ');
      const parts: string[] = [];
      for await (const chunk of agentProvider.stream(prompt, { threadId: resumeId, tools: commandMap })) {
        const text = formatStreamChunk(chunk);
        parts.push(text);
        stdout(text);
      }
      return;
    }

    const program = buildProgram(stdout, context);

    try {
      await program.parseAsync(commandArgv);
    } catch (err: any) {
      if (err.exitCode === 0) {
        exit(0);
        return;
      }
      const msg = err instanceof Error ? err.message : String(err);
      stderr(msg);
      exit(err.exitCode ?? 1);
      return;
    }

    // --wait: keep process alive while routine runs
    if (waitFlag && routine && routine.status !== 'init') {
      routine.onOutput = (text: string) => stdout(renderMarkdown(text));
      await waitForSignal(routine, runOptions?.signal);
      exit(0);
    } else if (routine && routine.status === 'running') {
      // Command started the routine but --wait not specified — stop it
      await routine.stop();
    }
  }

  /**
   * Wait until the routine stops, either by external signal or by the routine
   * finishing on its own. In production (no signal provided), listens for
   * SIGINT/SIGTERM. In tests, listens on the provided AbortSignal.
   */
  async function waitForSignal(
    rt: Routine,
    signal?: AbortSignal,
  ): Promise<void> {
    if (signal) {
      // Test/programmatic mode: listen on the AbortSignal
      if (signal.aborted) {
        await rt.stop();
        return;
      }
      await new Promise<void>((resolve) => {
        signal.addEventListener('abort', async () => {
          await rt.stop();
          resolve();
        }, { once: true });
      });
      return;
    }

    // Production mode: listen for process signals
    await new Promise<void>((resolve) => {
      const handler = async () => {
        process.off('SIGINT', handler);
        process.off('SIGTERM', handler);
        await rt.stop();
        resolve();
      };
      process.on('SIGINT', handler);
      process.on('SIGTERM', handler);
    });
  }

  async function stopRoutine(): Promise<void> {
    if (routine) {
      await routine.stop();
    }
  }

  return {
    name: options.name,
    version: options.version,
    description: options.description,
    configSchema: options.configSchema,
    interactive: options.interactive,
    defaultCommand: options.defaultCommand,
    getCommand,
    listCommands,
    execute,
    parseArgs,
    generateHelp,
    generateCommandHelp,
    generateCompletion,
    configEnvVars,
    run,
    stopRoutine,
  };
}
