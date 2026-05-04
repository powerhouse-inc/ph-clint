import type { z } from 'zod';
import type { DocumentRegistry } from '../integrations/powerhouse/types.js';
import type { Command } from './types.js';

/**
 * Define a command — the atomic unit of ph-clint.
 * Compatible with Mastra createTool() shape.
 */
export function defineCommand<
  TInput extends z.ZodType,
  TOutput = unknown,
  TConfig = Record<string, unknown>,
  R extends DocumentRegistry = any,
>(
  options: Command<TInput, TOutput, TConfig, R>,
): Command<TInput, TOutput, TConfig, R> {
  return options;
}
