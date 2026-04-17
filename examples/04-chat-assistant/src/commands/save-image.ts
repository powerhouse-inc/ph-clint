import { defineCommand } from '../framework.js';
import { z } from 'zod';
import { writeFile, mkdir } from 'fs/promises';
import { join, basename } from 'path';

export const saveImage = defineCommand({
  id: 'save-image',
  description:
    'Download an image from a URL and save it to the workspace images/ directory. Returns the local file path.',
  inputSchema: z.object({
    url: z.string().url().describe('URL of the image to download'),
    name: z
      .string()
      .optional()
      .describe('Filename to save as (defaults to URL basename)'),
  }),
  execute: async (input, context) => {
    const imagesDir = join(context.workdir, 'images');
    await mkdir(imagesDir, { recursive: true });

    // Derive filename from the provided name or the URL basename
    const urlPath = new URL(input.url).pathname;
    let filename = input.name ?? basename(urlPath) ?? 'image';
    // Ensure it has an extension
    if (!/\.\w+$/.test(filename)) filename += '.png';

    const filePath = join(imagesDir, filename);

    const res = await fetch(input.url);
    if (!res.ok) {
      throw new Error(`Failed to download image: ${res.status} ${res.statusText}`);
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    await writeFile(filePath, buffer);

    return {
      text: `Saved ${filename} (${buffer.length} bytes) to ${filePath}`,
      data: { path: filePath, filename, size: buffer.length },
    };
  },
});
