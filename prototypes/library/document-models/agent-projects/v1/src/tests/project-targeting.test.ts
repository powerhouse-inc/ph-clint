/**
 * Unit tests for project-targeting module operations
 */

import { describe, it, expect } from "vitest";
import { generateId } from "document-model/core";
import {
  reducer,
  utils,
  isAgentProjectsDocument,
  createProject,
  runProject,
  stopProject,
  deleteProject,
} from "@powerhousedao/agent-manager/document-models/agent-projects";

describe("ProjectTargeting Operations", () => {
  describe("createProject", () => {
    it("should create a new project with default configuration", () => {
      const document = utils.createDocument();
      const projectId = generateId();
      const input = {
        id: projectId,
        name: "test-project",
      };

      const updatedDocument = reducer(document, createProject(input));

      expect(isAgentProjectsDocument(updatedDocument)).toBe(true);
      expect(updatedDocument.operations.global).toHaveLength(1);
      expect(updatedDocument.operations.global[0].action.type).toBe(
        "CREATE_PROJECT",
      );

      const state = updatedDocument.state.global;
      expect(state.projects).toHaveLength(1);

      const project = state.projects[0];
      expect(project.id).toBe(projectId);
      expect(project.name).toBe("test-project");
      expect(project.path).toBeNull();
      expect(project.currentStatus).toBe("MISSING");
      expect(project.targetedStatus).toBe("STOPPED");
      expect(project.configuration.connectPort).toBe(5000);
      expect(project.configuration.switchboardPort).toBe(6100);
      expect(project.configuration.startupTimeout).toBe(30000);
      expect(project.configuration.autoStart).toBe(false);
      expect(project.runtime).toBeNull();
      expect(project.logs).toEqual([]);
    });

    it("should create a project with custom ports", () => {
      const document = utils.createDocument();
      const projectId = generateId();
      const input = {
        id: projectId,
        name: "custom-project",
        connectPort: 5500,
        switchboardPort: 6500,
      };

      const updatedDocument = reducer(document, createProject(input));
      const project = updatedDocument.state.global.projects[0];

      expect(project.configuration.connectPort).toBe(5500);
      expect(project.configuration.switchboardPort).toBe(6500);
    });

    it("should create multiple projects", () => {
      let document = utils.createDocument();

      const project1Input = {
        id: generateId(),
        name: "project-1",
      };

      const project2Input = {
        id: generateId(),
        name: "project-2",
      };

      document = reducer(document, createProject(project1Input));
      document = reducer(document, createProject(project2Input));

      expect(document.state.global.projects).toHaveLength(2);
      expect(document.state.global.projects[0].name).toBe("project-1");
      expect(document.state.global.projects[1].name).toBe("project-2");
    });
  });

  describe("runProject", () => {
    it("should set project targetedStatus to RUNNING", () => {
      let document = utils.createDocument();
      const projectId = generateId();

      // First create a project
      document = reducer(
        document,
        createProject({
          id: projectId,
          name: "test-project",
        }),
      );

      // Then run it
      document = reducer(
        document,
        runProject({
          projectId,
        }),
      );

      const project = document.state.global.projects[0];
      expect(project.targetedStatus).toBe("RUNNING");
    });

    it("should record error if project does not exist", () => {
      const document = utils.createDocument();
      const input = {
        projectId: generateId(),
      };

      const updatedDocument = reducer(document, runProject(input));

      // Check that the operation was recorded with an error
      expect(updatedDocument.operations.global).toHaveLength(1);
      const operation = updatedDocument.operations.global[0];
      expect(operation.action.type).toBe("RUN_PROJECT");
      expect(operation.error).toBeDefined();

      // Check error structure - it might be a string or an object
      if (typeof operation.error === "string") {
        expect(operation.error).toMatch(/Project with ID .* not found/);
      } else if (operation.error) {
        expect(String(operation.error)).toMatch(/Project with ID .* not found/);
      }

      // The state should remain unchanged
      expect(updatedDocument.state.global.projects).toHaveLength(0);
    });
  });

  describe("stopProject", () => {
    it("should set project targetedStatus to STOPPED", () => {
      let document = utils.createDocument();
      const projectId = generateId();

      // Create and run a project
      document = reducer(
        document,
        createProject({
          id: projectId,
          name: "test-project",
        }),
      );
      document = reducer(document, runProject({ projectId }));

      // Then stop it
      document = reducer(document, stopProject({ projectId }));

      const project = document.state.global.projects[0];
      expect(project.targetedStatus).toBe("STOPPED");
    });

    it("should record error if project does not exist", () => {
      const document = utils.createDocument();
      const input = {
        projectId: generateId(),
      };

      const updatedDocument = reducer(document, stopProject(input));

      // Check that the operation was recorded with an error
      expect(updatedDocument.operations.global).toHaveLength(1);
      const operation = updatedDocument.operations.global[0];
      expect(operation.action.type).toBe("STOP_PROJECT");
      expect(operation.error).toBeDefined();

      // Check error structure - it might be a string or an object
      if (typeof operation.error === "string") {
        expect(operation.error).toMatch(/Project with ID .* not found/);
      } else if (operation.error) {
        expect(String(operation.error)).toMatch(/Project with ID .* not found/);
      }

      // The state should remain unchanged
      expect(updatedDocument.state.global.projects).toHaveLength(0);
    });
  });

  describe("deleteProject", () => {
    it("should set project targetedStatus to DELETED", () => {
      let document = utils.createDocument();
      const projectId = generateId();

      // Create a project
      document = reducer(
        document,
        createProject({
          id: projectId,
          name: "test-project",
        }),
      );

      // Then delete it
      document = reducer(document, deleteProject({ projectId }));

      const project = document.state.global.projects[0];
      expect(project.targetedStatus).toBe("DELETED");
    });

    it("should record error if project does not exist", () => {
      const document = utils.createDocument();
      const input = {
        projectId: generateId(),
      };

      const updatedDocument = reducer(document, deleteProject(input));

      // Check that the operation was recorded with an error
      expect(updatedDocument.operations.global).toHaveLength(1);
      const operation = updatedDocument.operations.global[0];
      expect(operation.action.type).toBe("DELETE_PROJECT");
      expect(operation.error).toBeDefined();

      // Check error structure - it might be a string or an object
      if (typeof operation.error === "string") {
        expect(operation.error).toMatch(/Project with ID .* not found/);
      } else if (operation.error) {
        expect(String(operation.error)).toMatch(/Project with ID .* not found/);
      }

      // The state should remain unchanged
      expect(updatedDocument.state.global.projects).toHaveLength(0);
    });
  });

  describe("Smart logic", () => {
    it("should enforce only one project can have RUNNING target", () => {
      let document = utils.createDocument();
      const project1Id = generateId();
      const project2Id = generateId();
      const project3Id = generateId();

      // Create three projects
      document = reducer(
        document,
        createProject({
          id: project1Id,
          name: "project-1",
        }),
      );
      document = reducer(
        document,
        createProject({
          id: project2Id,
          name: "project-2",
        }),
      );
      document = reducer(
        document,
        createProject({
          id: project3Id,
          name: "project-3",
        }),
      );

      // Set project 1 to RUNNING
      document = reducer(document, runProject({ projectId: project1Id }));
      expect(document.state.global.projects[0].targetedStatus).toBe("RUNNING");
      expect(document.state.global.projects[1].targetedStatus).toBe("STOPPED");
      expect(document.state.global.projects[2].targetedStatus).toBe("STOPPED");

      // Set project 2 to RUNNING - should stop project 1
      document = reducer(document, runProject({ projectId: project2Id }));
      expect(document.state.global.projects[0].targetedStatus).toBe("STOPPED");
      expect(document.state.global.projects[1].targetedStatus).toBe("RUNNING");
      expect(document.state.global.projects[2].targetedStatus).toBe("STOPPED");

      // Set project 3 to RUNNING - should stop project 2
      document = reducer(document, runProject({ projectId: project3Id }));
      expect(document.state.global.projects[0].targetedStatus).toBe("STOPPED");
      expect(document.state.global.projects[1].targetedStatus).toBe("STOPPED");
      expect(document.state.global.projects[2].targetedStatus).toBe("RUNNING");
    });

    it("should auto-reconcile DELETED status when deleting MISSING project", () => {
      let document = utils.createDocument();
      const projectId = generateId();

      // Create project (starts with currentStatus: MISSING)
      document = reducer(
        document,
        createProject({
          id: projectId,
          name: "missing-project",
        }),
      );

      const projectBefore = document.state.global.projects[0];
      expect(projectBefore.currentStatus).toBe("MISSING");
      expect(projectBefore.targetedStatus).toBe("STOPPED");

      // Delete the missing project
      document = reducer(document, deleteProject({ projectId }));

      const projectAfter = document.state.global.projects[0];
      expect(projectAfter.targetedStatus).toBe("DELETED");
      // Should auto-reconcile currentStatus to DELETED
      expect(projectAfter.currentStatus).toBe("DELETED");
    });

    it("should NOT auto-reconcile DELETED status for non-MISSING projects", async () => {
      let document = utils.createDocument();
      const projectId = generateId();

      // Create and register a project with STOPPED status
      document = reducer(
        document,
        createProject({
          id: projectId,
          name: "stopped-project",
        }),
      );

      // Manually update status to STOPPED (simulating it exists on filesystem)
      const { updateProjectStatus } =
        await import("@powerhousedao/agent-manager/document-models/agent-projects");
      document = reducer(
        document,
        updateProjectStatus({
          projectId,
          currentStatus: "STOPPED",
        }),
      );

      const projectBefore = document.state.global.projects[0];
      expect(projectBefore.currentStatus).toBe("STOPPED");

      // Delete the stopped project
      document = reducer(document, deleteProject({ projectId }));

      const projectAfter = document.state.global.projects[0];
      expect(projectAfter.targetedStatus).toBe("DELETED");
      // Should NOT auto-reconcile - keeps STOPPED status
      expect(projectAfter.currentStatus).toBe("STOPPED");
    });

    it("should update project path when provided in UPDATE_PROJECT_STATUS", async () => {
      let document = utils.createDocument();
      const projectId = generateId();

      // Create project (starts with path: null)
      document = reducer(
        document,
        createProject({
          id: projectId,
          name: "path-test-project",
        }),
      );

      let project = document.state.global.projects[0];
      expect(project.path).toBeNull();

      // Import necessary function
      const { updateProjectStatus } =
        await import("@powerhousedao/agent-manager/document-models/agent-projects");

      // Update status with path
      document = reducer(
        document,
        updateProjectStatus({
          projectId,
          currentStatus: "INITIALIZING",
          path: "/home/wouter/projects/demo-workspace/path-test-project",
        }),
      );

      project = document.state.global.projects[0];
      expect(project.currentStatus).toBe("INITIALIZING");
      expect(project.path).toBe(
        "/home/wouter/projects/demo-workspace/path-test-project",
      );

      // Update status without path (should keep existing path)
      document = reducer(
        document,
        updateProjectStatus({
          projectId,
          currentStatus: "STOPPED",
        }),
      );

      project = document.state.global.projects[0];
      expect(project.currentStatus).toBe("STOPPED");
      expect(project.path).toBe(
        "/home/wouter/projects/demo-workspace/path-test-project",
      );
    });

    it("should clear runtime info when transitioning from RUNNING to STOPPED", async () => {
      let document = utils.createDocument();
      const projectId = generateId();

      // Create project
      document = reducer(
        document,
        createProject({
          id: projectId,
          name: "runtime-test-project",
        }),
      );

      // Import necessary functions
      const { updateRuntimeInfo, updateProjectStatus } =
        await import("@powerhousedao/agent-manager/document-models/agent-projects");

      // Simulate project running with runtime info
      document = reducer(
        document,
        updateRuntimeInfo({
          projectId,
          pid: 12345,
          startedAt: new Date().toISOString(),
          driveUrl: "http://localhost:5000",
          connectPort: 5000,
          switchboardPort: 6100,
        }),
      );

      // Update status to RUNNING
      document = reducer(
        document,
        updateProjectStatus({
          projectId,
          currentStatus: "RUNNING",
        }),
      );

      let project = document.state.global.projects[0];
      expect(project.runtime).not.toBeNull();
      expect(project.runtime?.pid).toBe(12345);

      // Update status to STOPPED
      document = reducer(
        document,
        updateProjectStatus({
          projectId,
          currentStatus: "STOPPED",
        }),
      );

      project = document.state.global.projects[0];
      // Runtime info should be cleared
      expect(project.runtime).toBeNull();
    });
  });

  describe("Project lifecycle", () => {
    it("should handle complete project lifecycle", () => {
      let document = utils.createDocument();
      const projectId = generateId();

      // Create project
      document = reducer(
        document,
        createProject({
          id: projectId,
          name: "lifecycle-project",
          connectPort: 5100,
          switchboardPort: 6200,
        }),
      );

      let project = document.state.global.projects[0];
      expect(project.targetedStatus).toBe("STOPPED");
      expect(project.currentStatus).toBe("MISSING");

      // Run project
      document = reducer(document, runProject({ projectId }));
      project = document.state.global.projects[0];
      expect(project.targetedStatus).toBe("RUNNING");

      // Stop project
      document = reducer(document, stopProject({ projectId }));
      project = document.state.global.projects[0];
      expect(project.targetedStatus).toBe("STOPPED");

      // Delete project
      document = reducer(document, deleteProject({ projectId }));
      project = document.state.global.projects[0];
      expect(project.targetedStatus).toBe("DELETED");
    });

    it("should maintain project data through state changes", () => {
      let document = utils.createDocument();
      const projectId = generateId();
      const projectName = "persistent-project";

      // Create project with specific config
      document = reducer(
        document,
        createProject({
          id: projectId,
          name: projectName,
          connectPort: 5200,
          switchboardPort: 6300,
        }),
      );

      // Run, stop, and check data persists
      document = reducer(document, runProject({ projectId }));
      document = reducer(document, stopProject({ projectId }));

      const project = document.state.global.projects[0];
      expect(project.id).toBe(projectId);
      expect(project.name).toBe(projectName);
      expect(project.configuration.connectPort).toBe(5200);
      expect(project.configuration.switchboardPort).toBe(6300);
      expect(project.path).toBeNull();
    });
  });
});
