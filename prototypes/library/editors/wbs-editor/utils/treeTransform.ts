import type { Goal } from "@powerhousedao/agent-manager/document-models/work-breakdown-structure";

export interface TreeGoal extends Goal {
  data?: TreeGoal[];
  open?: boolean;
}

/**
 * Transforms a flat array of goals with parentId relationships into a hierarchical tree structure
 * suitable for SVAR Grid's tree display
 */
export function flatToTree(goals: Goal[]): TreeGoal[] {
  const goalMap = new Map<string, TreeGoal>();
  const rootGoals: TreeGoal[] = [];

  // First pass: create a map of all goals
  goals.forEach((goal) => {
    goalMap.set(goal.id, { ...goal, data: [], open: true });
  });

  // Second pass: build the tree structure
  goals.forEach((goal) => {
    const treeGoal = goalMap.get(goal.id)!;

    if (goal.parentId === null) {
      // This is a root goal
      rootGoals.push(treeGoal);
    } else {
      // This goal has a parent
      const parent = goal.parentId && goalMap.get(goal.parentId);
      if (parent) {
        if (!parent.data) {
          parent.data = [];
        }
        parent.data.push(treeGoal);
      } else {
        // Parent not found, treat as root
        console.warn(`Parent ${goal.parentId} not found for goal ${goal.id}`);
        rootGoals.push(treeGoal);
      }
    }
  });

  return rootGoals;
}

/**
 * Finds a goal by ID in the tree structure
 */
export function findGoalInTree(
  tree: TreeGoal[],
  goalId: string,
): TreeGoal | null {
  for (const goal of tree) {
    if (goal.id === goalId) {
      return goal;
    }
    if (goal.data && goal.data.length > 0) {
      const found = findGoalInTree(goal.data, goalId);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Counts total goals in tree including nested ones
 */
export function countGoalsInTree(tree: TreeGoal[]): number {
  let count = tree.length;
  for (const goal of tree) {
    if (goal.data && goal.data.length > 0) {
      count += countGoalsInTree(goal.data);
    }
  }
  return count;
}
