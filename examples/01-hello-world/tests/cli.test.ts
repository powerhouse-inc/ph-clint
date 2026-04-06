import { describe, it, expect } from '@jest/globals';
import { defineCli } from 'ph-clint';
import { greet } from '../src/commands/greet.js';

describe('hello CLI', () => {
  const cli = defineCli({
    name: 'hello',
    version: '1.0.0',
    description: 'A minimal ph-clint example',
    commands: [greet],
  });

  describe('definition', () => {
    it('has the correct name', () => {
      expect(cli.name).toBe('hello');
    });

    it('has the correct version', () => {
      expect(cli.version).toBe('1.0.0');
    });

    it('registers the greet command', () => {
      expect(cli.getCommand('greet')).toBeDefined();
      expect(cli.getCommand('greet')!.id).toBe('greet');
    });

    it('returns undefined for unknown commands', () => {
      expect(cli.getCommand('nonexistent')).toBeUndefined();
    });

    it('lists all registered commands', () => {
      const commands = cli.listCommands();
      expect(commands).toHaveLength(1);
      expect(commands[0]!.id).toBe('greet');
    });
  });

  describe('command execution', () => {
    it('executes greet with valid args', async () => {
      const result = await cli.execute('greet', { name: 'Alice' });
      expect(result).toBe('Hello, Alice!');
    });

    it('executes greet with loud flag', async () => {
      const result = await cli.execute('greet', { name: 'Alice', loud: true });
      expect(result).toBe('HELLO, ALICE!');
    });

    it('applies defaults when executing', async () => {
      const result = await cli.execute('greet', { name: 'Bob' });
      expect(result).toBe('Hello, Bob!');
    });

    it('throws on missing required args', async () => {
      await expect(cli.execute('greet', {})).rejects.toThrow();
    });

    it('throws on unknown command', async () => {
      await expect(cli.execute('nonexistent', {})).rejects.toThrow();
    });
  });

  describe('help generation', () => {
    it('generates top-level help with command list', () => {
      const help = cli.generateHelp();
      expect(help).toContain('hello');
      expect(help).toContain('1.0.0');
      expect(help).toContain('greet');
      expect(help).toContain('Greet someone by name');
    });

    it('generates command-level help with argument details', () => {
      const help = cli.generateCommandHelp('greet');
      expect(help).toContain('greet');
      expect(help).toContain('--name');
      expect(help).toContain('Name of the person to greet');
      expect(help).toContain('--loud');
      expect(help).toContain('Shout the greeting');
      expect(help).toContain('default: false');
    });
  });

  describe('arg parsing', () => {
    it('parses --name Alice', () => {
      const parsed = cli.parseArgs('greet', ['--name', 'Alice']);
      expect(parsed).toEqual({ name: 'Alice', loud: false });
    });

    it('parses --name Alice --loud', () => {
      const parsed = cli.parseArgs('greet', ['--name', 'Alice', '--loud']);
      expect(parsed).toEqual({ name: 'Alice', loud: true });
    });

    it('parses --loud --name Alice (flag order independent)', () => {
      const parsed = cli.parseArgs('greet', ['--loud', '--name', 'Alice']);
      expect(parsed).toEqual({ name: 'Alice', loud: true });
    });

    it('throws on missing required --name', () => {
      expect(() => cli.parseArgs('greet', [])).toThrow();
    });

    it('throws on unknown flags', () => {
      expect(() => cli.parseArgs('greet', ['--name', 'Alice', '--unknown'])).toThrow();
    });
  });

  describe('completion', () => {
    it('generates a shell completion script', () => {
      const script = cli.generateCompletion('bash');
      expect(script).toContain('hello');
      expect(script).toContain('greet');
    });
  });
});
