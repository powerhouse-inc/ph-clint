import { defineCommand } from '../framework.js';
import { z } from 'zod';
import { checkNpmAuth, npmPublish, resolveRegistryUrl } from '@powerhousedao/shared/registry';
import path from 'node:path';
import fs from 'node:fs';
import { runBuild } from './reactor-project-build.js';
import { spawnAsync } from '@powerhousedao/shared/clis';
import { spawn } from 'node:child_process';

function npmLogin(registryUrl: string, username: string, password: string, email?: string, cwd?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const cmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
      const child = spawn(cmd, ['login', '--registry', registryUrl], {
        cwd,
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      const answers: Record<string, string> = {
        'Username': username,
        'Password': password,
        'Email': email ?? '',
      };

      const handleData = (data: Buffer) => {
        const text = data.toString();
        for (const [prompt, answer] of Object.entries(answers)) {
          if (text.includes(prompt)) {
            child.stdin!.write(answer + '\n');
            return;
          }
        }
      };

      child.stdout.on('data', handleData);
      child.stderr.on('data', handleData);
      child.on('error', reject);
      child.on('close', (code) => {
        code === 0 ? resolve() : reject(new Error(`npm adduser exited with code ${code}`));
      });
    });
}

function npmLogout(registryUrl: string, cwd?: string): Promise<string> {
  return spawnAsync('npm', ['logout', '--registry', registryUrl], {
    cwd,
  });
}

const publishInputSchema = z.object({
  name: z.string().optional().describe('Project directory name (relative to workdir).'),
  version: z.string().optional().describe("Package version to set before publishing (e.g. '1.2.3'). Updates package.json in place."),
  registry: z.url().optional().describe(`Registry URL to publish to.`),
  tag: z.string().optional().describe('npm dist-tag to publish under (e.g. "dev", "next").'),
  skipBuild: z.boolean().optional().describe('Skip the build step before publishing.'),
  dryRun: z.boolean().optional().describe('Perform a dry run without actually publishing.'),
  log: z.boolean().optional().describe('Whether to log output to the console. Defaults to false.'),
  username: z.string().optional().describe('Registry username (overrides config.registryUsername)'),
  password: z.string().optional().describe('Registry password (overrides config.registryPassword)'),
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
Run \`npm login --registry <url>\` to create an account with a username, password, and email.`,
  inputSchema: publishInputSchema,
  execute: async ({ name, version, registry, tag, skipBuild, dryRun, log }, { workdir, config, stdout }) => {
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
      registry: registry || config.registryUrl,
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
    
    let username: string | undefined;
    try {
    
    try {
      username = await checkNpmAuth(registryUrl);
    } catch (error) {
      // not authenticated, will attempt to log in
    }

    // if the user is authenticated but the username doesn't match the one in config,
    // log out to prevent publishing under the wrong account
    if (config.registryUsername && username && username !== config.registryUsername) {
      await npmLogout(registryUrl, projectPath);
      username = undefined;
    }

    if (!username) {
      if (config.registryUsername && config.registryPassword) {
        await npmLogin(registryUrl, config.registryUsername || '', config.registryPassword || '', config.registryEmail, projectPath);
      } else {
        return {
          text: `**Error:** Not authenticated with registry \`${registryUrl}\`. Please provide registryUsername and registryPassword in your config, or run \`npm login --registry ${registryUrl}\` to log in.`,
        };
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      text: ['**Authentication failed**', '', `Registry: \`${registryUrl}\``, '', '```', message, '```'].join('\n'),
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
