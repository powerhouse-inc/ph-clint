import React, { useState, useCallback } from "react";

interface ReportProgressPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (note: string, moveToReview: boolean, author?: string) => void;
  goalId: string;
  goalDescription: string;
  currentAssignee?: string;
}

export function ReportProgressPopup({
  isOpen,
  onClose,
  onSubmit,
  goalId,
  goalDescription,
  currentAssignee,
}: ReportProgressPopupProps) {
  const [note, setNote] = useState("");
  const [author, setAuthor] = useState("");
  const [moveToReview, setMoveToReview] = useState(true);

  // Set author to current assignee when popup opens
  React.useEffect(() => {
    if (isOpen && currentAssignee) {
      setAuthor(currentAssignee);
    }
  }, [isOpen, currentAssignee]);

  const handleSubmit = useCallback(() => {
    if (note.trim()) {
      onSubmit(note.trim(), moveToReview, author.trim() || undefined);
      setNote("");
      setAuthor("");
      setMoveToReview(true);
      onClose();
    }
  }, [note, author, moveToReview, onSubmit, onClose]);

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
      <div className="bg-white rounded-lg p-6 w-[450px] max-w-[90vw] shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Report Progress
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl font-bold"
          >
            ×
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Report progress on:{" "}
          <span className="font-medium">{goalDescription}</span>
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Progress Report *
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical min-h-[100px]"
              placeholder="Describe the progress made on this goal..."
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Author (optional)
            </label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Report author"
            />
          </div>

          <div className="flex items-center space-x-2 pt-2 pb-1">
            <input
              type="checkbox"
              id="moveToReview"
              checked={moveToReview}
              onChange={(e) => setMoveToReview(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="moveToReview" className="text-sm text-gray-700">
              Move to <span className="font-medium">In Review</span> status
            </label>
          </div>
          <p className="text-xs text-gray-500 ml-6">
            Check this if the goal is ready for review by the owner
          </p>
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
              disabled={!note.trim()}
              className="px-3 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200"
            >
              Submit Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
