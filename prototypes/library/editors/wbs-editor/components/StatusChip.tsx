import React from "react";

interface StatusChipProps {
  row: {
    status: string;
  };
}

// Status colors based on document model categories
const WAITING_COLOR = {
  bg: "#fef3c7", // amber-100
  text: "#d97706", // amber-600
  dot: "#f59e0b", // amber-500
};

const ACTIVE_COLOR = {
  bg: "#dbeafe", // blue-100
  text: "#2563eb", // blue-600
  dot: "#3b82f6", // blue-500
};

const FINISHED_COLOR = {
  bg: "#dcfce7", // green-100
  text: "#16a34a", // green-600
  dot: "#22c55e", // green-500
};

export const STATUS_COLORS = {
  // Waiting statuses
  TODO: WAITING_COLOR,
  BLOCKED: WAITING_COLOR,

  // Active statuses
  IN_PROGRESS: ACTIVE_COLOR,
  DELEGATED: ACTIVE_COLOR,
  IN_REVIEW: ACTIVE_COLOR,

  // Finished statuses
  COMPLETED: FINISHED_COLOR,
  WONT_DO: FINISHED_COLOR,
};

export const STATUS_LABELS = {
  TODO: "To Do",
  BLOCKED: "Blocked",
  IN_PROGRESS: "In Progress",
  DELEGATED: "Delegated",
  IN_REVIEW: "In Review",
  COMPLETED: "Completed",
  WONT_DO: "Won't Do",
};

export default function StatusChip({ row }: StatusChipProps) {
  const status = row.status as keyof typeof STATUS_COLORS;
  const colors = STATUS_COLORS[status] || STATUS_COLORS.TODO;
  const label = STATUS_LABELS[status] || status;

  return (
    <div className="flex items-center justify-center h-full">
      <div
        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium min-w-[120px]"
        style={{
          backgroundColor: colors.bg,
          color: colors.text,
        }}
      >
        <div
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: colors.dot }}
        />
        {label}
      </div>
    </div>
  );
}
