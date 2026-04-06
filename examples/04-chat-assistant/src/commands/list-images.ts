import { defineCommand } from 'ph-clint';
import { z } from 'zod';
import { readdir, stat } from 'fs/promises';
import { join } from 'path';

const IMAGE_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.svg', '.tiff', '.ico',
]);

export const listImages = defineCommand({
  id: 'list-images',
  description:
    'List images saved in the workspace images/ directory. Returns filenames and paths that can be passed to the ascii command.',
  inputSchema: z.object({}),
  execute: async (_input, context) => {
    const imagesDir = join(context.workspace.basePath, 'images');

    let entries: string[];
    try {
      entries = await readdir(imagesDir);
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        return { text: 'No images saved yet. Use save-image to download one.', data: { images: [] } };
      }
      throw err;
    }

    const images: Array<{ name: string; path: string; size: number }> = [];
    for (const entry of entries) {
      const ext = entry.slice(entry.lastIndexOf('.')).toLowerCase();
      if (!IMAGE_EXTENSIONS.has(ext)) continue;
      const filePath = join(imagesDir, entry);
      const info = await stat(filePath);
      if (info.isFile()) {
        images.push({ name: entry, path: filePath, size: info.size });
      }
    }

    if (images.length === 0) {
      return { text: 'No images saved yet. Use save-image to download one.', data: { images: [] } };
    }

    const listing = images
      .map((img) => `  ${img.name} (${img.size} bytes) → ${img.path}`)
      .join('\n');
    return {
      text: `Workspace images:\n${listing}`,
      data: { images },
    };
  },
});
