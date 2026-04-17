/**
 * Reactor builder — lazy-loads @powerhousedao/reactor and creates
 * a ReactorClientModule with persistent PGlite storage.
 */

import type { DocumentModelModule } from 'document-model';
import type { ReactorClientModule } from './types.js';

/** Structural type for the @powerhousedao/reactor ReactorBuilder (fluent API). */
interface ReactorBuilderLike {
  withDocumentModels(m: DocumentModelModule[]): ReactorBuilderLike;
  withKysely(k: unknown): ReactorBuilderLike;
  withChannelScheme(s: unknown): ReactorBuilderLike;
}

export interface BuildReactorOptions {
  /** Document model modules to register. */
  documentModels: DocumentModelModule[];
  /** Absolute path to the persistent PGlite directory. */
  storagePath: string;
  /** Enable Switchboard sync channel scheme (required for Phase 2). */
  enableSync?: boolean;
}

/**
 * Dynamically import a module, wrapping the import() to prevent
 * TypeScript from resolving peer dependency types at compile time.
 */
async function lazyImport<T = Record<string, unknown>>(
  specifier: string,
): Promise<T> {
  return import(/* webpackIgnore: true */ specifier) as Promise<T>;
}

/**
 * Build a ReactorClientModule with persistent PGlite storage.
 *
 * All imports are lazy — @powerhousedao/reactor and @electric-sql/pglite
 * are optional peer dependencies.
 *
 * PGlite opens an existing database if the directory exists, or creates
 * a new one if it doesn't. This makes the Reactor persistent across
 * CLI restarts — same path, same data.
 */
export async function buildReactor(
  options: BuildReactorOptions,
): Promise<ReactorClientModule> {
  // Ensure the storage directory exists
  const { mkdir } = await import('node:fs/promises');
  await mkdir(options.storagePath, { recursive: true });

  const reactor = await lazyImport<Record<string, unknown>>(
    '@powerhousedao/reactor',
  );
  const pgliteMod = await lazyImport<Record<string, unknown>>(
    '@electric-sql/pglite',
  );
  const kyselyMod = await lazyImport<Record<string, unknown>>('kysely');
  const dialectMod = await lazyImport<Record<string, unknown>>(
    'kysely-pglite-dialect',
  );

  // Base document models (always needed for drives and document-model)
  const sharedMod = await lazyImport<Record<string, unknown>>(
    '@powerhousedao/shared/document-drive',
  );
  const docModelMod = await lazyImport<Record<string, unknown>>(
    'document-model',
  );

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- dynamic peer dep
  const ReactorBuilder = reactor.ReactorBuilder as new () => ReactorBuilderLike;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- dynamic peer dep
  const ReactorClientBuilder = reactor.ReactorClientBuilder as new () => {
    withReactorBuilder(r: unknown): { buildModule(): Promise<ReactorClientModule> };
  };
  const ChannelScheme = reactor.ChannelScheme as { SWITCHBOARD: unknown };
  const PGlite = pgliteMod.PGlite as new (path: string) => unknown;
  const Kysely = kyselyMod.Kysely as new (opts: { dialect: unknown }) => unknown;
  const PGliteDialect = dialectMod.PGliteDialect as new (
    pglite: unknown,
  ) => unknown;
  const driveDocumentModelModule =
    sharedMod.driveDocumentModelModule as DocumentModelModule;
  const documentModelDocumentModelModule =
    docModelMod.documentModelDocumentModelModule as DocumentModelModule;

  const pglite = new PGlite(options.storagePath);
  const kysely = new Kysely({ dialect: new PGliteDialect(pglite) });

  const reactorBuilder = new ReactorBuilder()
    .withDocumentModels([
      documentModelDocumentModelModule,
      driveDocumentModelModule,
      ...options.documentModels,
    ])
    .withKysely(kysely);

  // Enable sync channel scheme when Switchboard will wrap this Reactor.
  // This populates reactorModule.syncModule.syncManager which Switchboard requires.
  if (options.enableSync) {
    reactorBuilder.withChannelScheme(ChannelScheme.SWITCHBOARD);
  }

  const module = await new ReactorClientBuilder()
    .withReactorBuilder(reactorBuilder)
    .buildModule();

  return module;
}
