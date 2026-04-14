/**
 * Subscription bridge — maps Reactor document change events
 * to the ph-clint event bus.
 */

import type { SubscriptionConfig } from './types.js';

/**
 * Bridge Reactor document subscriptions to the ph-clint event bus.
 *
 * @param client - IReactorClient from the built ReactorClientModule
 * @param subscriptions - Filter configuration for which document changes to bridge
 * @param emit - Event bus emit function from CommandContext
 * @returns Unsubscribe function
 */
export function bridgeSubscriptions(
  client: any,
  subscriptions: SubscriptionConfig,
  emit: (event: string, data?: unknown) => void,
): () => void {
  const search: Record<string, unknown> = {};
  if (subscriptions.documentTypes) {
    search.documentTypes = subscriptions.documentTypes;
  }

  return client.subscribe(search, (event: any) => {
    try {
      switch (event.type) {
        case 'Created':
          for (const doc of event.documents ?? []) {
            emit('powerhouse:document:created', {
              documentId: doc.id,
              documentType: doc.documentType,
            });
          }
          break;
        case 'Updated':
          emit('powerhouse:document:changed', {
            changeType: event.type,
            documents: event.documents,
          });
          break;
        case 'Deleted':
          for (const doc of event.documents ?? []) {
            emit('powerhouse:document:deleted', { documentId: doc.id });
          }
          break;
      }
    } catch {
      // Don't crash the event bus on subscription handler errors
    }
  });
}
