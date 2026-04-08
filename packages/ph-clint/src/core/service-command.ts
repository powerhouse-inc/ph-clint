import { z } from 'zod';
import type { Command, CommandContext, ServiceStatus } from './types.js';

/**
 * Format a service status line for display.
 */
export function formatStatus(s: ServiceStatus): string {
  const icon =
    s.status === 'ready' ? '●' :
    s.status === 'starting' ? '◐' :
    s.status === 'failed' ? '✗' :
    s.status === 'stopping' ? '◑' :
    '○';
  const parts = [`${icon} ${s.label} [${s.status}]`];
  if (s.pid) parts.push(`pid ${s.pid}`);
  if (s.endpoints) {
    const ep = Object.entries(s.endpoints).map(([k, v]) => `${k}=${v}`);
    if (ep.length) parts.push(ep.join(' '));
  }
  if (s.error) parts.push(`error: ${s.error}`);
  if (s.restartAttempt) parts.push(`restart #${s.restartAttempt}`);
  return parts.join('  ');
}

/**
 * Create the built-in `svc` command for CLIs with service definitions.
 *
 * Supports actions: up, down, ps, logs, restart.
 * When no --id is given, up/down/restart apply to all services.
 * The `--manage` flag opens an interactive panel (intercepted by the REPL
 * session before execute() runs, so execute() never sees it).
 */
export function createSvcCommand(serviceIds: string[]): Command {
  const inputSchema = z.object({
    action: z.enum(['up', 'down', 'ps', 'logs', 'restart']).default('ps').describe(
      'Action: up (start), down (stop), ps (status), logs (tail), restart',
    ),
    id: z.string().optional().describe('Service ID (omit for all services)'),
    lines: z.coerce.number().default(50).describe('Number of log lines to show'),
    manage: z.boolean().default(false).describe('Open interactive management panel (REPL only)'),
  });

  return {
    id: 'svc',
    description: 'Manage background services (up/down/ps/logs/restart/--manage)',
    inputSchema,
    execute: async (input, context: CommandContext) => {
      const { action, id, lines } = input as {
        action: 'up' | 'down' | 'ps' | 'logs' | 'restart';
        id?: string;
        lines: number;
        manage: boolean;
      };

      const services = context.services;
      if (!services) {
        throw new Error('No services configured');
      }

      switch (action) {
        case 'ps': {
          const all = services.list();
          if (all.length === 0) return { text: 'No services defined' };
          return { text: all.map(formatStatus).join('\n'), data: all };
        }

        case 'up': {
          const targets = id ? [id] : serviceIds;
          const results: string[] = [];
          for (const svcId of targets) {
            try {
              await services.start(svcId);
              const status = services.list().find((s) => s.id === svcId);
              results.push(formatStatus(status!));
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : String(err);
              results.push(`✗ ${svcId}: ${msg}`);
            }
          }
          return { text: results.join('\n') };
        }

        case 'down': {
          const targets = id ? [id] : serviceIds;
          const results: string[] = [];
          for (const svcId of targets) {
            try {
              await services.stop(svcId);
              results.push(`■ ${svcId} stopped`);
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : String(err);
              results.push(`✗ ${svcId}: ${msg}`);
            }
          }
          return { text: results.join('\n') };
        }

        case 'restart': {
          const targets = id ? [id] : serviceIds;
          const results: string[] = [];
          for (const svcId of targets) {
            try {
              // Stop if running
              const status = services.list().find((s) => s.id === svcId);
              if (status && (status.status === 'ready' || status.status === 'starting')) {
                await services.stop(svcId);
              }
              await services.start(svcId);
              const newStatus = services.list().find((s) => s.id === svcId);
              results.push(formatStatus(newStatus!));
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : String(err);
              results.push(`✗ ${svcId}: ${msg}`);
            }
          }
          return { text: results.join('\n') };
        }

        case 'logs': {
          if (!id) {
            // Show logs for all services, labeled
            const all = services.list();
            const results: string[] = [];
            for (const s of all) {
              const logContent = services.logs(s.id, lines);
              if (logContent.trim()) {
                results.push(`── ${s.label} (${s.id}) ──`);
                results.push(logContent);
                results.push('');
              }
            }
            return { text: results.join('\n') || 'No logs available' };
          }
          return { text: services.logs(id, lines) };
        }
      }
    },
  };
}
