export interface CommandDef {
  name: string;
  description: string;
  args: string;
  execute: (args: string) => AsyncGenerator<string, void, unknown>;
}

const hello: CommandDef = {
  name: 'hello',
  description: 'Greet someone (or the whole world)',
  args: '[name]',
  async *execute(args: string) {
    yield `hello ${args.trim() || 'world'}`;
  },
};

const weather: CommandDef = {
  name: 'weather',
  description: 'Ask the weather agent about a location',
  args: '<city>',
  async *execute(args: string) {
    const city = args.trim();
    if (!city) {
      yield 'Usage: /weather <city>';
      return;
    }

    const { iterateFullStream } = await import('../stream-utils.js');
    const { mastra } = await import('../mastra/index.js');
    const agent = mastra.getAgentById('weather-agent');
    const stream = await agent.stream(`What is the weather in ${city}?`, { maxSteps: 200 });

    yield* iterateFullStream(stream.fullStream);
  },
};

const reactor: CommandDef = {
  name: 'reactor',
  description: 'Manage Reactor Package projects (list, init, run, status, ...)',
  args: '<instruction>',
  async *execute(args: string) {
    const instruction = args.trim();
    if (!instruction) {
      yield 'Usage: /reactor <instruction>\nExamples:\n  /reactor list projects\n  /reactor init my-project\n  /reactor run my-project\n  /reactor status\n  /reactor shutdown';
      return;
    }

    const { iterateFullStream } = await import('../stream-utils.js');
    const { mastra } = await import('../mastra/index.js');
    const agent = mastra.getAgentById('reactor-package-dev-agent');
    const stream = await agent.stream(instruction, { maxSteps: 200 });

    yield* iterateFullStream(stream.fullStream);
  },
};

const commands: CommandDef[] = [hello, weather, reactor];

export function getCommand(name: string): CommandDef | undefined {
  return commands.find((c) => c.name === name);
}

export function getAllCommands(): CommandDef[] {
  return commands;
}
