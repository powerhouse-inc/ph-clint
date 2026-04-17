import { defineTrigger } from './framework.js';
import { stat } from 'node:fs/promises';
import { join } from 'node:path';
import { readdir } from 'node:fs/promises';

async function getLatestMtime(dir: string): Promise<number> {
  try {
    const entries = await readdir(dir, { recursive: true });
    let latest = 0;
    for (const entry of entries) {
      const s = await stat(join(dir, entry));
      if (s.mtimeMs > latest) latest = s.mtimeMs;
    }
    return latest;
  } catch {
    return 0;
  }
}

export const fileChangeTrigger = defineTrigger({
  id: 'file-change',
  type: 'condition',
  setup: async (context) => {
    context.state.lastModified = Date.now();
  },
  teardown: async (context) => {
    context.state.lastModified = 0;
  },
  poll: async (context) => {
    const { watchDir } = context.context.config;
    const current = await getLatestMtime(watchDir);

    if (current > (context.state.lastModified as number)) {
      context.state.lastModified = current;
      return {
        type: 'command' as const,
        params: { commandId: 'build', args: {} },
        callbacks: {
          onSuccess: () => context.context.emit?.('build:complete'),
          onFailure: (err: Error) => context.context.emit?.('build:failed', err),
        },
      };
    }
    return null;
  },
});
