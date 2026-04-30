import fs from 'node:fs';
import path from 'node:path';
import { downloadImage } from './image.js';

export interface BuildManifestOptions {
  /** Source directory containing powerhouse.manifest.json. Default: cwd */
  srcDir?: string;
  /** Output directory. Default: {srcDir}/dist */
  outDir?: string;
}

export interface BuildManifestResult {
  /** Path to the written manifest file */
  manifestPath: string;
  /** Whether an image was downloaded */
  imageDownloaded: boolean;
}

/**
 * Copy powerhouse.manifest.json to outDir, downloading the agent image
 * if it's a URL (replacing with a relative local path).
 */
export async function buildManifest(
  options?: BuildManifestOptions,
): Promise<BuildManifestResult> {
  const srcDir = path.resolve(options?.srcDir ?? process.cwd());
  const outDir = path.resolve(options?.outDir ?? path.join(srcDir, 'dist'));

  const srcManifest = path.join(srcDir, 'powerhouse.manifest.json');
  if (!fs.existsSync(srcManifest)) {
    throw new Error(`No powerhouse.manifest.json found in ${srcDir}`);
  }

  const raw = fs.readFileSync(srcManifest, 'utf-8');
  const manifest = JSON.parse(raw);

  let imageDownloaded = false;
  const imageUrl = manifest.features?.agent?.image;

  if (imageUrl && typeof imageUrl === 'string' && /^https?:\/\//.test(imageUrl)) {
    const agentId = manifest.features?.agent?.id ?? 'agent';
    try {
      const { filename } = await downloadImage(imageUrl, outDir, agentId);
      manifest.features.agent.image = `./${filename}`;
      imageDownloaded = true;
    } catch (err) {
      console.warn(
        `Warning: failed to download agent image: ${err instanceof Error ? err.message : err}`,
      );
      // Keep original URL
    }
  }

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const manifestPath = path.join(outDir, 'powerhouse.manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

  return { manifestPath, imageDownloaded };
}

// CLI entrypoint
// Resolve process.argv[1] via realpathSync so symlinked paths (pnpm .bin stubs)
// match import.meta.filename which always resolves symlinks.
if (
  process.argv[1] &&
  import.meta.filename === fs.realpathSync(path.resolve(process.argv[1]))
) {
  buildManifest().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
