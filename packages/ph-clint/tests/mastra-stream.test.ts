import { describe, it, expect } from '@jest/globals';
import { mapMastraStream } from '../src/integrations/mastra/stream.js';
import type { StreamChunk } from '../src/core/types.js';

async function collect(gen: AsyncGenerator<StreamChunk>): Promise<StreamChunk[]> {
  const chunks: StreamChunk[] = [];
  for await (const c of gen) chunks.push(c);
  return chunks;
}

function fakeStream(items: Array<{ type: string; [key: string]: unknown }>) {
  return (async function* () {
    for (const item of items) yield item;
  })();
}

describe('mapMastraStream', () => {
  it('maps text-delta (direct format)', async () => {
    const chunks = await collect(
      mapMastraStream(fakeStream([{ type: 'text-delta', textDelta: 'hello' }])),
    );
    expect(chunks).toEqual([{ type: 'text-delta', text: 'hello' }]);
  });

  it('maps text-delta (payload format from Memory)', async () => {
    const chunks = await collect(
      mapMastraStream(fakeStream([{ type: 'text-delta', payload: { text: 'world' } }])),
    );
    expect(chunks).toEqual([{ type: 'text-delta', text: 'world' }]);
  });

  it('prefers payload over direct properties', async () => {
    const chunks = await collect(
      mapMastraStream(fakeStream([{
        type: 'text-delta',
        textDelta: 'direct',
        payload: { text: 'payload' },
      }])),
    );
    expect(chunks).toEqual([{ type: 'text-delta', text: 'payload' }]);
  });

  it('maps tool-call', async () => {
    const chunks = await collect(
      mapMastraStream(fakeStream([{
        type: 'tool-call',
        toolName: 'ascii',
        args: { image: 'test.png' },
      }])),
    );
    expect(chunks).toEqual([{
      type: 'tool-call',
      toolName: 'ascii',
      args: { image: 'test.png' },
    }]);
  });

  it('maps tool-call (payload format)', async () => {
    const chunks = await collect(
      mapMastraStream(fakeStream([{
        type: 'tool-call',
        payload: { toolName: 'save-image', args: { url: 'http://x' } },
      }])),
    );
    expect(chunks).toEqual([{
      type: 'tool-call',
      toolName: 'save-image',
      args: { url: 'http://x' },
    }]);
  });

  it('maps tool-result', async () => {
    const chunks = await collect(
      mapMastraStream(fakeStream([{
        type: 'tool-result',
        toolName: 'ascii',
        result: 'art',
        isError: false,
      }])),
    );
    expect(chunks).toEqual([{
      type: 'tool-result',
      toolName: 'ascii',
      result: 'art',
      isError: false,
    }]);
  });

  it('maps tool-result with error', async () => {
    const chunks = await collect(
      mapMastraStream(fakeStream([{
        type: 'tool-result',
        payload: { toolName: 'ascii', result: 'fail', isError: true },
      }])),
    );
    expect(chunks).toEqual([{
      type: 'tool-result',
      toolName: 'ascii',
      result: 'fail',
      isError: true,
    }]);
  });

  it('maps error chunks', async () => {
    const chunks = await collect(
      mapMastraStream(fakeStream([{ type: 'error', error: 'something broke' }])),
    );
    expect(chunks).toEqual([{ type: 'error', error: 'something broke' }]);
  });

  it('ignores unknown chunk types', async () => {
    const chunks = await collect(
      mapMastraStream(fakeStream([
        { type: 'step-finish' },
        { type: 'text-delta', textDelta: 'hi' },
        { type: 'finish' },
      ])),
    );
    expect(chunks).toEqual([{ type: 'text-delta', text: 'hi' }]);
  });

  it('handles empty stream', async () => {
    const chunks = await collect(mapMastraStream(fakeStream([])));
    expect(chunks).toEqual([]);
  });

  it('handles missing fields gracefully', async () => {
    const chunks = await collect(
      mapMastraStream(fakeStream([
        { type: 'text-delta' },
        { type: 'tool-call' },
        { type: 'tool-result' },
      ])),
    );
    expect(chunks).toEqual([
      { type: 'text-delta', text: '' },
      { type: 'tool-call', toolName: '', args: {} },
      { type: 'tool-result', toolName: '', result: null, isError: false },
    ]);
  });
});
