import type { Goal } from "../../gen/index.js";
import {
  findGoal,
  findGoalIndex,
  isDescendant,
  sortGoalsDepthFirst,
} from "../utils.js";
import type { WorkBreakdownStructureHierarchyOperations } from "@powerhousedao/agent-manager/document-models/work-breakdown-structure/v1";

export const workBreakdownStructureHierarchyOperations: WorkBreakdownStructureHierarchyOperations =
  {
    reorderOperation(state, action) {
      // Find target goal by ID
      const goal = findGoal(state.goals, action.input.goalId);
      if (!goal) {
        throw new Error(`Goal with ID ${action.input.goalId} not found`);
      }

      // If new parent is specified, validate it's not a descendant (prevent cycles)
      if (action.input.parentId !== undefined) {
        // Check if the new parent exists (unless it's null for root)
        if (action.input.parentId !== null) {
          const newParent = findGoal(state.goals, action.input.parentId);
          if (!newParent) {
            throw new Error(
              `Parent goal with ID ${action.input.parentId} not found`,
            );
          }

          // Prevent circular reference - can't move a goal under its own descendant
          if (
            isDescendant(
              state.goals,
              action.input.goalId,
              action.input.parentId,
            )
          ) {
            throw new Error(
              `Cannot move goal ${action.input.goalId} under its own descendant ${action.input.parentId}`,
            );
          }
        }

        // Update the goal's parentId
        goal.parentId = action.input.parentId;
      }

      // Handle position reordering if insertBefore is specified
      if (action.input.insertBefore !== undefined) {
        // Remove goal from current position
        const currentIndex = findGoalIndex(state.goals, action.input.goalId);
        if (currentIndex !== -1) {
          const [removedGoal] = state.goals.splice(currentIndex, 1);

          // Find the position to insert
          if (action.input.insertBefore === null) {
            // Insert at the end
            state.goals.push(removedGoal);
          } else {
            const insertIndex = findGoalIndex(
              state.goals,
              action.input.insertBefore,
            );
            if (insertIndex === -1) {
              // If insertBefore goal not found, append at end
              state.goals.push(removedGoal);
            } else {
              // Insert at the specific position
              state.goals.splice(insertIndex, 0, removedGoal);
            }
          }
        }
      }

      // Sort to maintain depth-first traversal order
      state.goals = sortGoalsDepthFirst(state.goals);
    },
    addDependenciesOperation(state, action) {
      // Find target goal by ID
      const goal = findGoal(state.goals, action.input.goalId);
      if (!goal) {
        throw new Error(`Goal with ID ${action.input.goalId} not found`);
      }

      // Validate each dependency exists
      for (const depId of action.input.dependsOn) {
        const dependency = findGoal(state.goals, depId);
        if (!dependency) {
          throw new Error(`Dependency goal with ID ${depId} not found`);
        }

        // Check no circular dependencies (goal can't depend on its descendants)
        if (isDescendant(state.goals, action.input.goalId, depId)) {
          throw new Error(
            `Cannot add dependency ${depId} as it is a descendant of ${action.input.goalId}`,
          );
        }

        // Also prevent depending on self
        if (depId === action.input.goalId) {
          throw new Error(
            `Goal ${action.input.goalId} cannot depend on itself`,
          );
        }
      }

      // Add new dependencies to existing array (avoid duplicates)
      for (const depId of action.input.dependsOn) {
        if (!goal.dependencies.includes(depId)) {
          goal.dependencies.push(depId);
        }
      }
    },
    removeDependenciesOperation(state, action) {
      // Find target goal by ID
      const goal = findGoal(state.goals, action.input.goalId);
      if (!goal) {
        throw new Error(`Goal with ID ${action.input.goalId} not found`);
      }

      // Filter out specified dependencies from array
      goal.dependencies = goal.dependencies.filter(
        (depId) => !action.input.dependencies.includes(depId),
      );
    },
  };
