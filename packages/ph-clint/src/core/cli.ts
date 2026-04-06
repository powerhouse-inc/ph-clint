import { Command as Commander } from 'commander';
import type {
  Cli,
  CliOptions,
  Command,
  CommandContext,
  ConfigEnvVar,
  RunOptions,
} from './types.js';
import { getSchemaFields } from './schema.js';
import { createMemoryWorkspace, createWorkspace } from './workspace.js';
import { getConfigEnvVars, resolveConfig } from './config.js';

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

  function getCommand(id: string): Command | undefined {
    return commandMap.get(id);
  }

  function listCommands(): Command[] {
    return [...commandMap.values()];
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
    const ctx = context ?? {
      workspace: createMemoryWorkspace(),
      config: options.configSchema
        ? (options.configSchema.parse({}) as Record<string, unknown>)
        : {},
    };
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
    lines.push('Commands:');
    for (const cmd of commandMap.values()) {
      lines.push(`  ${cmd.id.padEnd(20)} ${cmd.description}`);
    }
    lines.push('');
    return lines.join('\n');
  }

  function generateCommandHelp(commandId: string): string {
    const cmd = commandMap.get(commandId);
    if (!cmd) {
      throw new Error(`Unknown command: ${commandId}`);
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

      sub.action(async (opts) => {
        const parsed = cmd.inputSchema.parse(opts);
        const result = await cmd.execute(parsed, context);
        const output = formatResult(result);
        if (output !== undefined) {
          stdout(output);
        }
      });
    }

    return program;
  }

  async function run(argv: string[], runOptions?: RunOptions): Promise<void> {
    const exit = runOptions?.exit ?? process.exit;
    const stdout = runOptions?.stdout ?? console.log;
    const stderr = runOptions?.stderr ?? console.error;

    // Create workspace and resolve config for this run
    const cwd = process.cwd();
    const workspacePath = `.ph/cli/${options.name}`;
    const workspace = createWorkspace(workspacePath);
    const config = options.configSchema
      ? resolveConfig(options.configSchema, options.name, cwd)
      : {};
    const context: CommandContext = { workspace, config };

    const program = buildProgram(stdout, context);

    try {
      await program.parseAsync(argv);
    } catch (err: any) {
      if (err.exitCode === 0) {
        exit(0);
        return;
      }
      const msg = err instanceof Error ? err.message : String(err);
      stderr(msg);
      exit(err.exitCode ?? 1);
    }
  }

  return {
    name: options.name,
    version: options.version,
    description: options.description,
    configSchema: options.configSchema,
    interactive: options.interactive,
    getCommand,
    listCommands,
    execute,
    parseArgs,
    generateHelp,
    generateCommandHelp,
    generateCompletion,
    configEnvVars,
    run,
  };
}
