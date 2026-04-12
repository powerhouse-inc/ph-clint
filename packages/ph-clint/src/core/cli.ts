import fs from 'node:fs';
import { Command as Commander } from 'commander';
import type {
  AgentContext,
  AgentLoader,
  AgentProvider,
  Cli,
  CliMetadata,
  CliOptions,
  Command,
  CommandContext,
  ConfigEnvVar,
  Resolvable,
  ResolvedInteractiveConfig,
  Routine,
  RunOptions,
} from './types.js';
import { randomUUID } from 'node:crypto';
import { formatStreamChunk } from './stream.js';
import { getSchemaFields, slugToTitle, type FieldInfo } from './schema.js';
import { createMemoryWorkdirStore, createWorkdirStore } from './store.js';
import { getConfigEnvVars, resolveConfig, userStoreFolder } from './config.js';
import { resolveWorkdir } from './workdir.js';
import { createConfigCommand, generateConfigCommandHelp } from './config-command.js';
import { createServiceCommands } from './service-command.js';
import { resolveServiceName } from './services.js';
import { createHelpCommand } from './help-command.js';
import { installSkills } from './init.js';
import { readSkillsFromSources } from './skills.js';
import type { SkillInfo } from './skills.js';
import { createSkillCommands, isSkillInvocation, DEFAULT_SKILL_INSTRUCTION } from './skill-commands.js';
import type { SkillInvocation } from './skill-commands.js';
import { renderSkillTemplate } from './templates.js';
import { createRoutine } from './routine.js';
import { createEventBus } from './events.js';
import { createProcessManager } from './processes.js';
import { createServiceManager } from './services.js';
import { createRoutineServiceAdapter, createCompositeServiceManager } from './routine-service.js';
import { createReplSession } from '../interactive/session.js';
import { formatZodError } from './errors.js';
import { createLogger } from './logger.js';

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
  logLevel?: import('./types.js').LogLevel;
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
export function defineCli<
  TSchema extends import('zod').ZodType = import('zod').ZodType<Record<string, unknown>>,
  TSecrets extends import('zod').ZodType = import('zod').ZodType<Record<string, unknown>>,
>(options: CliOptions<TSchema, TSecrets>): Cli {
  // Merged config type — used internally after secrets are folded in
  type TMerged = import('zod').infer<TSchema> & import('zod').infer<TSecrets>;

  // Merge secretsSchema into configSchema and track secret keys
  const sensitiveKeys = new Set<string>();
  if (options.secretsSchema && options.configSchema) {
    const secretsObj = options.secretsSchema as any;
    for (const key of Object.keys(secretsObj.shape)) {
      sensitiveKeys.add(key);
    }
    const configObj = options.configSchema as any;
    options = { ...options, configSchema: configObj.merge(secretsObj) as unknown as TSchema };
  }

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
      sensitiveKeys,
      implementationDefaults: options.configDefaults,
      // configFile is set lazily during run() via activeConfigFile
      get configFile() { return activeConfigFile; },
    });
    commandMap.set('config', configCmd);
  }

  // If triggers/routine config provided, create shared runtime services
  const hasTriggers = options.triggers && options.triggers.length > 0;
  const hasServices = options.services && options.services.length > 0;

  // Auto-inject per-service commands when services are defined
  // serviceGroups maps command ID → { name, description } for help grouping
  const serviceGroups = new Map<string, { name: string; description?: string }>();
  if (hasServices) {
    for (const svcDef of options.services!) {
      const cmds = createServiceCommands(svcDef);
      const svcGroup = { name: resolveServiceName(svcDef), description: svcDef.description };
      for (const cmd of cmds) {
        if (!commandMap.has(cmd.id)) commandMap.set(cmd.id, cmd);
        serviceGroups.set(cmd.id, svcGroup);
      }
    }
  }

  // Auto-inject built-in help command — uses lazy getCli() since the Cli object
  // is created at the end of defineCli, but execute() is only called at runtime.
  let cliRef: Cli | undefined;
  if (!commandMap.has('cli-docs')) {
    commandMap.set('cli-docs', createHelpCommand({
      getCli: () => cliRef!,
    }));
  }

  // Read skill metadata and register skill commands
  let resolvedSkills: SkillInfo[] = [];
  if (options.prompts && options.prompts.sources.length > 0) {
    resolvedSkills = readSkillsFromSources(options.prompts.sources);
    const skillCmds = createSkillCommands(resolvedSkills, options.prompts.skills);
    for (const cmd of skillCmds) {
      if (!commandMap.has(cmd.id)) commandMap.set(cmd.id, cmd);
    }
  }
  const skillIds = new Set(resolvedSkills.map(s => s.name));

  const eventBus = (hasTriggers || hasServices) ? createEventBus() : undefined;
  const processManager = hasTriggers ? createProcessManager() : undefined;
  let routine: Routine | undefined;

  // RoutineServiceAdapter for auto-injected service commands
  let routineServiceAdapter: import('./types.js').ServiceManager | undefined;

  if (hasTriggers) {
    routine = createRoutine({
      triggers: options.triggers!,
      commands: commandMap,
      tickInterval: options.routine?.tickInterval,
      idleInterval: options.routine?.idleInterval,
      eventBus,
      processManager,
    });

    // Auto-inject service commands for the routine when id is configured
    if (options.routine?.id) {
      const routineConfig = options.routine;
      // Build a synthetic ServiceDefinition for createServiceCommands
      const routineName = routineConfig.name ?? slugToTitle(routineConfig.id!);
      const syntheticDef: import('./types.js').ServiceDefinition = {
        id: routineConfig.id!,
        name: routineName,
        command: '',
        maxInstances: 1,
        ...(routineConfig.projectScanner && { projectScanner: routineConfig.projectScanner }),
      };
      const cmds = createServiceCommands(syntheticDef);
      const svcGroup = { name: routineName };
      for (const cmd of cmds) {
        if (!commandMap.has(cmd.id)) commandMap.set(cmd.id, cmd);
        serviceGroups.set(cmd.id, svcGroup);
      }

      // Create the adapter (used later when wiring up context.services)
      routineServiceAdapter = createRoutineServiceAdapter(routine, routineConfig, eventBus);
    }
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
    let parsed;
    try {
      parsed = cmd.inputSchema.parse(args);
    } catch (err) {
      throw new Error(formatZodError(err, commandId));
    }
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
    const desc = resolveValue(options.description, { workdir: activeWorkdir, config: {} as TMerged});
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
    // Group commands: regular, per-service, skills
    const allCmds = [...commandMap.values()];
    const regularCmds = allCmds.filter(c => !skillIds.has(c.id) && !serviceGroups.has(c.id));
    const skillCmds = allCmds.filter(c => skillIds.has(c.id));

    // Collect service groups preserving definition order
    const svcNameOrder: string[] = [];
    const svcCmdsByName = new Map<string, { group: { name: string; description?: string }; cmds: Command[] }>();
    for (const cmd of allCmds) {
      const group = serviceGroups.get(cmd.id);
      if (!group) continue;
      if (!svcCmdsByName.has(group.name)) {
        svcNameOrder.push(group.name);
        svcCmdsByName.set(group.name, { group, cmds: [] });
      }
      svcCmdsByName.get(group.name)!.cmds.push(cmd);
    }

    lines.push('Commands:');
    for (const cmd of regularCmds) {
      lines.push(`  ${cmd.id.padEnd(36)} ${cmd.description}`);
    }

    for (const name of svcNameOrder) {
      const entry = svcCmdsByName.get(name)!;
      lines.push('');
      lines.push(`${entry.group.name}:`);
      if (entry.group.description) {
        lines.push(`  ${entry.group.description}`);
        lines.push('');
      }
      for (const cmd of entry.cmds) {
        lines.push(`  ${cmd.id.padEnd(36)} ${cmd.description}`);
      }
    }

    if (skillCmds.length > 0) {
      lines.push('');
      lines.push('Skills:');
      for (const cmd of skillCmds) {
        lines.push(`  ${cmd.id.padEnd(36)} ${cmd.description}`);
      }
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
    const fields = getSchemaFields(options.configSchema, sensitiveKeys);

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
      return generateConfigCommandHelp(options.name, options.configSchema, activeWorkdir, sensitiveKeys);
    }

    // Rich help page for skill commands
    if (skillIds.has(commandId)) {
      const skill = resolvedSkills.find(s => s.name === commandId);
      const lines: string[] = [];
      lines.push(`Skill: ${commandId}`);
      lines.push('');
      lines.push(cmd.description);
      lines.push('');

      const fields = getSchemaFields(cmd.inputSchema);
      if (fields.length > 0) {
        lines.push('Parameters:');
        for (const field of fields) {
          const parts: string[] = [`  --${field.key}`];
          parts.push(field.description ?? '');
          if (field.hasDefault) parts.push(`(default: ${JSON.stringify(field.defaultValue)})`);
          if (!field.isOptional) parts.push('(required)');
          lines.push(parts.join('  '));
        }
        lines.push('');
      }

      // Append .cli-docs.md content if available
      if (skill?.cliDocsPath) {
        try {
          const docsContent = fs.readFileSync(skill.cliDocsPath, 'utf-8').trim();
          if (docsContent) {
            lines.push(docsContent);
            lines.push('');
          }
        } catch {
          // Skip unreadable docs
        }
      }

      return lines.join('\n');
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
    onSkillInvocation?: (invocation: SkillInvocation) => Promise<void>,
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

    program.option('--verbose', 'Enable debug-level logging');
    program.option('--meta', 'Output CLI metadata as JSON');

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

      const isSkill = skillIds.has(cmd.id);
      const isHidden = isSkill || serviceGroups.has(cmd.id);
      const sub = program.command(cmd.id, { hidden: isHidden }).description(cmd.description);
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
        sub.helpInformation = () => generateConfigCommandHelp(options.name, options.configSchema!, activeWorkdir, sensitiveKeys) + '\n';
      }

      sub.action(async (opts) => {
        let parsed;
        try {
          parsed = cmd.inputSchema.parse(opts);
        } catch (err) {
          throw new Error(formatZodError(err, cmd.id));
        }
        const result = await cmd.execute(parsed, context);
        if (isSkillInvocation(result)) {
          if (onSkillInvocation) {
            await onSkillInvocation(result);
          } else {
            stdout(`Skill: ${result.skillName}` + (result.userMessage ? ` — ${result.userMessage}` : ''));
          }
          return;
        }
        const output = formatResult(result);
        if (output !== undefined) {
          stdout(output);
        }
      });
    }

    // Append grouped service + skills sections to Commander's --help
    const groupedLines: string[] = [];

    // Service groups
    const allCmds = [...commandMap.values()];
    const svcNameOrder: string[] = [];
    const svcCmdsByName = new Map<string, { group: { name: string; description?: string }; cmds: Command[] }>();
    for (const cmd of allCmds) {
      const group = serviceGroups.get(cmd.id);
      if (!group) continue;
      if (!svcCmdsByName.has(group.name)) {
        svcNameOrder.push(group.name);
        svcCmdsByName.set(group.name, { group, cmds: [] });
      }
      svcCmdsByName.get(group.name)!.cmds.push(cmd);
    }
    for (const name of svcNameOrder) {
      const entry = svcCmdsByName.get(name)!;
      groupedLines.push('');
      groupedLines.push(`${entry.group.name}:`);
      if (entry.group.description) {
        groupedLines.push(`  ${entry.group.description}`);
        groupedLines.push('');
      }
      for (const cmd of entry.cmds) {
        groupedLines.push(`  ${cmd.id.padEnd(36)} ${cmd.description}`);
      }
    }

    // Skills
    const skillCmds = allCmds.filter(c => skillIds.has(c.id));
    if (skillCmds.length > 0) {
      groupedLines.push('');
      groupedLines.push('Skills:');
      for (const cmd of skillCmds) {
        groupedLines.push(`  ${cmd.id.padEnd(36)} ${cmd.description}`);
      }
    }

    if (groupedLines.length > 0) {
      program.addHelpText('after', groupedLines.join('\n'));
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
      logLevel: runOptions?.logLevel,
    };
    return runImpl(argv, resolved);
  }

  /**
   * Internal run with fully-resolved options — no process globals, fully testable.
   */
  async function runImpl(argv: string[], opts: ResolvedRunOptions): Promise<void> {
    const { exit, stdout, stderr, cwd, writeRaw } = opts;

    // ── Extract pre-command framework flags ────────────────────────
    // Framework flags (--workdir, --config, --resume, -i) are extracted from
    // args that appear BEFORE the subcommand name, to set up context before
    // Commander runs.  Commander (with enablePositionalOptions) handles the
    // scoping natively — post-subcommand options belong to the subcommand —
    // so we pass argv through unmodified.
    //   rupert --workdir ws vetra-start --workdir proj
    //          ^^^^^^^^^^^              ^^^^^^^^^^^^^^
    //          framework flag           subcommand flag (Commander scopes it)
    const userArgs = argv.slice(2);
    const subcommandNames = new Set([...commandMap.keys(), 'help']);
    let subcommandIdx = userArgs.findIndex((a) => subcommandNames.has(a));
    if (subcommandIdx === -1) subcommandIdx = userArgs.length;
    const preCommandArgs = userArgs.slice(0, subcommandIdx);

    // Extract framework flag values from pre-command args only
    let workdirFlag: string | undefined;
    let configFileFlag: string | undefined = opts.configFile;
    let resumeId: string | undefined = opts.resume;
    let interactiveFlag = false;
    let verboseFlag = false;
    let metaFlag = false;
    const frameworkFlags = new Set(['--resume', '--workdir', '-w', '--config', '-c']);
    for (let i = 0; i < preCommandArgs.length; i++) {
      const arg = preCommandArgs[i]!;
      if (arg === '-i' || arg === '--interactive') {
        interactiveFlag = true;
      } else if (arg === '--verbose') {
        verboseFlag = true;
      } else if (arg === '--meta') {
        metaFlag = true;
      } else if (frameworkFlags.has(arg) && i + 1 < preCommandArgs.length) {
        const value = preCommandArgs[i + 1]!;
        if (arg === '--workdir' || arg === '-w') workdirFlag = value;
        else if (arg === '--config' || arg === '-c') configFileFlag = value;
        else if (arg === '--resume') resumeId = value;
        i++; // skip value
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

    // Auto-initialize store and install skills on first use
    if (options.prompts && options.prompts.sources.length > 0) {
      const storeRoot = workspace.getStoreFolder();
      if (!fs.existsSync(storeRoot)) {
        fs.mkdirSync(storeRoot, { recursive: true });
        const dbFolder = workspace.getStoreFolder('.mastra/db');
        fs.mkdirSync(dbFolder, { recursive: true });
        installSkills({
          store: workspace,
          skillSources: options.prompts.sources,
          stdout: verboseFlag ? stderr : () => {},
        });
      }
    }

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
    const logLevel = opts.logLevel ?? (verboseFlag ? 'debug' : 'info');
    const log = createLogger(logLevel, stderr);
    const context = buildContext({ workdir, workspace, config, stdout: writeRaw, log });

    // Create ServiceManager when services and/or routine-as-service are defined
    {
      let processServiceManager: import('./types.js').ServiceManager | undefined;
      if (hasServices && options.services && eventBus) {
        const svcDir = userStoreFolder(options.name, 'services');
        processServiceManager = createServiceManager(options.services as any[], {
          config,
          servicesDir: svcDir,
          eventBus,
        });
      }

      // Wire up composite or single ServiceManager
      if (processServiceManager && routineServiceAdapter) {
        // Both process services and routine — create composite
        const routeMap = new Map<string, import('./types.js').ServiceManager>();
        for (const svc of options.services!) {
          routeMap.set(svc.id, processServiceManager);
        }
        routeMap.set(options.routine!.id!, routineServiceAdapter);
        context.services = createCompositeServiceManager(
          [processServiceManager, routineServiceAdapter],
          routeMap,
        );
      } else if (processServiceManager) {
        context.services = processServiceManager;
      } else if (routineServiceAdapter) {
        context.services = routineServiceAdapter;
      }

      // Register event handlers on the event bus
      if (eventBus && options.events) {
        for (const [event, handler] of Object.entries(options.events)) {
          eventBus.on(event, handler);
        }
      }
    }

    // Resolve Resolvable values now that workdir/config are known.
    // Cast config to the inferred type — at runtime it IS that type (Zod parsed it).
    type TConfig = TMerged;
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
        skills: resolvedSkills,
      };
      cachedProvider = await agentLoader(agentCtx);
      return cachedProvider;
    }

    // Handle --meta: output metadata JSON and exit (ignoring all other args)
    if (metaFlag) {
      stdout(JSON.stringify(getMetadata(), null, 2));
      exit(0);
      return;
    }

    // Check for interactive mode (-i or --interactive)
    if (interactiveFlag) {
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
        getMetadata,
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
      } else if (!process.stdin.isTTY) {
        /* istanbul ignore next -- no TTY in CI */
        stderr('Interactive mode requires a terminal. Use command mode instead: ' + options.name + ' "your message"');
        exit(1);
        return;
      } else {
        /* istanbul ignore next -- Ink REPL requires a real terminal */
        const { startInkRepl } = await import('../interactive/start.js');
        /* istanbul ignore next */
        await startInkRepl(session, { services: context.services, workdir: context.workdir });
        /* istanbul ignore next */
        exit(0);
      }
      return;
    }

    // Update the routine's context so it uses the resolved config/workspace
    if (routine) routine.setContext(context);

    // Check if the first non-flag arg is a registered subcommand or Commander built-in.
    // We already know from subcommandIdx whether a subcommand is present.
    // If not, and we have an agent, treat remaining non-flag args as an agent prompt.
    const postCmdArgs = userArgs.slice(subcommandIdx);
    const firstSubcmd = postCmdArgs[0];
    const isSubcommand = firstSubcmd && (commandMap.has(firstSubcmd) || firstSubcmd === 'help');

    if (!isSubcommand && agentLoader) {
      // Collect non-flag, non-framework-value args as the agent prompt.
      // Skip framework flag values by tracking when we see a framework flag.
      const promptArgs: string[] = [];
      let skipNext = false;
      for (const arg of preCommandArgs) {
        if (skipNext) { skipNext = false; continue; }
        if (frameworkFlags.has(arg)) { skipNext = true; continue; }
        if (arg.startsWith('-')) continue; // other flags like -i
        promptArgs.push(arg);
      }
      if (promptArgs.length > 0) {
        const agentProvider = await getAgentProvider();
        if (agentProvider) {
          const prompt = promptArgs.join(' ');
          const threadId = resumeId ?? randomUUID();
          const parts: string[] = [];
          for await (const chunk of agentProvider.stream(prompt, { threadId, tools: commandMap })) {
            const text = formatStreamChunk(chunk);
            parts.push(text);
            stdout(text);
          }
          stdout('');
          stdout(`\x1b[2mThread: ${threadId}  (continue with: ${options.name} --resume ${threadId} "your message")\x1b[0m`);
          return;
        }
      }
    }

    /**
     * Render an agent prompt from a SkillInvocation using its template.
     */
    function renderSkillPrompt(invocation: SkillInvocation): string {
      const template = invocation.instructionTemplate ?? DEFAULT_SKILL_INSTRUCTION;
      const skill = resolvedSkills.find(s => s.name === invocation.skillName);
      const context: Record<string, unknown> = {
        skillId: invocation.skillName,
        description: skill?.description ?? '',
        prompt: invocation.userMessage ?? '',
        ...(invocation.inputValues ?? {}),
      };
      return renderSkillTemplate(template, context).rendered.trim();
    }

    // Skill invocation handler for command mode — routes to agent with skill prefix
    async function handleSkillInvocation(invocation: SkillInvocation) {
      const agentProvider = await getAgentProvider();
      if (!agentProvider) {
        stderr('Agent not available — cannot invoke skill');
        exit(1);
        return;
      }
      const prompt = renderSkillPrompt(invocation);
      const threadId = resumeId ?? randomUUID();
      for await (const chunk of agentProvider.stream(prompt, { threadId, tools: commandMap })) {
        const text = formatStreamChunk(chunk);
        stdout(text);
      }
      stdout('');
      stdout(`\x1b[2mThread: ${threadId}  (continue with: ${options.name} --resume ${threadId} "your message")\x1b[0m`);
    }

    const program = buildProgram(stdout, context, resolvedDescription, agentLoader ? handleSkillInvocation : undefined);

    try {
      await program.parseAsync(argv);
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

  function fieldsToMap(fields: FieldInfo[]): Record<string, import('./types.js').MetadataField> {
    const map: Record<string, import('./types.js').MetadataField> = {};
    for (const f of fields) {
      const entry: import('./types.js').MetadataField = {
        id: f.key,
        description: f.description,
        optional: f.isOptional,
        type: f.baseType,
        sensitive: f.sensitive,
      };
      if (f.hasDefault) entry.default = f.defaultValue;
      map[f.key] = entry;
    }
    return map;
  }

  function getMetadata(): CliMetadata {
    const desc = resolveValue(options.description, { workdir: activeWorkdir, config: {} as TMerged});

    // Config metadata — flat map with env var names inlined
    let configMeta: CliMetadata['config'] = null;
    if (options.configSchema) {
      const fields = getSchemaFields(options.configSchema, sensitiveKeys);
      const envVarsByField = new Map<string, string>();
      for (const ev of configEnvVars()) {
        envVarsByField.set(ev.field, ev.name);
      }
      configMeta = {};
      for (const f of fields) {
        const entry: import('./types.js').ConfigMetadataField = {
          id: f.key,
          description: f.description,
          optional: f.isOptional,
          type: f.baseType,
          sensitive: f.sensitive,
          env: envVarsByField.get(f.key) ?? '',
        };
        if (f.hasDefault) entry.default = f.defaultValue;
        configMeta[f.key] = entry;
      }
    }

    // Commands metadata (keyed by id) — exclude skill-wrapper commands (listed in skills.resolved)
    const commandsMeta: CliMetadata['commands'] = {};
    for (const cmd of commandMap.values()) {
      if (skillIds.has(cmd.id)) continue; // skip skill-wrapper commands
      commandsMeta[cmd.id] = {
        id: cmd.id,
        description: cmd.description,
        params: fieldsToMap(getSchemaFields(cmd.inputSchema)),
      };
    }

    // Services metadata (keyed by id)
    let servicesMeta: CliMetadata['services'] = null;
    if (options.services && options.services.length > 0) {
      servicesMeta = {};
      for (const svc of options.services) {
        // Collect MCP capture names from readiness patterns
        const mcpCaptures: string[] = [];
        if (svc.readiness) {
          if (svc.readiness.patterns) {
            for (const pat of svc.readiness.patterns) {
              if (pat.captures) {
                for (const [capName, def] of Object.entries(pat.captures)) {
                  if (typeof def === 'object' && def.type === 'api-mcp') {
                    mcpCaptures.push(capName);
                  }
                }
              }
            }
          } else if (svc.readiness.captures) {
            for (const [capName, def] of Object.entries(svc.readiness.captures)) {
              if (typeof def === 'object' && def.type === 'api-mcp') {
                mcpCaptures.push(capName);
              }
            }
          }
        }

        // Build mcpPrefix: undefined | string | Record<string, string>
        let mcpPrefix: string | Record<string, string> | undefined;
        if (mcpCaptures.length === 1) {
          mcpPrefix = `${svc.id}-mcp__`;
        } else if (mcpCaptures.length > 1) {
          mcpPrefix = {};
          for (const capName of mcpCaptures) {
            mcpPrefix[capName] = `${svc.id}-${capName}-mcp__`;
          }
        }

        servicesMeta[svc.id] = {
          id: svc.id,
          name: resolveServiceName(svc),
          ...(svc.description && { description: svc.description }),
          ...(svc.maxInstances !== undefined && { maxInstances: svc.maxInstances }),
          params: svc.paramsSchema ? fieldsToMap(getSchemaFields(svc.paramsSchema)) : {},
          ...(svc.shutdown && { shutdown: { signal: String(svc.shutdown.signal), timeout: svc.shutdown.timeout } }),
          ...(svc.restart && { restart: { enabled: svc.restart.enabled, maxRetries: svc.restart.maxRetries, delay: svc.restart.delay } }),
          ...(svc.readiness?.timeout !== undefined && { readinessTimeout: svc.readiness.timeout }),
          ...(mcpPrefix !== undefined && { mcpPrefix }),
        };
      }
    }

    // Prompts metadata
    let promptsMeta: CliMetadata['prompts'] = null;
    if (options.prompts) {
      const resolvedMap: Record<string, { id: string; description: string }> = {};
      for (const s of resolvedSkills) {
        resolvedMap[s.name] = { id: s.name, description: s.description };
      }
      promptsMeta = {
        sources: options.prompts.sources,
        agents: options.prompts.agents ?? {},
        skills: options.prompts.skills ?? {},
        resolved: resolvedMap,
      };
    }

    return {
      name: options.name,
      version: options.version,
      description: desc,
      hasInteractive: !!options.interactive,
      hasAgent: !!agentLoader,
      hasReactor: false, // TODO: detect Powerhouse reactor integration when implemented
      config: configMeta,
      commands: commandsMeta,
      services: servicesMeta,
      prompts: promptsMeta,
    };
  }

  // Resolve description for the static Cli object (best-effort without runtime context)
  const staticDescription = typeof options.description === 'string'
    ? options.description
    : options.description({ workdir: activeWorkdir, config: {} as TMerged});

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
    getMetadata,
    run,
    stopRoutine,
  };

  return cliRef;
}
