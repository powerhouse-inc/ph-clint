import {
  DuplicateProjectError,
  ProjectNotFoundError,
} from "../../gen/project-management/error.js";
import type { AgentProjectsProjectManagementOperations } from "@powerhousedao/agent-manager/document-models/agent-projects/v1";

export const agentProjectsProjectManagementOperations: AgentProjectsProjectManagementOperations =
  {
    registerProjectOperation(state, action) {
      const existingProject = state.projects.find(
        (p) => p.name === action.input.name || p.path === action.input.path,
      );
      if (existingProject) {
        throw new DuplicateProjectError(
          `Project with name '${action.input.name}' or path '${action.input.path}' already exists`,
        );
      }

      const newProject = {
        id: action.input.id,
        name: action.input.name,
        path: action.input.path,
        currentStatus: action.input.currentStatus,
        targetedStatus: "STOPPED" as const,
        configuration: {
          connectPort: action.input.connectPort,
          switchboardPort: action.input.switchboardPort,
          startupTimeout: action.input.startupTimeout,
          autoStart: action.input.autoStart,
        },
        runtime: null,
        logs: [],
      };
      state.projects.push(newProject);
    },
    updateProjectConfigOperation(state, action) {
      const project = state.projects.find(
        (p) => p.id === action.input.projectId,
      );
      if (!project) {
        throw new ProjectNotFoundError(
          `Project with ID ${action.input.projectId} not found`,
        );
      }
      if (
        action.input.connectPort !== undefined &&
        action.input.connectPort !== null
      ) {
        project.configuration.connectPort = action.input.connectPort;
      }
      if (
        action.input.switchboardPort !== undefined &&
        action.input.switchboardPort !== null
      ) {
        project.configuration.switchboardPort = action.input.switchboardPort;
      }
      if (
        action.input.startupTimeout !== undefined &&
        action.input.startupTimeout !== null
      ) {
        project.configuration.startupTimeout = action.input.startupTimeout;
      }
      if (
        action.input.autoStart !== undefined &&
        action.input.autoStart !== null
      ) {
        project.configuration.autoStart = action.input.autoStart;
      }
    },
    updateProjectStatusOperation(state, action) {
      const project = state.projects.find(
        (p) => p.id === action.input.projectId,
      );
      if (!project) {
        throw new ProjectNotFoundError(
          `Project with ID ${action.input.projectId} not found`,
        );
      }

      const previousStatus = project.currentStatus;
      project.currentStatus = action.input.currentStatus;

      // Update path if provided
      if (action.input.path !== undefined && action.input.path !== null) {
        project.path = action.input.path;
      }

      // Smart logic: Clear runtime info when stopping
      // If transitioning to STOPPED, clear the runtime info
      if (
        action.input.currentStatus === "STOPPED" &&
        previousStatus === "RUNNING"
      ) {
        project.runtime = null;
      }
    },
  };
