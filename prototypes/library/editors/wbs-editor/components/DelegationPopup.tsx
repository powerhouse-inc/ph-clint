import React, { useState, useCallback, useEffect } from "react";

interface DelegationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (assignee: string) => void;
  goalId: string;
  defaultAssignee?: string;
}

export function DelegationPopup({
  isOpen,
  onClose,
  onSubmit,
  goalId,
  defaultAssignee,
}: DelegationPopupProps) {
  const [assignee, setAssignee] = useState(defaultAssignee || "");

  // Update assignee when defaultAssignee changes
  useEffect(() => {
    if (isOpen && defaultAssignee) {
      setAssignee(defaultAssignee);
    }
  }, [isOpen, defaultAssignee]);

  const handleSubmit = useCallback(() => {
    if (assignee.trim()) {
      onSubmit(assignee.trim());
      setAssignee("");
      onClose();
    }
  }, [assignee, onSubmit, onClose]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && e.ctrlKey) {
        handleSubmit();
      } else if (e.key === "Escape") {
        onClose();
      }
    },
    [handleSubmit, onClose],
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-w-[90vw] shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Delegate Goal</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl font-bold"
          >
            ×
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Assign this goal to someone who will work on it and report progress.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assignee *
            </label>
            <input
              type="text"
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter the name or identifier of the assignee"
              autoFocus
            />
          </div>
        </div>

        <div className="flex items-center justify-between mt-6">
          <div className="text-xs text-gray-400">
            Ctrl+Enter to submit, Escape to cancel
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!assignee.trim()}
              className="px-3 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200"
            >
              Delegate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
