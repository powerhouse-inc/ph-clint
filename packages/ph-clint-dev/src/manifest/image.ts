import fs from 'node:fs';
import path from 'node:path';

const CONTENT_TYPE_MAP: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/svg+xml': '.svg',
  'image/webp': '.webp',
};

export interface DownloadResult {
  localPath: string;
  filename: string;
}

/**
 * Download an image from a URL to destDir.
 * Extension is derived from Content-Type, URL path, or defaults to .png.
 */
export async function downloadImage(
  url: string,
  destDir: string,
  agentId: string,
): Promise<DownloadResult> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get('content-type') ?? '';
  let ext = CONTENT_TYPE_MAP[contentType.split(';')[0].trim()];

  if (!ext) {
    // Fallback: extract extension from URL path
    const urlPath = new URL(url).pathname;
    const urlExt = path.extname(urlPath);
    ext = urlExt && ['.png', '.jpg', '.jpeg', '.svg', '.webp'].includes(urlExt.toLowerCase())
      ? urlExt.toLowerCase()
      : '.png';
    if (ext === '.jpeg') ext = '.jpg';
  }

  const filename = `${agentId}${ext}`;
  const localPath = path.join(destDir, filename);

  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(localPath, buffer);

  return { localPath, filename };
}
