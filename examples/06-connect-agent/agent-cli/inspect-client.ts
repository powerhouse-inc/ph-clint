import { ReactorBuilder, ReactorClientBuilder } from '@powerhousedao/reactor';
import { PGlite } from '@electric-sql/pglite';
import { Kysely } from 'kysely';
import { PGliteDialect } from 'kysely-pglite-dialect';
import { driveDocumentModelModule } from '@powerhousedao/shared/document-drive';
import { documentModelDocumentModelModule } from 'document-model';
import { documentModels } from 'agent-app';
import { mkdir } from 'node:fs/promises';
import { actions, addStakeholder, addAgent, sendText } from 'agent-app/document-models/agent-chat';

async function main() {
  await mkdir('.ph/connect-agent/test-storage4', { recursive: true });

  const pglite = new PGlite('.ph/connect-agent/test-storage4');
  const kysely = new Kysely({ dialect: new PGliteDialect(pglite) });

  const mod = await new ReactorClientBuilder()
    .withReactorBuilder(
      new ReactorBuilder()
        .withDocumentModels([
          documentModelDocumentModelModule,
          driveDocumentModelModule,
          ...documentModels,
        ])
        .withKysely(kysely),
    )
    .buildModule();

  const client = mod.client;

  // Create drive + chat document
  const drive = await client.createEmpty('powerhouse/document-drive');
  const driveId = drive.header.id;
  console.log('Drive:', driveId);

  const chatDoc = await client.createEmpty('powerhouse/agent-chat');
  const chatId = chatDoc.header.id;
  console.log('Chat:', chatId);

  await client.addChildren(driveId, [chatId]);

  // Check what an action creator returns
  const stakeholderAction = addStakeholder({ id: 'user-1', name: 'Test User' });
  console.log('\naddStakeholder() result:');
  console.log(JSON.stringify(stakeholderAction, null, 2));

  // Try execute
  console.log('\n--- Execute addStakeholder ---');
  try {
    const result = await client.execute(chatId, 'main', [stakeholderAction]);
    console.log('execute result:', JSON.stringify(result, null, 2)?.slice(0, 500));
  } catch (e: any) {
    console.log('execute error:', e.message);
    // Maybe it expects a different format? Try actions.addStakeholder
    const action2 = actions.addStakeholder({ id: 'user-1', name: 'Test User' });
    console.log('\nactions.addStakeholder():', JSON.stringify(action2, null, 2));
    try {
      const result2 = await client.execute(chatId, 'main', [action2]);
      console.log('execute with actions.x result:', JSON.stringify(result2, null, 2)?.slice(0, 500));
    } catch (e2: any) {
      console.log('execute with actions.x error:', e2.message);
    }
  }

  // Check state after
  const updated = await client.get(chatId);
  console.log('\nChat state after:', JSON.stringify(updated?.state?.global, null, 2));

  // Try addAgent + sendText
  console.log('\n--- Execute addAgent + sendText ---');
  try {
    await client.execute(chatId, 'main', [
      addAgent({ id: 'agent-1', name: 'Test Agent', role: 'AI', description: 'test' }),
    ]);
    await client.execute(chatId, 'main', [
      sendText({ id: 'msg-1', sender: 'user-1', text: 'Hello agent!', when: new Date().toISOString(), format: 'Text' }),
    ]);
    const finalDoc = await client.get(chatId);
    console.log('Final state:', JSON.stringify(finalDoc?.state?.global, null, 2));
  } catch (e: any) {
    console.log('multi-execute error:', e.message);
  }

  // Try subscribe
  console.log('\n--- Subscribe ---');
  console.log('subscribe fn:', client.subscribe.toString().slice(0, 300));

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
