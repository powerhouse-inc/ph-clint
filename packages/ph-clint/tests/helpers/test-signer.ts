/**
 * A real P-256 `did:key` signer for tests: v2 tuples the reactor verifies.
 * `user` is mutable, like Renown's live signer (set on sign-in).
 */
import { webcrypto } from 'node:crypto';
import { actionSignerIdentity, signActionV2 } from 'document-model';

const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function base58(bytes: Uint8Array): string {
  let value = 0n;
  for (const b of bytes) value = (value << 8n) | BigInt(b);
  let out = '';
  while (value > 0n) {
    out = ALPHABET[Number(value % 58n)] + out;
    value /= 58n;
  }
  for (const b of bytes) {
    if (b !== 0) break;
    out = '1' + out;
  }
  return out;
}

export interface TestSigner {
  user?: { address: string; networkId: string; chainId: number };
  app: { name: string; key: string };
  publicKey: CryptoKey;
  sign(data: Uint8Array): Promise<Uint8Array>;
  verify(): Promise<void>;
  signAction(action: any, target: any): Promise<any>;
}

export async function createTestSigner(name = 'test-agent'): Promise<TestSigner> {
  const keys = (await webcrypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, [
    'sign',
    'verify',
  ])) as CryptoKeyPair;
  const raw = new Uint8Array(await webcrypto.subtle.exportKey('raw', keys.publicKey));
  const x = raw.slice(1, 33);
  const yOdd = raw[64] & 1;
  const compressed = new Uint8Array([yOdd ? 3 : 2, ...x]);
  const did = `did:key:z${base58(new Uint8Array([0x80, 0x24, ...compressed]))}`;

  const sign = async (data: Uint8Array) =>
    new Uint8Array(
      await webcrypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, keys.privateKey, data),
    );

  const signer: TestSigner = {
    user: undefined,
    app: { name, key: did },
    publicKey: keys.publicKey as CryptoKey,
    sign,
    async verify() {},
    async signAction(action, target) {
      return signActionV2({
        action,
        target,
        signer: actionSignerIdentity(signer as never),
        sign,
        previousStateHash: action.context?.prevOpHash ?? '',
      } as never);
    },
  };
  return signer;
}

export const OWNER = {
  address: '0x00000000000000000000000000000000000000a1',
  networkId: 'eip155',
  chainId: 1,
};
