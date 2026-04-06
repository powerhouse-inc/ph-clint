import { useState, useEffect } from "react";
import { AgentPanel } from "./components/AgentPanel.js";
import { ThreadsList } from "./components/ThreadsList.js";
import { MessageThread } from "./components/MessageThread.js";
import { NewChatModal } from "./components/NewChatModal.js";
import { DocumentToolbar } from "@powerhousedao/design-system/connect/index";
import { useSelectedAgentInboxDocument } from "@powerhousedao/agent-manager/document-models/agent-inbox";

export default function Editor() {
  const [document, dispatch] = useSelectedAgentInboxDocument();
  const [activeTab, setActiveTab] = useState<"inbox" | "archive">("inbox");
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLeftColumnCollapsed, setIsLeftColumnCollapsed] = useState(false);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);

  // Return early if no document
  if (!document || !dispatch) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        No document selected
      </div>
    );
  }

  const agent = document.state.global.agent;
  const stakeholders = document.state.global.stakeholders;
  const threads = document.state.global.threads;

  // Set initial selected thread
  useEffect(() => {
    if (!selectedThreadId && threads.length > 0) {
      setSelectedThreadId(threads[0].id);
    }
  }, [threads, selectedThreadId]);

  // Transform threads for display with stakeholder info
  const threadsWithInfo = threads.map((thread) => {
    const stakeholder = stakeholders.find((s) => s.id === thread.stakeholder);
    const lastMessage =
      thread.messages.length > 0
        ? thread.messages[thread.messages.length - 1]
        : null;

    return {
      ...thread,
      stakeholderId: thread.stakeholder,
      stakeholderName: stakeholder?.name || "Unknown",
      stakeholderRemoved: stakeholder?.removed || false,
      lastMessage: lastMessage?.content || "",
      lastMessageTime: lastMessage
        ? new Date(lastMessage.when).toLocaleString()
        : "",
      unreadCount: thread.messages.filter(
        (m) => m.flow === "Outgoing" && !m.read,
      ).length,
    };
  });

  // Filter threads based on tab
  const displayedThreads = threadsWithInfo.filter((thread) => {
    if (activeTab === "inbox") {
      return thread.status !== "Archived";
    } else {
      return thread.status === "Archived";
    }
  });

  // Further filter by search query
  const filteredThreads = displayedThreads.filter(
    (thread) =>
      (thread.topic || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      thread.stakeholderName
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      thread.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const selectedThread = threads.find((t) => t.id === selectedThreadId);
  const selectedStakeholder = selectedThread
    ? stakeholders.find((s) => s.id === selectedThread.stakeholder)
    : null;

  const handleThreadCreated = (threadId: string) => {
    setSelectedThreadId(threadId);
    setActiveTab("inbox");
  };

  return (
    <div className="flex flex-col pt-4 px-4 w-full h-[calc(100vh-1rem)] mx-auto max-w-[1600px]">
      {/* Top cell - toolbar with bottom padding only */}
      <div className="pb-6 flex-0">
        <DocumentToolbar />
      </div>

      {/* Bottom cell - calc remaining height minus toolbar and its padding */}
      <div className="overflow-hidden flex-1 flex items-strech border border-gray-200 shadow-md">
        {/* Left Column - 1/3 width */}
        {!isLeftColumnCollapsed && (
          <div className="bg-white border-r border-gray-200 flex-0 h-full w-1/3 min-w-[400px]">
            {/* Agent Panel - Fixed */}
            <AgentPanel
              agent={agent}
              dispatch={dispatch}
              onCollapse={() => setIsLeftColumnCollapsed(true)}
            />

            {/* Tabs and Search - Fixed */}
            <div className="px-4 pt-4 pb-2 border-t border-gray-200 flex-shrink-0">
              <div className="flex space-x-1 mb-3">
                <button
                  onClick={() => setActiveTab("inbox")}
                  className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === "inbox"
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  Inbox (
                  {
                    threadsWithInfo.filter((t) => t.status !== "Archived")
                      .length
                  }
                  )
                </button>
                <button
                  onClick={() => setActiveTab("archive")}
                  className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === "archive"
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  Archive (
                  {
                    threadsWithInfo.filter((t) => t.status === "Archived")
                      .length
                  }
                  )
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search threads..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 pl-9 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <svg
                  className="absolute left-3 top-2.5 h-4 w-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            {/* Threads List - scrollable */}
            <div className="overflow-y-auto">
              <ThreadsList
                threads={filteredThreads}
                selectedThreadId={selectedThreadId}
                onThreadSelect={setSelectedThreadId}
              />
            </div>

            {/* Footer with New Chat button */}
            <div className="p-4 border-t border-gray-200 flex-shrink-0">
              <button
                onClick={() => setIsNewChatModalOpen(true)}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <span>New Chat</span>
              </button>
            </div>
          </div>
        )}

        {/* Right Column - 2/3 width or full width when collapsed */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden">
          {selectedThread && selectedStakeholder ? (
            <MessageThread
              thread={selectedThread}
              stakeholder={selectedStakeholder}
              agent={agent}
              dispatch={dispatch}
              isCollapsed={isLeftColumnCollapsed}
              onExpand={() => setIsLeftColumnCollapsed(false)}
            />
          ) : (
            <div className="flex-1 flex flex-col">
              {/* Header with expand button when collapsed */}
              {isLeftColumnCollapsed && (
                <div className="px-6 py-4 border-b border-gray-200 bg-white flex-shrink-0">
                  <button
                    onClick={() => setIsLeftColumnCollapsed(false)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                    title="Expand sidebar"
                  >
                    <svg
                      className="w-5 h-5 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 12h16M4 18h16"
                      />
                    </svg>
                  </button>
                </div>
              )}

              {/* Empty state content */}
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <svg
                    className="mx-auto h-12 w-12 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4l-4 4-4-4z"
                    />
                  </svg>
                  <p className="text-lg">Select a thread to view messages</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* New Chat Modal */}
      <NewChatModal
        isOpen={isNewChatModalOpen}
        onClose={() => setIsNewChatModalOpen(false)}
        stakeholders={stakeholders}
        dispatch={dispatch}
        onThreadCreated={handleThreadCreated}
      />
    </div>
  );
}
