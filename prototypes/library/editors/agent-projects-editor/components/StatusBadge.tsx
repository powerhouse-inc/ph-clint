import type {
  CurrentStatus,
  TargetedStatus,
} from "@powerhousedao/agent-manager/document-models/agent-projects";

interface StatusBadgeProps {
  status: CurrentStatus | TargetedStatus;
  label: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
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

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs text-gray-500 uppercase tracking-wider">
        {label}
      </span>
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border ${getStatusColor(
          status,
        )}`}
      >
        <span>{getStatusIcon(status)}</span>
        {status}
      </span>
    </div>
  );
}
