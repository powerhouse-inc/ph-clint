import type { Goal } from "../gen/schema/types.js";

/**
 * Find a goal by its ID
 */
export function findGoal(goals: Goal[], id: string): Goal | undefined {
  return goals.find((goal) => goal.id === id);
}

/**
 * Find the index of a goal by its ID
 */
export function findGoalIndex(goals: Goal[], id: string): number {
  return goals.findIndex((goal) => goal.id === id);
}

/**
 * Get all direct children of a goal
 */
export function getChildren(goals: Goal[], parentId: string): Goal[] {
  return goals.filter((goal) => goal.parentId === parentId);
}

/**
 * Get all descendants of a goal (recursive)
 */
export function getDescendants(goals: Goal[], id: string): Goal[] {
  const descendants: Goal[] = [];
  const children = getChildren(goals, id);

  for (const child of children) {
    descendants.push(child);
    descendants.push(...getDescendants(goals, child.id));
  }

  return descendants;
}

/**
 * Get all ancestors of a goal (up the chain)
 */
export function getAncestors(goals: Goal[], id: string): Goal[] {
  const ancestors: Goal[] = [];
  const goal = findGoal(goals, id);

  if (!goal || !goal.parentId) return ancestors;

  const parent = findGoal(goals, goal.parentId);
  if (parent) {
    ancestors.push(parent);
    ancestors.push(...getAncestors(goals, parent.id));
  }

  return ancestors;
}

/**
 * Check if a goal is a descendant of another goal
 */
export function isDescendant(
  goals: Goal[],
  ancestorId: string,
  descendantId: string,
): boolean {
  const descendants = getDescendants(goals, ancestorId);
  return descendants.some((d) => d.id === descendantId);
}

/**
 * Check if there are any blocked goals
 */
export function hasBlockedGoals(goals: Goal[]): boolean {
  return goals.some((goal) => goal.status === "BLOCKED");
}

/**
 * Check if a goal is a leaf node (has no children)
 */
export function isLeafGoal(goals: Goal[], id: string): boolean {
  return !goals.some((goal) => goal.parentId === id);
}

/**
 * Get siblings of a goal (goals with the same parent)
 */
export function getSiblings(goals: Goal[], id: string): Goal[] {
  const goal = findGoal(goals, id);
  if (!goal) return [];

  // For root goals, siblings are other root goals
  if (!goal.parentId) {
    return goals.filter((g) => !g.parentId && g.id !== id);
  }

  // For child goals, siblings share the same parent
  return goals.filter((g) => g.parentId === goal.parentId && g.id !== id);
}

/**
 * Insert a goal at a specific position among siblings
 */
export function insertGoalAtPosition(
  goals: Goal[],
  newGoal: Goal,
  insertBefore?: string,
): Goal[] {
  // If no insertBefore, append at the end
  if (!insertBefore) {
    return [...goals, newGoal];
  }

  // Find the position to insert
  const insertIndex = findGoalIndex(goals, insertBefore);

  // If insertBefore goal not found, append at end
  if (insertIndex === -1) {
    return [...goals, newGoal];
  }

  // Insert at the specific position
  const result = [...goals];
  result.splice(insertIndex, 0, newGoal);
  return result;
}

/**
 * Sort goals array to maintain depth-first traversal order.
 * This ensures parents always appear before their children in the flat array.
 * Within the same level, the original relative order is preserved.
 */
export function sortGoalsDepthFirst(goals: Goal[]): Goal[] {
  const result: Goal[] = [];
  const visited = new Set<string>();

  // Build a map for quick lookups
  const goalMap = new Map<string, Goal>();
  goals.forEach((goal) => goalMap.set(goal.id, goal));

  // Build children map for efficient traversal
  const childrenMap = new Map<string | null, Goal[]>();
  goals.forEach((goal) => {
    const parentKey = goal.parentId || null;
    if (!childrenMap.has(parentKey)) {
      childrenMap.set(parentKey, []);
    }
    childrenMap.get(parentKey)!.push(goal);
  });

  // Depth-first traversal starting from roots
  function traverse(parentId: string | null) {
    const children = childrenMap.get(parentId) || [];

    // Process children in their current order (preserves relative positions)
    for (const child of children) {
      if (!visited.has(child.id)) {
        visited.add(child.id);
        result.push(child);
        // Recursively traverse this goal's children
        traverse(child.id);
      }
    }
  }

  // Start traversal from root goals (parentId === null)
  traverse(null);

  // Handle any orphaned goals (whose parents don't exist in the array)
  // This shouldn't happen in well-formed data but we handle it defensively
  goals.forEach((goal) => {
    if (!visited.has(goal.id)) {
      // This goal's parent doesn't exist, treat it as a root
      visited.add(goal.id);
      result.push(goal);
      traverse(goal.id);
    }
  });

  return result;
}
