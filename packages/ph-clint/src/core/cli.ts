import { Command as Commander } from 'commander';
import type {
  AgentContext,
  AgentLoader,
  AgentProvider,
  Cli,
  CliOptions,
  Command,
  CommandContext,
  ConfigEnvVar,
  Resolvable,
  ResolvedInteractiveConfig,
  Routine,
  RunOptions,
} from './types.js';
import { formatStreamChunk } from './stream.js';
import { getSchemaFields } from './schema.js';
import { createMemoryWorkdirStore, createWorkdirStore } from './store.js';
import { getConfigEnvVars, resolveConfig } from './config.js';
import { resolveWorkdir } from './workdir.js';
import { createConfigCommand, generateConfigCommandHelp } from './config-command.js';
import { createSvcCommand } from './service-command.js';
import { createHelpCommand } from './help-command.js';
import { createInitCommand } from './init.js';
import { createRoutine } from './routine.js';
import { createEventBus } from './events.js';
import { createProcessManager } from './processes.js';
import { createServiceManager } from './services.js';
import { createReplSession } from '../interactive/session.js';

/* istanbul ignore next -- fallback stdout used only when running without RunOptions (real terminal) */
const defaultStdout = (text: string) => { process.stdout.write(text); };

/** Fully-resolved run options — no optionals for process defaults. Internal to defineCli. */
interface ResolvedRunOptions {
  exit: (code: number) => void;
  stdout: (message: string) => void;
  stderr: (message: string) => void;
  cwd: string;
  writeRaw: (text: string) => void;
  configFile?: string;
  resume?: string;
  interactiveInput?: AsyncIterable<string>;
}

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
 * Resolve a Resolvable<T> value — call it if it's a function, return it otherwise.
 */
function resolveValue<T, C>(value: Resolvable<T, C>, ctx: { workdir: string; config: C }): T {
  return typeof value === 'function' ? (value as (ctx: { workdir: string; config: C }) => T)(ctx) : value;
}

/**
 * Define a CLI — the top-level entry point.
 *
 * When a `configSchema` is provided, TSchema is inferred automatically,
 * giving typed `config` in agent factories, `Resolvable` callbacks, and
 * interactive config.
 */
export function defineCli<TSchema extends import('zod').ZodType = import('zod').ZodType<Record<string, unknown>>>(options: CliOptions<TSchema>): Cli {
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
  const hasServices = options.services && options.services.length > 0;

  // Auto-inject built-in svc command when services are defined
  if (hasServices && !commandMap.has('svc')) {
    const serviceIds = options.services!.map((s) => s.id);
    commandMap.set('svc', createSvcCommand(serviceIds));
  }

  // Auto-inject built-in help command — uses lazy getCli() since the Cli object
  // is created at the end of defineCli, but execute() is only called at runtime.
  let cliRef: Cli | undefined;
  if (!commandMap.has('cli-docs')) {
    commandMap.set('cli-docs', createHelpCommand({
      getCli: () => cliRef!,
    }));
  }

  // Auto-inject built-in init command when skillSources are defined
  if (options.skillSources && options.skillSources.length > 0 && !commandMap.has('init')) {
    commandMap.set('init', createInitCommand({
      skillSources: options.skillSources,
    }));
  }

  const eventBus = (hasTriggers || hasServices) ? createEventBus() : undefined;
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

  // Mutable agent loader — set via setAgentLoader()
  let agentLoader: AgentLoader<any> | undefined;

  function setAgentLoader(loader: AgentLoader<any>): void {
    agentLoader = loader;
  }

  function getCommand(id: string): Command | undefined {
    return commandMap.get(id);
  }

  function listCommands(): Command[] {
    return [...commandMap.values()];
  }

  function buildContext(base?: CommandContext): CommandContext {
    const ctx: CommandContext = base ?? {
      workdir: process.cwd(),
      workspace: createMemoryWorkdirStore(),
      config: options.configSchema
        ? (options.configSchema.parse({}) as Record<string, unknown>)
        : {},
      stdout: defaultStdout,
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
    const desc = resolveValue(options.description, { workdir: activeWorkdir, config: {} as import('zod').infer<TSchema> });
    const lines: string[] = [];
    lines.push(`${options.name} v${options.version}`);
    lines.push('');
    lines.push(desc);
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
    /* istanbul ignore next -- configSchema always has at least one field when present */
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
    resolvedDescription: string,
  ): Commander {
    const program = new Commander();
    program
      .name(options.name)
      .version(options.version)
      .description(resolvedDescription)
      .enablePositionalOptions()
      .exitOverride()
      .configureOutput({
        writeOut: (str) => stdout(str.trimEnd()),
        writeErr: (str) => stdout(str.trimEnd()),
      });

    if (options.interactive) {
      program.option('-i, --interactive', 'Start interactive REPL mode');
    }

    if (agentLoader) {
      program.option('--resume <thread-id>', 'Resume a previous conversation');
    }

    // --workdir is available unless the implementation overrides it
    if (!options.workdir) {
      program.option('-w, --workdir <path>', 'Set the workspace directory');
    }

    if (options.configSchema) {
      program.option('-c, --config <path>', 'Load config from a JSON file (relative to cwd)');
    }

    // Shorthand aliases for the built-in config command
    const configShorthands: Record<string, string> = {
      name: '-n',
      write: '-w',
      remove: '-r',
      list: '-l',
      scope: '-s',
    };

    for (const cmd of commandMap.values()) {
      // Skip cli-docs — it exists in commandMap only so the agent gets it as a tool.
      // Commander's built-in `help` handles CLI users.
      if (cmd.id === 'cli-docs') continue;

      const sub = program.command(cmd.id).description(cmd.description);
      const isBuiltinConfig = cmd.id === 'config' && options.configSchema;

      const fields = getSchemaFields(cmd.inputSchema);
      for (const field of fields) {
        const desc = field.description ?? '';
        const shorthand = isBuiltinConfig ? configShorthands[field.key] : undefined;
        const longFlag = `--${field.key}`;
        const flag = shorthand ? `${shorthand}, ${longFlag}` : longFlag;

        if (field.baseType === 'boolean') {
          sub.option(
            flag,
            desc,
            field.hasDefault ? (field.defaultValue as boolean) : false,
          );
        } else if (field.isOptional) {
          sub.option(
            `${flag} <value>`,
            desc,
            field.hasDefault ? String(field.defaultValue) : undefined,
          );
        } else {
          sub.requiredOption(`${flag} <value>`, desc);
        }
      }

      // Override help for the built-in config command with a rich help page
      if (isBuiltinConfig) {
        sub.helpInformation = () => generateConfigCommandHelp(options.name, options.configSchema!, activeWorkdir) + '\n';
      }

      sub.action(async (opts) => {
        const parsed = cmd.inputSchema.parse(opts);
        const result = await cmd.execute(parsed, context);
        const output = formatResult(result);
        if (output !== undefined) {
          stdout(output);
        }
      });
    }

    const configHelp = generateConfigHelp();
    if (configHelp) {
      program.addHelpText('after', '\n' + configHelp);
    }

    return program;
  }

  /**
   * Public entry point — fills in process defaults, then delegates to runImpl.
   */
  async function run(argv: string[], runOptions?: RunOptions): Promise<void> {
    /* istanbul ignore next -- process defaults only used when running as a real CLI */
    const resolved: ResolvedRunOptions = {
      exit: runOptions?.exit ?? ((code: number) => process.exit(code)),
      stdout: runOptions?.stdout ?? ((msg: string) => { console.log(msg); }),
      stderr: runOptions?.stderr ?? ((msg: string) => { console.error(msg); }),
      cwd: runOptions?.workdir ?? process.cwd(),
      writeRaw: runOptions?.stdout ?? defaultStdout,
      configFile: runOptions?.configFile,
      resume: runOptions?.resume,
      interactiveInput: runOptions?.interactiveInput,
    };
    return runImpl(argv, resolved);
  }

  /**
   * Internal run with fully-resolved options — no process globals, fully testable.
   */
  async function runImpl(argv: string[], opts: ResolvedRunOptions): Promise<void> {
    const { exit, stdout, stderr, cwd, writeRaw } = opts;

    // Extract --workdir and --config before Commander sees them
    const userArgs = argv.slice(2);
    let workdirFlag: string | undefined;
    let configFileFlag: string | undefined = opts.configFile;
    {
      const wIdx = userArgs.indexOf('--workdir');
      const wShort = userArgs.indexOf('-w');
      const wdIdx = wIdx !== -1 ? wIdx : (wShort !== -1 ? wShort : -1);
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
    const workdir = resolveWorkdir({
      implementationOverride: options.workdir,
      cliFlag: workdirFlag,
      fallback: cwd,
    });

    // Update active state for the config command
    activeWorkdir = workdir;
    activeConfigFile = configFileFlag;

    // Context store lives at {workdir}/.ph/{cli-name}/
    const workspace = createWorkdirStore(workdir, options.name);

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
    const context = buildContext({ workdir, workspace, config, stdout: writeRaw });

    // Create ServiceManager when services are defined
    if (hasServices && options.services && eventBus) {
      const svcDir = workspace.getStoreFolder('services');
      const serviceManager = createServiceManager(options.services as any[], {
        config,
        servicesDir: svcDir,
        eventBus,
      });
      context.services = serviceManager;

      // Register event handlers on the event bus
      if (options.events) {
        for (const [event, handler] of Object.entries(options.events)) {
          eventBus.on(event, handler);
        }
      }
    }

    // Resolve Resolvable values now that workdir/config are known.
    // Cast config to the inferred type — at runtime it IS that type (Zod parsed it).
    type TConfig = import('zod').infer<TSchema>;
    const typedConfig = config as TConfig;
    const resolvableCtx = { workdir, config: typedConfig };
    const resolvedDescription = resolveValue(options.description, resolvableCtx);
    const resolvedWelcome = options.interactive
      ? resolveValue(options.interactive.welcome, resolvableCtx)
      : undefined;

    // Lazy agent provider — only created when actually needed
    let cachedProvider: AgentProvider | undefined;
    async function getAgentProvider(): Promise<AgentProvider | undefined> {
      if (cachedProvider) return cachedProvider;
      if (!agentLoader) return undefined;
      const agentCtx: AgentContext<TConfig> = {
        workdir,
        config: typedConfig,
        cliName: options.name,
        cliVersion: options.version,
        context,
        commands: [...commandMap.values()],
      };
      cachedProvider = await agentLoader(agentCtx);
      return cachedProvider;
    }

    // Extract --resume <id> before Commander sees it
    let resumeId = opts.resume;
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

      const resolvedInteractive: ResolvedInteractiveConfig = { welcome: resolvedWelcome! };
      const cliRef: Cli = {
        name: options.name,
        version: options.version,
        description: resolvedDescription,
        configSchema: options.configSchema,
        interactive: resolvedInteractive,
        get hasAgent() { return !!agentLoader; },
        setAgentLoader,
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

      const agentProvider = await getAgentProvider();
      const session = createReplSession({
        cli: cliRef,
        context,
        agentProvider,
        threadId: resumeId,
      });

      if (opts.interactiveInput) {
        // Headless mode for testing
        if (session.welcome) stdout(session.welcome);
        for await (const line of opts.interactiveInput) {
          const result = await session.processInput(line);
          if (result.type === 'exit') {
            if (result.text) stdout(result.text);
            break;
          }
          if (result.text) stdout(result.text);
        }
        exit(0);
      } else {
        /* istanbul ignore next -- Ink REPL requires a real terminal */
        const { startInkRepl } = await import('../interactive/start.js');
        /* istanbul ignore next */
        await startInkRepl(session, { services: context.services });
        /* istanbul ignore next */
        exit(0);
      }
      return;
    }

    // Update the routine's context so it uses the resolved config/workspace
    if (routine) routine.setContext(context);

    // Strip framework flags and their values from argv before Commander sees them
    let commandArgv: string[];
    {
      const frameworkFlags = ['--resume', '--workdir', '-w', '--config', '-c'];
      const filtered: string[] = [];
      for (let i = 0; i < argv.length; i++) {
        if (frameworkFlags.includes(argv[i]!) && i + 1 < argv.length) {
          i++; // skip the flag and its value
        } else {
          filtered.push(argv[i]!);
        }
      }
      commandArgv = filtered;
    }

    // Check if the first non-flag arg is a registered subcommand or Commander built-in
    // If not, and we have an agent, treat remaining args as an agent prompt
    const nonFlagArgs = commandArgv.slice(2).filter((a) => !a.startsWith('-'));
    const firstArg = nonFlagArgs[0];
    const isSubcommand = firstArg && (commandMap.has(firstArg) || firstArg === 'help');

    if (!isSubcommand && agentLoader && nonFlagArgs.length > 0) {
      // Agent prompt in command mode
      const agentProvider = await getAgentProvider();
      if (agentProvider) {
        const prompt = nonFlagArgs.join(' ');
        const parts: string[] = [];
        for await (const chunk of agentProvider.stream(prompt, { threadId: resumeId, tools: commandMap })) {
          const text = formatStreamChunk(chunk);
          parts.push(text);
          stdout(text);
        }
        return;
      }
    }

    const program = buildProgram(stdout, context, resolvedDescription);

    try {
      await program.parseAsync(commandArgv);
    } catch (err: any) {
      if (err.exitCode === 0) {
        exit(0);
        return;
      }
      const msg = err instanceof Error ? err.message : String(err);
      // Commander's exitOverride wraps help/version output as errors with
      // messages like "(outputHelp)" or "(version)". The actual text has
      // already been written via configureOutput, so skip these.
      if (msg !== '(outputHelp)' && msg !== '(version)') {
        stderr(msg);
      }
      exit(err.exitCode ?? 1);
      return;
    }

    // If a command started the routine, stop it — command mode is one-shot
    if (routine && routine.status === 'running') {
      await routine.stop();
    }
  }

  async function stopRoutine(): Promise<void> {
    if (routine) {
      await routine.stop();
    }
  }

  // Resolve description for the static Cli object (best-effort without runtime context)
  const staticDescription = typeof options.description === 'string'
    ? options.description
    : options.description({ workdir: activeWorkdir, config: {} as import('zod').infer<TSchema> });

  cliRef = {
    name: options.name,
    version: options.version,
    description: staticDescription,
    configSchema: options.configSchema,
    interactive: options.interactive,
    get hasAgent() { return !!agentLoader; },
    setAgentLoader,
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

  return cliRef;
}
