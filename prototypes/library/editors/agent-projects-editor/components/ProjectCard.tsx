import type { Project } from "@powerhousedao/agent-manager/document-models/agent-projects";
import { ProjectStatusDisplay } from "./ProjectStatusDisplay.js";
import { TargetedStatusControls } from "./TargetedStatusControls.js";

interface ProjectCardProps {
  project: Project;
  onRunProject: (projectId: string) => void;
  onStopProject: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
}

export function ProjectCard({
  project,
  onRunProject,
  onStopProject,
  onDeleteProject,
}: ProjectCardProps) {
  const hasRuntime = project.runtime !== null;
  const isRunning = project.currentStatus === "RUNNING";
  const isTargetedToRun = project.targetedStatus === "RUNNING" && !isRunning;

  // Determine border color based on status
  const borderColor = isRunning
    ? "border-green-500 border-2 bg-green-50"
    : isTargetedToRun
      ? "border-yellow-500 border-2 bg-yellow-50"
      : "border-gray-200";

  return (
    <div
      className={`rounded-lg p-4 hover:shadow-md transition-shadow ${borderColor}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {isRunning && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                ACTIVE
              </span>
            )}
            <h3 className="text-lg font-semibold text-gray-900">
              {project.name}
            </h3>
          </div>
          <p className="text-sm text-gray-500 font-mono">
            {project.path || (
              <span className="italic">Path not yet assigned</span>
            )}
          </p>
        </div>
        <ProjectStatusDisplay
          currentStatus={project.currentStatus}
          targetedStatus={project.targetedStatus}
        />
      </div>

      {/* Configuration (Read-only) */}
      <div className="bg-gray-50 rounded p-3 mb-3">
        <h4 className="text-sm font-medium text-gray-700 mb-2">
          Configuration
        </h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-gray-600">Connect Port:</span>{" "}
            <span className="font-mono">
              {project.configuration.connectPort}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Switchboard Port:</span>{" "}
            <span className="font-mono">
              {project.configuration.switchboardPort}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Startup Timeout:</span>{" "}
            <span className="font-mono">
              {project.configuration.startupTimeout}ms
            </span>
          </div>
          <div>
            <span className="text-gray-600">Auto Start:</span>{" "}
            <span className="font-mono">
              {project.configuration.autoStart ? "Yes" : "No"}
            </span>
          </div>
        </div>
      </div>

      {/* Runtime Info (Read-only) */}
      {hasRuntime && project.runtime && (
        <div className="bg-blue-50 rounded p-3 mb-3">
          <h4 className="text-sm font-medium text-blue-700 mb-2">
            Runtime Info
          </h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-blue-600">PID:</span>{" "}
              <span className="font-mono">{project.runtime.pid}</span>
            </div>
            <div>
              <span className="text-blue-600">Started:</span>{" "}
              <span className="font-mono">
                {new Date(project.runtime.startedAt).toLocaleTimeString()}
              </span>
            </div>
            {project.runtime.driveUrl && (
              <div className="col-span-2">
                <span className="text-blue-600">Drive URL:</span>{" "}
                <a
                  href={project.runtime.driveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-700 underline font-mono text-xs"
                >
                  {project.runtime.driveUrl}
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Logs Summary (Read-only) */}
      {project.logs.length > 0 && (
        <div className="bg-gray-50 rounded p-3 mb-3">
          <h4 className="text-sm font-medium text-gray-700 mb-1">
            Recent Logs ({project.logs.length})
          </h4>
          <div className="text-xs text-gray-600 max-h-20 overflow-y-auto">
            {project.logs.slice(-3).map((log, index) => (
              <div
                key={`${log.timestamp}-${index}`}
                className="font-mono py-0.5"
              >
                [{new Date(log.timestamp).toLocaleTimeString()}] {log.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Targeted Status Controls (Editable) */}
      <div className="border-t pt-3">
        <h4 className="text-sm font-medium text-gray-700 mb-2">
          Set Targeted Status
        </h4>
        <TargetedStatusControls
          project={project}
          onRunProject={onRunProject}
          onStopProject={onStopProject}
          onDeleteProject={onDeleteProject}
        />
      </div>
    </div>
  );
}
