import { describe, it, expect, beforeEach } from '@jest/globals';
import { z } from 'zod';
import {
  defineCli,
  defineCommand,
  createReplSession,
  createMemoryWorkspace,
} from '../src/index.js';
import type { ReplSession, CommandContext, AgentProvider, StreamChunk } from '../src/index.js';

describe('createReplSession', () => {
  const greet = defineCommand({
    id: 'greet',
    description: 'Greet someone by name',
    inputSchema: z.object({
      name: z.string().describe('Name of the person to greet'),
      loud: z.boolean().default(false).describe('Shout the greeting'),
    }),
    execute: async ({ name, loud }) => {
      const msg = `Hello, ${name}!`;
      return loud ? msg.toUpperCase() : msg;
    },
  });

  const echo = defineCommand({
    id: 'echo',
    description: 'Echo a message',
    inputSchema: z.object({
      message: z.string().describe('Message to echo'),
    }),
    execute: async ({ message }) => ({ text: message, data: { message } }),
  });

  const errorCmd = defineCommand({
    id: 'fail',
    description: 'Always fails',
    inputSchema: z.object({}),
    execute: async () => {
      throw new Error('command failed');
    },
  });

  const cli = defineCli({
    name: 'test',
    version: '1.0.0',
    description: 'Test CLI',
    commands: [greet, echo, errorCmd],
    interactive: { welcome: 'Welcome to Test CLI' },
  });

  let session: ReplSession;
  let context: CommandContext;

  beforeEach(() => {
    context = { workspace: createMemoryWorkspace(), config: {}, workdir: '', stdout: () => {} };
    session = createReplSession({ cli, context });
  });

  describe('welcome', () => {
    it('returns the welcome message', () => {
      expect(session.welcome).toBe('Welcome to Test CLI');
    });
  });

  describe('processInput', () => {
    it('handles empty input', async () => {
      const result = await session.processInput('');
      expect(result.type).toBe('empty');
    });

    it('handles /help', async () => {
      const result = await session.processInput('/help');
      expect(result.type).toBe('help');
      expect(result.text).toContain('greet');
      expect(result.text).toContain('echo');
      expect(result.text).toContain('/help');
      expect(result.text).toContain('/exit');
    });

    it('handles /exit', async () => {
      const result = await session.processInput('/exit');
      expect(result.type).toBe('exit');
      expect(result.text).toBe('Goodbye!');
    });

    it('handles /quit', async () => {
      const result = await session.processInput('/quit');
      expect(result.type).toBe('exit');
    });

    it('executes a command returning a string', async () => {
      const result = await session.processInput('/greet --name Alice');
      expect(result.type).toBe('result');
      expect(result.text).toContain('Hello, Alice!');
    });

    it('executes a command with boolean flag', async () => {
      const result = await session.processInput('/greet --name Alice --loud');
      expect(result.type).toBe('result');
      expect(result.text).toContain('HELLO, ALICE!');
    });

    it('executes a command returning { text }', async () => {
      const result = await session.processInput('/echo --message "Hello World"');
      expect(result.type).toBe('result');
      expect(result.text).toContain('Hello World');
    });

    it('returns error for unknown command', async () => {
      const result = await session.processInput('/nonexistent');
      expect(result.type).toBe('error');
      expect(result.text).toContain('Unknown command');
      expect(result.text).toContain('nonexistent');
    });

    it('returns error for bare text', async () => {
      const result = await session.processInput('just some text');
      expect(result.type).toBe('error');
      expect(result.text).toContain('/help');
    });

    it('returns error for missing required arg', async () => {
      const result = await session.processInput('/greet');
      expect(result.type).toBe('error');
      expect(result.text).toContain('name');
    });

    it('returns error when command throws', async () => {
      const result = await session.processInput('/fail');
      expect(result.type).toBe('error');
      expect(result.text).toContain('command failed');
    });
  });

  describe('processInput — result formatting', () => {
    it('handles command returning null', async () => {
      const nullCmd = defineCommand({
        id: 'null',
        description: 'Returns null',
        inputSchema: z.object({}),
        execute: async () => null as unknown,
      });
      const nullCli = defineCli({
        name: 'test',
        version: '1.0.0',
        description: 'test',
        commands: [nullCmd],
        interactive: { welcome: '' },
      });
      const s = createReplSession({
        cli: nullCli,
        context: { workspace: createMemoryWorkspace(), config: {}, workdir: '', stdout: () => {} },
      });
      const result = await s.processInput('/null');
      expect(result.type).toBe('result');
      expect(result.text).toBe('');
    });
  });

  describe('getCompletions', () => {
    it('completes command names', () => {
      const result = session.getCompletions('/gr');
      expect(result).toEqual(['/greet']);
    });

    it('returns all commands for /', () => {
      const result = session.getCompletions('/');
      expect(result).toContain('/greet');
      expect(result).toContain('/echo');
      expect(result).toContain('/fail');
      expect(result).toContain('/help');
      expect(result).toContain('/exit');
    });
  });

  describe('getGhostSuggestion', () => {
    it('returns ghost suggestion for partial command', () => {
      const ghost = session.getGhostSuggestion('/gr');
      expect(ghost).toBe('/greet');
    });

    it('returns ghost suggestion for flag', () => {
      const ghost = session.getGhostSuggestion('/greet --na');
      expect(ghost).toContain('--name');
    });

    it('returns null for unknown command', () => {
      expect(session.getGhostSuggestion('/unknown')).toBeNull();
    });
  });
});

describe('parameter prompting', () => {
  const addTask = defineCommand({
    id: 'add',
    description: 'Add a task',
    inputSchema: z.object({
      title: z.string().describe('Task title'),
      priority: z.enum(['low', 'medium', 'high']).optional().describe('Task priority'),
      due: z.string().optional().describe('Due date'),
    }),
    prompt: {
      promptForDefaults: false,
      promptOptional: ['priority'],
    },
    execute: async ({ title, priority }) => ({
      text: `Added: ${title} [${priority ?? 'none'}]`,
    }),
  });

  const addRequired = defineCommand({
    id: 'add-req',
    description: 'Add with required fields',
    inputSchema: z.object({
      title: z.string().describe('Task title'),
      body: z.string().describe('Task body'),
    }),
    prompt: {},
    execute: async ({ title, body }) => ({
      text: `${title}: ${body}`,
    }),
  });

  const addDefaults = defineCommand({
    id: 'add-def',
    description: 'Add with defaults prompting',
    inputSchema: z.object({
      title: z.string().describe('Task title'),
      priority: z.enum(['low', 'medium', 'high']).default('medium').describe('Task priority'),
    }),
    prompt: {
      promptForDefaults: true,
    },
    execute: async ({ title, priority }) => ({
      text: `${title} [${priority}]`,
    }),
  });

  function makeSession(commands: Parameters<typeof defineCli>[0]['commands']) {
    const cli = defineCli({
      name: 'test',
      version: '1.0.0',
      description: 'Test',
      commands,
      interactive: { welcome: '' },
    });
    return createReplSession({
      cli,
      context: { workspace: createMemoryWorkspace(), config: {}, workdir: '', stdout: () => {} },
    });
  }

  it('does not prompt when all required fields are provided', async () => {
    const session = makeSession([addTask]);
    const result = await session.processInput('/add --title "Buy milk"');
    expect(result.type).toBe('result');
    expect(session.isPrompting).toBe(false);
  });

  it('includes promptOptional fields when prompting for missing required', async () => {
    const session = makeSession([addTask]);
    // title is required and missing → triggers prompting, which also asks for priority
    const r1 = await session.processInput('/add');
    expect(r1.type).toBe('prompt');
    expect(r1.promptLabel).toBe('title');

    const r2 = await session.processInput('Buy milk');
    expect(r2.type).toBe('prompt');
    expect(r2.promptLabel).toBe('priority');

    const r3 = await session.processInput('high');
    expect(r3.type).toBe('result');
    expect(r3.text).toContain('Buy milk');
    expect(r3.text).toContain('high');
    expect(session.isPrompting).toBe(false);
  });

  it('accepts empty input for optional prompted field', async () => {
    const session = makeSession([addTask]);
    await session.processInput('/add');
    await session.processInput('Buy milk');
    // priority prompt — accept default (skip)
    const result = await session.processInput('');
    expect(result.type).toBe('result');
    expect(result.text).toContain('Buy milk');
  });

  it('prompts for missing required fields when command has prompt config', async () => {
    const session = makeSession([addRequired]);
    const result = await session.processInput('/add-req');
    expect(result.type).toBe('prompt');
    expect(result.promptLabel).toBe('title');
  });

  it('prompts for each required field sequentially', async () => {
    const session = makeSession([addRequired]);
    await session.processInput('/add-req');
    const r2 = await session.processInput('My Task');
    expect(r2.type).toBe('prompt');
    expect(r2.promptLabel).toBe('body');
    const r3 = await session.processInput('Task details');
    expect(r3.type).toBe('result');
    expect(r3.text).toContain('My Task');
    expect(r3.text).toContain('Task details');
  });

  it('re-prompts when required field is left empty', async () => {
    const session = makeSession([addRequired]);
    await session.processInput('/add-req');
    const r2 = await session.processInput('');
    expect(r2.type).toBe('prompt');
    expect(r2.promptLabel).toBe('title');
    expect(r2.text).toContain('required');
  });

  it('skips prompting when all args are provided', async () => {
    const session = makeSession([addTask]);
    const result = await session.processInput('/add --title "Buy milk" --priority high');
    expect(result.type).toBe('result');
    expect(session.isPrompting).toBe(false);
  });

  it('promptForDefaults includes default fields when prompting is triggered', async () => {
    const session = makeSession([addDefaults]);
    // title is required and missing → triggers prompting
    // promptForDefaults means priority (which has a default) also gets prompted
    const r1 = await session.processInput('/add-def');
    expect(r1.type).toBe('prompt');
    expect(r1.promptLabel).toBe('title');

    const r2 = await session.processInput('Task');
    expect(r2.type).toBe('prompt');
    expect(r2.promptLabel).toBe('priority');
  });

  it('accepts default value on empty input when promptForDefaults', async () => {
    const session = makeSession([addDefaults]);
    await session.processInput('/add-def');
    await session.processInput('Task');
    const result = await session.processInput('');
    expect(result.type).toBe('result');
    expect(result.text).toContain('medium'); // default applied
  });

  it('does not prompt for defaults when all required fields are provided', async () => {
    const session = makeSession([addDefaults]);
    const result = await session.processInput('/add-def --title "Task"');
    expect(result.type).toBe('result');
    expect(result.text).toContain('medium');
  });

  it('disables completions during prompting', async () => {
    const session = makeSession([addTask]);
    await session.processInput('/add');
    expect(session.getCompletions('/add')).toEqual([]);
    expect(session.getGhostSuggestion('/add')).toBeNull();
  });

  it('prompts for boolean fields with true/false hint', async () => {
    const boolCmd = defineCommand({
      id: 'toggle',
      description: 'Toggle',
      inputSchema: z.object({
        verbose: z.boolean().describe('Verbose output'),
      }),
      prompt: {},
      execute: async ({ verbose }) => ({ text: `verbose=${verbose}` }),
    });
    const session = makeSession([boolCmd]);
    const r1 = await session.processInput('/toggle');
    expect(r1.type).toBe('prompt');
    expect(r1.text).toContain('true/false');

    const r2 = await session.processInput('true');
    expect(r2.type).toBe('result');
    expect(r2.text).toContain('verbose=true');
  });

  it('handles error during prompted command execution', async () => {
    const failCmd = defineCommand({
      id: 'fail',
      description: 'Fails',
      inputSchema: z.object({
        x: z.string().describe('Value'),
      }),
      prompt: {},
      execute: async () => { throw new Error('boom'); },
    });
    const session = makeSession([failCmd]);
    await session.processInput('/fail');
    const result = await session.processInput('test');
    expect(result.type).toBe('error');
    expect(result.text).toContain('boom');
  });

  it('enters prompting for missing required fields with partial args', async () => {
    const session = makeSession([addRequired]);
    // Provide title but not body — parseArgs throws, prompting catches it
    const r1 = await session.processInput('/add-req --title "My Task"');
    expect(r1.type).toBe('prompt');
    expect(r1.promptLabel).toBe('body');

    const r2 = await session.processInput('The body text');
    expect(r2.type).toBe('result');
    expect(r2.text).toContain('My Task');
    expect(r2.text).toContain('The body text');
  });

  it('handles partial args with boolean flags when entering prompting', async () => {
    const mixedCmd = defineCommand({
      id: 'mixed',
      description: 'Mixed fields',
      inputSchema: z.object({
        title: z.string().describe('Title'),
        verbose: z.boolean().default(false).describe('Verbose'),
      }),
      prompt: {},
      execute: async ({ title, verbose }) => ({ text: `${title} v=${verbose}` }),
    });
    const session = makeSession([mixedCmd]);
    // Provide verbose but not title — title is required, triggers prompting via error path
    const r1 = await session.processInput('/mixed --verbose');
    expect(r1.type).toBe('prompt');
    expect(r1.promptLabel).toBe('title');

    const r2 = await session.processInput('Test');
    expect(r2.type).toBe('result');
    expect(r2.text).toContain('Test');
    expect(r2.text).toContain('v=true');
  });

  it('uses field key when description is missing in prompt text', async () => {
    const noDescCmd = defineCommand({
      id: 'nodesc',
      description: 'No desc fields',
      inputSchema: z.object({
        value: z.string(),
      }),
      prompt: {},
      execute: async ({ value }) => ({ text: value }),
    });
    const session = makeSession([noDescCmd]);
    const r1 = await session.processInput('/nodesc');
    expect(r1.type).toBe('prompt');
    expect(r1.text).toContain('value'); // falls back to key
  });

  it('skips optional prompted field on empty input when prompting is active', async () => {
    const optCmd = defineCommand({
      id: 'opt',
      description: 'Optional prompting',
      inputSchema: z.object({
        name: z.string().describe('Name'),
        note: z.string().optional().describe('Note'),
      }),
      prompt: { promptOptional: ['note'] },
      execute: async ({ name, note }) => ({ text: `${name}:${note ?? 'none'}` }),
    });
    const session = makeSession([optCmd]);
    // Omit required name → triggers prompting, which also asks for note (promptOptional)
    const r1 = await session.processInput('/opt');
    expect(r1.type).toBe('prompt');
    expect(r1.promptLabel).toBe('name');

    const r2 = await session.processInput('Test');
    expect(r2.type).toBe('prompt');
    expect(r2.promptLabel).toBe('note');

    // Skip optional note
    const r3 = await session.processInput('');
    expect(r3.type).toBe('result');
    expect(r3.text).toContain('none');
  });

  it('applies non-prompted defaults and includes promptOptional when required fields missing', async () => {
    const mixedDefaultsCmd = defineCommand({
      id: 'mixed-defaults',
      description: 'Mixed defaults',
      inputSchema: z.object({
        title: z.string().describe('Title'),
        priority: z.enum(['low', 'medium', 'high']).default('medium').describe('Priority'),
        verbose: z.boolean().default(false).describe('Verbose'),
      }),
      prompt: {
        promptOptional: ['priority'],  // priority is prompted when prompting is active, verbose is not
      },
      execute: async ({ title, priority, verbose }) => ({
        text: `${title} [${priority}] v=${verbose}`,
      }),
    });
    const session = makeSession([mixedDefaultsCmd]);
    // Missing title triggers prompting; priority (promptOptional) also prompted; verbose gets default
    const r1 = await session.processInput('/mixed-defaults');
    expect(r1.type).toBe('prompt');
    expect(r1.promptLabel).toBe('title');

    const r2 = await session.processInput('Test');
    expect(r2.type).toBe('prompt');
    expect(r2.promptLabel).toBe('priority');

    const r3 = await session.processInput('high');
    expect(r3.type).toBe('result');
    expect(r3.text).toContain('Test');
    expect(r3.text).toContain('high');
    expect(r3.text).toContain('v=false'); // verbose got its default
  });

  it('does not prompt for commands without prompt config', async () => {
    const noPrompt = defineCommand({
      id: 'simple',
      description: 'Simple',
      inputSchema: z.object({
        name: z.string().describe('Name'),
      }),
      execute: async ({ name }) => name,
    });
    const session = makeSession([noPrompt]);
    const result = await session.processInput('/simple');
    expect(result.type).toBe('error');
    expect(result.text).toContain('name');
  });
});

describe('headless interactive mode via run()', () => {
  const greet = defineCommand({
    id: 'greet',
    description: 'Greet someone by name',
    inputSchema: z.object({
      name: z.string().describe('Name'),
    }),
    execute: async ({ name }) => `Hello, ${name}!`,
  });

  const cli = defineCli({
    name: 'test',
    version: '1.0.0',
    description: 'Test CLI',
    commands: [greet],
    interactive: { welcome: 'Welcome!' },
  });

  it('runs commands from interactiveInput and prints output', async () => {
    const output: string[] = [];
    const inputs = ['/greet --name Alice', '/exit'];

    await cli.run(['node', 'test', '-i'], {
      stdout: (msg) => output.push(msg),
      stderr: () => {},
      exit: () => {},
      interactiveInput: (async function* () {
        for (const input of inputs) yield input;
      })(),
    });

    expect(output[0]).toBe('Welcome!');
    expect(output).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Hello, Alice!'),
      ]),
    );
    expect(output).toContain('Goodbye!');
  });

  it('shows welcome message', async () => {
    const output: string[] = [];

    await cli.run(['node', 'test', '-i'], {
      stdout: (msg) => output.push(msg),
      stderr: () => {},
      exit: () => {},
      interactiveInput: (async function* () {
        yield '/exit';
      })(),
    });

    expect(output[0]).toBe('Welcome!');
  });

  it('handles /help in headless mode', async () => {
    const output: string[] = [];

    await cli.run(['node', 'test', '-i'], {
      stdout: (msg) => output.push(msg),
      stderr: () => {},
      exit: () => {},
      interactiveInput: (async function* () {
        yield '/help';
        yield '/exit';
      })(),
    });

    const helpOutput = output.find((o) => o.includes('greet'));
    expect(helpOutput).toBeDefined();
  });

  it('rejects -i when interactive is not configured', async () => {
    const noInteractive = defineCli({
      name: 'test',
      version: '1.0.0',
      description: 'No interactive',
      commands: [greet],
    });

    const errors: string[] = [];
    let exitCode: number | undefined;

    await noInteractive.run(['node', 'test', '-i'], {
      stdout: () => {},
      stderr: (msg) => errors.push(msg),
      exit: (code) => { exitCode = code; },
    });

    expect(errors[0]).toContain('not configured');
    expect(exitCode).toBe(1);
  });
});

describe('default command — agent routing', () => {
  function createTestAgent(
    responses: Record<string, StreamChunk[]>,
  ): AgentProvider {
    return {
      id: 'test-assistant',
      async *stream(prompt) {
        const chunks = responses[prompt] ?? [
          { type: 'text-delta' as const, text: `Echo: ${prompt}` },
        ];
        for (const chunk of chunks) yield chunk;
      },
    };
  }

  const search = defineCommand({
    id: 'search',
    description: 'Search',
    inputSchema: z.object({ query: z.string().describe('Query') }),
    execute: async ({ query }) => ({ text: `Results for: ${query}` }),
  });

  it('routes bare text to agent when agent factory is set', async () => {
    const agent = createTestAgent({
      'What is TypeScript?': [
        { type: 'text-delta', text: 'TypeScript is a typed superset of JavaScript.' },
      ],
    });

    const cli = defineCli({
      name: 'assist',
      version: '1.0.0',
      description: 'Assistant',
      commands: [search],
      agent: { default: async () => agent },
      interactive: { welcome: 'Hi!' },
    });

    const context: CommandContext = { workspace: createMemoryWorkspace(), config: {}, workdir: '', stdout: () => {} };
    const session = createReplSession({ cli, context, agentProvider: agent });

    const result = await session.processInput('What is TypeScript?');
    expect(result.type).toBe('result');
    expect(result.text).toContain('TypeScript is a typed superset of JavaScript.');
  });

  it('still routes /command to direct execution', async () => {
    const agent = createTestAgent({});

    const cli = defineCli({
      name: 'assist',
      version: '1.0.0',
      description: 'Assistant',
      commands: [search],
      agent: { default: async () => agent },
      interactive: { welcome: 'Hi!' },
    });

    const context: CommandContext = { workspace: createMemoryWorkspace(), config: {}, workdir: '', stdout: () => {} };
    const session = createReplSession({ cli, context, agentProvider: agent });

    const result = await session.processInput('/search --query "hello"');
    expect(result.type).toBe('result');
    expect(result.text).toContain('Results for: hello');
  });

  it('streams tool-call and tool-result chunks into output', async () => {
    const agent = createTestAgent({
      'search for cats': [
        { type: 'tool-call', toolName: 'search', args: { query: 'cats' } },
        { type: 'tool-result', toolName: 'search', result: '3 results', isError: false },
        { type: 'text-delta', text: 'Here are results about cats.' },
      ],
    });

    const cli = defineCli({
      name: 'assist',
      version: '1.0.0',
      description: 'Assistant',
      commands: [search],
      agent: { default: async () => agent },
      interactive: { welcome: '' },
    });

    const context: CommandContext = { workspace: createMemoryWorkspace(), config: {}, workdir: '', stdout: () => {} };
    const session = createReplSession({ cli, context, agentProvider: agent });

    const result = await session.processInput('search for cats');
    expect(result.text).toContain('▶');
    expect(result.text).toContain('search');
    expect(result.text).toContain('✓');
    expect(result.text).toContain('Here are results about cats.');
  });

  it('handles error chunks from agent', async () => {
    const agent = createTestAgent({
      'break': [
        { type: 'text-delta', text: 'Starting...' },
        { type: 'error', error: 'API rate limit exceeded' },
      ],
    });

    const cli = defineCli({
      name: 'assist',
      version: '1.0.0',
      description: 'Assistant',
      commands: [search],
      agent: { default: async () => agent },
      interactive: { welcome: '' },
    });

    const context: CommandContext = { workspace: createMemoryWorkspace(), config: {}, workdir: '', stdout: () => {} };
    const session = createReplSession({ cli, context, agentProvider: agent });

    const result = await session.processInput('break');
    expect(result.text).toContain('Starting...');
    expect(result.text).toContain('API rate limit exceeded');
  });

  it('returns error for bare text when no agent is configured', async () => {
    const cli = defineCli({
      name: 'test',
      version: '1.0.0',
      description: 'Test',
      commands: [search],
      interactive: { welcome: '' },
    });

    const context: CommandContext = { workspace: createMemoryWorkspace(), config: {}, workdir: '', stdout: () => {} };
    const session = createReplSession({ cli, context });

    const result = await session.processInput('just some text');
    expect(result.type).toBe('error');
  });

  it('returns error when agent factory is set but provider is not passed', async () => {
    const cli = defineCli({
      name: 'assist',
      version: '1.0.0',
      description: 'Assistant',
      commands: [search],
      agent: { default: async () => ({ id: 'x', async *stream() {} }) },
      interactive: { welcome: '' },
    });

    const context: CommandContext = { workspace: createMemoryWorkspace(), config: {}, workdir: '', stdout: () => {} };
    // No agentProvider passed — session should still route text to agent handler
    const session = createReplSession({ cli, context });

    const result = await session.processInput('hello');
    expect(result.type).toBe('error');
    expect(result.text).toContain('Agent not available');
  });
});
