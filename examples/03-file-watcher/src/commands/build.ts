import { defineCommand } from '../framework.js';
import { z } from 'zod';

export const build = defineCommand({
  id: 'build',
  description: 'Run the build command',
  inputSchema: z.object({}),
  execute: async (_, { config, processes }) => {
    const result = await processes!.run(config.buildCommand, {
      label: 'build',
      timeout: 60_000,
    });
    return { text: result.success ? 'Build succeeded' : 'Build failed' };
  },
});
