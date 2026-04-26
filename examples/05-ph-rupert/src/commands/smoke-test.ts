import { z } from 'zod';
import { defineCommand } from '@powerhousedao/ph-clint';
import { agentInboxDocumentType } from '@powerhousedao/agent-manager/document-models/agent-inbox';
import {
  setAgentName,
  addStakeholder,
  createThread,
} from '@powerhousedao/agent-manager/document-models/agent-inbox';

/**
 * Smoke test for the rupert agent loop.
 *
 * Creates an agent-inbox document on the active drive, adds a test
 * stakeholder, and posts an unread Incoming message. The inbox trigger
 * should pick it up on the next routine tick and emit a 'skill'
 * work-item that runs handle-stakeholder-message against the agent.
 *
 * Usage:
 *   /smoke-test --message "build me a todo document model"
 */
export const smokeTest = defineCommand({
  id: 'smoke-test',
  description:
    'Inject a fake stakeholder message into a fresh inbox doc to exercise the agent loop',
  inputSchema: z.object({
    message: z
      .string()
      .default('build me a todo document model')
      .describe('Stakeholder message body'),
    stakeholder: z
      .string()
      .default('Smoke Tester')
      .describe('Stakeholder display name'),
    topic: z
      .string()
      .default('Smoke Test Thread')
      .describe('Thread topic'),
  }),
  execute: async (input, ctx) => {
    const reactor = await ctx.reactor?.();
    if (!reactor) {
      return 'Smoke test requires a reactor — none configured.';
    }

    const driveId = reactor.driveId;
    const ts = Date.now();
    const inboxId = `smoke-inbox-${ts}`;
    const stakeholderId = `stakeholder-${ts}`;
    const threadId = `thread-${ts}`;
    const messageId = `msg-${ts}`;

    // Create the inbox document on the drive.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = reactor.client as any;
    await client.create({
      header: { id: inboxId, documentType: agentInboxDocumentType },
      driveId,
    });

    // Populate it: agent name, one stakeholder, one thread with one Incoming message.
    await reactor.client.execute(inboxId, 'main', [
      setAgentName({ name: 'Rupert' }),
      addStakeholder({ id: stakeholderId, name: input.stakeholder }),
      createThread({
        id: threadId,
        stakeholder: stakeholderId,
        topic: input.topic,
        initialMessage: {
          id: messageId,
          when: new Date().toISOString(),
          content: input.message,
          flow: 'Incoming',
        },
      }),
    ]);

    return [
      `Smoke inbox created: ${inboxId}`,
      `Thread: ${threadId}, Message: ${messageId}`,
      `Stakeholder: ${input.stakeholder} (${stakeholderId})`,
      ``,
      `The inbox trigger should fire on the next routine tick`,
      `and dispatch handle-stakeholder-message with prompt:`,
      `  "${input.message}"`,
    ].join('\n');
  },
});
