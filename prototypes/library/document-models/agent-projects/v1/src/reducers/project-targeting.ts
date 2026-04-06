import { ProjectNotFoundError } from "../../gen/project-targeting/error.js";
import type { AgentProjectsProjectTargetingOperations } from "@powerhousedao/agent-manager/document-models/agent-projects/v1";

export const agentProjectsProjectTargetingOperations: AgentProjectsProjectTargetingOperations =
  {
    createProjectOperation(state, action) {
      const newProject = {
        id: action.input.id,
        name: action.input.name,
        path: null,
        currentStatus: "MISSING" as const,
        targetedStatus: "STOPPED" as const,
        configuration: {
          connectPort: action.input.connectPort || 5000,
          switchboardPort: action.input.switchboardPort || 6100,
          startupTimeout: 30000,
          autoStart: false,
        },
        runtime: null,
        logs: [],
      };
      state.projects.push(newProject);
    },
    runProjectOperation(state, action) {
      const project = state.projects.find(
        (p) => p.id === action.input.projectId,
      );
      if (!project) {
        throw new ProjectNotFoundError(
          `Project with ID ${action.input.projectId} not found`,
        );
      }

      // Smart logic: Only one project can have RUNNING target
      // Stop all other projects that are targeted to run
      state.projects.forEach((p) => {
        if (p.id !== action.input.projectId && p.targetedStatus === "RUNNING") {
          p.targetedStatus = "STOPPED";
        }
      });

      project.targetedStatus = "RUNNING";
    },
    stopProjectOperation(state, action) {
      const project = state.projects.find(
        (p) => p.id === action.input.projectId,
      );
      if (!project) {
        throw new ProjectNotFoundError(
          `Project with ID ${action.input.projectId} not found`,
        );
      }
      project.targetedStatus = "STOPPED";
    },
    deleteProjectOperation(state, action) {
      const project = state.projects.find(
        (p) => p.id === action.input.projectId,
      );
      if (!project) {
        throw new ProjectNotFoundError(
          `Project with ID ${action.input.projectId} not found`,
        );
      }

      project.targetedStatus = "DELETED";

      // Smart logic: Auto-reconcile DELETED status
      // If current status is MISSING and we target DELETED, it's effectively deleted
      if (project.currentStatus === "MISSING") {
        project.currentStatus = "DELETED";
      }
    },
  };
