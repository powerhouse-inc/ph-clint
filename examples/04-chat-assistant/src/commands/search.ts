import { defineCommand } from 'ph-clint';
import { z } from 'zod';

export const search = defineCommand({
  id: 'search',
  description: 'Search the web for information',
  inputSchema: z.object({
    query: z.string().describe('Search query'),
    limit: z.number().default(5).describe('Max results'),
  }),
  execute: async ({ query, limit }) => {
    // Stubbed — in a real CLI this would call a search API
    const results = Array.from({ length: limit }, (_, i) => ({
      title: `Result ${i + 1} for "${query}"`,
      url: `https://example.com/${i + 1}`,
    }));
    return {
      text: results.map((r) => `- [${r.title}](${r.url})`).join('\n'),
      data: results,
    };
  },
});
