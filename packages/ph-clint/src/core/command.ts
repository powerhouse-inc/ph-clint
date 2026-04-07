import type { z } from 'zod';
import type { Command } from './types.js';

/**
 * Define a command — the atomic unit of ph-clint.
 * Compatible with Mastra createTool() shape.
 */
export function defineCommand<TInput extends z.ZodType, TOutput = unknown, TConfig = Record<string, unknown>>(
  options: Command<TInput, TOutput, TConfig>,
): Command<TInput, TOutput, TConfig> {
  return options;
}
