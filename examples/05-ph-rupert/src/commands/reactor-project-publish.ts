import { defineCommand } from '../framework.js';
import { z } from 'zod';
import { DEFAULT_REGISTRY_URL} from '@powerhousedao/shared/clis';
import { checkNpmAuth, npmPublish, resolveRegistryUrl } from '@powerhousedao/shared/registry';
import path from 'node:path';
import fs from 'node:fs';
import { runBuild } from './reactor-project-build.js';

const publishInputSchema = z.object({
  name: z.string().optional().describe('Project directory name (relative to workdir).'),
  version: z.string().optional().describe("Package version to set before publishing (e.g. '1.2.3'). Updates package.json in place."),
  registry: z.url().optional().describe(`Registry URL to publish to.`),
  tag: z.string().optional().describe('npm dist-tag to publish under (e.g. "dev", "next").'),
  skipBuild: z.boolean().optional().describe('Skip the build step before publishing.'),
  dryRun: z.boolean().optional().describe('Perform a dry run without actually publishing.'),
  log: z.boolean().optional().describe('Whether to log output to the console. Defaults to false.'),
});

export const reactorProjectPublish = defineCommand({
  id: 'reactor-project-publish',
  description: `Build and publish a Reactor Package to the npm registry.

This command:
1. Optionally updates the version in package.json
2. Runs \`reactor-project-build\` — uses tsdown to produce Node.js and browser bundles so the package can be loaded in both Connect (browser) and Switchboard (Node.js) instances
3. Resolves the registry URL (--registry flag > PH_REGISTRY_URL env > powerhouse.config.json > default)
4. Checks authentication with the registry
5. Runs npm publish

Prerequisites: You must be authenticated with the npm registry.
Run \`npm adduser --registry <url>\` to create an account with a username, password, and email.`,
  inputSchema: publishInputSchema,
  execute: async ({ name, version, registry, tag, skipBuild, dryRun, log }, { workdir, stdout }) => {
    const projectPath = name ? path.join(workdir, name) : workdir;
    const packageJsonPath = path.join(projectPath, 'package.json');

    if (!fs.existsSync(projectPath)) {
      return {
        text: `**Error:** Project directory \`${projectPath}\` does not exist.`,
      };
    }

    if (!fs.existsSync(path.join(projectPath, 'powerhouse.config.json'))) {
      return {
        text: `**Error:** \`${projectPath}\` is not a Powerhouse project (missing powerhouse.config.json).`,
      };
    }

    if (!fs.existsSync(packageJsonPath)) {
      return {
        text: `**Error:** No package.json found in \`${projectPath}\`. Ensure this is a valid npm package.`,
      };
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8')) as { name?: string; version?: string };

    if (version) {
      packageJson.version = version;
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
    }

    const registryUrl = resolveRegistryUrl({
      registry,
      projectPath,
    });


    if (!skipBuild) {
      const buildResult = await runBuild(projectPath, (stdoutChunk) => {
        if (log) {
          stdout(stdoutChunk);
        }
      });
      if (!buildResult.success) {
        return {
          text: `**Build failed** (exit code ${buildResult.exitCode}). Publish aborted.`,
        };
      }
    }

    let username: string;
    try {
      username = await checkNpmAuth(registryUrl);
    } catch {
      return {
        text: [`**Not authenticated** with registry \`${registryUrl}\``, '', 'Run the following to authenticate:', '```', `npm adduser --registry ${registryUrl}`, '```'].join('\n'),
      };
    }
    const extraArgs: string[] = [];
    if (tag) extraArgs.push('--tag', tag);
    if (dryRun) extraArgs.push('--dry-run');

    try {
      const result = await npmPublish({
        registryUrl,
        cwd: projectPath,
        args: extraArgs,
      });

      const lines = [
        dryRun ? '**Dry run complete**' : '**Published successfully**',
        '',
        `| Field | Value |`,
        `|-------|-------|`,
        packageJson.name ? `| Package | \`${packageJson.name}\` |` : null,
        packageJson.version ? `| Version | \`${packageJson.version}\` |` : null,
        `| Registry | \`${registryUrl}\` |`,
        `| User | \`${username}\` |`,
        tag ? `| Tag | \`${tag}\` |` : null,
        dryRun ? `| Mode | dry-run |` : null,
      ].filter((l) => l !== null);

      const output = result.stdout.trim();
      if (output && log) {
        stdout(output);
      }

      return { text: lines.join('\n') };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        text: ['**Publish failed**', '', `Registry: \`${registryUrl}\``, '', '```', message, '```'].join('\n'),
      };
    }
  },
});
