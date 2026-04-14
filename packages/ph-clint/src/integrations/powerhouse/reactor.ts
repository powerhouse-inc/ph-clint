/**
 * Reactor builder — lazy-loads @powerhousedao/reactor and creates
 * a ReactorClientModule with persistent PGlite storage.
 */

export interface BuildReactorOptions {
  /** Document model modules to register. */
  documentModels: any[];
  /** Absolute path to the persistent PGlite directory. */
  storagePath: string;
  /** Enable Switchboard sync channel scheme (required for Phase 2). */
  enableSync?: boolean;
}

/**
 * Dynamically import a module, wrapping the import() to prevent
 * TypeScript from resolving peer dependency types at compile time.
 */
async function lazyImport(specifier: string): Promise<any> {
  return import(/* webpackIgnore: true */ specifier);
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
export async function buildReactor(options: BuildReactorOptions): Promise<any> {
  // Ensure the storage directory exists
  const { mkdir } = await import('node:fs/promises');
  await mkdir(options.storagePath, { recursive: true });

  const reactor = await lazyImport('@powerhousedao/reactor');
  const pgliteMod = await lazyImport('@electric-sql/pglite');
  const kyselyMod = await lazyImport('kysely');
  const dialectMod = await lazyImport('kysely-pglite-dialect');

  // Base document models (always needed for drives and document-model)
  const sharedMod = await lazyImport('@powerhousedao/shared/document-drive');
  const docModelMod = await lazyImport('document-model');

  const { ReactorBuilder, ReactorClientBuilder, ChannelScheme } = reactor;
  const { PGlite } = pgliteMod;
  const { Kysely } = kyselyMod;
  const { PGliteDialect } = dialectMod;
  const { driveDocumentModelModule } = sharedMod;
  const { documentModelDocumentModelModule } = docModelMod;

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
