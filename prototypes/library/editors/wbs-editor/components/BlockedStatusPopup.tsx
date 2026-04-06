import React, { useState, useCallback } from "react";

interface BlockedStatusPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (note: string, author?: string) => void;
  goalId: string;
}

export function BlockedStatusPopup({
  isOpen,
  onClose,
  onSubmit,
  goalId,
}: BlockedStatusPopupProps) {
  const [note, setNote] = useState("");
  const [author, setAuthor] = useState("");

  const handleSubmit = useCallback(() => {
    if (note.trim()) {
      onSubmit(note.trim(), author.trim() || undefined);
      setNote("");
      setAuthor("");
      onClose();
    }
  }, [note, author, onSubmit, onClose]);

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
          <h3 className="text-lg font-semibold text-gray-800">Goal Blocked</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl font-bold"
          >
            ×
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          This goal is being marked as blocked. Please provide details about
          what's blocking progress.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              What's blocking this goal? *
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical min-h-[80px]"
              placeholder="Describe what's preventing progress on this goal..."
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your name (optional)
            </label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Your name"
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
              disabled={!note.trim()}
              className="px-3 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200"
            >
              Mark as Blocked
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
