import { EventEmitter } from 'node:events';
import type { EventBus } from './types.js';

/**
 * Create an event bus — a central EventEmitter-based bus for decoupled communication.
 */
export function createEventBus(): EventBus {
  const emitter = new EventEmitter();

  return {
    emit(event: string, data?: unknown): void {
      emitter.emit(event, data);
    },
    on(event: string, handler: (data?: unknown) => void): void {
      emitter.on(event, handler);
    },
    off(event: string, handler: (data?: unknown) => void): void {
      emitter.off(event, handler);
    },
  };
}
