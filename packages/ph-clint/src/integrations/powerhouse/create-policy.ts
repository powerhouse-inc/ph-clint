/**
 * Signature policy for documents ph-clint builds before handing them to
 * `client.create()` / `client.drives.addFile()`.
 *
 * From Powerhouse 6.2.3 on, `module.utils.createDocument()` returns a
 * `v2-required` document: its id is derived from its header and every later
 * write must carry a v2 signature. `client.create()` keeps the header it is
 * given, so the client's create policy (see `withCreateSignaturePolicy` in
 * `buildReactor`) does not apply to these documents — they are re-headed
 * here to match it. A fixed id is only possible on a `legacy` document.
 *
 * Older Powerhouse versions (no `withSignaturePolicy` export) have no
 * policies: the document's id is set directly, as before.
 */

type SignaturePolicy = 'legacy' | 'v2-required';

interface HeaderedDocument {
  header: { id: string; meta?: Record<string, unknown> };
}

interface PolicyClient {
  getCreateSignaturePolicy?: () => Promise<SignaturePolicy>;
}

type WithSignaturePolicy = <T>(
  document: T,
  policy: SignaturePolicy,
  options?: { id?: string },
) => T;

/**
 * Return `document` under the client's create policy, or under `legacy`
 * with `id` when a fixed id is requested.
 */
export async function applyCreatePolicy<T extends HeaderedDocument>(
  client: unknown,
  document: T,
  id?: string,
): Promise<T> {
  const docModel = (await import('document-model')) as unknown as {
    withSignaturePolicy?: WithSignaturePolicy;
  };
  const withSignaturePolicy = docModel.withSignaturePolicy;
  if (typeof withSignaturePolicy !== 'function') {
    if (id) document.header.id = id;
    return document;
  }

  if (id) return withSignaturePolicy(document, 'legacy', { id });

  const getPolicy = (client as PolicyClient).getCreateSignaturePolicy;
  if (typeof getPolicy !== 'function') return document;
  const policy = await getPolicy.call(client);
  return withSignaturePolicy(document, policy);
}
