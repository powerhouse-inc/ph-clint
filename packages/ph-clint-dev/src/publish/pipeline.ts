import fs from 'node:fs';
import path from 'node:path';
import type {
  PublishConfig,
  PublishGroup,
  PublishOptions,
  PublishPlan,
  PublishResult,
  BumpOptions,
  ResolvedPackage,
} from './types.js';
import {
  loadConfig,
  discoverConfigPath,
  resolveGroup,
  resolvePackagePaths,
} from './config.js';
import {
  computeVersion,
  queryLatestPrerelease,
  validateBump,
  isValidSemver,
} from './version.js';
import { analyzeFileDeps, resolveAllFileDeps } from './deps.js';
import {
  backupPackageJson,
  rewritePackageJson,
  restorePackageJson,
  restoreFileDepPaths,
  removeBackup,
} from './rewrite.js';
import { buildAll } from './build.js';
import {
  checkNpmAuth,
  verifyVersionOnRegistry,
  verifyWithRetry,
  verifyAllPublished,
  packDryRun,
  publishAll,
} from './npm.js';
import { checkCleanWorkingTree } from './git.js';

/**
 * Phase 1+2: Load config, validate packages, run pre-flight checks, and
 * compute the version. Returns a plan that can be passed to buildPackages()
 * and publishPackages().
 */
export async function resolvePublishPlan(options: PublishOptions): Promise<PublishPlan> {
  const log = options.log ?? ((msg: string) => console.log(msg));

  // ── 1. LOAD & VALIDATE ──
  log('Loading config...');
  const configPath =
    options.configPath ?? discoverConfigPath(process.cwd());
  if (!configPath) {
    throw new Error(
      'No publish.config.js found. Specify one with --config.',
    );
  }

  const { config, configDir } = await loadConfig(configPath);
  const { name: groupName, group } = resolveGroup(config, options.group);
  log(`Group: ${groupName}`);

  const registry =
    options.registry ?? group.registry ?? 'https://registry.npmjs.org';

  // Handle --base-version (bump before publish)
  if (options.baseVersion) {
    const issues = validateBump(group.version, options.baseVersion);
    if (issues.length > 0) {
      if (options.force) {
        for (const issue of issues) log(`  ⚠ ${issue} (forced)`);
      } else {
        throw new Error(
          `Version validation failed:\n${issues.map((i) => `  - ${i}`).join('\n')}`,
        );
      }
    }
    group.version = options.baseVersion;
    await persistBaseVersion(configPath, groupName, options.baseVersion);
    log(`Base version updated to ${options.baseVersion}`);
  }

  // Resolve package paths
  const absPaths = resolvePackagePaths(group, configDir);

  // Load package.json files and analyze deps
  let packages: ResolvedPackage[] = group.packages.map((entry, i) => {
    const absPath = absPaths[i];
    const pkgJsonPath = path.join(absPath, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
    const name = packageJson.name as string;
    if (!name) {
      throw new Error(`No "name" in ${pkgJsonPath}`);
    }
    if (packageJson.private && !options.allowPrivate) {
      throw new Error(
        `Package "${name}" is marked private. Remove "private": true from ${pkgJsonPath}, ` +
          `or use --allow-private to publish anyway.`,
      );
    }
    if (!packageJson.files) {
      throw new Error(
        `Package "${name}" has no "files" field in ${pkgJsonPath}. ` +
          `Add a "files" array (e.g. ["dist"]) to control what gets published. ` +
          `Without it, npm publishes everything not in .gitignore.`,
      );
    }
    const fileDeps = analyzeFileDeps(absPath, packageJson, absPaths);
    return { entry, absPath, packageJson, name, fileDeps };
  });

  // ── 2. PRE-FLIGHT ──
  log('Pre-flight checks...');

  if (!options.skipGitCheck) {
    await checkCleanWorkingTree();
  }

  await checkNpmAuth(registry);

  // Resolve version
  let computedVer: string;
  if (options.tag === 'production') {
    computedVer = group.version;
  } else {
    // Query first package for latest prerelease number
    const latest = await queryLatestPrerelease(
      packages[0].name,
      group.version,
      options.tag,
      registry,
    );
    computedVer = computeVersion(group.version, options.tag, latest);

    // Partial failure recovery: if some packages are already published at this
    // version but not all, reuse it instead of bumping to the next prerelease.
    if (latest !== null) {
      const currentVer = computeVersion(group.version, options.tag, latest - 1);
      const somePublished = await verifyVersionOnRegistry(
        packages[0].name,
        currentVer,
        registry,
      );
      if (somePublished) {
        const allPublished = await Promise.all(
          packages.map((p) =>
            verifyVersionOnRegistry(p.name, currentVer, registry),
          ),
        );
        if (!allPublished.every(Boolean)) {
          computedVer = currentVer;
          log(`Resuming partial publish at ${computedVer}`);
        }
      }
    }
  }
  log(`Version: ${computedVer}`);

  // Resolve all file: deps
  packages = resolveAllFileDeps(packages, computedVer);

  // Verify external deps exist on registry
  for (const pkg of packages) {
    for (const dep of pkg.fileDeps) {
      if (!dep.intraGroup && dep.publishVersion) {
        const depVersion = dep.publishVersion.replace(/^\^/, '');
        // The registry is a serve-stale-while-revalidating cache: the first
        // read of a lapsed packument returns stale (missing a just-published
        // version) and triggers a background refresh. Retry with backoff so
        // the spacing outlasts that refresh instead of failing the race.
        const exists = await verifyWithRetry(
          dep.name,
          depVersion,
          registry,
          log,
          4,
        );
        if (!exists) {
          throw new Error(
            `External dependency ${dep.name}@${depVersion} not found on registry ${registry}. Publish it first.`,
          );
        }
      }
    }
  }

  return {
    config,
    configPath,
    configDir,
    group,
    groupName,
    packages,
    version: computedVer,
    tag: options.tag,
    registry,
  };
}

/**
 * Phase 3: Build all packages in the plan.
 */
export async function buildPackages(
  plan: PublishPlan,
  options?: { skipBuild?: boolean; verbose?: boolean; verifyConnect?: boolean; log?: (msg: string) => void },
): Promise<void> {
  const log = options?.log ?? ((msg: string) => console.log(msg));

  if (options?.skipBuild) {
    log('Skipping build (--skip-build)');
    return;
  }

  log('Building...');
  await buildAll(plan.packages, options?.verbose ?? false, log, {
    verifyConnect: options?.verifyConnect,
  });
}

/**
 * Phase 4-7: Prepare, validate, publish, and post-publish cleanup.
 */
export async function publishPackages(
  plan: PublishPlan,
  options?: { dryRun?: boolean; verbose?: boolean; verify?: boolean; log?: (msg: string) => void },
): Promise<PublishResult> {
  const log = options?.log ?? ((msg: string) => console.log(msg));
  const { packages, version: computedVer, registry, tag } = plan;

  // ── 4. PREPARE FOR PUBLISH ──
  log('Preparing package.json files...');
  try {
    for (const pkg of packages) {
      backupPackageJson(pkg.absPath);
      rewritePackageJson(pkg, computedVer);
    }

    // ── 5. VALIDATE ──
    log('Validating packages...');
    for (const pkg of packages) {
      await packDryRun(pkg.absPath, options?.verbose ?? false);
      log(`  ✓ ${pkg.name}`);
    }

    if (options?.dryRun) {
      log('\nDry run — restoring package.json files...');
      for (const pkg of packages) {
        restorePackageJson(pkg.absPath);
      }
      log('Done (dry run). No packages were published.\n');
      printSummary(packages, computedVer, registry, tag, true, log);
      return {
        success: true,
        version: computedVer,
        published: [],
        failed: [],
        dryRun: true,
      };
    }

    // ── 6. PUBLISH ALL ──
    log('Publishing...');
    const { published, failed } = await publishAll(
      packages,
      registry,
      tag,
      computedVer,
      options?.verbose ?? false,
      log,
    );

    if (failed.length > 0) {
      // Persist versions and restore file: paths so re-run picks up the same version
      for (const pkg of packages) {
        restoreFileDepPaths(pkg);
        removeBackup(pkg.absPath);
      }
      return {
        success: false,
        version: computedVer,
        published,
        failed,
        dryRun: false,
      };
    }

    // ── 7. POST-PUBLISH ──
    // Keep versions, restore file: paths, remove backups
    for (const pkg of packages) {
      restoreFileDepPaths(pkg);
      removeBackup(pkg.absPath);
    }

    log('');
    printSummary(packages, computedVer, registry, tag, false, log);

    if (options?.verify) {
      log('\nVerifying packages on registry...');
      const { unverified } = await verifyAllPublished(
        published,
        computedVer,
        registry,
        log,
      );
      if (unverified.length > 0) {
        log(`\n${unverified.length} package(s) not yet visible — this is normal for new packages.`);
        log('They will appear on the registry within a few minutes.');
      }
    }

    return {
      success: true,
      version: computedVer,
      published,
      failed: [],
      dryRun: false,
    };
  } catch (err) {
    // Restore on any unexpected error
    for (const pkg of packages) {
      restorePackageJson(pkg.absPath);
    }
    throw err;
  }
}

/**
 * Main publish pipeline — thin orchestrator over the decomposed phases.
 */
export async function publish(options: PublishOptions): Promise<PublishResult> {
  const log = options.log ?? ((msg: string) => console.log(msg));
  const optsWithLog = { ...options, log };

  const plan = await resolvePublishPlan(optsWithLog);

  await buildPackages(plan, {
    skipBuild: options.skipBuild,
    verbose: options.verbose,
    verifyConnect: options.verifyConnect,
    log,
  });

  return publishPackages(plan, {
    dryRun: options.dryRun,
    verbose: options.verbose,
    verify: options.verify,
    log,
  });
}

/**
 * Bump command: update the base version in config without publishing.
 */
export async function bump(options: BumpOptions): Promise<void> {
  const log = options.log ?? ((msg: string) => console.log(msg));

  const configPath =
    options.configPath ?? discoverConfigPath(process.cwd());
  if (!configPath) {
    throw new Error(
      'No publish.config.js found. Specify one with --config.',
    );
  }

  const { config } = await loadConfig(configPath);
  const { name: groupName, group } = resolveGroup(config, options.group);

  if (!isValidSemver(options.version)) {
    throw new Error(`"${options.version}" is not valid semver (expected M.m.p)`);
  }

  const issues = validateBump(group.version, options.version);
  if (issues.length > 0) {
    if (options.force) {
      for (const issue of issues) log(`  ⚠ ${issue} (forced)`);
    } else {
      throw new Error(
        `Version validation failed:\n${issues.map((i) => `  - ${i}`).join('\n')}`,
      );
    }
  }

  await persistBaseVersion(configPath, groupName, options.version);
  log(`Bumped group "${groupName}" from ${group.version} to ${options.version}`);
}

/**
 * Persist a new base version to the config file.
 * Rewrites the version field for the specified group using text replacement
 * to preserve formatting.
 */
async function persistBaseVersion(
  configPath: string,
  groupName: string,
  newVersion: string,
): Promise<void> {
  const content = fs.readFileSync(configPath, 'utf-8');

  // Strategy: find the group block and replace its version field.
  // We look for the pattern: 'groupName': { ... version: '...' ... }
  // or "groupName": { ... version: "..." ... }
  // This is a best-effort text replacement that works for typical configs.
  const groupPattern = new RegExp(
    `(['"]${escapeRegex(groupName)}['"]\\s*:\\s*\\{[^}]*?version\\s*:\\s*)(['"])([^'"]+)\\2`,
  );

  const match = groupPattern.exec(content);
  if (match) {
    const updated =
      content.slice(0, match.index) +
      `${match[1]}${match[2]}${newVersion}${match[2]}` +
      content.slice(match.index + match[0].length);
    fs.writeFileSync(configPath, updated);
    return;
  }

  // Fallback: try without quotes around group name (bare identifier)
  const barePattern = new RegExp(
    `(${escapeRegex(groupName)}\\s*:\\s*\\{[^}]*?version\\s*:\\s*)(['"])([^'"]+)\\2`,
  );
  const bareMatch = barePattern.exec(content);
  if (bareMatch) {
    const updated =
      content.slice(0, bareMatch.index) +
      `${bareMatch[1]}${bareMatch[2]}${newVersion}${bareMatch[2]}` +
      content.slice(bareMatch.index + bareMatch[0].length);
    fs.writeFileSync(configPath, updated);
    return;
  }

  throw new Error(
    `Could not find version field for group "${groupName}" in ${configPath}. ` +
      `Update it manually.`,
  );
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function printSummary(
  packages: ResolvedPackage[],
  version: string,
  registry: string,
  tag: string,
  dryRun: boolean,
  log: (msg: string) => void,
): void {
  const distTag = tag === 'production' ? 'latest' : tag;
  log(`${'─'.repeat(50)}`);
  log(dryRun ? 'DRY RUN SUMMARY' : 'PUBLISH SUMMARY');
  log(`${'─'.repeat(50)}`);
  log(`Version:  ${version}`);
  log(`Tag:      ${distTag}`);
  log(`Registry: ${registry}`);
  log(`Packages:`);
  for (const pkg of packages) {
    log(`  - ${pkg.name}@${version}`);
  }
  log(`${'─'.repeat(50)}`);
}
