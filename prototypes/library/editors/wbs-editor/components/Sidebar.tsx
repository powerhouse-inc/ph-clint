import { useState, useCallback } from "react";
import { generateId } from "document-model/core";
import { useSelectedWorkBreakdownStructureDocument } from "@powerhousedao/agent-manager/document-models/work-breakdown-structure";
import {
  setOwner,
  setReferences,
  setMetaData,
} from "@powerhousedao/agent-manager/document-models/work-breakdown-structure";

export function WBSSidebar() {
  const [document, dispatch] = useSelectedWorkBreakdownStructureDocument();
  const [editingOwner, setEditingOwner] = useState(false);
  const [editingReferences, setEditingReferences] = useState(false);
  const [editingMetadata, setEditingMetadata] = useState(false);

  if (!document) return null;

  const state = document.state.global;
  const owner = state.owner || "";
  const references = state.references || [];
  const metadata = state.metaData;
  const isBlocked = state.isBlocked;

  const handleSetOwner = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const ownerInput = form.elements.namedItem("owner") as HTMLInputElement;
    const newOwner = ownerInput.value.trim();

    if (newOwner) {
      dispatch(setOwner({ owner: newOwner }));
      setEditingOwner(false);
    }
  };

  const handleAddReference = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const urlInput = form.elements.namedItem("url") as HTMLInputElement;
    const newUrl = urlInput.value.trim();

    if (newUrl) {
      const updatedReferences = [...references, newUrl];
      dispatch(setReferences({ references: updatedReferences }));
      form.reset();
    }
  };

  const handleRemoveReference = (index: number) => {
    const updatedReferences = references.filter((_, i) => i !== index);
    dispatch(setReferences({ references: updatedReferences }));
  };

  const handleSetMetadata = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formatSelect = form.elements.namedItem("format") as HTMLSelectElement;
    const dataTextarea = form.elements.namedItem("data") as HTMLTextAreaElement;

    const format = formatSelect.value as "JSON" | "TEXT" | "OTHER";
    const data = dataTextarea.value;

    if (data) {
      dispatch(setMetaData({ format, data }));
      setEditingMetadata(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Document Status */}
      <div>
        <h3 className="text-base font-semibold text-gray-700 mb-2">Status</h3>
        <div className="flex items-center space-x-2">
          <div
            className={`w-3 h-3 rounded-full ${isBlocked ? "bg-red-500" : "bg-green-500"}`}
          ></div>
          <span className="text-base text-gray-600">
            {isBlocked ? "Blocked" : "Not Blocked"}
          </span>
        </div>
      </div>

      {/* Owner */}
      <div>
        <h3 className="text-base font-semibold text-gray-700 mb-2">Owner</h3>
        {editingOwner ? (
          <form onSubmit={handleSetOwner} className="space-y-2">
            <input
              name="owner"
              type="text"
              defaultValue={owner}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              placeholder="Enter owner name"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditingOwner(false)}
                className="px-3 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-base text-gray-600">
              {owner || <span className="italic text-gray-400">None</span>}
            </span>
            <button
              onClick={() => setEditingOwner(true)}
              className="text-xs text-blue-500 hover:text-blue-700"
            >
              {owner ? "Edit" : "Set"}
            </button>
          </div>
        )}
      </div>

      {/* References */}
      <div>
        <h3 className="text-base font-semibold text-gray-700 mb-2">
          References
        </h3>
        <div className="space-y-2">
          {references.length > 0 &&
            references.map((ref, index) => (
              <div key={index} className="flex items-start gap-2 group">
                <a
                  href={ref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-500 hover:underline break-all flex-1 min-w-0 leading-4"
                  title={ref}
                >
                  {ref}
                </a>
                <button
                  onClick={() => handleRemoveReference(index)}
                  className="text-xs text-red-500 hover:text-red-700 flex-shrink-0 leading-4 font-bold"
                  title="Remove reference"
                >
                  ×
                </button>
              </div>
            ))}

          {editingReferences ? (
            <form onSubmit={handleAddReference} className="space-y-2 mt-2">
              <input
                name="url"
                type="url"
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                placeholder="https://example.com"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setEditingReferences(false)}
                  className="px-3 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setEditingReferences(true)}
              className="mt-2 text-xs text-blue-500 hover:text-blue-700"
            >
              Add Reference
            </button>
          )}
        </div>
      </div>

      {/* Metadata */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base font-semibold text-gray-700">Metadata</h3>
          {metadata && (
            <button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(metadata.data);
                } catch (error) {
                  console.error("Failed to copy metadata:", error);
                }
              }}
              className="text-gray-400 hover:text-gray-600 p-1"
              title="Copy metadata"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </button>
          )}
        </div>
        {editingMetadata ? (
          <form onSubmit={handleSetMetadata} className="space-y-2">
            <select
              name="format"
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              defaultValue={metadata?.format || "TEXT"}
            >
              <option value="TEXT">Text</option>
              <option value="JSON">JSON</option>
              <option value="OTHER">Other</option>
            </select>
            <textarea
              name="data"
              rows={4}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              placeholder="Enter metadata..."
              defaultValue={metadata?.data || ""}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditingMetadata(false)}
                className="px-3 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <>
            {metadata && (
              <div className="space-y-2">
                <div className="text-xs text-gray-500">
                  Format: {metadata.format}
                </div>
                <div className="p-2 bg-white border border-gray-200 rounded">
                  <pre className="text-xs text-gray-600 whitespace-pre-wrap break-all">
                    {metadata.format === "JSON"
                      ? (() => {
                          try {
                            return JSON.stringify(
                              JSON.parse(metadata.data),
                              null,
                              2,
                            );
                          } catch {
                            return metadata.data;
                          }
                        })()
                      : metadata.data}
                  </pre>
                </div>
              </div>
            )}
            <button
              onClick={() => setEditingMetadata(true)}
              className="mt-2 text-xs text-blue-500 hover:text-blue-700 block"
            >
              {metadata ? "Edit" : "Add"} Metadata
            </button>
          </>
        )}
      </div>
    </div>
  );
}
