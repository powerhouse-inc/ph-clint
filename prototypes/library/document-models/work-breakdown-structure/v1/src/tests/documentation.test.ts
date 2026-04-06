/**
 * This is a scaffold file meant for customization:
 * - change it by adding new tests or modifying the existing ones
 */

import { describe, it, expect } from "vitest";
import {
  reducer,
  utils,
  createGoal,
  updateDescription,
  updateInstructions,
  addNote,
  clearInstructions,
  clearNotes,
  removeNote,
  markAsDraft,
  markAsReady,
} from "@powerhousedao/agent-manager/document-models/work-breakdown-structure";

describe("Documentation Operations", () => {
  describe("UPDATE_DESCRIPTION", () => {
    it("should update goal description", () => {
      const document = utils.createDocument();

      // Create a goal
      let updatedDocument = reducer(
        document,
        createGoal({
          id: "goal-1",
          description: "Original description",
          instructions: undefined,
          draft: false,
          parentId: null,
          insertBefore: null,
          assignee: null,
          dependsOn: [],
          initialNote: null,
          metaData: null,
        }),
      );

      // Update description
      updatedDocument = reducer(
        updatedDocument,
        updateDescription({
          goalId: "goal-1",
          description: "Updated description",
        }),
      );

      const goal = updatedDocument.state.global.goals[0];
      expect(goal.description).toBe("Updated description");
    });

    it("should fail when goal does not exist", () => {
      const document = utils.createDocument();

      const result = reducer(
        document,
        updateDescription({
          goalId: "nonexistent",
          description: "New description",
        }),
      );

      const lastOperation =
        result.operations.global[result.operations.global.length - 1];
      expect(lastOperation.error).toBeDefined();
    });
  });

  describe("UPDATE_INSTRUCTIONS", () => {
    it("should update goal instructions", () => {
      const document = utils.createDocument();

      // Create a goal
      let updatedDocument = reducer(
        document,
        createGoal({
          id: "goal-1",
          description: "Test goal",
          instructions: {
            comments: "Original instructions",
            workType: undefined,
            workId: undefined,
            contextJSON: undefined,
          },
          draft: false,
          parentId: null,
          insertBefore: null,
          assignee: null,
          dependsOn: [],
          initialNote: null,
          metaData: null,
        }),
      );

      // Update instructions
      updatedDocument = reducer(
        updatedDocument,
        updateInstructions({
          goalId: "goal-1",
          instructions: {
            comments: "Updated instructions",
            workType: undefined,
            workId: undefined,
            contextJSON: undefined,
          },
        }),
      );

      const goal = updatedDocument.state.global.goals[0];
      expect(goal.instructions).toEqual({
        comments: "Updated instructions",
        workType: null,
        workId: null,
        context: null,
      });
    });

    it("should set instructions when previously null", () => {
      const document = utils.createDocument();

      // Create a goal without instructions
      let updatedDocument = reducer(
        document,
        createGoal({
          id: "goal-1",
          description: "Test goal",
          instructions: undefined,
          draft: false,
          parentId: null,
          insertBefore: null,
          assignee: null,
          dependsOn: [],
          initialNote: null,
          metaData: null,
        }),
      );

      // Set instructions
      updatedDocument = reducer(
        updatedDocument,
        updateInstructions({
          goalId: "goal-1",
          instructions: {
            comments: "New instructions",
            workType: undefined,
            workId: undefined,
            contextJSON: undefined,
          },
        }),
      );

      const goal = updatedDocument.state.global.goals[0];
      expect(goal.instructions).toEqual({
        comments: "New instructions",
        workType: null,
        workId: null,
        context: null,
      });
    });
  });

  describe("ADD_NOTE", () => {
    it("should add a note to a goal", () => {
      const document = utils.createDocument();

      // Create a goal
      let updatedDocument = reducer(
        document,
        createGoal({
          id: "goal-1",
          description: "Test goal",
          instructions: undefined,
          draft: false,
          parentId: null,
          insertBefore: null,
          assignee: null,
          dependsOn: [],
          initialNote: null,
          metaData: null,
        }),
      );

      // Add a note
      updatedDocument = reducer(
        updatedDocument,
        addNote({
          goalId: "goal-1",
          noteId: "note-1",
          note: "This is a test note",
          author: "Test User",
        }),
      );

      const goal = updatedDocument.state.global.goals[0];
      expect(goal.notes).toHaveLength(1);
      expect(goal.notes[0].note).toBe("This is a test note");
      expect(goal.notes[0].author).toBe("Test User");
      expect(goal.notes[0].id).toBe("note-1");
    });

    it("should add multiple notes", () => {
      const document = utils.createDocument();

      // Create a goal
      let updatedDocument = reducer(
        document,
        createGoal({
          id: "goal-1",
          description: "Test goal",
          instructions: undefined,
          draft: false,
          parentId: null,
          insertBefore: null,
          assignee: null,
          dependsOn: [],
          initialNote: null,
          metaData: null,
        }),
      );

      // Add first note
      updatedDocument = reducer(
        updatedDocument,
        addNote({
          goalId: "goal-1",
          noteId: "note-1",
          note: "First note",
          author: null,
        }),
      );

      // Add second note
      updatedDocument = reducer(
        updatedDocument,
        addNote({
          goalId: "goal-1",
          noteId: "note-2",
          note: "Second note",
          author: "Another User",
        }),
      );

      const goal = updatedDocument.state.global.goals[0];
      expect(goal.notes).toHaveLength(2);
      expect(goal.notes[0].note).toBe("First note");
      expect(goal.notes[1].note).toBe("Second note");
    });
  });

  describe("REMOVE_NOTE", () => {
    it("should remove a specific note", () => {
      const document = utils.createDocument();

      // Create a goal with an initial note
      let updatedDocument = reducer(
        document,
        createGoal({
          id: "goal-1",
          description: "Test goal",
          instructions: undefined,
          draft: false,
          parentId: null,
          insertBefore: null,
          assignee: null,
          dependsOn: [],
          initialNote: {
            id: "note-1",
            note: "Initial note",
            author: "Author",
          },
          metaData: null,
        }),
      );

      // Add another note
      updatedDocument = reducer(
        updatedDocument,
        addNote({
          goalId: "goal-1",
          noteId: "note-2",
          note: "Second note",
          author: null,
        }),
      );

      // Remove the first note
      updatedDocument = reducer(
        updatedDocument,
        removeNote({
          goalId: "goal-1",
          noteId: "note-1",
        }),
      );

      const goal = updatedDocument.state.global.goals[0];
      expect(goal.notes).toHaveLength(1);
      expect(goal.notes[0].note).toBe("Second note");
    });

    it("should fail when note does not exist", () => {
      const document = utils.createDocument();

      // Create a goal
      const updatedDocument = reducer(
        document,
        createGoal({
          id: "goal-1",
          description: "Test goal",
          instructions: undefined,
          draft: false,
          parentId: null,
          insertBefore: null,
          assignee: null,
          dependsOn: [],
          initialNote: null,
          metaData: null,
        }),
      );

      // Try to remove non-existent note
      const result = reducer(
        updatedDocument,
        removeNote({
          goalId: "goal-1",
          noteId: "nonexistent",
        }),
      );

      const lastOperation =
        result.operations.global[result.operations.global.length - 1];
      expect(lastOperation.error).toBeDefined();
    });
  });

  describe("CLEAR_INSTRUCTIONS", () => {
    it("should clear goal instructions", () => {
      const document = utils.createDocument();

      // Create a goal with instructions
      let updatedDocument = reducer(
        document,
        createGoal({
          id: "goal-1",
          description: "Test goal",
          instructions: {
            comments: "Some instructions",
            workType: undefined,
            workId: undefined,
            contextJSON: undefined,
          },
          draft: false,
          parentId: null,
          insertBefore: null,
          assignee: null,
          dependsOn: [],
          initialNote: null,
          metaData: null,
        }),
      );

      // Clear instructions
      updatedDocument = reducer(
        updatedDocument,
        clearInstructions({
          goalId: "goal-1",
        }),
      );

      const goal = updatedDocument.state.global.goals[0];
      expect(goal.instructions).toBeNull();
    });
  });

  describe("CLEAR_NOTES", () => {
    it("should clear all notes", () => {
      const document = utils.createDocument();

      // Create a goal with notes
      let updatedDocument = reducer(
        document,
        createGoal({
          id: "goal-1",
          description: "Test goal",
          instructions: undefined,
          draft: false,
          parentId: null,
          insertBefore: null,
          assignee: null,
          dependsOn: [],
          initialNote: {
            id: "note-1",
            note: "Initial note",
            author: "Author",
          },
          metaData: null,
        }),
      );

      // Add more notes
      updatedDocument = reducer(
        updatedDocument,
        addNote({
          goalId: "goal-1",
          noteId: "note-2",
          note: "Second note",
          author: null,
        }),
      );

      updatedDocument = reducer(
        updatedDocument,
        addNote({
          goalId: "goal-1",
          noteId: "note-3",
          note: "Third note",
          author: null,
        }),
      );

      // Clear all notes
      updatedDocument = reducer(
        updatedDocument,
        clearNotes({
          goalId: "goal-1",
        }),
      );

      const goal = updatedDocument.state.global.goals[0];
      expect(goal.notes).toHaveLength(0);
    });
  });

  describe("MARK_AS_DRAFT", () => {
    it("should mark goal as draft", () => {
      const document = utils.createDocument();

      // Create a non-draft goal
      let updatedDocument = reducer(
        document,
        createGoal({
          id: "goal-1",
          description: "Test goal",
          instructions: undefined,
          draft: false,
          parentId: null,
          insertBefore: null,
          assignee: null,
          dependsOn: [],
          initialNote: null,
          metaData: null,
        }),
      );

      // Mark as draft
      updatedDocument = reducer(
        updatedDocument,
        markAsDraft({
          goalId: "goal-1",
        }),
      );

      const goal = updatedDocument.state.global.goals[0];
      expect(goal.isDraft).toBe(true);
    });

    it("should recursively mark all child goals as draft", () => {
      const document = utils.createDocument();

      // Create parent goal
      let updatedDocument = reducer(
        document,
        createGoal({
          id: "parent-goal",
          description: "Parent goal",
          instructions: undefined,
          draft: false,
          parentId: null,
          insertBefore: null,
          assignee: null,
          dependsOn: [],
          initialNote: null,
          metaData: null,
        }),
      );

      // Create child goals
      updatedDocument = reducer(
        updatedDocument,
        createGoal({
          id: "child-1",
          description: "Child 1",
          instructions: undefined,
          draft: false,
          parentId: "parent-goal",
          insertBefore: null,
          assignee: null,
          dependsOn: [],
          initialNote: null,
          metaData: null,
        }),
      );

      updatedDocument = reducer(
        updatedDocument,
        createGoal({
          id: "child-2",
          description: "Child 2",
          instructions: undefined,
          draft: false,
          parentId: "parent-goal",
          insertBefore: null,
          assignee: null,
          dependsOn: [],
          initialNote: null,
          metaData: null,
        }),
      );

      // Create grandchild
      updatedDocument = reducer(
        updatedDocument,
        createGoal({
          id: "grandchild-1",
          description: "Grandchild 1",
          instructions: undefined,
          draft: false,
          parentId: "child-1",
          insertBefore: null,
          assignee: null,
          dependsOn: [],
          initialNote: null,
          metaData: null,
        }),
      );

      // Mark parent as draft
      updatedDocument = reducer(
        updatedDocument,
        markAsDraft({
          goalId: "parent-goal",
        }),
      );

      const goals = updatedDocument.state.global.goals;
      const parent = goals.find((g) => g.id === "parent-goal");
      const child1 = goals.find((g) => g.id === "child-1");
      const child2 = goals.find((g) => g.id === "child-2");
      const grandchild = goals.find((g) => g.id === "grandchild-1");

      // All goals should be marked as draft
      expect(parent?.isDraft).toBe(true);
      expect(child1?.isDraft).toBe(true);
      expect(child2?.isDraft).toBe(true);
      expect(grandchild?.isDraft).toBe(true);
    });
  });

  describe("MARK_AS_READY", () => {
    it("should mark goal as ready (not draft)", () => {
      const document = utils.createDocument();

      // Create a draft goal
      let updatedDocument = reducer(
        document,
        createGoal({
          id: "goal-1",
          description: "Test goal",
          instructions: undefined,
          draft: true,
          parentId: null,
          insertBefore: null,
          assignee: null,
          dependsOn: [],
          initialNote: null,
          metaData: null,
        }),
      );

      // Mark as ready
      updatedDocument = reducer(
        updatedDocument,
        markAsReady({
          goalId: "goal-1",
        }),
      );

      const goal = updatedDocument.state.global.goals[0];
      expect(goal.isDraft).toBe(false);
    });

    it("should recursively mark all child goals as ready", () => {
      const document = utils.createDocument();

      // Create parent goal as draft
      let updatedDocument = reducer(
        document,
        createGoal({
          id: "parent-goal",
          description: "Parent goal",
          instructions: undefined,
          draft: true,
          parentId: null,
          insertBefore: null,
          assignee: null,
          dependsOn: [],
          initialNote: null,
          metaData: null,
        }),
      );

      // Create child goals as draft
      updatedDocument = reducer(
        updatedDocument,
        createGoal({
          id: "child-1",
          description: "Child 1",
          instructions: undefined,
          draft: true,
          parentId: "parent-goal",
          insertBefore: null,
          assignee: null,
          dependsOn: [],
          initialNote: null,
          metaData: null,
        }),
      );

      updatedDocument = reducer(
        updatedDocument,
        createGoal({
          id: "child-2",
          description: "Child 2",
          instructions: undefined,
          draft: true,
          parentId: "parent-goal",
          insertBefore: null,
          assignee: null,
          dependsOn: [],
          initialNote: null,
          metaData: null,
        }),
      );

      // Create grandchild as draft
      updatedDocument = reducer(
        updatedDocument,
        createGoal({
          id: "grandchild-1",
          description: "Grandchild 1",
          instructions: undefined,
          draft: true,
          parentId: "child-1",
          insertBefore: null,
          assignee: null,
          dependsOn: [],
          initialNote: null,
          metaData: null,
        }),
      );

      // Mark parent as ready
      updatedDocument = reducer(
        updatedDocument,
        markAsReady({
          goalId: "parent-goal",
        }),
      );

      const goals = updatedDocument.state.global.goals;
      const parent = goals.find((g) => g.id === "parent-goal");
      const child1 = goals.find((g) => g.id === "child-1");
      const child2 = goals.find((g) => g.id === "child-2");
      const grandchild = goals.find((g) => g.id === "grandchild-1");

      // All goals should be marked as ready (not draft)
      expect(parent?.isDraft).toBe(false);
      expect(child1?.isDraft).toBe(false);
      expect(child2?.isDraft).toBe(false);
      expect(grandchild?.isDraft).toBe(false);
    });
  });
});
