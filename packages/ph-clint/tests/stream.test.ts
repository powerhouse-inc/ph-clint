import { describe, it, expect } from '@jest/globals';
import { formatStreamChunk, renderStream } from '../src/core/stream.js';
import type { StreamChunk } from '../src/core/types.js';

describe('StreamChunk types', () => {
  it('text-delta chunk has text', () => {
    const chunk: StreamChunk = { type: 'text-delta', text: 'hello' };
    expect(chunk.type).toBe('text-delta');
    expect(chunk.text).toBe('hello');
  });

  it('tool-call chunk has toolName and args', () => {
    const chunk: StreamChunk = { type: 'tool-call', toolName: 'search', args: { query: 'test' } };
    expect(chunk.type).toBe('tool-call');
    expect(chunk.toolName).toBe('search');
  });

  it('tool-result chunk has toolName, result, and isError', () => {
    const chunk: StreamChunk = { type: 'tool-result', toolName: 'search', result: [1, 2], isError: false };
    expect(chunk.type).toBe('tool-result');
    expect(chunk.isError).toBe(false);
  });

  it('error chunk has error message', () => {
    const chunk: StreamChunk = { type: 'error', error: 'something failed' };
    expect(chunk.type).toBe('error');
    expect(chunk.error).toBe('something failed');
  });
});

describe('formatStreamChunk', () => {
  it('formats text-delta as plain text', () => {
    const result = formatStreamChunk({ type: 'text-delta', text: 'hello world' });
    expect(result).toBe('hello world');
  });

  it('formats tool-call with arrow and name', () => {
    const result = formatStreamChunk({ type: 'tool-call', toolName: 'search', args: { query: 'test' } });
    expect(result).toContain('▶');
    expect(result).toContain('search');
    expect(result).toContain('test');
  });

  it('formats successful tool-result with checkmark', () => {
    const result = formatStreamChunk({ type: 'tool-result', toolName: 'search', result: '5 results', isError: false });
    expect(result).toContain('✓');
    expect(result).toContain('search');
    expect(result).toContain('5 results');
  });

  it('formats failed tool-result with cross', () => {
    const result = formatStreamChunk({ type: 'tool-result', toolName: 'search', result: 'timeout', isError: true });
    expect(result).toContain('✗');
    expect(result).toContain('search');
    expect(result).toContain('timeout');
  });

  it('formats error chunk', () => {
    const result = formatStreamChunk({ type: 'error', error: 'connection lost' });
    expect(result).toContain('Error');
    expect(result).toContain('connection lost');
  });

  it('truncates long tool-call args', () => {
    const longArgs = { query: 'x'.repeat(200) };
    const result = formatStreamChunk({ type: 'tool-call', toolName: 'search', args: longArgs });
    expect(result.length).toBeLessThan(300);
    expect(result).toContain('…');
  });

  it('truncates long tool-result', () => {
    const longResult = 'x'.repeat(300);
    const result = formatStreamChunk({ type: 'tool-result', toolName: 'search', result: longResult, isError: false });
    expect(result).toContain('…');
  });

  it('formats null/undefined tool-result as ok', () => {
    const result = formatStreamChunk({ type: 'tool-result', toolName: 'ping', result: null, isError: false });
    expect(result).toContain('ok');
  });
});

describe('renderStream', () => {
  async function* makeStream(chunks: StreamChunk[]): AsyncGenerator<StreamChunk> {
    for (const chunk of chunks) yield chunk;
  }

  async function collectStream(stream: AsyncGenerator<string>): Promise<string[]> {
    const parts: string[] = [];
    for await (const part of stream) parts.push(part);
    return parts;
  }

  it('converts stream chunks to formatted strings', async () => {
    const chunks: StreamChunk[] = [
      { type: 'text-delta', text: 'Hello ' },
      { type: 'text-delta', text: 'world' },
    ];
    const parts = await collectStream(renderStream(makeStream(chunks)));
    expect(parts.join('')).toContain('Hello world');
  });

  it('includes tool activity in output', async () => {
    const chunks: StreamChunk[] = [
      { type: 'tool-call', toolName: 'search', args: { q: 'test' } },
      { type: 'tool-result', toolName: 'search', result: '3 results', isError: false },
      { type: 'text-delta', text: 'Based on the search...' },
    ];
    const parts = await collectStream(renderStream(makeStream(chunks)));
    const output = parts.join('');
    expect(output).toContain('▶');
    expect(output).toContain('search');
    expect(output).toContain('✓');
    expect(output).toContain('Based on the search...');
  });

  it('handles empty stream', async () => {
    const parts = await collectStream(renderStream(makeStream([])));
    expect(parts).toHaveLength(0);
  });

  it('handles errors in stream', async () => {
    const chunks: StreamChunk[] = [
      { type: 'text-delta', text: 'Starting...' },
      { type: 'error', error: 'API rate limit' },
    ];
    const parts = await collectStream(renderStream(makeStream(chunks)));
    const output = parts.join('');
    expect(output).toContain('Starting...');
    expect(output).toContain('API rate limit');
  });
});
