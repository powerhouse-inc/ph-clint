/**
 * Per-CLI typed framework binding for the connect-agent example.
 *
 * Captures `configSchema` and the document registry once so `defineCommand` /
 * `defineTrigger` / `createDocumentChangeTrigger` don't need their generics
 * restated at every call site.
 */
import { createTypes } from 'ph-clint';
import type { RegistryEntry } from 'ph-clint';
import type {
  AgentChatAction,
  AgentChatPHState,
} from 'agent-app/document-models/agent-chat';
import { configSchema } from './config.js';

export type Registry = {
  'powerhouse/agent-chat': RegistryEntry<AgentChatPHState, AgentChatAction>;
};

export const {
  defineCommand,
  defineTrigger,
  defineService,
  createDocumentChangeTrigger,
} = createTypes<typeof configSchema, Registry>({
  configSchema,
});
