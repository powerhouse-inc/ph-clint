import { useState } from "react";
import type { FormEventHandler } from "react";
import { useSelectedClaudeChatDocument } from "@powerhousedao/agent-manager/document-models/claude-chat";
import { setUsername } from "@powerhousedao/agent-manager/document-models/claude-chat";

export function UserSettings() {
  const [document, dispatch] = useSelectedClaudeChatDocument();
  const [isEditing, setIsEditing] = useState(false);

  if (!document) return null;

  const currentUsername = document.state.global.username;

  const handleSubmit: FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newUsername = formData.get("username") as string;

    if (newUsername && newUsername !== currentUsername) {
      dispatch(setUsername({ username: newUsername }));
    }
    setIsEditing(false);
  };

  return (
    <div className="bg-white rounded-b-lg shadow-sm border-l border-r border-b border-gray-200 p-4 h-full overflow-y-auto">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        User Settings
      </h3>

      {isEditing ? (
        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          <input
            type="text"
            name="username"
            defaultValue={currentUsername}
            placeholder="Enter your username"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            autoFocus
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        </form>
      ) : (
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Username</p>
            <p className="text-base font-medium text-gray-900">
              {currentUsername || "Not set"}
            </p>
          </div>
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
          >
            Edit
          </button>
        </div>
      )}
    </div>
  );
}
