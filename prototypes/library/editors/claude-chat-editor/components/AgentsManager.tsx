import { useState } from "react";
import type { FormEventHandler } from "react";
import { generateId } from "document-model/core";
import { useSelectedClaudeChatDocument } from "@powerhousedao/agent-manager/document-models/claude-chat";
import { addAgent } from "@powerhousedao/agent-manager/document-models/claude-chat";
import { ClaudeService } from "../services/ClaudeService.js";

export function AgentsManager() {
  const [document, dispatch] = useSelectedClaudeChatDocument();
  const [isAddingAgent, setIsAddingAgent] = useState(false);

  if (!document) return null;

  const agents = document.state.global.agents;

  const handleAddAgent: FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const model = formData.get("model") as string;
    const apiKey = formData.get("apiKey") as string;
    const initialPrompt = formData.get("initialPrompt") as string;

    if (name && model && apiKey) {
      dispatch(
        addAgent({
          id: generateId(),
          name,
          model,
          apiKey,
          initialPrompt: initialPrompt || null,
        }),
      );
      setIsAddingAgent(false);
      e.currentTarget.reset();
    }
  };

  return (
    <div className="bg-white rounded-b-lg shadow-sm border-l border-r border-b border-gray-200 p-4 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">AI Agents</h3>
        {!isAddingAgent && (
          <button
            onClick={() => setIsAddingAgent(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Add Agent
          </button>
        )}
      </div>

      {isAddingAgent && (
        <form
          onSubmit={handleAddAgent}
          className="mb-4 p-4 bg-gray-50 rounded-lg"
        >
          <div className="space-y-3">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Agent Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                placeholder="e.g., Claude Assistant"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
                required
              />
            </div>

            <div>
              <label
                htmlFor="model"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Model
              </label>
              <select
                id="model"
                name="model"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select a Claude model</option>
                {ClaudeService.getSupportedModels().map((model) => (
                  <option
                    key={model.id}
                    value={model.id}
                    title={model.description}
                  >
                    {model.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="apiKey"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                API Key
              </label>
              <input
                type="password"
                id="apiKey"
                name="apiKey"
                placeholder="Enter API key"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label
                htmlFor="initialPrompt"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Initial Prompt <span className="text-gray-500">(Optional)</span>
              </label>
              <textarea
                id="initialPrompt"
                name="initialPrompt"
                rows={3}
                placeholder="e.g., 'Always respond in JSON format' or 'Réponds toujours en français'"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
              />
              <p className="text-xs text-gray-500 mt-1">
                This prompt will be sent before every conversation to customize
                the agent's behavior
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Add Agent
              </button>
              <button
                type="button"
                onClick={() => setIsAddingAgent(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {agents.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No agents configured yet
          </p>
        ) : (
          agents.map((agent) => (
            <div
              key={agent.id}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{agent.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Model: {agent.model}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    API Key: {agent.apiKey.substring(0, 8)}...
                  </p>
                  {agent.initialPrompt && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-600 font-medium">
                        Initial Prompt:
                      </p>
                      <p className="text-xs text-gray-500 mt-1 bg-gray-50 p-2 rounded border-l-2 border-blue-200 italic">
                        "{agent.initialPrompt}"
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded">
                    Active
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
