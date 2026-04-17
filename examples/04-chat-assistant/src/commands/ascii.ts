import { defineCommand } from '../framework.js';
import { z } from 'zod';
import asciify from 'asciify-image';

export const ascii = defineCommand({
  id: 'ascii',
  description: 'Convert an image to ASCII art. Accepts a URL or local file path.',
  inputSchema: z.object({
    image: z.string().describe('URL or local file path of the image to convert'),
    width: z.coerce.number().default(60).describe('Width in characters'),
    height: z.coerce.number().default(30).describe('Height in characters'),
    fit: z
      .enum(['box', 'width', 'height', 'original', 'none'])
      .default('box')
      .describe('How to fit the image: box, width, height, original, none'),
  }),
  execute: async (input) => {
    const art = await asciify(input.image, {
      fit: input.fit,
      width: input.width,
      height: input.height,
    });
    return { text: art, data: { width: input.width, height: input.height } };
  },
});
