import type { Project } from "@powerhousedao/agent-manager/document-models/agent-projects";

interface TargetedStatusControlsProps {
  project: Project;
  onRunProject: (projectId: string) => void;
  onStopProject: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
}

export function TargetedStatusControls({
  project,
  onRunProject,
  onStopProject,
  onDeleteProject,
}: TargetedStatusControlsProps) {
  const targetedStatus = project.targetedStatus;
  const currentStatus = project.currentStatus;

  // Determine which actions are available based on current targeted status
  const canRun = targetedStatus !== "RUNNING" && targetedStatus !== "DELETED";
  const canStop = targetedStatus === "RUNNING";
  const canDelete = targetedStatus !== "DELETED";

  // Check if system is reconciling (current doesn't match targeted)
  const isReconciling =
    currentStatus !== targetedStatus &&
    !(currentStatus === "MISSING" && targetedStatus === "DELETED");

  return (
    <div>
      <div className="flex gap-2 mb-2">
        <button
          onClick={() => onRunProject(project.id)}
          disabled={!canRun}
          className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
            canRun
              ? "bg-green-600 text-white hover:bg-green-700"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          Run Project
        </button>
        <button
          onClick={() => onStopProject(project.id)}
          disabled={!canStop}
          className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
            canStop
              ? "bg-yellow-600 text-white hover:bg-yellow-700"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          Stop Project
        </button>
        <button
          onClick={() => onDeleteProject(project.id)}
          disabled={!canDelete}
          className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
            canDelete
              ? "bg-red-600 text-white hover:bg-red-700"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          Delete Project
        </button>
      </div>

      {isReconciling && (
        <div className="flex items-center gap-2 text-sm text-amber-600">
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span>Reconciling...</span>
        </div>
      )}
    </div>
  );
}

// Helper function to map current status to expected targeted status
function mapCurrentToTargeted(currentStatus: string): string {
  switch (currentStatus) {
    case "RUNNING":
      return "RUNNING";
    case "STOPPED":
      return "STOPPED";
    case "MISSING":
      return "DELETED";
    case "INITIALIZING":
      return "STOPPED";
    case "DELETED":
      return "DELETED";
    default:
      return "STOPPED";
  }
}
