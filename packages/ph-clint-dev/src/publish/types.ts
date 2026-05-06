/**
 * Package category determines build strategy.
 * - cli/lib: tsc
 * - app: ph-cli build (Powerhouse reactor package)
 * - fusion: next build
 */
export type PackageCategory = 'cli' | 'app' | 'lib' | 'fusion';

/** A single package to publish. */
export interface PackageEntry {
  /** Path to package dir, relative to config file. */
  path: string;
  /** Determines build strategy. */
  category: PackageCategory;
}

/** A group of packages published together with lockstep versioning. */
export interface PublishGroup {
  /** Base version for this group. Tags derive from this. */
  version: string;
  /** Packages in dependency order (deps before dependents). */
  packages: PackageEntry[];
  /** npm registry URL. Default: https://registry.npmjs.org */
  registry?: string;
}

/** Top-level publish configuration. */
export interface PublishConfig {
  /** Named publish groups. */
  groups: Record<string, PublishGroup>;
}

/** Tag determines version suffix and dist-tag. */
export type PublishTag = 'dev' | 'staging' | 'production';

/** Options passed to the publish pipeline. */
export interface PublishOptions {
  tag: PublishTag;
  group?: string;
  configPath?: string;
  registry?: string;
  baseVersion?: string;
  dryRun?: boolean;
  skipBuild?: boolean;
  skipGitCheck?: boolean;
  force?: boolean;
  verbose?: boolean;
  allowPrivate?: boolean;
  /** Verify packages are visible on the registry after publish (default: false). */
  verify?: boolean;
  /** Error if app packages with Connect are missing dist/connect/index.html after build. */
  verifyConnect?: boolean;
  log?: (msg: string) => void;
}

/** Options for the bump command. */
export interface BumpOptions {
  version: string;
  group?: string;
  configPath?: string;
  force?: boolean;
  log?: (msg: string) => void;
}

/** Resolved info about a file: dependency. */
export interface FileDep {
  /** The dependency name (package name). */
  name: string;
  /** The original file: specifier. */
  originalSpecifier: string;
  /** Absolute path the file: dep resolves to. */
  resolvedPath: string;
  /** Whether this dep is in the same publish group. */
  intraGroup: boolean;
  /** The resolved version to publish with. */
  publishVersion?: string;
  /** Which field: 'dependencies' or 'devDependencies'. */
  field: 'dependencies' | 'devDependencies';
}

/** Info about a package resolved during pipeline execution. */
export interface ResolvedPackage {
  /** Package entry from config. */
  entry: PackageEntry;
  /** Absolute path to the package directory. */
  absPath: string;
  /** Contents of package.json. */
  packageJson: Record<string, unknown>;
  /** Package name from package.json. */
  name: string;
  /** Resolved file: dependencies. */
  fileDeps: FileDep[];
}

/** Resolved plan ready for build + publish execution. */
export interface PublishPlan {
  config: PublishConfig;
  configPath: string;
  configDir: string;
  group: PublishGroup;
  groupName: string;
  packages: ResolvedPackage[];
  version: string;
  tag: PublishTag;
  registry: string;
}

/** Result of a publish pipeline run. */
export interface PublishResult {
  /** Whether the pipeline completed successfully. */
  success: boolean;
  /** The computed version that was (or would be) published. */
  version: string;
  /** Packages that were published (empty for dry-run). */
  published: string[];
  /** Packages that failed to publish. */
  failed: string[];
  /** Whether this was a dry run. */
  dryRun: boolean;
}
