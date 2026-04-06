import type { Goal, Note } from "../../gen/index.js";
import {
  insertGoalAtPosition,
  findGoal,
  getAncestors,
  getDescendants,
  isLeafGoal,
  hasBlockedGoals,
  getChildren,
  sortGoalsDepthFirst,
} from "../utils.js";
import { DuplicateGoalIdError } from "../../gen/workflow/error.js";
import type { WorkBreakdownStructureWorkflowOperations } from "@powerhousedao/agent-manager/document-models/work-breakdown-structure/v1";

export const workBreakdownStructureWorkflowOperations: WorkBreakdownStructureWorkflowOperations =
  {
    createGoalOperation(state, action) {
      // Check if a goal with this ID already exists
      const existingGoal = findGoal(state.goals, action.input.id);
      if (existingGoal) {
        throw new DuplicateGoalIdError(
          `Goal with ID ${action.input.id} already exists`,
        );
      }

      // Helper function to determine work type from ID pattern
      function getWorkTypeFromId(
        id: string,
      ): "SKILL" | "SCENARIO" | "TASK" | null {
        if (!id) return null;

        // Check if it's a skill (just words, no dots)
        if (!/\./.test(id)) {
          return "SKILL";
        }

        // Check if it's a scenario (skillId.XY pattern)
        if (/^[^.]+\.[A-Z0-9]{2,}$/i.test(id)) {
          return "SCENARIO";
        }

        // Check if it's a task (skillId.XY.numbers pattern)
        if (/^[^.]+\.[A-Z0-9]{2,}\.[0-9.]+$/i.test(id)) {
          return "TASK";
        }

        // Invalid format
        throw new Error(
          `Invalid work ID format: ${id}. Expected formats: 'skill' for skills, 'skill.XY' for scenarios, 'skill.XY.123' for tasks`,
        );
      }

      // Process instructions if provided
      let instructionsObj = null;
      if (action.input.instructions) {
        // Validate workType matches workId pattern if both are provided
        if (
          action.input.instructions.workId &&
          action.input.instructions.workType
        ) {
          const derivedType = getWorkTypeFromId(
            action.input.instructions.workId,
          );
          if (derivedType !== action.input.instructions.workType) {
            throw new Error(
              `Work type '${action.input.instructions.workType}' doesn't match ID pattern '${action.input.instructions.workId}' (expected ${derivedType})`,
            );
          }
        }

        // Auto-determine workType from workId if not provided
        const workType =
          action.input.instructions.workType ||
          (action.input.instructions.workId
            ? getWorkTypeFromId(action.input.instructions.workId)
            : null);

        instructionsObj = {
          comments: action.input.instructions.comments,
          workType: workType || null,
          workId: action.input.instructions.workId || null,
          context: action.input.instructions.contextJSON
            ? {
                format: "JSON" as const,
                data: action.input.instructions.contextJSON,
              }
            : null,
        };
      }

      // Create the new goal with required fields
      const newGoal: Goal = {
        id: action.input.id,
        description: action.input.description,
        status: action.input.assignee ? "DELEGATED" : "TODO", // Status based on assignee
        block: null,
        parentId: action.input.parentId || null,
        dependencies: action.input.dependsOn || [],
        isDraft: action.input.draft !== false, // Default to true unless explicitly set to false
        instructions: instructionsObj,
        notes: [] as Note[],
        assignee: action.input.assignee || null,
        outcome: null,
      };

      // Add initial note if provided
      if (action.input.initialNote) {
        const note: Note = {
          id: action.input.initialNote.id,
          note: action.input.initialNote.note,
          author: action.input.initialNote.author || null,
        };
        newGoal.notes.push(note);
      }

      // Insert goal at the specified position
      state.goals = insertGoalAtPosition(
        state.goals,
        newGoal,
        action.input.insertBefore || undefined,
      );

      // Sort to maintain depth-first traversal order
      state.goals = sortGoalsDepthFirst(state.goals);
    },
    delegateGoalOperation(state, action) {
      // Find target goal by ID
      const goal = findGoal(state.goals, action.input.id);
      if (!goal) {
        throw new Error(`Goal with ID ${action.input.id} not found`);
      }

      // Validate goal has no children (leaf node only)
      if (!isLeafGoal(state.goals, action.input.id)) {
        throw new Error(
          `Goal with ID ${action.input.id} has children and cannot be delegated`,
        );
      }

      // Update assignee field
      goal.assignee = action.input.assignee;

      // Change status to DELEGATED
      goal.status = "DELEGATED";
    },
    reportOnGoalOperation(state, action) {
      // Find target goal by ID
      const goal = findGoal(state.goals, action.input.id);
      if (!goal) {
        throw new Error(`Goal with ID ${action.input.id} not found`);
      }

      // Validate goal status is DELEGATED
      if (goal.status !== "DELEGATED") {
        throw new Error(
          `Goal with ID ${action.input.id} is not delegated and cannot be reported on`,
        );
      }

      // Add note to goal
      const note: Note = {
        id: action.input.note.id,
        note: action.input.note.note,
        author: action.input.note.author || null,
      };
      goal.notes.push(note);

      // If moveInReview is true, change status to IN_REVIEW
      if (action.input.moveInReview) {
        goal.status = "IN_REVIEW";
      }
    },
    markInProgressOperation(state, action) {
      // Find the target goal
      const goal = findGoal(state.goals, action.input.id);
      if (!goal) {
        throw new Error(`Goal with ID ${action.input.id} not found`);
      }

      // Update goal status to IN_PROGRESS
      goal.status = "IN_PROGRESS";

      // Clear assignee since status is not DELEGATED or IN_REVIEW
      goal.assignee = null;

      // Add optional note if provided
      if (action.input.note) {
        const note: Note = {
          id: action.input.note.id,
          note: action.input.note.note,
          author: action.input.note.author || null,
        };
        goal.notes.push(note);
      }

      // Propagate IN_PROGRESS up to all ancestors
      const ancestors = getAncestors(state.goals, action.input.id);
      for (const ancestor of ancestors) {
        // Update ancestors that are TODO, DELEGATED, COMPLETED, or WONT_DO
        // This allows resuming work on previously finished goals
        if (
          ancestor.status === "TODO" ||
          ancestor.status === "DELEGATED" ||
          ancestor.status === "COMPLETED" ||
          ancestor.status === "WONT_DO"
        ) {
          ancestor.status = "IN_PROGRESS";
          ancestor.assignee = null;
        }
      }
    },
    markCompletedOperation(state, action) {
      // Find the target goal
      const goal = findGoal(state.goals, action.input.id);
      if (!goal) {
        throw new Error(`Goal with ID ${action.input.id} not found`);
      }

      // Update goal status to COMPLETED
      goal.status = "COMPLETED";

      // Clear assignee since status is not DELEGATED or IN_REVIEW
      goal.assignee = null;

      // Add optional note if provided
      if (action.input.note) {
        const note: Note = {
          id: action.input.note.id,
          note: action.input.note.note,
          author: action.input.note.author || null,
        };
        goal.notes.push(note);
      }

      // Set optional outcome if provided
      if (action.input.outcome) {
        goal.outcome = {
          format: action.input.outcome.format,
          data: action.input.outcome.data,
        };
      }

      // Mark all unfinished child goals as COMPLETED
      const descendants = getDescendants(state.goals, action.input.id);
      for (const descendant of descendants) {
        // Only mark as completed if not already finished (COMPLETED or WONT_DO)
        if (
          descendant.status !== "COMPLETED" &&
          descendant.status !== "WONT_DO"
        ) {
          descendant.status = "COMPLETED";
          descendant.assignee = null;
        }
      }

      // Auto-complete parent if all siblings are finished
      autoCompleteParentIfAllChildrenFinished(state.goals, action.input.id);
    },
    markTodoOperation(state, action) {
      // Find the target goal
      const goal = findGoal(state.goals, action.input.id);
      if (!goal) {
        throw new Error(`Goal with ID ${action.input.id} not found`);
      }

      // Update goal status to TODO
      goal.status = "TODO";

      // Clear assignee since status is not DELEGATED or IN_REVIEW
      goal.assignee = null;

      // Add optional note if provided
      if (action.input.note) {
        const note: Note = {
          id: action.input.note.id,
          note: action.input.note.note,
          author: action.input.note.author || null,
        };
        goal.notes.push(note);
      }

      // Reset finished parents (COMPLETED or WONT_DO) to TODO
      const ancestors = getAncestors(state.goals, action.input.id);
      for (const ancestor of ancestors) {
        if (ancestor.status === "COMPLETED" || ancestor.status === "WONT_DO") {
          ancestor.status = "TODO";
          ancestor.assignee = null;
        }
      }
    },
    reportBlockedOperation(state, action) {
      // Find target goal by ID
      const goal = findGoal(state.goals, action.input.id);
      if (!goal) {
        throw new Error(`Goal with ID ${action.input.id} not found`);
      }

      // Update goal status to BLOCKED
      goal.status = "BLOCKED";

      // Clear assignee since status is not DELEGATED or IN_REVIEW
      goal.assignee = null;

      // Set the block reason with type and optional comment
      goal.block = {
        type: action.input.type,
        comment: action.input.comment || null,
      };

      // Update global isBlocked flag if this is the first blocked goal
      if (!state.isBlocked) {
        state.isBlocked = true;
      }
    },
    unblockGoalOperation(state, action) {
      // Find target goal by ID
      const goal = findGoal(state.goals, action.input.id);
      if (!goal) {
        throw new Error(`Goal with ID ${action.input.id} not found`);
      }

      // Validate goal status is BLOCKED
      if (goal.status !== "BLOCKED") {
        throw new Error(`Goal with ID ${action.input.id} is not blocked`);
      }

      // Store response as a note
      const note: Note = {
        id: action.input.response.id,
        note: `UNBLOCKED: ${action.input.response.note}`,
        author: action.input.response.author || null,
      };
      goal.notes.push(note);

      // Change status back to TODO (since we don't track previous status)
      goal.status = "TODO";

      // Clear assignee since status is not DELEGATED or IN_REVIEW
      goal.assignee = null;

      // Clear the block reason
      goal.block = null;

      // Check if any goals remain blocked and update global isBlocked flag
      state.isBlocked = hasBlockedGoals(state.goals);
    },
    markWontDoOperation(state, action) {
      // Find the target goal
      const goal = findGoal(state.goals, action.input.id);
      if (!goal) {
        throw new Error(`Goal with ID ${action.input.id} not found`);
      }

      // Update goal status to WONT_DO
      goal.status = "WONT_DO";

      // Clear assignee since status is not DELEGATED or IN_REVIEW
      goal.assignee = null;

      // Mark all unfinished child goals as WONT_DO
      const descendants = getDescendants(state.goals, action.input.id);
      for (const descendant of descendants) {
        // Only mark as WONT_DO if not already finished (COMPLETED or WONT_DO)
        if (
          descendant.status !== "COMPLETED" &&
          descendant.status !== "WONT_DO"
        ) {
          descendant.status = "WONT_DO";
          descendant.assignee = null;
        }
      }

      // Auto-complete parent if all siblings are finished
      autoCompleteParentIfAllChildrenFinished(state.goals, action.input.id);
    },
  };

/**
 * Helper function to check if all children of a parent are finished (COMPLETED or WONT_DO)
 * and if so, mark the parent as COMPLETED recursively
 */
function autoCompleteParentIfAllChildrenFinished(
  goals: Goal[],
  childId: string,
): void {
  const child = findGoal(goals, childId);
  if (!child || !child.parentId) return;

  const parent = findGoal(goals, child.parentId);
  if (!parent) return;

  // Don't auto-complete if parent is already finished
  if (parent.status === "COMPLETED" || parent.status === "WONT_DO") {
    return;
  }

  // Check if all children of the parent are finished
  const children = getChildren(goals, parent.id);
  const allChildrenFinished = children.every(
    (c) => c.status === "COMPLETED" || c.status === "WONT_DO",
  );

  if (allChildrenFinished) {
    // Mark parent as COMPLETED
    parent.status = "COMPLETED";
    parent.assignee = null;

    // Recursively check parent's parent
    autoCompleteParentIfAllChildrenFinished(goals, parent.id);
  }
}
