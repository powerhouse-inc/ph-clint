import { DocumentToolbar } from "@powerhousedao/design-system/connect/index";
import { EditClaudeChatName } from "./components/EditName.js";
import { UserSettings } from "./components/UserSettings.js";
import { AgentsManager } from "./components/AgentsManager.js";
import { ChatInterface } from "./components/ChatInterface.js";
import { useState } from "react";

/** Claude Chat Editor with tabbed interface */
export default function Editor() {
  const [activeTab, setActiveTab] = useState<"chat" | "agents" | "settings">(
    "chat",
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-4 px-8">
        <DocumentToolbar />

        <div className="mt-6">
          <EditClaudeChatName />
        </div>

        {/* Two-column layout: 80% left / 20% right */}
        <div className="mt-6 flex gap-6 h-[calc(100vh-200px)]">
          {/* Left column: Placeholder for future feature */}
          <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="text-8xl mb-4">🦜</div>
                <p className="text-gray-500 text-lg">Placeholder Area</p>
                <p className="text-gray-400 text-sm mt-2">
                  Future feature coming soon
                </p>
              </div>
            </div>
          </div>

          {/* Right column: Chat/Agents/Settings with 20% width and minimum width */}
          <div className="w-1/5 min-w-80 flex flex-col">
            {/* Tab Navigation */}
            <div className="border-b border-gray-200 bg-white rounded-t-lg">
              <nav className="-mb-px flex">
                <button
                  onClick={() => setActiveTab("chat")}
                  className={`flex-1 py-2 px-2 border-b-2 font-medium text-xs transition-colors ${
                    activeTab === "chat"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Chat
                </button>
                <button
                  onClick={() => setActiveTab("agents")}
                  className={`flex-1 py-2 px-2 border-b-2 font-medium text-xs transition-colors ${
                    activeTab === "agents"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Agents
                </button>
                <button
                  onClick={() => setActiveTab("settings")}
                  className={`flex-1 py-2 px-2 border-b-2 font-medium text-xs transition-colors ${
                    activeTab === "settings"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Settings
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="flex-1 min-h-0">
              {activeTab === "chat" && <ChatInterface />}
              {activeTab === "agents" && <AgentsManager />}
              {activeTab === "settings" && <UserSettings />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
