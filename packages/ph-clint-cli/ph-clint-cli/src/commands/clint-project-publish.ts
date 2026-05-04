import path from 'node:path';
import { defineCommand } from '../framework.js';
import { z } from 'zod';
import {
  resolvePublishPlan,
  buildPackages,
  publishPackages,
  type PublishPlan,
} from '@powerhousedao/ph-clint-dev/publish';

const inputSchema = z.object({
  tag: z.enum(['dev', 'staging', 'production']).describe('Release channel'),
  dir: z.string().optional().describe('Project root directory'),
  dryRun: z.boolean().default(false).describe('Preview without publishing'),
  skipBuild: z.boolean().default(false),
  skipGitCheck: z.boolean().default(false).describe('Skip git working tree check'),
  verbose: z.boolean().default(false),
});

function formatPlanPreview(plan: PublishPlan): string {
  const lines: string[] = [];
  const distTag = plan.tag === 'production' ? 'latest' : plan.tag;
  lines.push(`Publish plan:`);
  lines.push(`  Group:    ${plan.groupName}`);
  lines.push(`  Version:  ${plan.version}`);
  lines.push(`  Tag:      ${distTag}`);
  lines.push(`  Registry: ${plan.registry}`);
  lines.push(`  Packages:`);
  for (const pkg of plan.packages) {
    lines.push(`    - ${pkg.name}`);
  }
  return lines.join('\n');
}

export const clintProjectPublish = defineCommand({
  id: 'clint-project-publish',
  description: 'Publish project packages to npm',
  inputSchema,
  execute: async (input, { workdir, stdout }) => {
    const dir = path.resolve(input.dir ?? workdir);

    const logLines: string[] = [];
    const log = (msg: string) => {
      logLines.push(msg);
      stdout(msg + '\n');
    };

    // 1. Resolve plan — discover config from the target dir, not process.cwd().
    const configFile = path.join(dir, 'publish.config.js');
    const plan = await resolvePublishPlan({
      tag: input.tag,
      configPath: configFile,
      skipGitCheck: input.dryRun || input.skipGitCheck,
      log,
    });

    // 2. Show preview
    stdout(formatPlanPreview(plan) + '\n');

    // 3. Build
    if (!input.skipBuild) {
      await buildPackages(plan, { verbose: input.verbose, log });
    }

    // 4. Publish (or dry-run)
    const result = await publishPackages(plan, {
      dryRun: input.dryRun,
      verbose: input.verbose,
      log,
    });

    if (result.success) {
      return {
        text: result.dryRun
          ? `Dry run complete — ${plan.packages.length} packages validated at ${result.version}.`
          : `Published ${result.published.length} packages at ${result.version}.`,
        data: result,
      };
    } else {
      return {
        text: `Publish failed. Published: ${result.published.length}, Failed: ${result.failed.length}.`,
        data: result,
      };
    }
  },
});
