#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { publish, bump } from './publish/index.js';
import type { PublishTag } from './publish/types.js';

const VALID_TAGS = ['dev', 'staging', 'production'] as const;

function printUsage(): void {
  console.log(`Usage: ph-publish <tag> [options]
       ph-publish bump <version> [options]

Tags: dev, staging, production

Options:
  -g, --group <name>       Named group to publish
  -c, --config <path>      Path to publish.config.ts
  -r, --registry <url>     npm registry URL
  -b, --base-version <ver> Set new base version before publishing
  -n, --dry-run            Build but skip actual publish
  --skip-build             Skip the build step
  --skip-git-check         Skip clean working tree check
  --force                  Downgrade validation errors to warnings
  --allow-private          Allow publishing packages marked private
  -v, --verbose            Show build and publish output
  -h, --help               Show this help`);
}

async function main(): Promise<void> {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      group: { type: 'string', short: 'g' },
      config: { type: 'string', short: 'c' },
      registry: { type: 'string', short: 'r' },
      'base-version': { type: 'string', short: 'b' },
      'dry-run': { type: 'boolean', short: 'n' },
      'skip-build': { type: 'boolean' },
      'skip-git-check': { type: 'boolean' },
      'allow-private': { type: 'boolean' },
      force: { type: 'boolean' },
      verbose: { type: 'boolean', short: 'v' },
      help: { type: 'boolean', short: 'h' },
    },
  });

  if (values.help) {
    printUsage();
    process.exit(0);
  }

  const command = positionals[0];

  if (!command) {
    printUsage();
    process.exit(1);
  }

  // Handle bump subcommand
  if (command === 'bump') {
    const version = positionals[1];
    if (!version) {
      console.error('Error: bump requires a version argument');
      process.exit(1);
    }
    await bump({
      version,
      group: values.group,
      configPath: values.config,
      force: values.force,
    });
    return;
  }

  // Validate tag
  if (!VALID_TAGS.includes(command as PublishTag)) {
    console.error(`Error: invalid tag "${command}". Must be one of: ${VALID_TAGS.join(', ')}`);
    process.exit(1);
  }

  await publish({
    tag: command as PublishTag,
    group: values.group,
    configPath: values.config,
    registry: values.registry,
    baseVersion: values['base-version'],
    dryRun: values['dry-run'],
    skipBuild: values['skip-build'],
    skipGitCheck: values['skip-git-check'],
    allowPrivate: values['allow-private'],
    force: values.force,
    verbose: values.verbose,
  });
}

main().catch((err) => {
  console.error(`Error: ${err instanceof Error ? err.message : err}`);
  process.exit(1);
});
