/**
 * This is a scaffold file meant for customization:
 * - change it by adding new tests or modifying the existing ones
 */

import { describe, it, expect } from "vitest";
import { generateMock } from "@powerhousedao/codegen";
import {
  reducer,
  utils,
  isWorkBreakdownStructureDocument,
  createGoal,
  CreateGoalInputSchema,
  delegateGoal,
  DelegateGoalInputSchema,
  reportOnGoal,
  ReportOnGoalInputSchema,
  markInProgress,
  MarkInProgressInputSchema,
  markCompleted,
  MarkCompletedInputSchema,
  markTodo,
  MarkTodoInputSchema,
  reportBlocked,
  ReportBlockedInputSchema,
  unblockGoal,
  UnblockGoalInputSchema,
  markWontDo,
  MarkWontDoInputSchema,
} from "@powerhousedao/agent-manager/document-models/work-breakdown-structure";

describe("Workflow Operations", () => {
  describe("CREATE_GOAL", () => {
    it("should create a root goal with TODO status when no assignee", () => {
      const document = utils.createDocument();

      const updatedDocument = reducer(
        document,
        createGoal({
          id: "goal-1",
          description: "Build a house",
          instructions: {
            comments: "Step by step instructions",
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

      expect(updatedDocument.state.global.goals).toHaveLength(1);
      const goal = updatedDocument.state.global.goals[0];
      expect(goal.id).toBe("goal-1");
      expect(goal.description).toBe("Build a house");
      expect(goal.status).toBe("TODO");
      expect(goal.parentId).toBeNull();
      expect(goal.assignee).toBeNull();
      expect(goal.instructions).toEqual({
        comments: "Step by step instructions",
        workType: null,
        workId: null,
        context: null,
      });
      expect(goal.isDraft).toBe(false);
      expect(goal.dependencies).toEqual([]);
      expect(goal.notes).toEqual([]);
    });

    it("should create a goal with DELEGATED status when assignee is provided", () => {
      const document = utils.createDocument();

      const updatedDocument = reducer(
        document,
        createGoal({
          id: "goal-1",
          description: "Design the architecture",
          instructions: undefined,
          draft: false,
          parentId: null,
          insertBefore: null,
          assignee: "john.doe@example.com",
          dependsOn: [],
          initialNote: null,
          metaData: null,
        }),
      );

      const goal = updatedDocument.state.global.goals[0];
      expect(goal.status).toBe("DELEGATED");
      expect(goal.assignee).toBe("john.doe@example.com");
    });

    it("should default to draft=true when draft is not specified", () => {
      const document = utils.createDocument();

      const updatedDocument = reducer(
        document,
        createGoal({
          id: "goal-1",
          description: "Draft goal by default",
          instructions: undefined,
          draft: undefined, // Not specified, should default to true
          parentId: null,
          insertBefore: null,
          assignee: null,
          dependsOn: [],
          initialNote: null,
          metaData: null,
        }),
      );

      const goal = updatedDocument.state.global.goals[0];
      expect(goal.isDraft).toBe(true);
    });

    it("should respect draft=false when explicitly set", () => {
      const document = utils.createDocument();

      const updatedDocument = reducer(
        document,
        createGoal({
          id: "goal-1",
          description: "Non-draft goal",
          instructions: undefined,
          draft: false, // Explicitly set to false
          parentId: null,
          insertBefore: null,
          assignee: null,
          dependsOn: [],
          initialNote: null,
          metaData: null,
        }),
      );

      const goal = updatedDocument.state.global.goals[0];
      expect(goal.isDraft).toBe(false);
    });

    it("should create a child goal with parent relationship", () => {
      const document = utils.createDocument();

      // Create parent first
      let updatedDocument = reducer(
        document,
        createGoal({
          id: "parent-1",
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

      // Create child
      updatedDocument = reducer(
        updatedDocument,
        createGoal({
          id: "child-1",
          description: "Child goal",
          instructions: undefined,
          draft: false,
          parentId: "parent-1",
          insertBefore: null,
          assignee: null,
          dependsOn: [],
          initialNote: null,
          metaData: null,
        }),
      );

      expect(updatedDocument.state.global.goals).toHaveLength(2);
      const childGoal = updatedDocument.state.global.goals.find(
        (g) => g.id === "child-1",
      );
      expect(childGoal).toBeDefined();
      expect(childGoal?.parentId).toBe("parent-1");
    });

    it("should add initial note when provided", () => {
      const document = utils.createDocument();

      const updatedDocument = reducer(
        document,
        createGoal({
          id: "goal-1",
          description: "Goal with note",
          instructions: undefined,
          draft: false,
          parentId: null,
          insertBefore: null,
          assignee: null,
          dependsOn: [],
          initialNote: {
            id: "note-1",
            note: "This is an initial note",
            author: "Alice",
          },
          metaData: null,
        }),
      );

      const goal = updatedDocument.state.global.goals[0];
      expect(goal.notes).toHaveLength(1);
      expect(goal.notes[0].id).toBe("note-1");
      expect(goal.notes[0].note).toBe("This is an initial note");
      expect(goal.notes[0].author).toBe("Alice");
    });

    it("should handle dependencies when provided", () => {
      const document = utils.createDocument();

      // Create dependency goals first
      let updatedDocument = reducer(
        document,
        createGoal({
          id: "goal-1",
          description: "First goal",
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

      updatedDocument = reducer(
        updatedDocument,
        createGoal({
          id: "goal-2",
          description: "Second goal",
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

      // Create goal with dependencies
      updatedDocument = reducer(
        updatedDocument,
        createGoal({
          id: "goal-3",
          description: "Dependent goal",
          instructions: undefined,
          draft: false,
          parentId: null,
          insertBefore: null,
          assignee: null,
          dependsOn: ["goal-1", "goal-2"],
          initialNote: null,
          metaData: null,
        }),
      );

      const goal = updatedDocument.state.global.goals.find(
        (g) => g.id === "goal-3",
      );
      expect(goal?.dependencies).toEqual(["goal-1", "goal-2"]);
    });

    it("should insert goal before specified position", () => {
      const document = utils.createDocument();

      // Create initial goals
      let updatedDocument = reducer(
        document,
        createGoal({
          id: "goal-1",
          description: "First goal",
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

      updatedDocument = reducer(
        updatedDocument,
        createGoal({
          id: "goal-3",
          description: "Third goal",
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

      // Insert goal-2 before goal-3
      updatedDocument = reducer(
        updatedDocument,
        createGoal({
          id: "goal-2",
          description: "Second goal",
          instructions: undefined,
          draft: false,
          parentId: null,
          insertBefore: "goal-3",
          assignee: null,
          dependsOn: [],
          initialNote: null,
          metaData: null,
        }),
      );

      expect(updatedDocument.state.global.goals).toHaveLength(3);
      expect(updatedDocument.state.global.goals[0].id).toBe("goal-1");
      expect(updatedDocument.state.global.goals[1].id).toBe("goal-2");
      expect(updatedDocument.state.global.goals[2].id).toBe("goal-3");
    });

    it("should handle draft status correctly", () => {
      const document = utils.createDocument();

      const updatedDocument = reducer(
        document,
        createGoal({
          id: "goal-1",
          description: "Draft goal",
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

      const goal = updatedDocument.state.global.goals[0];
      expect(goal.isDraft).toBe(true);
    });

    it("should create complex hierarchy with multiple levels", () => {
      let document = utils.createDocument();

      // Create root goal
      document = reducer(
        document,
        createGoal({
          id: "root-1",
          description: "Root goal",
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

      // Create child goal
      document = reducer(
        document,
        createGoal({
          id: "child-1",
          description: "Child of root",
          instructions: undefined,
          draft: false,
          parentId: "root-1",
          insertBefore: null,
          assignee: null,
          dependsOn: [],
          initialNote: null,
          metaData: null,
        }),
      );

      // Create grandchild goal
      document = reducer(
        document,
        createGoal({
          id: "grandchild-1",
          description: "Grandchild of root",
          instructions: undefined,
          draft: false,
          parentId: "child-1",
          insertBefore: null,
          assignee: "bob@example.com",
          dependsOn: [],
          initialNote: {
            id: "note-1",
            note: "Starting work on this",
            author: "Bob",
          },
          metaData: null,
        }),
      );

      expect(document.state.global.goals).toHaveLength(3);

      const root = document.state.global.goals.find((g) => g.id === "root-1");
      const child = document.state.global.goals.find((g) => g.id === "child-1");
      const grandchild = document.state.global.goals.find(
        (g) => g.id === "grandchild-1",
      );

      expect(root?.parentId).toBeNull();
      expect(child?.parentId).toBe("root-1");
      expect(grandchild?.parentId).toBe("child-1");
      expect(grandchild?.status).toBe("DELEGATED");
      expect(grandchild?.assignee).toBe("bob@example.com");
      expect(grandchild?.notes).toHaveLength(1);
    });

    it("should throw an error when creating a goal with duplicate ID", () => {
      const document = utils.createDocument();

      // Create first goal
      const updatedDocument = reducer(
        document,
        createGoal({
          id: "goal-1",
          description: "First goal",
          instructions: undefined,
          draft: false,
          parentId: null,
          insertBefore: null,
          assignee: null,
          dependsOn: null,
          initialNote: null,
          metaData: null,
        }),
      );

      expect(updatedDocument.state.global.goals).toHaveLength(1);

      // Try to create another goal with the same ID
      const result = reducer(
        updatedDocument,
        createGoal({
          id: "goal-1", // Same ID as the first goal
          description: "Second goal with same ID",
          instructions: undefined,
          draft: false,
          parentId: null,
          insertBefore: null,
          assignee: null,
          dependsOn: null,
          initialNote: null,
          metaData: null,
        }),
      );

      // Check that the operation has an error
      const lastOperation =
        result.operations.global[result.operations.global.length - 1];
      expect(lastOperation.error).toBeDefined();
      if (
        lastOperation.error &&
        typeof lastOperation.error === "object" &&
        "message" in lastOperation.error
      ) {
        expect((lastOperation.error as any).message).toBe(
          "Goal with ID goal-1 already exists",
        );
      }

      // The state should remain unchanged (still only 1 goal)
      expect(result.state.global.goals).toHaveLength(1);
    });

    it("should allow creating goals with different IDs", () => {
      const document = utils.createDocument();

      // Create first goal
      let updatedDocument = reducer(
        document,
        createGoal({
          id: "goal-1",
          description: "First goal",
          instructions: undefined,
          draft: false,
          parentId: null,
          insertBefore: null,
          assignee: null,
          dependsOn: null,
          initialNote: null,
          metaData: null,
        }),
      );

      // Create second goal with different ID
      updatedDocument = reducer(
        updatedDocument,
        createGoal({
          id: "goal-2", // Different ID
          description: "Second goal",
          instructions: undefined,
          draft: false,
          parentId: null,
          insertBefore: null,
          assignee: null,
          dependsOn: null,
          initialNote: null,
          metaData: null,
        }),
      );

      expect(updatedDocument.state.global.goals).toHaveLength(2);
      expect(updatedDocument.state.global.goals[0].id).toBe("goal-1");
      expect(updatedDocument.state.global.goals[1].id).toBe("goal-2");
    });
  });

  describe("MARK_IN_PROGRESS", () => {
    it("should mark a goal as IN_PROGRESS", () => {
      const document = utils.createDocument();

      // Create a goal first
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

      // Mark it as in progress
      updatedDocument = reducer(
        updatedDocument,
        markInProgress({
          id: "goal-1",
          note: null,
        }),
      );

      const goal = updatedDocument.state.global.goals[0];
      expect(goal.status).toBe("IN_PROGRESS");
    });

    it("should add a note when marking as IN_PROGRESS", () => {
      const document = utils.createDocument();

      // Create a goal first
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

      // Mark it as in progress with a note
      updatedDocument = reducer(
        updatedDocument,
        markInProgress({
          id: "goal-1",
          note: {
            id: "note-1",
            note: "Started working on this",
            author: "john@example.com",
          },
        }),
      );

      const goal = updatedDocument.state.global.goals[0];
      expect(goal.notes).toHaveLength(1);
      expect(goal.notes[0].note).toBe("Started working on this");
      expect(goal.notes[0].author).toBe("john@example.com");
    });

    it("should propagate IN_PROGRESS to parent goals", () => {
      const document = utils.createDocument();

      // Create a hierarchy
      let updatedDocument = reducer(
        document,
        createGoal({
          id: "parent-1",
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

      updatedDocument = reducer(
        updatedDocument,
        createGoal({
          id: "child-1",
          description: "Child goal",
          instructions: undefined,
          draft: false,
          parentId: "parent-1",
          insertBefore: null,
          assignee: null,
          dependsOn: [],
          initialNote: null,
          metaData: null,
        }),
      );

      // Mark child as in progress
      updatedDocument = reducer(
        updatedDocument,
        markInProgress({
          id: "child-1",
          note: null,
        }),
      );

      const parent = updatedDocument.state.global.goals.find(
        (g) => g.id === "parent-1",
      );
      const child = updatedDocument.state.global.goals.find(
        (g) => g.id === "child-1",
      );

      expect(child?.status).toBe("IN_PROGRESS");
      expect(parent?.status).toBe("IN_PROGRESS");
    });

    it("should propagate IN_PROGRESS up multiple levels", () => {
      const document = utils.createDocument();

      // Create a deeper hierarchy
      let updatedDocument = reducer(
        document,
        createGoal({
          id: "grandparent-1",
          description: "Grandparent goal",
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

      updatedDocument = reducer(
        updatedDocument,
        createGoal({
          id: "parent-1",
          description: "Parent goal",
          instructions: undefined,
          draft: false,
          parentId: "grandparent-1",
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
          id: "child-1",
          description: "Child goal",
          instructions: undefined,
          draft: false,
          parentId: "parent-1",
          insertBefore: null,
          assignee: null,
          dependsOn: [],
          initialNote: null,
          metaData: null,
        }),
      );

      // Mark deepest child as in progress
      updatedDocument = reducer(
        updatedDocument,
        markInProgress({
          id: "child-1",
          note: null,
        }),
      );

      const grandparent = updatedDocument.state.global.goals.find(
        (g) => g.id === "grandparent-1",
      );
      const parent = updatedDocument.state.global.goals.find(
        (g) => g.id === "parent-1",
      );
      const child = updatedDocument.state.global.goals.find(
        (g) => g.id === "child-1",
      );

      expect(child?.status).toBe("IN_PROGRESS");
      expect(parent?.status).toBe("IN_PROGRESS");
      expect(grandparent?.status).toBe("IN_PROGRESS");
    });

    it("should not change parent status if already IN_PROGRESS", () => {
      const document = utils.createDocument();

      // Create parent and two children
      let updatedDocument = reducer(
        document,
        createGoal({
          id: "parent-1",
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

      updatedDocument = reducer(
        updatedDocument,
        createGoal({
          id: "child-1",
          description: "First child",
          instructions: undefined,
          draft: false,
          parentId: "parent-1",
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
          description: "Second child",
          instructions: undefined,
          draft: false,
          parentId: "parent-1",
          insertBefore: null,
          assignee: null,
          dependsOn: [],
          initialNote: null,
          metaData: null,
        }),
      );

      // Mark first child as in progress
      updatedDocument = reducer(
        updatedDocument,
        markInProgress({
          id: "child-1",
          note: null,
        }),
      );

      const parentAfterFirst = updatedDocument.state.global.goals.find(
        (g) => g.id === "parent-1",
      );
      expect(parentAfterFirst?.status).toBe("IN_PROGRESS");

      // Mark second child as in progress
      updatedDocument = reducer(
        updatedDocument,
        markInProgress({
          id: "child-2",
          note: null,
        }),
      );

      const parentAfterSecond = updatedDocument.state.global.goals.find(
        (g) => g.id === "parent-1",
      );
      expect(parentAfterSecond?.status).toBe("IN_PROGRESS");
    });

    it("should change parent status from COMPLETED to IN_PROGRESS when child becomes active", () => {
      const document = utils.createDocument();

      // Create parent and child
      let updatedDocument = reducer(
        document,
        createGoal({
          id: "parent-1",
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

      updatedDocument = reducer(
        updatedDocument,
        createGoal({
          id: "child-1",
          description: "Child goal",
          instructions: undefined,
          draft: false,
          parentId: "parent-1",
          insertBefore: null,
          assignee: null,
          dependsOn: [],
          initialNote: null,
          metaData: null,
        }),
      );

      // Mark parent as COMPLETED first
      updatedDocument = reducer(
        updatedDocument,
        markCompleted({
          id: "parent-1",
          note: null,
        }),
      );

      // Verify both are COMPLETED
      let parent = updatedDocument.state.global.goals.find(
        (g) => g.id === "parent-1",
      );
      let child = updatedDocument.state.global.goals.find(
        (g) => g.id === "child-1",
      );
      expect(parent?.status).toBe("COMPLETED");
      expect(child?.status).toBe("COMPLETED");

      // Now mark child as in progress
      updatedDocument = reducer(
        updatedDocument,
        markInProgress({
          id: "child-1",
          note: null,
        }),
      );

      parent = updatedDocument.state.global.goals.find(
        (g) => g.id === "parent-1",
      );
      child = updatedDocument.state.global.goals.find(
        (g) => g.id === "child-1",
      );

      expect(child?.status).toBe("IN_PROGRESS");
      expect(parent?.status).toBe("IN_PROGRESS"); // Should change to IN_PROGRESS
    });

    it("should change parent status from WONT_DO to IN_PROGRESS when child becomes active", () => {
      const document = utils.createDocument();

      // Create parent and child
      let updatedDocument = reducer(
        document,
        createGoal({
          id: "parent-1",
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

      updatedDocument = reducer(
        updatedDocument,
        createGoal({
          id: "child-1",
          description: "Child goal",
          instructions: undefined,
          draft: false,
          parentId: "parent-1",
          insertBefore: null,
          assignee: null,
          dependsOn: [],
          initialNote: null,
          metaData: null,
        }),
      );

      // Mark parent as WONT_DO first
      updatedDocument = reducer(
        updatedDocument,
        markWontDo({
          id: "parent-1",
        }),
      );

      // Verify both are WONT_DO
      let parent = updatedDocument.state.global.goals.find(
        (g) => g.id === "parent-1",
      );
      let child = updatedDocument.state.global.goals.find(
        (g) => g.id === "child-1",
      );
      expect(parent?.status).toBe("WONT_DO");
      expect(child?.status).toBe("WONT_DO");

      // Now mark child as in progress
      updatedDocument = reducer(
        updatedDocument,
        markInProgress({
          id: "child-1",
          note: null,
        }),
      );

      parent = updatedDocument.state.global.goals.find(
        (g) => g.id === "parent-1",
      );
      child = updatedDocument.state.global.goals.find(
        (g) => g.id === "child-1",
      );

      expect(child?.status).toBe("IN_PROGRESS");
      expect(parent?.status).toBe("IN_PROGRESS"); // Should change to IN_PROGRESS
    });

    it("should handle error for non-existent goal", () => {
      const document = utils.createDocument();

      const updatedDocument = reducer(
        document,
        markInProgress({
          id: "non-existent",
        }),
      );

      const lastOperation = updatedDocument.operations.global[0];
      expect(lastOperation).toBeDefined();
      expect(lastOperation.error).toBeDefined();
      if (
        lastOperation.error &&
        typeof lastOperation.error === "object" &&
        "message" in lastOperation.error
      ) {
        expect((lastOperation.error as any).message).toBe(
          "Goal with ID non-existent not found",
        );
      }
    });
  });

  describe("MARK_COMPLETED", () => {
    it("should mark a goal as COMPLETED", () => {
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

      // Mark it as completed
      updatedDocument = reducer(
        updatedDocument,
        markCompleted({
          id: "goal-1",
          note: null,
        }),
      );

      const goal = updatedDocument.state.global.goals[0];
      expect(goal.status).toBe("COMPLETED");
    });

    it("should add a note when marking as COMPLETED", () => {
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

      // Mark it as completed with a note
      updatedDocument = reducer(
        updatedDocument,
        markCompleted({
          id: "goal-1",
          note: {
            id: "note-1",
            note: "Task completed successfully",
            author: "jane@example.com",
          },
        }),
      );

      const goal = updatedDocument.state.global.goals[0];
      expect(goal.status).toBe("COMPLETED");
      expect(goal.notes).toHaveLength(1);
      expect(goal.notes[0].note).toBe("Task completed successfully");
      expect(goal.notes[0].author).toBe("jane@example.com");
    });

    it("should mark all child goals as COMPLETED", () => {
      const document = utils.createDocument();

      // Create hierarchy
      let updatedDocument = reducer(
        document,
        createGoal({
          id: "parent-1",
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

      updatedDocument = reducer(
        updatedDocument,
        createGoal({
          id: "child-1",
          description: "Child goal 1",
          instructions: undefined,
          draft: false,
          parentId: "parent-1",
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
          description: "Child goal 2",
          instructions: undefined,
          draft: false,
          parentId: "parent-1",
          insertBefore: null,
          assignee: null,
          dependsOn: [],
          initialNote: null,
          metaData: null,
        }),
      );

      // Mark parent as completed
      updatedDocument = reducer(
        updatedDocument,
        markCompleted({
          id: "parent-1",
          note: null,
        }),
      );

      const parent = updatedDocument.state.global.goals.find(
        (g) => g.id === "parent-1",
      );
      const child1 = updatedDocument.state.global.goals.find(
        (g) => g.id === "child-1",
      );
      const child2 = updatedDocument.state.global.goals.find(
        (g) => g.id === "child-2",
      );

      expect(parent?.status).toBe("COMPLETED");
      expect(child1?.status).toBe("COMPLETED");
      expect(child2?.status).toBe("COMPLETED");
    });

    it("should mark all descendants as COMPLETED recursively", () => {
      const document = utils.createDocument();

      // Create deeper hierarchy
      let updatedDocument = reducer(
        document,
        createGoal({
          id: "root-1",
          description: "Root goal",
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

      updatedDocument = reducer(
        updatedDocument,
        createGoal({
          id: "child-1",
          description: "Child goal",
          instructions: undefined,
          draft: false,
          parentId: "root-1",
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
          id: "grandchild-1",
          description: "Grandchild goal",
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

      // Mark root as completed
      updatedDocument = reducer(
        updatedDocument,
        markCompleted({
          id: "root-1",
          note: null,
        }),
      );

      const root = updatedDocument.state.global.goals.find(
        (g) => g.id === "root-1",
      );
      const child = updatedDocument.state.global.goals.find(
        (g) => g.id === "child-1",
      );
      const grandchild = updatedDocument.state.global.goals.find(
        (g) => g.id === "grandchild-1",
      );

      expect(root?.status).toBe("COMPLETED");
      expect(child?.status).toBe("COMPLETED");
      expect(grandchild?.status).toBe("COMPLETED");
    });

    it("should not change already COMPLETED children", () => {
      const document = utils.createDocument();

      // Create parent and child
      let updatedDocument = reducer(
        document,
        createGoal({
          id: "parent-1",
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

      updatedDocument = reducer(
        updatedDocument,
        createGoal({
          id: "child-1",
          description: "Child goal",
          instructions: undefined,
          draft: false,
          parentId: "parent-1",
          insertBefore: null,
          assignee: null,
          dependsOn: [],
          initialNote: null,
          metaData: null,
        }),
      );

      // Mark child as completed first
      updatedDocument = reducer(
        updatedDocument,
        markCompleted({
          id: "child-1",
          note: {
            id: "note-1",
            note: "Child done first",
            author: null,
          },
        }),
      );

      const childBefore = updatedDocument.state.global.goals.find(
        (g) => g.id === "child-1",
      );
      expect(childBefore?.status).toBe("COMPLETED");
      expect(childBefore?.notes).toHaveLength(1);

      // Now mark parent as completed
      updatedDocument = reducer(
        updatedDocument,
        markCompleted({
          id: "parent-1",
          note: null,
        }),
      );

      const childAfter = updatedDocument.state.global.goals.find(
        (g) => g.id === "child-1",
      );
      // Child should still have its original note
      expect(childAfter?.status).toBe("COMPLETED");
      expect(childAfter?.notes).toHaveLength(1);
      expect(childAfter?.notes[0].note).toBe("Child done first");
    });

    it("should not change WONT_DO children", () => {
      const document = utils.createDocument();

      // Create parent and children
      let updatedDocument = reducer(
        document,
        createGoal({
          id: "parent-1",
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

      updatedDocument = reducer(
        updatedDocument,
        createGoal({
          id: "child-1",
          description: "Will complete",
          instructions: undefined,
          draft: false,
          parentId: "parent-1",
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
          description: "Won't do this",
          instructions: undefined,
          draft: false,
          parentId: "parent-1",
          insertBefore: null,
          assignee: null,
          dependsOn: [],
          initialNote: null,
          metaData: null,
        }),
      );

      // Mark child-2 as WONT_DO manually (will implement this operation later)
      updatedDocument.state.global.goals[2].status = "WONT_DO";

      // Mark parent as completed
      updatedDocument = reducer(
        updatedDocument,
        markCompleted({
          id: "parent-1",
          note: null,
        }),
      );

      const parent = updatedDocument.state.global.goals.find(
        (g) => g.id === "parent-1",
      );
      const child1 = updatedDocument.state.global.goals.find(
        (g) => g.id === "child-1",
      );
      const child2 = updatedDocument.state.global.goals.find(
        (g) => g.id === "child-2",
      );

      expect(parent?.status).toBe("COMPLETED");
      expect(child1?.status).toBe("COMPLETED");
      expect(child2?.status).toBe("WONT_DO"); // Should stay WONT_DO
    });
  });

  describe("MARK_TODO", () => {
    it("should mark a goal as TODO", () => {
      const document = utils.createDocument();

      // Create goal and mark it IN_PROGRESS first
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

      // First mark as IN_PROGRESS
      updatedDocument = reducer(
        updatedDocument,
        markInProgress({
          id: "goal-1",
        }),
      );

      expect(updatedDocument.state.global.goals[0].status).toBe("IN_PROGRESS");

      // Now mark back to TODO
      updatedDocument = reducer(
        updatedDocument,
        markTodo({
          id: "goal-1",
        }),
      );

      const goal = updatedDocument.state.global.goals[0];
      expect(goal.status).toBe("TODO");
    });

    it("should add a note when marking as TODO", () => {
      const document = utils.createDocument();

      // Create goal
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

      // Mark as IN_PROGRESS first
      updatedDocument = reducer(
        updatedDocument,
        markInProgress({
          id: "goal-1",
        }),
      );

      // Mark back to TODO with note
      updatedDocument = reducer(
        updatedDocument,
        markTodo({
          id: "goal-1",
          note: {
            id: "note-1",
            note: "Reverting to TODO",
            author: "user@example.com",
          },
        }),
      );

      const goal = updatedDocument.state.global.goals[0];
      expect(goal.status).toBe("TODO");
      expect(goal.notes).toHaveLength(1);
      expect(goal.notes[0].note).toBe("Reverting to TODO");
    });

    it("should reset COMPLETED parent goals to TODO", () => {
      const document = utils.createDocument();

      // Create hierarchy
      let updatedDocument = reducer(
        document,
        createGoal({
          id: "parent-1",
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

      updatedDocument = reducer(
        updatedDocument,
        createGoal({
          id: "child-1",
          description: "Child goal",
          instructions: undefined,
          draft: false,
          parentId: "parent-1",
          insertBefore: null,
          assignee: null,
          dependsOn: [],
          initialNote: null,
          metaData: null,
        }),
      );

      // Mark parent as completed (this will also complete child)
      updatedDocument = reducer(
        updatedDocument,
        markCompleted({
          id: "parent-1",
        }),
      );

      expect(updatedDocument.state.global.goals[0].status).toBe("COMPLETED");
      expect(updatedDocument.state.global.goals[1].status).toBe("COMPLETED");

      // Now mark child back to TODO
      updatedDocument = reducer(
        updatedDocument,
        markTodo({
          id: "child-1",
        }),
      );

      const parent = updatedDocument.state.global.goals.find(
        (g) => g.id === "parent-1",
      );
      const child = updatedDocument.state.global.goals.find(
        (g) => g.id === "child-1",
      );

      expect(child?.status).toBe("TODO");
      expect(parent?.status).toBe("TODO"); // Parent should be reset
    });

    it("should reset WONT_DO parent goals to TODO", () => {
      const document = utils.createDocument();

      // Create hierarchy
      let updatedDocument = reducer(
        document,
        createGoal({
          id: "parent-1",
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

      updatedDocument = reducer(
        updatedDocument,
        createGoal({
          id: "child-1",
          description: "Child goal",
          instructions: undefined,
          draft: false,
          parentId: "parent-1",
          insertBefore: null,
          assignee: null,
          dependsOn: [],
          initialNote: null,
          metaData: null,
        }),
      );

      // Manually mark parent as WONT_DO
      updatedDocument.state.global.goals[0].status = "WONT_DO";

      // Mark child back to TODO
      updatedDocument = reducer(
        updatedDocument,
        markTodo({
          id: "child-1",
        }),
      );

      const parent = updatedDocument.state.global.goals.find(
        (g) => g.id === "parent-1",
      );
      const child = updatedDocument.state.global.goals.find(
        (g) => g.id === "child-1",
      );

      expect(child?.status).toBe("TODO");
      expect(parent?.status).toBe("TODO"); // Parent should be reset
    });

    it("should not change parent if already TODO or IN_PROGRESS", () => {
      const document = utils.createDocument();

      // Create hierarchy
      let updatedDocument = reducer(
        document,
        createGoal({
          id: "parent-1",
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

      updatedDocument = reducer(
        updatedDocument,
        createGoal({
          id: "child-1",
          description: "Child goal",
          instructions: undefined,
          draft: false,
          parentId: "parent-1",
          insertBefore: null,
          assignee: null,
          dependsOn: [],
          initialNote: null,
          metaData: null,
        }),
      );

      // Mark child as IN_PROGRESS
      updatedDocument = reducer(
        updatedDocument,
        markInProgress({
          id: "child-1",
        }),
      );

      const parentBefore = updatedDocument.state.global.goals.find(
        (g) => g.id === "parent-1",
      );
      expect(parentBefore?.status).toBe("IN_PROGRESS");

      // Mark child back to TODO
      updatedDocument = reducer(
        updatedDocument,
        markTodo({
          id: "child-1",
        }),
      );

      const parentAfter = updatedDocument.state.global.goals.find(
        (g) => g.id === "parent-1",
      );
      expect(parentAfter?.status).toBe("IN_PROGRESS"); // Should stay IN_PROGRESS
    });
  });

  describe("Auto-Complete Parent Goals", () => {
    it("should auto-complete parent when all children are finished (COMPLETED)", () => {
      const document = utils.createDocument();

      // Create parent with two children
      let updatedDocument = reducer(
        document,
        createGoal({
          id: "parent-1",
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

      updatedDocument = reducer(
        updatedDocument,
        createGoal({
          id: "child-1",
          description: "First child",
          instructions: undefined,
          draft: false,
          parentId: "parent-1",
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
          description: "Second child",
          instructions: undefined,
          draft: false,
          parentId: "parent-1",
          insertBefore: null,
          assignee: null,
          dependsOn: [],
          initialNote: null,
          metaData: null,
        }),
      );

      // Complete first child - parent should remain TODO
      updatedDocument = reducer(
        updatedDocument,
        markCompleted({
          id: "child-1",
          note: null,
        }),
      );

      let parent = updatedDocument.state.global.goals.find(
        (g) => g.id === "parent-1",
      );
      expect(parent?.status).toBe("TODO");

      // Complete second child - parent should auto-complete
      updatedDocument = reducer(
        updatedDocument,
        markCompleted({
          id: "child-2",
          note: null,
        }),
      );

      parent = updatedDocument.state.global.goals.find(
        (g) => g.id === "parent-1",
      );
      expect(parent?.status).toBe("COMPLETED");
    });

    it("should auto-complete parent when all children are finished (mix of COMPLETED and WONT_DO)", () => {
      const document = utils.createDocument();

      // Create parent with two children
      let updatedDocument = reducer(
        document,
        createGoal({
          id: "parent-1",
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

      updatedDocument = reducer(
        updatedDocument,
        createGoal({
          id: "child-1",
          description: "First child",
          instructions: undefined,
          draft: false,
          parentId: "parent-1",
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
          description: "Second child",
          instructions: undefined,
          draft: false,
          parentId: "parent-1",
          insertBefore: null,
          assignee: null,
          dependsOn: [],
          initialNote: null,
          metaData: null,
        }),
      );

      // Mark first child as WONT_DO
      updatedDocument = reducer(
        updatedDocument,
        markWontDo({
          id: "child-1",
        }),
      );

      let parent = updatedDocument.state.global.goals.find(
        (g) => g.id === "parent-1",
      );
      expect(parent?.status).toBe("TODO");

      // Complete second child - parent should auto-complete
      updatedDocument = reducer(
        updatedDocument,
        markCompleted({
          id: "child-2",
          note: null,
        }),
      );

      parent = updatedDocument.state.global.goals.find(
        (g) => g.id === "parent-1",
      );
      expect(parent?.status).toBe("COMPLETED");
    });

    it("should recursively auto-complete grandparents when all descendants are finished", () => {
      const document = utils.createDocument();

      // Create three-level hierarchy
      let updatedDocument = reducer(
        document,
        createGoal({
          id: "grandparent-1",
          description: "Grandparent goal",
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

      updatedDocument = reducer(
        updatedDocument,
        createGoal({
          id: "parent-1",
          description: "Parent 1",
          instructions: undefined,
          draft: false,
          parentId: "grandparent-1",
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
          id: "parent-2",
          description: "Parent 2",
          instructions: undefined,
          draft: false,
          parentId: "grandparent-1",
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
          id: "child-1-1",
          description: "Child of parent 1",
          instructions: undefined,
          draft: false,
          parentId: "parent-1",
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
          id: "child-2-1",
          description: "Child of parent 2",
          instructions: undefined,
          draft: false,
          parentId: "parent-2",
          insertBefore: null,
          assignee: null,
          dependsOn: [],
          initialNote: null,
          metaData: null,
        }),
      );

      // Complete first grandchild - nothing should auto-complete
      updatedDocument = reducer(
        updatedDocument,
        markCompleted({
          id: "child-1-1",
          note: null,
        }),
      );

      let grandparent = updatedDocument.state.global.goals.find(
        (g) => g.id === "grandparent-1",
      );
      const parent1 = updatedDocument.state.global.goals.find(
        (g) => g.id === "parent-1",
      );
      let parent2 = updatedDocument.state.global.goals.find(
        (g) => g.id === "parent-2",
      );

      expect(parent1?.status).toBe("COMPLETED"); // Auto-completed (only child finished)
      expect(parent2?.status).toBe("TODO");
      expect(grandparent?.status).toBe("TODO");

      // Complete second grandchild - should cascade up
      updatedDocument = reducer(
        updatedDocument,
        markCompleted({
          id: "child-2-1",
          note: null,
        }),
      );

      grandparent = updatedDocument.state.global.goals.find(
        (g) => g.id === "grandparent-1",
      );
      parent2 = updatedDocument.state.global.goals.find(
        (g) => g.id === "parent-2",
      );

      expect(parent2?.status).toBe("COMPLETED"); // Auto-completed
      expect(grandparent?.status).toBe("COMPLETED"); // Auto-completed recursively
    });

    it("should not auto-complete parent if any child is not finished", () => {
      const document = utils.createDocument();

      // Create parent with three children
      let updatedDocument = reducer(
        document,
        createGoal({
          id: "parent-1",
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

      updatedDocument = reducer(
        updatedDocument,
        createGoal({
          id: "child-1",
          description: "First child",
          instructions: undefined,
          draft: false,
          parentId: "parent-1",
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
          description: "Second child",
          instructions: undefined,
          draft: false,
          parentId: "parent-1",
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
          id: "child-3",
          description: "Third child",
          instructions: undefined,
          draft: false,
          parentId: "parent-1",
          insertBefore: null,
          assignee: null,
          dependsOn: [],
          initialNote: null,
          metaData: null,
        }),
      );

      // Complete first child
      updatedDocument = reducer(
        updatedDocument,
        markCompleted({
          id: "child-1",
          note: null,
        }),
      );

      // Mark second child as WONT_DO
      updatedDocument = reducer(
        updatedDocument,
        markWontDo({
          id: "child-2",
        }),
      );

      // Third child is still TODO
      const parent = updatedDocument.state.global.goals.find(
        (g) => g.id === "parent-1",
      );
      const child3 = updatedDocument.state.global.goals.find(
        (g) => g.id === "child-3",
      );

      expect(child3?.status).toBe("TODO");
      expect(parent?.status).toBe("TODO"); // Should NOT auto-complete
    });

    it("should not auto-complete parent if child is IN_PROGRESS", () => {
      const document = utils.createDocument();

      // Create parent with two children
      let updatedDocument = reducer(
        document,
        createGoal({
          id: "parent-1",
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

      updatedDocument = reducer(
        updatedDocument,
        createGoal({
          id: "child-1",
          description: "First child",
          instructions: undefined,
          draft: false,
          parentId: "parent-1",
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
          description: "Second child",
          instructions: undefined,
          draft: false,
          parentId: "parent-1",
          insertBefore: null,
          assignee: null,
          dependsOn: [],
          initialNote: null,
          metaData: null,
        }),
      );

      // Complete first child
      updatedDocument = reducer(
        updatedDocument,
        markCompleted({
          id: "child-1",
          note: null,
        }),
      );

      // Mark second child as IN_PROGRESS
      updatedDocument = reducer(
        updatedDocument,
        markInProgress({
          id: "child-2",
          note: null,
        }),
      );

      const parent = updatedDocument.state.global.goals.find(
        (g) => g.id === "parent-1",
      );
      expect(parent?.status).toBe("IN_PROGRESS"); // Should NOT auto-complete
    });

    it("should not change parent status if already COMPLETED", () => {
      const document = utils.createDocument();

      // Create parent with child
      let updatedDocument = reducer(
        document,
        createGoal({
          id: "parent-1",
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

      updatedDocument = reducer(
        updatedDocument,
        createGoal({
          id: "child-1",
          description: "Child goal",
          instructions: undefined,
          draft: false,
          parentId: "parent-1",
          insertBefore: null,
          assignee: null,
          dependsOn: [],
          initialNote: null,
          metaData: null,
        }),
      );

      // Mark parent as completed (which also completes child)
      updatedDocument = reducer(
        updatedDocument,
        markCompleted({
          id: "parent-1",
          note: null,
        }),
      );

      const parentBefore = updatedDocument.state.global.goals.find(
        (g) => g.id === "parent-1",
      );
      const childBefore = updatedDocument.state.global.goals.find(
        (g) => g.id === "child-1",
      );
      expect(parentBefore?.status).toBe("COMPLETED");
      expect(childBefore?.status).toBe("COMPLETED");

      // Now mark child as WONT_DO - parent should stay COMPLETED
      updatedDocument = reducer(
        updatedDocument,
        markWontDo({
          id: "child-1",
        }),
      );

      const parentAfter = updatedDocument.state.global.goals.find(
        (g) => g.id === "parent-1",
      );
      const childAfter = updatedDocument.state.global.goals.find(
        (g) => g.id === "child-1",
      );
      expect(childAfter?.status).toBe("WONT_DO");
      expect(parentAfter?.status).toBe("COMPLETED"); // Should remain COMPLETED
    });
  });

  describe("MARK_WONT_DO", () => {
    it("should mark a goal as WONT_DO", () => {
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

      // Mark it as WONT_DO
      updatedDocument = reducer(
        updatedDocument,
        markWontDo({
          id: "goal-1",
        }),
      );

      const goal = updatedDocument.state.global.goals[0];
      expect(goal.status).toBe("WONT_DO");
    });

    it("should mark all child goals as WONT_DO", () => {
      const document = utils.createDocument();

      // Create hierarchy
      let updatedDocument = reducer(
        document,
        createGoal({
          id: "parent-1",
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

      updatedDocument = reducer(
        updatedDocument,
        createGoal({
          id: "child-1",
          description: "Child goal 1",
          instructions: undefined,
          draft: false,
          parentId: "parent-1",
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
          description: "Child goal 2",
          instructions: undefined,
          draft: false,
          parentId: "parent-1",
          insertBefore: null,
          assignee: null,
          dependsOn: [],
          initialNote: null,
          metaData: null,
        }),
      );

      // Mark parent as WONT_DO
      updatedDocument = reducer(
        updatedDocument,
        markWontDo({
          id: "parent-1",
        }),
      );

      const parent = updatedDocument.state.global.goals.find(
        (g) => g.id === "parent-1",
      );
      const child1 = updatedDocument.state.global.goals.find(
        (g) => g.id === "child-1",
      );
      const child2 = updatedDocument.state.global.goals.find(
        (g) => g.id === "child-2",
      );

      expect(parent?.status).toBe("WONT_DO");
      expect(child1?.status).toBe("WONT_DO");
      expect(child2?.status).toBe("WONT_DO");
    });

    it("should not change already COMPLETED children", () => {
      const document = utils.createDocument();

      // Create parent and children
      let updatedDocument = reducer(
        document,
        createGoal({
          id: "parent-1",
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

      updatedDocument = reducer(
        updatedDocument,
        createGoal({
          id: "child-1",
          description: "Completed child",
          instructions: undefined,
          draft: false,
          parentId: "parent-1",
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
          description: "Unfinished child",
          instructions: undefined,
          draft: false,
          parentId: "parent-1",
          insertBefore: null,
          assignee: null,
          dependsOn: [],
          initialNote: null,
          metaData: null,
        }),
      );

      // Mark child-1 as COMPLETED first
      updatedDocument = reducer(
        updatedDocument,
        markCompleted({
          id: "child-1",
        }),
      );

      // Now mark parent as WONT_DO
      updatedDocument = reducer(
        updatedDocument,
        markWontDo({
          id: "parent-1",
        }),
      );

      const parent = updatedDocument.state.global.goals.find(
        (g) => g.id === "parent-1",
      );
      const child1 = updatedDocument.state.global.goals.find(
        (g) => g.id === "child-1",
      );
      const child2 = updatedDocument.state.global.goals.find(
        (g) => g.id === "child-2",
      );

      expect(parent?.status).toBe("WONT_DO");
      expect(child1?.status).toBe("COMPLETED"); // Should stay COMPLETED
      expect(child2?.status).toBe("WONT_DO");
    });

    it("should mark all descendants recursively", () => {
      const document = utils.createDocument();

      // Create deeper hierarchy
      let updatedDocument = reducer(
        document,
        createGoal({
          id: "root-1",
          description: "Root goal",
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

      updatedDocument = reducer(
        updatedDocument,
        createGoal({
          id: "child-1",
          description: "Child goal",
          instructions: undefined,
          draft: false,
          parentId: "root-1",
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
          id: "grandchild-1",
          description: "Grandchild goal",
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

      // Mark root as WONT_DO
      updatedDocument = reducer(
        updatedDocument,
        markWontDo({
          id: "root-1",
        }),
      );

      const root = updatedDocument.state.global.goals.find(
        (g) => g.id === "root-1",
      );
      const child = updatedDocument.state.global.goals.find(
        (g) => g.id === "child-1",
      );
      const grandchild = updatedDocument.state.global.goals.find(
        (g) => g.id === "grandchild-1",
      );

      expect(root?.status).toBe("WONT_DO");
      expect(child?.status).toBe("WONT_DO");
      expect(grandchild?.status).toBe("WONT_DO");
    });
  });

  describe("DELEGATE_GOAL", () => {
    it("should delegate a leaf goal to an assignee", () => {
      const document = utils.createDocument();

      // Create a leaf goal
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

      // Delegate it
      updatedDocument = reducer(
        updatedDocument,
        delegateGoal({
          id: "goal-1",
          assignee: "alice@example.com",
        }),
      );

      const goal = updatedDocument.state.global.goals[0];
      expect(goal.status).toBe("DELEGATED");
      expect(goal.assignee).toBe("alice@example.com");
    });

    it("should fail when trying to delegate a parent goal", () => {
      const document = utils.createDocument();

      // Create parent and child goals
      let updatedDocument = reducer(
        document,
        createGoal({
          id: "parent-1",
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

      updatedDocument = reducer(
        updatedDocument,
        createGoal({
          id: "child-1",
          description: "Child goal",
          instructions: undefined,
          draft: false,
          parentId: "parent-1",
          insertBefore: null,
          assignee: null,
          dependsOn: [],
          initialNote: null,
          metaData: null,
        }),
      );

      // Try to delegate the parent (should fail)
      const result = reducer(
        updatedDocument,
        delegateGoal({
          id: "parent-1",
          assignee: "alice@example.com",
        }),
      );

      // Check that the operation has an error
      const lastOperation =
        result.operations.global[result.operations.global.length - 1];
      expect(lastOperation.error).toBeDefined();
      const errorMessage =
        typeof lastOperation.error === "string"
          ? lastOperation.error
          : (lastOperation.error as any)?.message;
      expect(errorMessage).toContain("has children and cannot be delegated");
    });

    it("should fail when goal does not exist", () => {
      const document = utils.createDocument();

      const result = reducer(
        document,
        delegateGoal({
          id: "nonexistent",
          assignee: "alice@example.com",
        }),
      );

      // Check that the operation has an error
      const lastOperation =
        result.operations.global[result.operations.global.length - 1];
      expect(lastOperation.error).toBeDefined();
      const errorMessage =
        typeof lastOperation.error === "string"
          ? lastOperation.error
          : (lastOperation.error as any)?.message;
      expect(errorMessage).toContain("not found");
    });

    it("should update assignee when re-delegating", () => {
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
          assignee: "bob@example.com",
          dependsOn: [],
          initialNote: null,
          metaData: null,
        }),
      );

      // Initial status should be DELEGATED (since it had an assignee)
      expect(updatedDocument.state.global.goals[0].status).toBe("DELEGATED");
      expect(updatedDocument.state.global.goals[0].assignee).toBe(
        "bob@example.com",
      );

      // Re-delegate to someone else
      updatedDocument = reducer(
        updatedDocument,
        delegateGoal({
          id: "goal-1",
          assignee: "charlie@example.com",
        }),
      );

      const goal = updatedDocument.state.global.goals[0];
      expect(goal.status).toBe("DELEGATED");
      expect(goal.assignee).toBe("charlie@example.com");
    });
  });

  describe("REPORT_ON_GOAL", () => {
    it("should add a report note to a delegated goal", () => {
      const document = utils.createDocument();

      // Create a delegated goal
      let updatedDocument = reducer(
        document,
        createGoal({
          id: "goal-1",
          description: "Test goal",
          instructions: undefined,
          draft: false,
          parentId: null,
          insertBefore: null,
          assignee: "alice@example.com",
          dependsOn: [],
          initialNote: null,
          metaData: null,
        }),
      );

      // Report on the goal
      updatedDocument = reducer(
        updatedDocument,
        reportOnGoal({
          id: "goal-1",
          moveInReview: false,
          note: {
            id: "note-1",
            note: "Progress update: 50% complete",
            author: "Alice",
          },
        }),
      );

      const goal = updatedDocument.state.global.goals[0];
      expect(goal.status).toBe("DELEGATED"); // Status should remain DELEGATED
      expect(goal.notes).toHaveLength(1);
      expect(goal.notes[0].note).toBe("Progress update: 50% complete");
      expect(goal.notes[0].author).toBe("Alice");
    });

    it("should move goal to IN_REVIEW when moveInReview is true", () => {
      const document = utils.createDocument();

      // Create a delegated goal
      let updatedDocument = reducer(
        document,
        createGoal({
          id: "goal-1",
          description: "Test goal",
          instructions: undefined,
          draft: false,
          parentId: null,
          insertBefore: null,
          assignee: "alice@example.com",
          dependsOn: [],
          initialNote: null,
          metaData: null,
        }),
      );

      // Report on the goal and move to review
      updatedDocument = reducer(
        updatedDocument,
        reportOnGoal({
          id: "goal-1",
          moveInReview: true,
          note: {
            id: "note-1",
            note: "Ready for review",
            author: "Alice",
          },
        }),
      );

      const goal = updatedDocument.state.global.goals[0];
      expect(goal.status).toBe("IN_REVIEW");
      expect(goal.notes).toHaveLength(1);
      expect(goal.notes[0].note).toBe("Ready for review");
    });

    it("should fail when goal is not delegated", () => {
      const document = utils.createDocument();

      // Create a non-delegated goal
      const updatedDocument = reducer(
        document,
        createGoal({
          id: "goal-1",
          description: "Test goal",
          instructions: undefined,
          draft: false,
          parentId: null,
          insertBefore: null,
          assignee: null, // No assignee, so status is TODO
          dependsOn: [],
          initialNote: null,
          metaData: null,
        }),
      );

      // Try to report on the non-delegated goal
      const result = reducer(
        updatedDocument,
        reportOnGoal({
          id: "goal-1",
          moveInReview: false,
          note: {
            id: "note-1",
            note: "Progress update",
            author: "Alice",
          },
        }),
      );

      // Check that the operation has an error
      const lastOperation =
        result.operations.global[result.operations.global.length - 1];
      expect(lastOperation.error).toBeDefined();
      const errorMessage =
        typeof lastOperation.error === "string"
          ? lastOperation.error
          : (lastOperation.error as any)?.message;
      expect(errorMessage).toContain(
        "is not delegated and cannot be reported on",
      );
    });

    it("should fail when goal does not exist", () => {
      const document = utils.createDocument();

      const result = reducer(
        document,
        reportOnGoal({
          id: "nonexistent",
          moveInReview: false,
          note: {
            id: "note-1",
            note: "Progress update",
            author: "Alice",
          },
        }),
      );

      // Check that the operation has an error
      const lastOperation =
        result.operations.global[result.operations.global.length - 1];
      expect(lastOperation.error).toBeDefined();
      const errorMessage =
        typeof lastOperation.error === "string"
          ? lastOperation.error
          : (lastOperation.error as any)?.message;
      expect(errorMessage).toContain("not found");
    });
  });

  describe("REPORT_BLOCKED", () => {
    it("should mark a goal as BLOCKED and add question note", () => {
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

      // Report it as blocked
      updatedDocument = reducer(
        updatedDocument,
        reportBlocked({
          id: "goal-1",
          type: "MISSING_INFORMATION",
          comment: "What is the API endpoint for this service?",
        }),
      );

      const goal = updatedDocument.state.global.goals[0];
      expect(goal.status).toBe("BLOCKED");
      expect(goal.block).toBeDefined();
      expect(goal.block?.type).toBe("MISSING_INFORMATION");
      expect(goal.block?.comment).toBe(
        "What is the API endpoint for this service?",
      );
      expect(updatedDocument.state.global.isBlocked).toBe(true);
    });

    it("should update global isBlocked flag on first blocked goal", () => {
      const document = utils.createDocument();
      expect(document.state.global.isBlocked).toBe(false);

      // Create two goals
      let updatedDocument = reducer(
        document,
        createGoal({
          id: "goal-1",
          description: "Goal 1",
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

      updatedDocument = reducer(
        updatedDocument,
        createGoal({
          id: "goal-2",
          description: "Goal 2",
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

      // Block the first goal
      updatedDocument = reducer(
        updatedDocument,
        reportBlocked({
          id: "goal-1",
          type: "MISSING_INFORMATION",
          comment: "Need clarification",
        }),
      );

      expect(updatedDocument.state.global.isBlocked).toBe(true);
    });

    it("should fail when goal does not exist", () => {
      const document = utils.createDocument();

      const result = reducer(
        document,
        reportBlocked({
          id: "nonexistent",
          type: "OTHER",
          comment: "Question",
        }),
      );

      // Check that the operation has an error
      const lastOperation =
        result.operations.global[result.operations.global.length - 1];
      expect(lastOperation.error).toBeDefined();
      const errorMessage =
        typeof lastOperation.error === "string"
          ? lastOperation.error
          : (lastOperation.error as any)?.message;
      expect(errorMessage).toContain("not found");
    });
  });

  describe("UNBLOCK_GOAL", () => {
    it("should unblock a blocked goal and add response note", () => {
      const document = utils.createDocument();

      // Create a goal and block it
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

      updatedDocument = reducer(
        updatedDocument,
        reportBlocked({
          id: "goal-1",
          type: "MISSING_INFORMATION",
          comment: "What is the API endpoint?",
        }),
      );

      // Unblock it
      updatedDocument = reducer(
        updatedDocument,
        unblockGoal({
          id: "goal-1",
          response: {
            id: "note-2",
            note: "Use https://api.example.com/v1",
            author: "Tech Lead",
          },
        }),
      );

      const goal = updatedDocument.state.global.goals[0];
      expect(goal.status).toBe("TODO");
      expect(goal.block).toBeNull();
      expect(goal.notes).toHaveLength(1);
      expect(goal.notes[0].note).toBe(
        "UNBLOCKED: Use https://api.example.com/v1",
      );
      expect(goal.notes[0].author).toBe("Tech Lead");
      expect(updatedDocument.state.global.isBlocked).toBe(false);
    });

    it("should update global isBlocked flag when last blocked goal is unblocked", () => {
      const document = utils.createDocument();

      // Create two goals and block them
      let updatedDocument = reducer(
        document,
        createGoal({
          id: "goal-1",
          description: "Goal 1",
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

      updatedDocument = reducer(
        updatedDocument,
        createGoal({
          id: "goal-2",
          description: "Goal 2",
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

      updatedDocument = reducer(
        updatedDocument,
        reportBlocked({
          id: "goal-1",
          type: "MISSING_INFORMATION",
          comment: "Question 1",
        }),
      );

      updatedDocument = reducer(
        updatedDocument,
        reportBlocked({
          id: "goal-2",
          type: "MISSING_INFORMATION",
          comment: "Question 2",
        }),
      );

      expect(updatedDocument.state.global.isBlocked).toBe(true);

      // Unblock first goal
      updatedDocument = reducer(
        updatedDocument,
        unblockGoal({
          id: "goal-1",
          response: {
            id: "note-3",
            note: "Answer 1",
            author: null,
          },
        }),
      );

      // Should still be blocked (goal-2 is still blocked)
      expect(updatedDocument.state.global.isBlocked).toBe(true);

      // Unblock second goal
      updatedDocument = reducer(
        updatedDocument,
        unblockGoal({
          id: "goal-2",
          response: {
            id: "note-4",
            note: "Answer 2",
            author: null,
          },
        }),
      );

      // Now should be unblocked
      expect(updatedDocument.state.global.isBlocked).toBe(false);
    });

    it("should fail when goal is not blocked", () => {
      const document = utils.createDocument();

      // Create a non-blocked goal
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

      // Try to unblock it
      const result = reducer(
        updatedDocument,
        unblockGoal({
          id: "goal-1",
          response: {
            id: "note-1",
            note: "Response",
            author: null,
          },
        }),
      );

      // Check that the operation has an error
      const lastOperation =
        result.operations.global[result.operations.global.length - 1];
      expect(lastOperation.error).toBeDefined();
      const errorMessage =
        typeof lastOperation.error === "string"
          ? lastOperation.error
          : (lastOperation.error as any)?.message;
      expect(errorMessage).toContain("is not blocked");
    });

    it("should fail when goal does not exist", () => {
      const document = utils.createDocument();

      const result = reducer(
        document,
        unblockGoal({
          id: "nonexistent",
          response: {
            id: "note-1",
            note: "Response",
            author: null,
          },
        }),
      );

      // Check that the operation has an error
      const lastOperation =
        result.operations.global[result.operations.global.length - 1];
      expect(lastOperation.error).toBeDefined();
      const errorMessage =
        typeof lastOperation.error === "string"
          ? lastOperation.error
          : (lastOperation.error as any)?.message;
      expect(errorMessage).toContain("not found");
    });
  });
});
