#!/usr/bin/env node
import path from 'node:path';
import { buildSkills } from './build-skills.js';
import type { BuildConfig } from './types.js';

async function main() {
  const configPath = path.resolve(process.cwd(), 'build-skills.config.ts');

  let config: BuildConfig;
  try {
    const mod = await import(configPath);
    config = mod.default ?? mod.config ?? mod;
  } catch (err) {
    console.error(`Failed to load config from ${configPath}`);
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  }

  const result = buildSkills(config);

  if (result.warnings.length > 0) {
    process.exit(0); // warnings are informational, not fatal
  }
}

main();
