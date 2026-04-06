import type { Trigger, TriggerOptions } from './types.js';

/**
 * Define a trigger — a pluggable object that produces work items for the routine loop.
 */
export function defineTrigger(options: TriggerOptions): Trigger {
  return options;
}
