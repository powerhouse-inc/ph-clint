/**
 * Signed writes for the embedded reactor.
 *
 * By default the embedded reactor has no signer: it creates `legacy`
 * documents and every write goes out unsigned (see `buildReactor`). A host
 * that holds an identity (a `did:key` signer whose `user` is set once the
 * owner has delegated to it) passes `signing` instead. Then:
 *
 * - the agent's client signs every action with that signer;
 * - a write that needs a signature while the signer has no user is refused
 *   with `SignerNotReadyError` before anything is submitted — it is never
 *   sent unsigned;
 * - `legacyDocuments: 'refuse'` keeps the agent off legacy documents
 *   altogether (a host whose documents are all `v2-required`);
 *   `'sign-when-ready'` signs writes to legacy documents when it can and
 *   sends them unsigned otherwise (a host with existing legacy documents);
 * - the switchboard keeps its own unsigned client, so a request it serves is
 *   never signed with the agent's identity (see `buildReactor`).
 */
import type { IReactorClient } from '@powerhousedao/reactor';

export type SignaturePolicy = 'legacy' | 'v2-required';

/** Structural slice of document-model's `ISigner` this module touches. */
export interface SignerLike {
  user?: { address: string; networkId?: string; chainId?: number };
  app?: { name?: string; key: string };
  signAction: (...args: never[]) => Promise<unknown>;
}

/** Structural slice of the reactor's `SignatureTrustPolicy`. */
export interface TrustPolicyLike {
  authorizeSigner(signer: unknown, key: string, documentId: string): Promise<boolean>;
}

/** A document header as far as the write rules read it. */
export interface DocumentHeaderLike {
  header: {
    id: string;
    documentType?: string;
    protocolVersions?: Record<string, number> | null;
  };
}

export interface ReactorSigningOptions {
  /**
   * The agent's signer. Read on every write, so a signer whose `user` is set
   * later (a sign-in) takes effect without rebuilding the reactor.
   */
  signer: SignerLike;
  /** Decides which keys may sign as which users on writes this reactor admits. */
  trustPolicy?: TrustPolicyLike;
  /** What the agent's client creates new documents as. */
  createSignaturePolicy: SignaturePolicy;
  /**
   * `refuse`: the agent never writes a legacy document.
   * `sign-when-ready`: signed when the signer has a user, unsigned otherwise.
   */
  legacyDocuments: 'refuse' | 'sign-when-ready';
  /** Further documents the agent must leave alone (checked with the rules above). */
  accepts?: (document: DocumentHeaderLike) => boolean;
  /**
   * Subscribe to changes of the signer's user; the reactor announces
   * `powerhouse:writes:ready` when writes become possible. Returns an
   * unsubscribe function.
   */
  onSignerChange?: (listener: () => void) => () => void;
}

/** The agent cannot sign yet: its signer has no user. */
export class SignerNotReadyError extends Error {
  constructor(what = 'this write') {
    super(`The agent cannot sign ${what} yet: it has no signed-in identity.`);
    this.name = 'SignerNotReadyError';
  }
}

/** The agent was asked to write a document it leaves alone. */
export class DocumentNotWritableError extends Error {
  readonly documentId: string;
  constructor(documentId: string, reason: string) {
    super(`The agent does not write document ${documentId}: ${reason}.`);
    this.name = 'DocumentNotWritableError';
    this.documentId = documentId;
  }
}

/** True when the signer can sign as a user. */
export function signerReady(signer: SignerLike): boolean {
  return Boolean(signer.user?.address);
}

/** The policy a header carries (same rule as document-model's `signaturePolicyOf`). */
export function policyOfHeader(header: DocumentHeaderLike['header'] | undefined): SignaturePolicy {
  const version = header?.protocolVersions?.signature;
  return typeof version === 'number' && version >= 2 ? 'v2-required' : 'legacy';
}

/**
 * The signer, refusing to sign while it has no user. Everything else is read
 * through to the live signer.
 */
export function createGatedSigner<S extends SignerLike>(signer: S): S {
  return new Proxy(signer, {
    get(target, prop, receiver) {
      if (prop === 'signAction') {
        return async (...args: never[]) => {
          if (!signerReady(target)) throw new SignerNotReadyError();
          return target.signAction(...args);
        };
      }
      const value = Reflect.get(target, prop, receiver) as unknown;
      return typeof value === 'function' ? (value as (...a: unknown[]) => unknown).bind(target) : value;
    },
  });
}

export interface WriteRules {
  ready(): boolean;
  legacyDocuments: ReactorSigningOptions['legacyDocuments'];
  accepts?: ReactorSigningOptions['accepts'];
}

/** Whether the agent may write `document` right now (no reactor call). */
export function canWrite(rules: WriteRules, document: DocumentHeaderLike): boolean {
  if (rules.accepts && !rules.accepts(document)) return false;
  if (policyOfHeader(document.header) === 'v2-required') return rules.ready();
  return rules.legacyDocuments !== 'refuse';
}

type Route = 'signed' | 'unsigned';

/** Call `method` on `target` (the reactor client's methods are looked up by name). */
function call(target: object, method: string, args: unknown[]): unknown {
  const fn = (target as Record<string, unknown>)[method];
  if (typeof fn !== 'function') throw new TypeError(`${method} is not available on this reactor client`);
  return (fn as (...a: unknown[]) => unknown).apply(target, args);
}

/** Which client writes a document under `policy`, or why none may. */
export function routeFor(rules: WriteRules, policy: SignaturePolicy, documentId: string): Route {
  if (policy === 'v2-required') {
    if (!rules.ready()) throw new SignerNotReadyError(`a write to ${documentId}`);
    return 'signed';
  }
  if (rules.legacyDocuments === 'refuse') {
    throw new DocumentNotWritableError(documentId, 'it does not take signatures');
  }
  return rules.ready() ? 'signed' : 'unsigned';
}

/** Methods whose first argument names the document they write. */
const DOCUMENT_WRITES = new Set([
  'execute',
  'executeAsync',
  'rename',
  'setPreferredEditor',
  'upgradeDocument',
  'deleteDocument',
  'addRelationship',
  'updateRelationship',
  'removeRelationship',
  'moveRelationship',
]);

/** Drive-client methods whose first argument names the drive they write. */
const DRIVE_WRITES = new Set(['addFolder', 'removeNode', 'renameNode', 'moveNode', 'copyNode']);

interface CreateOptionsLike {
  signaturePolicy?: SignaturePolicy;
}

/**
 * The agent's client: reads go to `signed`; every write is routed by the
 * target document's policy (see `routeFor`) to `signed` or `unsigned`, or
 * refused before anything is submitted.
 */
export function createWriteGuardedClient(
  signed: IReactorClient,
  unsigned: IReactorClient,
  rules: WriteRules,
  createPolicy: SignaturePolicy,
): IReactorClient {
  const policies = new Map<string, SignaturePolicy>();

  async function policyOf(identifier: string): Promise<SignaturePolicy> {
    const known = policies.get(identifier);
    if (known) return known;
    const document = (await signed.get(identifier)) as unknown as DocumentHeaderLike;
    const policy = policyOfHeader(document.header);
    // A document's policy never changes, so it is remembered by id and slug.
    policies.set(identifier, policy);
    policies.set(document.header.id, policy);
    if (rules.accepts && !rules.accepts(document)) {
      throw new DocumentNotWritableError(document.header.id, 'it is outside what this agent works on');
    }
    return policy;
  }

  async function clientFor(identifier: string): Promise<IReactorClient> {
    return routeFor(rules, await policyOf(identifier), identifier) === 'signed' ? signed : unsigned;
  }

  function clientForCreate(policy: SignaturePolicy, label: string): IReactorClient {
    return routeFor(rules, policy, label) === 'signed' ? signed : unsigned;
  }

  /** Both routes have to agree; a signed route wins (it needs readiness). */
  function stricter(a: IReactorClient, b: IReactorClient): IReactorClient {
    return a === signed || b === signed ? signed : unsigned;
  }

  const drives = createGuardedDrives(signed, unsigned, clientFor, clientForCreate, stricter, createPolicy);

  return new Proxy(signed, {
    get(target, prop, receiver) {
      if (prop === 'drives') return drives;
      if (typeof prop === 'string' && DOCUMENT_WRITES.has(prop)) {
        return async (identifier: string, ...rest: unknown[]) => {
          const client = await clientFor(identifier);
          return call(client, prop, [identifier, ...rest]);
        };
      }
      switch (prop) {
        case 'create':
        case 'createAsync':
          return async (document: DocumentHeaderLike, ...rest: unknown[]) => {
            let client = clientForCreate(policyOfHeader(document.header), document.header.id || 'a new document');
            const parent = rest[0];
            if (typeof parent === 'string' && parent) client = stricter(client, await clientFor(parent));
            return call(client, prop, [document, ...rest]);
          };
        case 'createEmpty':
        case 'createEmptyAsync':
          return async (documentType: string, options?: CreateOptionsLike & { parentIdentifier?: string }, ...rest: unknown[]) => {
            let client = clientForCreate(options?.signaturePolicy ?? createPolicy, `a new ${documentType}`);
            if (options?.parentIdentifier) client = stricter(client, await clientFor(options.parentIdentifier));
            return call(client, prop, [documentType, options, ...rest]);
          };
        case 'createDocumentInDrive':
          return async (driveId: string, document: DocumentHeaderLike, ...rest: unknown[]) => {
            const client = stricter(
              await clientFor(driveId),
              clientForCreate(policyOfHeader(document.header), document.header.id || 'a new document'),
            );
            return call(client, 'createDocumentInDrive', [driveId, document, ...rest]);
          };
        case 'deleteDocuments':
          return async (identifiers: string[], ...rest: unknown[]) => {
            let client = unsigned;
            for (const id of identifiers) client = stricter(client, await clientFor(id));
            return call(client, 'deleteDocuments', [identifiers, ...rest]);
          };
        case 'executeBatch':
          return async (request: { jobs: Array<{ documentId: string }> }, ...rest: unknown[]) => {
            let client = unsigned;
            for (const job of request.jobs) client = stricter(client, await clientFor(job.documentId));
            return call(client, 'executeBatch', [request, ...rest]);
          };
        default: {
          const value = Reflect.get(target, prop, receiver) as unknown;
          return typeof value === 'function' ? (value as (...a: unknown[]) => unknown).bind(target) : value;
        }
      }
    },
  });
}

function createGuardedDrives(
  signed: IReactorClient,
  unsigned: IReactorClient,
  clientFor: (identifier: string) => Promise<IReactorClient>,
  clientForCreate: (policy: SignaturePolicy, label: string) => IReactorClient,
  stricter: (a: IReactorClient, b: IReactorClient) => IReactorClient,
  createPolicy: SignaturePolicy,
): IReactorClient['drives'] {
  const base = signed.drives;
  return new Proxy(base, {
    get(target, prop, receiver) {
      if (typeof prop === 'string' && DRIVE_WRITES.has(prop)) {
        return async (driveIdentifier: string, ...rest: unknown[]) => {
          const client = await clientFor(driveIdentifier);
          return call(client.drives, prop, [driveIdentifier, ...rest]);
        };
      }
      switch (prop) {
        case 'addFile':
          return async (driveIdentifier: string, document: DocumentHeaderLike, ...rest: unknown[]) => {
            const client = stricter(
              await clientFor(driveIdentifier),
              clientForCreate(policyOfHeader(document.header), document.header.id || 'a new document'),
            );
            return call(client.drives, 'addFile', [driveIdentifier, document, ...rest]);
          };
        case 'setPreferredEditorOnNode':
          return async (nodeId: string, ...rest: unknown[]) => {
            const client = await clientFor(nodeId);
            return call(client.drives, 'setPreferredEditorOnNode', [nodeId, ...rest]);
          };
        case 'create':
          return async (...args: unknown[]) => {
            const client = clientForCreate(createPolicy, 'a new drive');
            return call(client.drives, 'create', args);
          };
        default: {
          const value = Reflect.get(target, prop, receiver) as unknown;
          return typeof value === 'function' ? (value as (...a: unknown[]) => unknown).bind(target) : value;
        }
      }
    },
  });
}
