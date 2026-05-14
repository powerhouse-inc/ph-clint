/**
 * Builds `src/framework.ts` — the user-owned half of the typed-binding split.
 *
 * Emitted **only on create**. Once the file exists, codegen never overwrites
 * it: users are expected to extend `configSchema` and `secretsSchema` here,
 * and those edits must survive regens.
 *
 * Behavior differs by layout:
 *
 * - **Powerhouse enabled** — this file declares `configSchema`/`secretsSchema`
 *   and re-exports `registry`, `defineCommand`, `defineTrigger`,
 *   `defineService`, and `createDocumentChangeTrigger` from the companion
 *   `framework.gen.ts`. Adding a document type to the spec regenerates
 *   `framework.gen.ts`; this file keeps resolving its re-exports unchanged.
 *
 * - **Powerhouse disabled** — no reactor package exists to register modules
 *   against, so this file binds `createTypes({ configSchema })` directly and
 *   exports the typed factories from here. No `framework.gen.ts` is emitted.
 */
import {
  type ClintProjectSpec,
  getAllProviders,
  phAtLeast,
} from '../../spec/types.js';
import { DEMO_PROVIDER } from './provider-utils.js';

export function buildFrameworkTs(spec: ClintProjectSpec): string {
  const { mastra, powerhouse } = spec.features;
  const hasGen = phAtLeast(powerhouse, 'Reactor');
  const lines: string[] = [];

  lines.push('/**');
  lines.push(' * Per-CLI typed framework binding.');
  lines.push(' *');
  lines.push(' * This file is USER-OWNED. ph-clint-cli emits it once at project');
  lines.push(' * creation and never overwrites it afterwards — edit `configSchema`');
  lines.push(' * and `secretsSchema` freely.');
  if (hasGen) {
    lines.push(' *');
    lines.push(' * Typed factories (`defineCommand`, `defineTrigger`, ...) and the');
    lines.push(' * document `registry` come from `framework.gen.ts`, which IS');
    lines.push(' * regenerated whenever the spec\'s `documentTypes` list changes.');
  }
  lines.push(' */');
  lines.push(`import { z } from 'zod';`);
  lines.push(`import { createTypes } from '@powerhousedao/ph-clint';`);
  if (hasGen) {
    lines.push(`import { registry } from './framework.gen.js';`);
  }
  lines.push('');
  lines.push('export const configSchema = z.object({');
  lines.push('  // @clint:begin framework-config');
  if (mastra.enabled) {
    // The runtime `model` override only applies to the main agent. Sub-agent
    // models are taken verbatim from the spec.
    const mainModelId =
      mastra.mainAgent?.modelId ?? 'anthropic/claude-sonnet-4-5';
    lines.push(
      `  model: z.string().default('${mainModelId}').describe('LLM model for the main agent (sub-agent models come from the spec)'),`,
      `  agentLogging: z.boolean().default(false).describe('Enable agent conversation logging'),`,
    );
  }
  lines.push('  // @clint:end framework-config');
  lines.push('});');
  lines.push('');
  lines.push('export const secretsSchema = z.object({');
  lines.push('  // @clint:begin framework-secrets');
  if (mastra.enabled) {
    // Enumerate every unique provider across the main agent + all sub-agents.
    const providers = getAllProviders(spec).filter((p) => p !== DEMO_PROVIDER);
    for (const provider of providers) {
      const field = `${provider}ApiKey`;
      lines.push(`  ${field}: z.string().optional().describe('${provider} API key'),`);
    }
  }
  lines.push('  // @clint:end framework-secrets');
  lines.push('});');
  lines.push('');
  lines.push('export type Config = z.infer<typeof configSchema> &');
  lines.push('  z.infer<typeof secretsSchema>;');
  lines.push('');
  lines.push('const fullConfigSchema = configSchema.extend(secretsSchema.shape);');
  lines.push('');
  if (hasGen) {
    lines.push('export const {');
    lines.push('  defineCommand,');
    lines.push('  defineTrigger,');
    lines.push('  defineService,');
    lines.push('  createDocumentChangeTrigger,');
    lines.push('} = createTypes({');
    lines.push('  configSchema: fullConfigSchema,');
    lines.push('  registry,');
    lines.push('});');
    lines.push('');
    lines.push(`export { registry } from './framework.gen.js';`);
    lines.push(`export type { Registry } from './framework.gen.js';`);
  } else {
    lines.push('/**');
    lines.push(' * No reactor package — bind `createTypes` directly so');
    lines.push(' * `defineCommand` / `defineTrigger` / `defineService` still pick up');
    lines.push(' * the typed config. Enable `features.powerhouse` in the project spec');
    lines.push(' * and codegen will switch these exports to a registry-backed');
    lines.push(' * `framework.gen.ts`.');
    lines.push(' */');
    lines.push('export const {');
    lines.push('  defineCommand,');
    lines.push('  defineTrigger,');
    lines.push('  defineService,');
    lines.push('  createDocumentChangeTrigger,');
    lines.push('} = createTypes({ configSchema: fullConfigSchema });');
  }
  return lines.join('\n') + '\n';
}
