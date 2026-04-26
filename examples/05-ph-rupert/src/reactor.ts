import { buildDefaultReactor, type ReactorContext, type ReactorSetupContext } from '@powerhousedao/ph-clint';
import type { DocumentModelModule } from 'document-model';
import {
  WorkBreakdownStructure,
  AgentInbox,
} from '@powerhousedao/agent-manager/document-models';

/**
 * Reactor configuration for ph-rupert.
 *
 * Loads the agent-manager document models (WBS + agent-inbox) so the
 * inbox/WBS triggers see real document changes via reactor subscriptions.
 *
 * Drive defaults: a single 'default' personal drive. The tenant's actual
 * drive id is wired in via env (set by the chart) — until then, the agent
 * runs against a local development drive.
 */
export async function buildRupertReactor(
  ctx: ReactorSetupContext,
): Promise<ReactorContext> {
  // The agent-manager modules are typed against their specific PH state
  // shapes; buildDefaultReactor expects the generic DocumentModelModule.
  // The cast is safe — reactor invokes them via their reducer/action API.
  const documentModels = [WorkBreakdownStructure, AgentInbox] as unknown as DocumentModelModule[];
  return buildDefaultReactor(ctx, {
    documentModels,
    drive: { name: 'rupert' },
    subscriptions: {
      documentTypes: [
        'powerhouse/agent-inbox',
        'powerhouse/work-breakdown-structure',
      ],
    },
  });
}
