/**
 * Re-exports from @powerhousedao/ph-clint-dev/codegen with CLI_VERSION default.
 */
import {
  generateProject as _generateProject,
  type GenerateProjectOptions as DevGenerateProjectOptions,
  type GenerateProjectResult,
  type GenerateMode,
  type GeneratedFile,
} from '@powerhousedao/ph-clint-dev/codegen';
import type { CodegenContext } from '@powerhousedao/ph-clint-dev/codegen/types';
import { CLI_VERSION } from '../config.js';

export type { GenerateProjectResult, GenerateMode, GeneratedFile, CodegenContext };

export interface GenerateProjectOptions extends Omit<DevGenerateProjectOptions, 'context'> {
  /** Codegen context; defaults to CLI_VERSION when omitted. */
  context?: CodegenContext;
}

export async function generateProject(
  options: GenerateProjectOptions,
): Promise<GenerateProjectResult> {
  return _generateProject({
    ...options,
    context: options.context ?? { toolVersion: CLI_VERSION },
  });
}
