import { generateMock } from "@powerhousedao/common/utils";
import { describe, expect, it } from "vitest";
import {
  reducer,
  utils,
  isWorkBreakdownStructureDocument,
  createGoal,
  reorder,
  addDependencies,
  removeDependencies,
  ReorderInputSchema,
  AddDependenciesInputSchema,
  RemoveDependenciesInputSchema,
} from "@powerhousedao/agent-manager/document-models/work-breakdown-structure/v1";

describe("HierarchyOperations", () => {
  it("should handle reorder operation", () => {
    const document = utils.createDocument();
    const input = generateMock(ReorderInputSchema());

    const updatedDocument = reducer(document, reorder(input));

    expect(isWorkBreakdownStructureDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe("REORDER");
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle addDependencies operation", () => {
    const document = utils.createDocument();
    const input = generateMock(AddDependenciesInputSchema());

    const updatedDocument = reducer(document, addDependencies(input));

    expect(isWorkBreakdownStructureDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "ADD_DEPENDENCIES",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle removeDependencies operation", () => {
    const document = utils.createDocument();
    const input = generateMock(RemoveDependenciesInputSchema());

    const updatedDocument = reducer(document, removeDependencies(input));

    expect(isWorkBreakdownStructureDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "REMOVE_DEPENDENCIES",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  describe("REORDER", () => {
    it("should move a goal to a different parent", () => {
      const document = utils.createDocument();

      // Create parent goals
      let updatedDocument = reducer(
        document,
        createGoal({
          id: "parent-1",
          description: "Parent 1",
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
          id: "parent-2",
          description: "Parent 2",
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

      // Create a child under parent-1
      updatedDocument = reducer(
        updatedDocument,
        createGoal({
          id: "child-1",
          description: "Child 1",
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

      // Move child-1 to parent-2
      updatedDocument = reducer(
        updatedDocument,
        reorder({
          goalId: "child-1",
          parentId: "parent-2",
          insertBefore: null,
        }),
      );

      const child = updatedDocument.state.global.goals.find(
        (g) => g.id === "child-1",
      );
      expect(child?.parentId).toBe("parent-2");
    });

    it("should move a goal to root level", () => {
      const document = utils.createDocument();

      // Create parent and child
      let updatedDocument = reducer(
        document,
        createGoal({
          id: "parent-1",
          description: "Parent 1",
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
          description: "Child 1",
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

      // Move child-1 to root
      updatedDocument = reducer(
        updatedDocument,
        reorder({
          goalId: "child-1",
          parentId: null,
          insertBefore: null,
        }),
      );

      const child = updatedDocument.state.global.goals.find(
        (g) => g.id === "child-1",
      );
      expect(child?.parentId).toBeNull();
    });

    it("should reorder goals within the same level", () => {
      const document = utils.createDocument();

      // Create three sibling goals
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
        createGoal({
          id: "goal-3",
          description: "Goal 3",
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

      // Move goal-3 before goal-1
      updatedDocument = reducer(
        updatedDocument,
        reorder({
          goalId: "goal-3",
          insertBefore: "goal-1",
        }),
      );

      const goalIds = updatedDocument.state.global.goals.map((g) => g.id);
      const goal3Index = goalIds.indexOf("goal-3");
      const goal1Index = goalIds.indexOf("goal-1");
      expect(goal3Index).toBeLessThan(goal1Index);
    });

    it("should prevent circular references", () => {
      const document = utils.createDocument();

      // Create parent-child-grandchild hierarchy
      let updatedDocument = reducer(
        document,
        createGoal({
          id: "parent-1",
          description: "Parent 1",
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
          description: "Child 1",
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

      // Try to move parent-1 under grandchild-1 (should fail)
      const result = reducer(
        updatedDocument,
        reorder({
          goalId: "parent-1",
          parentId: "grandchild-1",
          insertBefore: null,
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
      expect(errorMessage).toContain("under its own descendant");
    });

    it("should fail when goal does not exist", () => {
      const document = utils.createDocument();

      const result = reducer(
        document,
        reorder({
          goalId: "nonexistent",
          parentId: null,
          insertBefore: null,
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

    it("should fail when new parent does not exist", () => {
      const document = utils.createDocument();

      // Create a goal
      const updatedDocument = reducer(
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

      // Try to move it under a non-existent parent
      const result = reducer(
        updatedDocument,
        reorder({
          goalId: "goal-1",
          parentId: "nonexistent-parent",
          insertBefore: null,
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
        "Parent goal with ID nonexistent-parent not found",
      );
    });
  });

  describe("ADD_DEPENDENCIES", () => {
    it("should add dependencies to a goal", () => {
      const document = utils.createDocument();

      // Create goals
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
        createGoal({
          id: "goal-3",
          description: "Goal 3",
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

      // Add dependencies
      updatedDocument = reducer(
        updatedDocument,
        addDependencies({
          goalId: "goal-3",
          dependsOn: ["goal-1", "goal-2"],
        }),
      );

      const goal = updatedDocument.state.global.goals.find(
        (g) => g.id === "goal-3",
      );
      expect(goal?.dependencies).toContain("goal-1");
      expect(goal?.dependencies).toContain("goal-2");
      expect(goal?.dependencies).toHaveLength(2);
    });

    it("should avoid duplicate dependencies", () => {
      const document = utils.createDocument();

      // Create goals
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
          dependsOn: ["goal-1"],
          initialNote: null,
          metaData: null,
        }),
      );

      // Try to add the same dependency again
      updatedDocument = reducer(
        updatedDocument,
        addDependencies({
          goalId: "goal-2",
          dependsOn: ["goal-1"],
        }),
      );

      const goal = updatedDocument.state.global.goals.find(
        (g) => g.id === "goal-2",
      );
      expect(goal?.dependencies).toHaveLength(1); // Should still be 1, not 2
      expect(goal?.dependencies).toContain("goal-1");
    });

    it("should prevent circular dependencies", () => {
      const document = utils.createDocument();

      // Create parent-child hierarchy
      let updatedDocument = reducer(
        document,
        createGoal({
          id: "parent-1",
          description: "Parent 1",
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
          description: "Child 1",
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

      // Try to make parent depend on its child
      const result = reducer(
        updatedDocument,
        addDependencies({
          goalId: "parent-1",
          dependsOn: ["child-1"],
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
      expect(errorMessage).toContain("is a descendant");
    });

    it("should prevent self-dependencies", () => {
      const document = utils.createDocument();

      // Create a goal
      const updatedDocument = reducer(
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

      // Try to make goal depend on itself
      const result = reducer(
        updatedDocument,
        addDependencies({
          goalId: "goal-1",
          dependsOn: ["goal-1"],
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
      expect(errorMessage).toContain("cannot depend on itself");
    });

    it("should fail when dependency does not exist", () => {
      const document = utils.createDocument();

      // Create a goal
      const updatedDocument = reducer(
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

      // Try to add non-existent dependency
      const result = reducer(
        updatedDocument,
        addDependencies({
          goalId: "goal-1",
          dependsOn: ["nonexistent"],
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
        "Dependency goal with ID nonexistent not found",
      );
    });
  });

  describe("REMOVE_DEPENDENCIES", () => {
    it("should remove specified dependencies", () => {
      const document = utils.createDocument();

      // Create goals with dependencies
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
        createGoal({
          id: "goal-3",
          description: "Goal 3",
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

      // Remove one dependency
      updatedDocument = reducer(
        updatedDocument,
        removeDependencies({
          goalId: "goal-3",
          dependencies: ["goal-1"],
        }),
      );

      const goal = updatedDocument.state.global.goals.find(
        (g) => g.id === "goal-3",
      );
      expect(goal?.dependencies).not.toContain("goal-1");
      expect(goal?.dependencies).toContain("goal-2");
      expect(goal?.dependencies).toHaveLength(1);
    });

    it("should remove all dependencies when specified", () => {
      const document = utils.createDocument();

      // Create goals with dependencies
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
        createGoal({
          id: "goal-3",
          description: "Goal 3",
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

      // Remove all dependencies
      updatedDocument = reducer(
        updatedDocument,
        removeDependencies({
          goalId: "goal-3",
          dependencies: ["goal-1", "goal-2"],
        }),
      );

      const goal = updatedDocument.state.global.goals.find(
        (g) => g.id === "goal-3",
      );
      expect(goal?.dependencies).toHaveLength(0);
    });

    it("should handle removing non-existent dependencies gracefully", () => {
      const document = utils.createDocument();

      // Create a goal with one dependency
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
          dependsOn: ["goal-1"],
          initialNote: null,
          metaData: null,
        }),
      );

      // Try to remove a dependency that doesn't exist
      updatedDocument = reducer(
        updatedDocument,
        removeDependencies({
          goalId: "goal-2",
          dependencies: ["nonexistent"],
        }),
      );

      // Should not fail, just not remove anything
      const goal = updatedDocument.state.global.goals.find(
        (g) => g.id === "goal-2",
      );
      expect(goal?.dependencies).toContain("goal-1");
      expect(goal?.dependencies).toHaveLength(1);
    });

    it("should fail when goal does not exist", () => {
      const document = utils.createDocument();

      const result = reducer(
        document,
        removeDependencies({
          goalId: "nonexistent",
          dependencies: ["dep1"],
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
