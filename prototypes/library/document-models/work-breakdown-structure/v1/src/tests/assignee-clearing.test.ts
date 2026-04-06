/**
 * Tests for assignee clearing when status changes
 */

import { describe, it, expect } from "vitest";
import {
  reducer,
  utils,
  createGoal,
  delegateGoal,
  markInProgress,
  markCompleted,
  markTodo,
  reportBlocked,
  unblockGoal,
  markWontDo,
  reportOnGoal,
} from "@powerhousedao/agent-manager/document-models/work-breakdown-structure";

describe("Assignee Clearing on Status Changes", () => {
  describe("when changing from DELEGATED status", () => {
    it("should clear assignee when marking DELEGATED goal as IN_PROGRESS", () => {
      const document = utils.createDocument();

      // Create a delegated goal
      let updatedDocument = reducer(
        document,
        createGoal({
          id: "goal-1",
          description: "Delegated task",
          assignee: "john.doe@example.com",
        }),
      );

      expect(updatedDocument.state.global.goals[0].status).toBe("DELEGATED");
      expect(updatedDocument.state.global.goals[0].assignee).toBe(
        "john.doe@example.com",
      );

      // Mark as IN_PROGRESS
      updatedDocument = reducer(
        updatedDocument,
        markInProgress({ id: "goal-1" }),
      );

      expect(updatedDocument.state.global.goals[0].status).toBe("IN_PROGRESS");
      expect(updatedDocument.state.global.goals[0].assignee).toBeNull();
    });

    it("should clear assignee when marking DELEGATED goal as COMPLETED", () => {
      const document = utils.createDocument();

      // Create a delegated goal
      let updatedDocument = reducer(
        document,
        createGoal({
          id: "goal-1",
          description: "Delegated task",
          assignee: "jane.smith@example.com",
        }),
      );

      expect(updatedDocument.state.global.goals[0].assignee).toBe(
        "jane.smith@example.com",
      );

      // Mark as COMPLETED
      updatedDocument = reducer(
        updatedDocument,
        markCompleted({ id: "goal-1" }),
      );

      expect(updatedDocument.state.global.goals[0].status).toBe("COMPLETED");
      expect(updatedDocument.state.global.goals[0].assignee).toBeNull();
    });

    it("should clear assignee when marking DELEGATED goal as TODO", () => {
      const document = utils.createDocument();

      // Create a delegated goal
      let updatedDocument = reducer(
        document,
        createGoal({
          id: "goal-1",
          description: "Delegated task",
          assignee: "bob@example.com",
        }),
      );

      // Mark as TODO
      updatedDocument = reducer(updatedDocument, markTodo({ id: "goal-1" }));

      expect(updatedDocument.state.global.goals[0].status).toBe("TODO");
      expect(updatedDocument.state.global.goals[0].assignee).toBeNull();
    });

    it("should clear assignee when marking DELEGATED goal as BLOCKED", () => {
      const document = utils.createDocument();

      // Create a delegated goal
      let updatedDocument = reducer(
        document,
        createGoal({
          id: "goal-1",
          description: "Delegated task",
          assignee: "alice@example.com",
        }),
      );

      // Report as blocked
      updatedDocument = reducer(
        updatedDocument,
        reportBlocked({
          id: "goal-1",
          type: "MISSING_INFORMATION",
          comment: "Need clarification",
        }),
      );

      expect(updatedDocument.state.global.goals[0].status).toBe("BLOCKED");
      expect(updatedDocument.state.global.goals[0].assignee).toBeNull();
    });

    it("should clear assignee when marking DELEGATED goal as WONT_DO", () => {
      const document = utils.createDocument();

      // Create a delegated goal
      let updatedDocument = reducer(
        document,
        createGoal({
          id: "goal-1",
          description: "Delegated task",
          assignee: "charlie@example.com",
        }),
      );

      // Mark as WONT_DO
      updatedDocument = reducer(updatedDocument, markWontDo({ id: "goal-1" }));

      expect(updatedDocument.state.global.goals[0].status).toBe("WONT_DO");
      expect(updatedDocument.state.global.goals[0].assignee).toBeNull();
    });
  });

  describe("when changing from IN_REVIEW status", () => {
    it("should keep assignee when reporting on DELEGATED goal and moving to IN_REVIEW", () => {
      const document = utils.createDocument();

      // Create a delegated goal
      let updatedDocument = reducer(
        document,
        createGoal({
          id: "goal-1",
          description: "Delegated task",
          assignee: "reviewer@example.com",
        }),
      );

      // Report progress and move to IN_REVIEW
      updatedDocument = reducer(
        updatedDocument,
        reportOnGoal({
          id: "goal-1",
          note: {
            id: "note-1",
            note: "Ready for review",
          },
          moveInReview: true,
        }),
      );

      expect(updatedDocument.state.global.goals[0].status).toBe("IN_REVIEW");
      expect(updatedDocument.state.global.goals[0].assignee).toBe(
        "reviewer@example.com",
      );
    });

    it("should clear assignee when marking IN_REVIEW goal as COMPLETED", () => {
      const document = utils.createDocument();

      // Create and move goal to IN_REVIEW with assignee
      let updatedDocument = reducer(
        document,
        createGoal({
          id: "goal-1",
          description: "Task in review",
          assignee: "reviewer@example.com",
        }),
      );

      updatedDocument = reducer(
        updatedDocument,
        reportOnGoal({
          id: "goal-1",
          note: { id: "note-1", note: "Ready for review" },
          moveInReview: true,
        }),
      );

      expect(updatedDocument.state.global.goals[0].status).toBe("IN_REVIEW");
      expect(updatedDocument.state.global.goals[0].assignee).toBe(
        "reviewer@example.com",
      );

      // Mark as COMPLETED
      updatedDocument = reducer(
        updatedDocument,
        markCompleted({ id: "goal-1" }),
      );

      expect(updatedDocument.state.global.goals[0].status).toBe("COMPLETED");
      expect(updatedDocument.state.global.goals[0].assignee).toBeNull();
    });

    it("should clear assignee when marking IN_REVIEW goal as TODO", () => {
      const document = utils.createDocument();

      // Create and move goal to IN_REVIEW
      let updatedDocument = reducer(
        document,
        createGoal({
          id: "goal-1",
          description: "Task in review",
          assignee: "reviewer@example.com",
        }),
      );

      updatedDocument = reducer(
        updatedDocument,
        reportOnGoal({
          id: "goal-1",
          note: { id: "note-1", note: "Ready for review" },
          moveInReview: true,
        }),
      );

      // Mark as TODO
      updatedDocument = reducer(updatedDocument, markTodo({ id: "goal-1" }));

      expect(updatedDocument.state.global.goals[0].status).toBe("TODO");
      expect(updatedDocument.state.global.goals[0].assignee).toBeNull();
    });
  });

  describe("when unblocking goals", () => {
    it("should clear assignee when unblocking a BLOCKED goal (returns to TODO)", () => {
      const document = utils.createDocument();

      // Create a delegated goal
      let updatedDocument = reducer(
        document,
        createGoal({
          id: "goal-1",
          description: "Task",
          assignee: "worker@example.com",
        }),
      );

      // Block it
      updatedDocument = reducer(
        updatedDocument,
        reportBlocked({
          id: "goal-1",
          type: "OTHER",
          comment: "Blocked",
        }),
      );

      expect(updatedDocument.state.global.goals[0].status).toBe("BLOCKED");
      expect(updatedDocument.state.global.goals[0].assignee).toBeNull();

      // Unblock it
      updatedDocument = reducer(
        updatedDocument,
        unblockGoal({
          id: "goal-1",
          response: { id: "r-1", note: "Resolved" },
        }),
      );

      expect(updatedDocument.state.global.goals[0].status).toBe("TODO");
      expect(updatedDocument.state.global.goals[0].assignee).toBeNull();
    });
  });

  describe("when propagating status changes", () => {
    it("should clear assignee on parent goals when child is marked IN_PROGRESS", () => {
      const document = utils.createDocument();

      // Create parent with assignee
      let updatedDocument = reducer(
        document,
        createGoal({
          id: "parent-1",
          description: "Parent goal",
          assignee: "manager@example.com",
        }),
      );

      // Create child
      updatedDocument = reducer(
        updatedDocument,
        createGoal({
          id: "child-1",
          description: "Child goal",
          parentId: "parent-1",
        }),
      );

      expect(updatedDocument.state.global.goals[0].status).toBe("DELEGATED");
      expect(updatedDocument.state.global.goals[0].assignee).toBe(
        "manager@example.com",
      );

      // Mark child as IN_PROGRESS
      updatedDocument = reducer(
        updatedDocument,
        markInProgress({ id: "child-1" }),
      );

      // Parent should be IN_PROGRESS with no assignee
      const parent = updatedDocument.state.global.goals.find(
        (g) => g.id === "parent-1",
      );
      expect(parent?.status).toBe("IN_PROGRESS");
      expect(parent?.assignee).toBeNull();
    });

    it("should clear assignee on child goals when parent is marked COMPLETED", () => {
      const document = utils.createDocument();

      // Create parent
      let updatedDocument = reducer(
        document,
        createGoal({
          id: "parent-1",
          description: "Parent goal",
        }),
      );

      // Create children with assignees
      updatedDocument = reducer(
        updatedDocument,
        createGoal({
          id: "child-1",
          description: "Child 1",
          parentId: "parent-1",
          assignee: "worker1@example.com",
        }),
      );

      updatedDocument = reducer(
        updatedDocument,
        createGoal({
          id: "child-2",
          description: "Child 2",
          parentId: "parent-1",
          assignee: "worker2@example.com",
        }),
      );

      // Verify children are delegated with assignees
      const child1Before = updatedDocument.state.global.goals.find(
        (g) => g.id === "child-1",
      );
      const child2Before = updatedDocument.state.global.goals.find(
        (g) => g.id === "child-2",
      );
      expect(child1Before?.status).toBe("DELEGATED");
      expect(child1Before?.assignee).toBe("worker1@example.com");
      expect(child2Before?.status).toBe("DELEGATED");
      expect(child2Before?.assignee).toBe("worker2@example.com");

      // Mark parent as COMPLETED
      updatedDocument = reducer(
        updatedDocument,
        markCompleted({ id: "parent-1" }),
      );

      // All goals should be COMPLETED with no assignees
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
      expect(parent?.assignee).toBeNull();
      expect(child1?.status).toBe("COMPLETED");
      expect(child1?.assignee).toBeNull();
      expect(child2?.status).toBe("COMPLETED");
      expect(child2?.assignee).toBeNull();
    });

    it("should clear assignee on child goals when parent is marked WONT_DO", () => {
      const document = utils.createDocument();

      // Create parent
      let updatedDocument = reducer(
        document,
        createGoal({
          id: "parent-1",
          description: "Parent goal",
        }),
      );

      // Create child with assignee
      updatedDocument = reducer(
        updatedDocument,
        createGoal({
          id: "child-1",
          description: "Child goal",
          parentId: "parent-1",
          assignee: "worker@example.com",
        }),
      );

      // Mark parent as WONT_DO
      updatedDocument = reducer(
        updatedDocument,
        markWontDo({ id: "parent-1" }),
      );

      // Both should be WONT_DO with no assignees
      const parent = updatedDocument.state.global.goals.find(
        (g) => g.id === "parent-1",
      );
      const child = updatedDocument.state.global.goals.find(
        (g) => g.id === "child-1",
      );

      expect(parent?.status).toBe("WONT_DO");
      expect(parent?.assignee).toBeNull();
      expect(child?.status).toBe("WONT_DO");
      expect(child?.assignee).toBeNull();
    });
  });
});
