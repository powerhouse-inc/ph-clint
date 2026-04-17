import { defineCommand } from 'ph-clint';
import { z } from 'zod';
import type { AuthStatusResult } from '@renown/sdk/node';
import type { Config } from '../config.js';


async function buildRenown(config: Config) {
  const { RenownBuilder, RENOWN_PRIVATE_KEY_ENV } = await import('@renown/sdk/node');

  if (config.renownPrivateKey) {
    process.env[RENOWN_PRIVATE_KEY_ENV] = config.renownPrivateKey;
  }

  return new RenownBuilder('ph-rupert', {
    baseUrl: config.renownUrl,
    keyPath: config.renownKeyPath,
    storagePath: config.renownStoragePath,
  }).build();
}

function formatAuthTable(title: string, s: AuthStatusResult): string {
  return [
    title,
    '',
    `| Field | Value |`,
    `|-------|-------|`,
    `| ETH Address | \`${s.address}\` |`,
    `| User DID | \`${s.userDid}\` |`,
    `| Chain ID | ${s.chainId} |`,
    `| CLI DID | \`${s.cliDid}\` |`,
    `| Authenticated at | ${s.authenticatedAt?.toLocaleString()} |`,
    `| Renown URL | ${s.baseUrl} |`,
  ].join('\n');
}

// ── Login ───────────────────────────────────────────────────────────

const loginInputSchema = z.object({
  renownUrl: z.url().optional().describe('Renown server URL (overrides config)'),
  timeout: z.number().optional().describe('Authentication timeout in seconds.'),
  status: z.boolean().optional().describe('Display current authentication status.'),
  showDid: z.boolean().optional().describe("Display the CLI's DID."),
});

export const phLogin = defineCommand<typeof loginInputSchema, { text: string }, Config>({
  id: 'login',
  description: `Authenticate with Renown using your Ethereum wallet. This enables
the CLI to act on behalf of your Ethereum identity for authenticated operations.

This command:
1. Generates or loads a cryptographic identity (DID) for the CLI
2. Opens your browser to the Renown authentication page
3. You authorize the CLI's DID to act on behalf of your Ethereum address
4. Stores the credentials locally in .ph/.renown.json
`,
  inputSchema: loginInputSchema,
  execute: async ({ renownUrl, timeout, status, showDid }, { stdout, config}) => {
    const renownConfig = {
      ...config,
      ...(renownUrl && { renownUrl: renownUrl }),
    };
    const renown = await buildRenown(renownConfig);

    if (showDid) {
      return { text: `**CLI DID:** \`${renown.did}\`` };
    }

    if (status) {
      const { getAuthStatus } = await import('@renown/sdk/node');
      const s = getAuthStatus(renown);
      if (!s.authenticated || !s.address) {
        return {
          text: 'Not authenticated. Run `/login` to authenticate with your Ethereum wallet.',
        };
      }
      return { text: formatAuthTable('**Authenticated**', s) };
    }

    const { browserLogin, getAuthStatus } = await import('@renown/sdk/node');
    const timeoutMs = timeout !== undefined ? timeout * 1000 : undefined;

    try {
      await browserLogin(renown, {
        renownUrl: renownConfig.renownUrl,
        timeoutMs,
        onLoginUrl: (u) => {
          stdout(`Login URL: [${u}](${u})\n`);
        },
        onBrowserOpenFailed: (u) => {
          stdout(`Could not open browser. Please visit: [${u}](${u})\n`);
        },
      });

      const s = getAuthStatus(renown);
      return { text: formatAuthTable('**Login successful**', s) };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { text: `**Login failed:** ${message}` };
    }
  },
});

// ── Logout ──────────────────────────────────────────────────────────

const logoutInputSchema = z.object({});

export const phLogout = defineCommand<typeof logoutInputSchema, { text: string }, Config>({
  id: 'logout',
  description: 'Sign out and remove the existing session created with the login command.',
  inputSchema: logoutInputSchema,
  execute: async (_input, { config }) => {
    const renown = await buildRenown(config);

    if (!renown.user) {
      return {
        text: 'Not currently authenticated. Run `/login` to start a session.',
      };
    }

    const address = renown.user.address;
    await renown.logout();
    return { text: `**Logged out** — session for \`${address}\` cleared.` };
  },
});

// ── Access Token ────────────────────────────────────────────────────

const accessTokenInputSchema = z.object({
  expiry: z.string().default('24h').describe('Token expiry duration. Supports "7d" (days), "24h" (hours), "3600s" or "3600" (seconds).'),
  audience: z.string().optional().describe('Audience claim (aud) for the token.'),
});

export const phAccessToken = defineCommand<typeof accessTokenInputSchema, { text: string }, Config>({
  id: 'access-token',
  description: `Generate a bearer token for API authentication. The token can be used to
authenticate requests to Powerhouse APIs like reactor-api (Switchboard).

Prerequisites: You must be authenticated. Run login first.

The token is a JWT containing your CLI's DID, credential subject, and expiration.`,
  inputSchema: accessTokenInputSchema,
  execute: async ({ expiry, audience }, { config }) => {
    const { generateAccessToken, parseExpiry, formatExpiry } = await import('@renown/sdk/node');
    const renown = await buildRenown(config);

    let expiresIn = expiry ? parseExpiry(expiry) : undefined;
    const result = await generateAccessToken(renown, {
      expiresIn,
      aud: audience,
    });

    return {
      text: [
        '**Access token generated**',
        '',
        `| Field | Value |`,
        `|-------|-------|`,
        `| ETH Address | \`${result.address}\` |`,
        `| CLI DID | \`${result.did}\` |`,
        `| Expires in | \`${formatExpiry(result.expiresIn)}\` |`,
        audience ? `| Audience | \`${audience}\` |` : null,
        '',
        '**Access Token (JWT):**',
        `\`${result.token}\``,
        '',
      ]
        .filter((line) => line !== null)
        .join('\n'),
    };
  },
});
