#!/usr/bin/env npx tsx
/**
 * Check the state of agent-chat documents in the persistent Reactor storage.
 */
import { ReactorBuilder, ReactorClientBuilder, ChannelScheme } from '@powerhousedao/reactor';
import { PGlite } from '@electric-sql/pglite';
import { Kysely } from 'kysely';
import { PGliteDialect } from 'kysely-pglite-dialect';
import { driveDocumentModelModule } from '@powerhousedao/shared/document-drive';
import { documentModelDocumentModelModule } from 'document-model';
import { documentModels } from 'agent-app';

const STORAGE_PATH = '.ph/connect-agent/reactor-storage';

async function main() {
  const pglite = new PGlite(STORAGE_PATH);
  const kysely = new Kysely({ dialect: new PGliteDialect(pglite) });

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

  const reactor = mod.reactor as any;
  const client = mod.client;

  // Find agent-chat documents
  const chats = await reactor.findByType('powerhouse/agent-chat');
  console.log(`Found ${chats?.results?.length ?? 0} agent-chat document(s)\n`);

  for (const chat of chats?.results ?? []) {
    const id = chat.header.id;
    const doc = await client.get(id);
    const state = doc?.state?.global;
    console.log(`Document: ${id}`);
    console.log(`  Name: ${doc?.header?.name}`);
    console.log(`  Topic: ${state?.topic}`);
    console.log(`  Stakeholders: ${JSON.stringify(state?.stakeholders)}`);
    console.log(`  Agents: ${JSON.stringify(state?.agents)}`);
    console.log(`  Messages (${state?.messages?.length ?? 0}):`);
    for (const msg of state?.messages ?? []) {
      console.log(`    [${msg.type}] ${msg.sender}: ${msg.text?.join?.('') ?? msg.text ?? '(no text)'}`);
    }
    console.log();
  }

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
