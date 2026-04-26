import {
  createDocumentChangeTrigger,
  findNextLeafGoal,
  resolveSkillFromGoal,
  type WorkItem,
  type WbsState,
} from '@powerhousedao/ph-clint';

/**
 * WBS trigger — fires when a `powerhouse/work-breakdown-structure` document
 * changes (status update, new goal added, etc.).
 *
 * Strategy: pick the next eligible leaf goal via `findNextLeafGoal`,
 * resolve `instructions.workType + workId` up the ancestor chain into a
 * concrete `{skillId, scenarioId?, taskId?}`, and emit a `'skill'`
 * work-item. The routine's skill dispatch invokes the agent against the
 * resolved skill.
 *
 * Callbacks mark the goal COMPLETED on success or BLOCKED on failure.
 * Action dispatch is a TODO until the rupert package depends on
 * @powerhousedao/agent-manager creators.
 */
export const wbsGoalTrigger = createDocumentChangeTrigger({
  id: 'wbs-goal',
  documentType: 'powerhouse/work-breakdown-structure',
  async onChange(doc, ctx): Promise<WorkItem | null> {
    const reactor = await ctx.reactor();
    if (!reactor) return null;

    const state = (doc as { state?: { global?: WbsState } }).state?.global;
    if (!state) return null;

    const work = findNextLeafGoal(state);
    if (!work) return null;

    const resolved = resolveSkillFromGoal(work);
    if (!resolved) {
      ctx.context.log?.warn?.(
        `[wbs] leaf goal ${work.goal.id} has no SKILL ancestor — skipping`,
      );
      return null;
    }

    const wbsDocId = (doc as { header?: { id?: string } }).header?.id;

    return {
      type: 'skill',
      params: {
        skillId: resolved.skillId,
        prompt: `Execute goal "${work.goal.id}". See WBS for context.`,
        inputs: {
          wbsDocId,
          goalId: resolved.goalId,
          scenarioId: resolved.scenarioId,
          taskId: resolved.taskId,
        },
      },
      callbacks: {
        onSuccess: (result) => {
          // TODO: reactor.dispatch(MARK_COMPLETED { id: resolved.goalId, note, outcome })
          // Requires markCompleted creator from
          // @powerhousedao/agent-manager/document-models/work-breakdown-structure.
          ctx.context.log?.info?.(
            `[wbs] goal ${resolved.goalId} done — outcome: ${typeof result === 'string' ? result.slice(0, 80) : '<non-string>'}`,
          );
        },
        onFailure: (err) => {
          // TODO: reactor.dispatch(REPORT_BLOCKED { id, type: 'OTHER', comment: err.message })
          ctx.context.log?.error?.(
            `[wbs] goal ${resolved.goalId} blocked: ${err.message}`,
          );
        },
      },
    };
  },
});
