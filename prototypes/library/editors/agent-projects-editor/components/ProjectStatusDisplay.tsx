import type {
  CurrentStatus,
  TargetedStatus,
} from "@powerhousedao/agent-manager/document-models/agent-projects";

interface ProjectStatusDisplayProps {
  currentStatus: CurrentStatus;
  targetedStatus: TargetedStatus;
}

export function ProjectStatusDisplay({
  currentStatus,
  targetedStatus,
}: ProjectStatusDisplayProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "RUNNING":
        return "bg-green-100 text-green-800 border-green-200";
      case "STOPPED":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "MISSING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "INITIALIZING":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "DELETED":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "RUNNING":
        return "▶";
      case "STOPPED":
        return "■";
      case "MISSING":
        return "?";
      case "INITIALIZING":
        return "⚙";
      case "DELETED":
        return "✕";
      default:
        return "•";
    }
  };

  // Check if statuses match (considering special mappings)
  const statusesMatch = () => {
    if (currentStatus === targetedStatus) return true;

    // Special case: MISSING + DELETED target = effectively the same
    if (currentStatus === "MISSING" && targetedStatus === "DELETED")
      return true;

    // Special case: DELETED current matches DELETED target
    if (currentStatus === "DELETED" && targetedStatus === "DELETED")
      return true;

    return false;
  };

  if (statusesMatch()) {
    // Show single status badge
    const displayStatus =
      targetedStatus === "DELETED" && currentStatus === "MISSING"
        ? "DELETED"
        : currentStatus;

    return (
      <div className="flex flex-col items-center">
        <span className="text-xs text-gray-500 uppercase tracking-wider mb-1">
          Status
        </span>
        <span
          className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border ${getStatusColor(
            displayStatus,
          )}`}
        >
          <span>{getStatusIcon(displayStatus)}</span>
          {displayStatus}
        </span>
      </div>
    );
  }

  // Show transition arrow
  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border ${getStatusColor(
          currentStatus,
        )}`}
      >
        <span>{getStatusIcon(currentStatus)}</span>
        {currentStatus}
      </span>

      <svg
        className="w-4 h-4 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 7l5 5m0 0l-5 5m5-5H6"
        />
      </svg>

      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border ${getStatusColor(
          targetedStatus,
        )}`}
      >
        <span>{getStatusIcon(targetedStatus)}</span>
        {targetedStatus}
      </span>
    </div>
  );
}
