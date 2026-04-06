import { z } from 'zod';
import type { Command } from '../core/types.js';
import { getSchemaFields } from '../core/schema.js';
import type { FieldInfo } from '../core/schema.js';

/**
 * Get auto-completion suggestions for partial REPL input.
 *
 * Supports:
 * - Command name completion: `/gr` → ['/greet']
 * - Flag name completion: `/greet --na` → ['--name']
 * - Enum value completion: `/list --filter d` → ['done']
 */
export function getCompletions(
  input: string,
  commands: Command[],
): string[] {
  const trimmed = input.trimStart();

  // Not a command prefix → no completions
  if (!trimmed.startsWith('/')) return [];

  const parts = trimmed.split(/\s+/);

  // Completing the command name: `/gr` → ['/greet']
  if (parts.length === 1) {
    const prefix = parts[0]!.slice(1).toLowerCase();
    const builtins = ['help', 'exit'];
    const allNames = [...commands.map((c) => c.id), ...builtins];
    return allNames
      .filter((name) => name.toLowerCase().startsWith(prefix))
      .map((name) => `/${name}`);
  }

  // Completing argument values
  const cmdName = parts[0]!.slice(1).toLowerCase();
  const cmd = commands.find((c) => c.id === cmdName);
  if (!cmd) return [];

  const lastPart = parts[parts.length - 1]!;
  const prevPart = parts.length >= 2 ? parts[parts.length - 2]! : '';

  // If previous part is a flag like `--filter`, complete the value
  if (prevPart.startsWith('--')) {
    const fieldName = prevPart.slice(2);
    return getFieldValueCompletions(cmd, fieldName, lastPart);
  }

  // If the current part starts with --, complete the flag name
  if (lastPart.startsWith('--')) {
    const prefix = lastPart.slice(2).toLowerCase();
    const fields = getSchemaFields(cmd.inputSchema);
    return fields
      .filter((f) => f.key.toLowerCase().startsWith(prefix))
      .map((f) => `--${f.key}`);
  }

  return [];
}

/**
 * Get value completions for an enum field.
 */
function getFieldValueCompletions(
  cmd: Command,
  fieldName: string,
  partial: string,
): string[] {
  const enumValues = getEnumValues(cmd.inputSchema, fieldName);
  if (!enumValues) return [];

  const prefix = partial.toLowerCase();
  return enumValues.filter((v) => v.toLowerCase().startsWith(prefix));
}

/**
 * Get the argument signature for a command, suitable for placeholder text.
 *
 * Returns a string like `--name <value> [--loud] [--filter <value>]`
 * where required args are bare and optional/defaulted args are in brackets.
 *
 * Returns null if the input doesn't match a known command or already has args.
 */
export function getCommandSignature(
  input: string,
  commands: Command[],
): string | null {
  const trimmed = input.trimEnd();
  if (!trimmed.startsWith('/')) return null;

  const parts = trimmed.split(/\s+/);
  // Only show signature when command is typed but no args yet
  if (parts.length !== 1) return null;

  const cmdName = parts[0]!.slice(1).toLowerCase();
  const cmd = commands.find((c) => c.id === cmdName);
  if (!cmd) return null;

  const fields = getSchemaFields(cmd.inputSchema);
  if (fields.length === 0) return null;

  return fields.map((f) => formatFieldSignature(f)).join(' ');
}

function formatFieldSignature(field: FieldInfo): string {
  const isRequired = !field.isOptional && !field.hasDefault;
  if (field.baseType === 'boolean') {
    return isRequired ? `--${field.key}` : `[--${field.key}]`;
  }
  const inner = `--${field.key} <${field.key}>`;
  return isRequired ? inner : `[${inner}]`;
}

/**
 * Extract enum values from a Zod schema field, if it's an enum type.
 * Unwraps Default/Optional/Nullable wrappers to find the underlying ZodEnum.
 */
function getEnumValues(
  schema: z.ZodType,
  fieldName: string,
): string[] | null {
  if (!(schema instanceof z.ZodObject)) return null;

  let field = (schema.shape as Record<string, z.ZodType>)[fieldName];
  if (!field) return null;

  // Unwrap Default/Optional/Nullable wrappers using public Zod v4 API
  const wrapperTypes = new Set(['default', 'optional', 'nullable']);
  let current = field as { type: string; def: { innerType?: unknown } };
  while (wrapperTypes.has(current.type) && current.def.innerType) {
    current = current.def.innerType as typeof current;
    field = current as unknown as z.ZodType;
  }

  // Check if it's a ZodEnum
  if (field instanceof z.ZodEnum) {
    return field.options as string[];
  }

  return null;
}
