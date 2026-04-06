import { ProjectNotFoundError } from "../../gen/runtime-info/error.js";
import type { AgentProjectsRuntimeInfoOperations } from "@powerhousedao/agent-manager/document-models/agent-projects/v1";

export const agentProjectsRuntimeInfoOperations: AgentProjectsRuntimeInfoOperations =
  {
    updateRuntimeInfoOperation(state, action) {
      const project = state.projects.find(
        (p) => p.id === action.input.projectId,
      );
      if (!project) {
        throw new ProjectNotFoundError(
          `Project with ID ${action.input.projectId} not found`,
        );
      }

      project.runtime = {
        pid: action.input.pid,
        startedAt: action.input.startedAt,
        driveUrl: action.input.driveUrl || null,
        connectPort: action.input.connectPort,
        switchboardPort: action.input.switchboardPort,
      };
    },
  };
