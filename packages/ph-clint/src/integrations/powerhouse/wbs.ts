/**
 * Helpers for driving a `powerhouse/work-breakdown-structure` document
 * (from `@powerhousedao/agent-manager`) inside the routine loop.
 *
 * These helpers are duck-typed against the WBS state shape so this module
 * can stay decoupled from the document-models package.
 */

/** Status of a WBS goal. */
export type WbsGoalStatus =
  | 'TODO'
  | 'IN_PROGRESS'
  | 'IN_REVIEW'
  | 'DELEGATED'
  | 'COMPLETED'
  | 'WONT_DO'
  | 'BLOCKED';

/** A WBS goal — minimal shape needed by these helpers. */
export interface WbsGoal {
  id: string;
  status: WbsGoalStatus;
  parentId?: string | null;
  isDraft: boolean;
  dependencies: string[];
  instructions?: {
    workType?: 'SKILL' | 'SCENARIO' | 'TASK' | null;
    workId?: string | null;
  } | null;
}

/** Minimal WBS state shape. */
export interface WbsState {
  goals: WbsGoal[];
}

/**
 * The next eligible work, with the full ancestor chain so callers can
 * resolve skill/scenario/task ids by walking up the tree.
 */
export interface NextWbsWork {
  /** The leaf goal selected for execution. */
  goal: WbsGoal;
  /** Root-to-leaf chain of goals (inclusive). */
  goalChain: WbsGoal[];
}

/** Goals that are eligible to run right now. */
const isEligible = (g: WbsGoal): boolean =>
  !g.isDraft && (g.status === 'TODO' || g.status === 'IN_PROGRESS');

/** Goals whose dependencies are satisfied (all listed deps are COMPLETED). */
function dependenciesSatisfied(goal: WbsGoal, byId: Map<string, WbsGoal>): boolean {
  if (!goal.dependencies || goal.dependencies.length === 0) return true;
  for (const depId of goal.dependencies) {
    const dep = byId.get(depId);
    if (!dep) return false;
    if (dep.status !== 'COMPLETED' && dep.status !== 'WONT_DO') return false;
  }
  return true;
}

/**
 * Find the next leaf goal eligible for execution.
 *
 * Returns the first leaf (no children in the tree) whose status is TODO or
 * IN_PROGRESS, isn't a draft, and whose dependencies are satisfied. Walks
 * the tree depth-first in `goals` array order.
 *
 * Returns `null` if nothing is eligible.
 */
export function findNextLeafGoal(state: WbsState): NextWbsWork | null {
  const byId = new Map<string, WbsGoal>();
  for (const g of state.goals) byId.set(g.id, g);

  const childrenByParent = new Map<string | null, WbsGoal[]>();
  for (const g of state.goals) {
    const key = g.parentId ?? null;
    const list = childrenByParent.get(key) ?? [];
    list.push(g);
    childrenByParent.set(key, list);
  }

  const isLeaf = (g: WbsGoal): boolean => {
    const children = childrenByParent.get(g.id) ?? [];
    return children.length === 0;
  };

  // Depth-first traversal from roots, in array order.
  const stack: WbsGoal[] = [...(childrenByParent.get(null) ?? [])].reverse();
  const visited = new Set<string>();
  while (stack.length > 0) {
    const goal = stack.pop()!;
    if (visited.has(goal.id)) continue;
    visited.add(goal.id);

    if (isLeaf(goal)) {
      if (isEligible(goal) && dependenciesSatisfied(goal, byId)) {
        return { goal, goalChain: ancestorChain(goal, byId) };
      }
      continue;
    }
    // Skip subtree rooted at finished/won't-do goals.
    if (goal.status === 'COMPLETED' || goal.status === 'WONT_DO') continue;

    const children = (childrenByParent.get(goal.id) ?? []).slice().reverse();
    for (const child of children) stack.push(child);
  }
  return null;
}

/** Build the root-to-leaf ancestor chain for a goal. */
export function ancestorChain(goal: WbsGoal, byId: Map<string, WbsGoal>): WbsGoal[] {
  const chain: WbsGoal[] = [];
  let current: WbsGoal | undefined = goal;
  const seen = new Set<string>();
  while (current) {
    if (seen.has(current.id)) break; // defensive against bad data
    seen.add(current.id);
    chain.unshift(current);
    if (!current.parentId) break;
    current = byId.get(current.parentId);
  }
  return chain;
}

/**
 * Resolved capability: the skill / scenario / task ids that should drive
 * execution for a given leaf goal. All three are looked up by walking up
 * the ancestor chain — the topmost SKILL ancestor wins, etc.
 */
export interface ResolvedSkillWork {
  /** The skill id to invoke (matches a registered skill command). */
  skillId: string;
  /** Optional scenario id (from a SCENARIO ancestor). */
  scenarioId?: string;
  /** Optional task id (from the TASK leaf). */
  taskId?: string;
  /** The original goal id so the caller can mark progress. */
  goalId: string;
}

/**
 * Walk the ancestor chain top-down and pull out skill/scenario/task ids
 * from `instructions.workType` + `instructions.workId`.
 *
 * Returns null if no SKILL ancestor is found (meaning the goal isn't
 * runnable as a skill work-item).
 */
export function resolveSkillFromGoal(work: NextWbsWork): ResolvedSkillWork | null {
  let skillId: string | undefined;
  let scenarioId: string | undefined;
  let taskId: string | undefined;

  for (const g of work.goalChain) {
    const t = g.instructions?.workType;
    const id = g.instructions?.workId;
    if (!t || !id) continue;
    if (t === 'SKILL' && !skillId) skillId = id;
    else if (t === 'SCENARIO' && !scenarioId) scenarioId = id;
    else if (t === 'TASK' && !taskId) taskId = id;
  }

  if (!skillId) return null;
  return { skillId, scenarioId, taskId, goalId: work.goal.id };
}
