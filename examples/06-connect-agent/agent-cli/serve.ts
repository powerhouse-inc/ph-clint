#!/usr/bin/env npx tsx
/**
 * Minimal server for testing — starts Reactor + Switchboard and keeps alive.
 * Prints a dot every 2 seconds so you know it's running.
 */
import { ReactorBuilder, ReactorClientBuilder, ChannelScheme } from '@powerhousedao/reactor';
import { PGlite } from '@electric-sql/pglite';
import { Kysely } from 'kysely';
import { PGliteDialect } from 'kysely-pglite-dialect';
import { driveDocumentModelModule } from '@powerhousedao/shared/document-drive';
import { documentModelDocumentModelModule } from 'document-model';
import { documentModels } from 'agent-app';
import { mkdir } from 'node:fs/promises';

const SWITCHBOARD_PORT = 4801;
const STORAGE_PATH = '.ph/connect-agent/reactor-storage';

async function main() {
  await mkdir(STORAGE_PATH, { recursive: true });

  const pglite = new PGlite(STORAGE_PATH);
  const kysely = new Kysely({ dialect: new PGliteDialect(pglite) });

  console.log('Building Reactor...');
  const mod = await new ReactorClientBuilder()
    .withReactorBuilder(
      new ReactorBuilder()
        .withDocumentModels([
          documentModelDocumentModelModule,
          driveDocumentModelModule,
          ...documentModels,
        ])
        .withKysely(kysely)
        .withChannelScheme(ChannelScheme.SWITCHBOARD),
    )
    .buildModule();

  // Ensure a drive exists
  const reactor = mod.reactor as any;
  const client = mod.client;
  const existing = await reactor.findByType('powerhouse/document-drive');
  let driveId: string;
  if (existing?.results?.length > 0) {
    driveId = existing.results[0].header.id;
    console.log('Found existing drive:', driveId);
  } else {
    const drive = await client.createEmpty('powerhouse/document-drive');
    driveId = drive.header.id;
    await client.rename(driveId, 'Agent Chat');
    console.log('Created drive:', driveId);
  }

  // Start Switchboard
  console.log('Starting Switchboard on port', SWITCHBOARD_PORT, '...');
  const { initializeAndStartAPI } = await import('@powerhousedao/reactor-api');
  await initializeAndStartAPI(
    async () => mod,
    { port: SWITCHBOARD_PORT, dbPath: '.ph/connect-agent/read-model.db', mcp: true, packages: [] },
    'agent',
  );

  console.log(`\nSwitchboard ready:`);
  console.log(`  GraphQL:  http://localhost:${SWITCHBOARD_PORT}/graphql`);
  console.log(`  Drive:    http://localhost:${SWITCHBOARD_PORT}/d/${driveId}`);
  console.log(`  MCP:      http://localhost:${SWITCHBOARD_PORT}/mcp`);
  console.log(`\nPress Ctrl+C to stop.\n`);

  // Keep alive with a dot every 2s
  setInterval(() => process.stdout.write('.'), 2000);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
