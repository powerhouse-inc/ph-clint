import type { Note } from "../../gen/index.js";
import { findGoal, getDescendants } from "../utils.js";
import type { WorkBreakdownStructureDocumentationOperations } from "@powerhousedao/agent-manager/document-models/work-breakdown-structure/v1";

export const workBreakdownStructureDocumentationOperations: WorkBreakdownStructureDocumentationOperations =
  {
    updateDescriptionOperation(state, action) {
      // Find target goal by ID
      const goal = findGoal(state.goals, action.input.goalId);
      if (!goal) {
        throw new Error(`Goal with ID ${action.input.goalId} not found`);
      }

      // Update description field
      goal.description = action.input.description;
    },
    updateInstructionsOperation(state, action) {
      // Find target goal by ID
      const goal = findGoal(state.goals, action.input.goalId);
      if (!goal) {
        throw new Error(`Goal with ID ${action.input.goalId} not found`);
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

      // Validate workType matches workId pattern if both are provided
      if (
        action.input.instructions.workId &&
        action.input.instructions.workType
      ) {
        const derivedType = getWorkTypeFromId(action.input.instructions.workId);
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

      // Update instructions field with the new GoalInstructions structure
      goal.instructions = {
        comments: action.input.instructions.comments,
        workType: workType || null,
        workId: action.input.instructions.workId || null,
        context: action.input.instructions.contextJSON
          ? { format: "JSON", data: action.input.instructions.contextJSON }
          : null,
      };
    },
    addNoteOperation(state, action) {
      // Find target goal by ID
      const goal = findGoal(state.goals, action.input.goalId);
      if (!goal) {
        throw new Error(`Goal with ID ${action.input.goalId} not found`);
      }

      // Create note object and add to notes array
      const note: Note = {
        id: action.input.noteId,
        note: action.input.note,
        author: action.input.author || null,
      };
      goal.notes.push(note);
    },
    clearInstructionsOperation(state, action) {
      // Find target goal by ID
      const goal = findGoal(state.goals, action.input.goalId);
      if (!goal) {
        throw new Error(`Goal with ID ${action.input.goalId} not found`);
      }

      // Set instructions to null
      goal.instructions = null;
    },
    clearNotesOperation(state, action) {
      // Find target goal by ID
      const goal = findGoal(state.goals, action.input.goalId);
      if (!goal) {
        throw new Error(`Goal with ID ${action.input.goalId} not found`);
      }

      // Empty the notes array
      goal.notes = [];
    },
    removeNoteOperation(state, action) {
      // Find target goal by ID
      const goal = findGoal(state.goals, action.input.goalId);
      if (!goal) {
        throw new Error(`Goal with ID ${action.input.goalId} not found`);
      }

      // Find and remove note by ID
      const noteIndex = goal.notes.findIndex(
        (n) => n.id === action.input.noteId,
      );
      if (noteIndex === -1) {
        throw new Error(`Note with ID ${action.input.noteId} not found`);
      }
      goal.notes.splice(noteIndex, 1);
    },
    markAsDraftOperation(state, action) {
      // Find target goal by ID
      const goal = findGoal(state.goals, action.input.goalId);
      if (!goal) {
        throw new Error(`Goal with ID ${action.input.goalId} not found`);
      }

      // Set isDraft to true for the goal
      goal.isDraft = true;

      // Recursively set isDraft to true for all descendants
      const descendants = getDescendants(state.goals, action.input.goalId);
      for (const descendant of descendants) {
        descendant.isDraft = true;
      }
    },
    markAsReadyOperation(state, action) {
      // Find target goal by ID
      const goal = findGoal(state.goals, action.input.goalId);
      if (!goal) {
        throw new Error(`Goal with ID ${action.input.goalId} not found`);
      }

      // Set isDraft to false for the goal
      goal.isDraft = false;

      // Recursively set isDraft to false for all descendants
      const descendants = getDescendants(state.goals, action.input.goalId);
      for (const descendant of descendants) {
        descendant.isDraft = false;
      }
    },
    setOwnerOperation(state, action) {
      // Set the owner field in the global state
      state.owner = action.input.owner;
    },
  };
