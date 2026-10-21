/**
 * Reactor builder — lazy-loads @powerhousedao/reactor and creates
 * a ReactorClientModule with persistent PGlite storage.
 */

import type { DocumentModelModule } from 'document-model';
import type { IReactorClient } from '@powerhousedao/reactor';
import type { ReactorClientModule } from './types.js';
import {
  createGatedSigner,
  createWriteGuardedClient,
  signerReady,
  type ReactorSigningOptions,
} from './signing.js';

/** Structural type for the @powerhousedao/reactor ReactorBuilder (fluent API). */
interface ReactorBuilderLike {
  /** 6.2.3+: accepts live modules (and file/package sources). */
  withDocumentModelSources?(m: DocumentModelModule[]): ReactorBuilderLike;
  /** Before 6.2.3. */
  withDocumentModels?(m: DocumentModelModule[]): ReactorBuilderLike;
  withKysely(k: unknown): ReactorBuilderLike;
  withSigner?(signer: unknown): ReactorBuilderLike;
  withTrustPolicy?(policy: unknown): ReactorBuilderLike;
}

interface ReactorClientBuilderLike {
  withReactorBuilder(r: unknown): ReactorClientBuilderLike;
  withReactor?(reactor: unknown, eventBus: unknown, documentIndexer: unknown, documentView: unknown): ReactorClientBuilderLike;
  withSigner?(signer: unknown): ReactorClientBuilderLike;
  withSubscriptionManager?(manager: unknown): ReactorClientBuilderLike;
  withJobAwaiter?(awaiter: unknown): ReactorClientBuilderLike;
  build?(): Promise<IReactorClient>;
  /** 6.2.3+: what the client creates new documents as. */
  withCreateSignaturePolicy?(policy: 'legacy' | 'v2-required'): ReactorClientBuilderLike;
  buildModule(): Promise<ReactorClientModule>;
}

/**
 * Structural shape of the switchboard helpers we call into. Loaded via
 * dynamic import so `@powerhousedao/switchboard` stays an optional peer.
 */
interface SwitchboardServerEntry {
  applySwitchboardReactorDefaults(
    reactorBuilder: unknown,
    clientBuilder: unknown,
    options?: {
      documentModels?: DocumentModelModule[];
      includeBaseModels?: boolean;
      includeVetraModels?: boolean;
      signalHandlers?: boolean;
    },
  ): void;
}

export interface BuildReactorOptions {
  /** Document model modules to register. */
  documentModels: DocumentModelModule[];
  /** Absolute path to the persistent PGlite directory. */
  storagePath: string;
  /**
   * Apply switchboard's reactor wiring so the module can be wrapped with
   * `startSwitchboard` later. Pulls in channel scheme, base document models,
   * the reactor-drive read model, etc. via `@powerhousedao/switchboard`'s
   * `applySwitchboardReactorDefaults`. Leave false for standalone reactors.
   */
  enableSync?: boolean;
  /**
   * Sign the agent's writes (see `signing.ts`). Without it the reactor has no
   * signer, creates legacy documents and every write is unsigned.
   */
  signing?: ReactorSigningOptions;
}

/**
 * The built reactor. `client` is the module's own client: unsigned, and the
 * one the switchboard serves. `agentClient` is what the agent writes with:
 * the same client without `signing`, a signing, write-guarded client with it.
 */
export type BuiltReactorModule = ReactorClientModule & { agentClient: IReactorClient };

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
): Promise<BuiltReactorModule> {
  // Ensure the storage directory exists
  const { mkdir } = await import('node:fs/promises');
  await mkdir(options.storagePath, { recursive: true });

  const reactor = (await import('@powerhousedao/reactor')) as unknown as Record<
    string,
    unknown
  >;
  const pgliteMod = (await import('@electric-sql/pglite')) as unknown as Record<
    string,
    unknown
  >;
  const kyselyMod = (await import('kysely')) as unknown as Record<
    string,
    unknown
  >;
  const dialectMod = (await import(
    'kysely-pglite-dialect'
  )) as unknown as Record<string, unknown>;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- dynamic peer dep
  const ReactorBuilder = reactor.ReactorBuilder as new () => ReactorBuilderLike;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- dynamic peer dep
  const ReactorClientBuilder =
    reactor.ReactorClientBuilder as new () => ReactorClientBuilderLike;
  const PGlite = pgliteMod.PGlite as new (path: string) => unknown;
  const Kysely = kyselyMod.Kysely as new (opts: { dialect: unknown }) => unknown;
  const PGliteDialect = dialectMod.PGliteDialect as new (
    pglite: unknown,
  ) => unknown;

  const pglite = new PGlite(options.storagePath);
  const kysely = new Kysely({ dialect: new PGliteDialect(pglite) });

  const reactorBuilder = new ReactorBuilder().withKysely(kysely);
  const clientBuilder = new ReactorClientBuilder().withReactorBuilder(
    reactorBuilder,
  );
  const signing = options.signing;
  if (signing) {
    // The reactor's own signer (synthesized operations, and its own key is
    // trusted to sign as its own user) is the live signer itself; the gate
    // only applies to the agent's client below.
    reactorBuilder.withSigner?.(signing.signer);
    if (signing.trustPolicy) reactorBuilder.withTrustPolicy?.(signing.trustPolicy);
    // The module's client stays unsigned: it is what the switchboard serves.
    clientBuilder.withCreateSignaturePolicy?.(signing.createSignaturePolicy);
  } else {
    // Without a signer the embedded reactor creates legacy documents: they
    // accept unsigned writes and fixed ids. Powerhouse 6.2.3 otherwise
    // defaults to `v2-required`, which refuses both.
    clientBuilder.withCreateSignaturePolicy?.('legacy');
  }

  if (options.enableSync) {
    // Switchboard owns the standard reactor wiring (channel scheme, base
    // + vetra document models, executor config, etc.). We opt out of signal
    // handlers because ph-clint manages SIGINT itself. The reactor-drive
    // read model + projection are skipped for now — ph-clint doesn't expose
    // its kysely to switchboard yet, so that subgraph stays disabled. See
    // `createReactorDriveProjection` in `@powerhousedao/switchboard/server`
    // for adding it later.
    const sw = (await import(
      '@powerhousedao/switchboard/server'
    )) as unknown as SwitchboardServerEntry;
    sw.applySwitchboardReactorDefaults(reactorBuilder, clientBuilder, {
      documentModels: options.documentModels,
      signalHandlers: false,
    });
  } else {
    // Standalone reactor: register only the document models ph-clint needs.
    const sharedMod = (await import(
      '@powerhousedao/shared/document-drive'
    )) as unknown as Record<string, unknown>;
    const docModelMod = (await import('document-model')) as unknown as Record<
      string,
      unknown
    >;
    const driveDocumentModelModule =
      sharedMod.driveDocumentModelModule as DocumentModelModule;
    const documentModelDocumentModelModule =
      docModelMod.documentModelDocumentModelModule as DocumentModelModule;
    const models = [
      documentModelDocumentModelModule,
      driveDocumentModelModule,
      ...options.documentModels,
    ];
    if (reactorBuilder.withDocumentModelSources) {
      reactorBuilder.withDocumentModelSources(models);
    } else {
      reactorBuilder.withDocumentModels?.(models);
    }
  }

  const module = await clientBuilder.buildModule();
  if (!signing) return Object.assign(module, { agentClient: module.client });

  const parts = module as unknown as {
    reactor: unknown;
    eventBus: unknown;
    documentIndexer: unknown;
    documentView: unknown;
    subscriptionManager: unknown;
    jobAwaiter: unknown;
  };
  const signedBuilder = new ReactorClientBuilder();
  if (!signedBuilder.withReactor || !signedBuilder.build) {
    throw new Error('Signed writes need Powerhouse 6.2.3 or later.');
  }
  signedBuilder
    .withReactor(parts.reactor, parts.eventBus, parts.documentIndexer, parts.documentView)
    .withSigner?.(createGatedSigner(signing.signer));
  signedBuilder.withCreateSignaturePolicy?.(signing.createSignaturePolicy);
  signedBuilder.withSubscriptionManager?.(parts.subscriptionManager);
  signedBuilder.withJobAwaiter?.(parts.jobAwaiter);
  const signedClient = await signedBuilder.build();

  const agentClient = createWriteGuardedClient(
    signedClient,
    module.client,
    {
      ready: () => signerReady(signing.signer),
      legacyDocuments: signing.legacyDocuments,
      accepts: signing.accepts,
    },
    signing.createSignaturePolicy,
  );
  return Object.assign(module, { agentClient });
}
