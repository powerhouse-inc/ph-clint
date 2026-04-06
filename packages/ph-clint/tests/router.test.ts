import { describe, it, expect } from '@jest/globals';
import { parseReplInput, tokenizeArgs } from '../src/interactive/router.js';

describe('parseReplInput', () => {
  const commandIds = ['greet', 'list', 'add', 'done'];

  it('parses empty input', () => {
    expect(parseReplInput('', commandIds)).toEqual({ type: 'empty', raw: '' });
    expect(parseReplInput('   ', commandIds)).toEqual({ type: 'empty', raw: '' });
  });

  it('parses /help', () => {
    expect(parseReplInput('/help', commandIds)).toEqual({ type: 'help', raw: '/help' });
    expect(parseReplInput('/HELP', commandIds)).toEqual({ type: 'help', raw: '/HELP' });
  });

  it('parses /exit and /quit', () => {
    expect(parseReplInput('/exit', commandIds)).toEqual({ type: 'exit', raw: '/exit' });
    expect(parseReplInput('/quit', commandIds)).toEqual({ type: 'exit', raw: '/quit' });
  });

  it('parses a known command without args', () => {
    expect(parseReplInput('/list', commandIds)).toEqual({
      type: 'command',
      commandId: 'list',
      args: [],
      raw: '/list',
    });
  });

  it('parses a known command with args', () => {
    expect(parseReplInput('/greet --name Alice', commandIds)).toEqual({
      type: 'command',
      commandId: 'greet',
      args: ['--name', 'Alice'],
      raw: '/greet --name Alice',
    });
  });

  it('parses a command with quoted args', () => {
    expect(parseReplInput('/add --title "Hello World"', commandIds)).toEqual({
      type: 'command',
      commandId: 'add',
      args: ['--title', 'Hello World'],
      raw: '/add --title "Hello World"',
    });
  });

  it('returns unknown for unrecognized command', () => {
    expect(parseReplInput('/foo', commandIds)).toEqual({
      type: 'unknown',
      commandId: 'foo',
      raw: '/foo',
    });
  });

  it('returns unknown for bare text (no / prefix)', () => {
    expect(parseReplInput('hello world', commandIds)).toEqual({
      type: 'unknown',
      raw: 'hello world',
    });
  });

  it('trims whitespace from input', () => {
    expect(parseReplInput('  /list  ', commandIds)).toEqual({
      type: 'command',
      commandId: 'list',
      args: [],
      raw: '/list',
    });
  });
});

describe('tokenizeArgs', () => {
  it('splits simple args', () => {
    expect(tokenizeArgs('--name Alice')).toEqual(['--name', 'Alice']);
  });

  it('handles double-quoted values', () => {
    expect(tokenizeArgs('--title "Hello World" --priority high')).toEqual([
      '--title',
      'Hello World',
      '--priority',
      'high',
    ]);
  });

  it('handles single-quoted values', () => {
    expect(tokenizeArgs("--title 'Hello World'")).toEqual(['--title', 'Hello World']);
  });

  it('handles empty string', () => {
    expect(tokenizeArgs('')).toEqual([]);
  });

  it('handles multiple spaces between args', () => {
    expect(tokenizeArgs('--name   Alice')).toEqual(['--name', 'Alice']);
  });

  it('handles tabs', () => {
    expect(tokenizeArgs('--name\tAlice')).toEqual(['--name', 'Alice']);
  });
});
