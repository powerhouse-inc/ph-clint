interface Thread {
  id: string;
  stakeholderId: string;
  stakeholderName: string;
  stakeholderRemoved?: boolean;
  topic: string | null | undefined;
  status: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

interface ThreadsListProps {
  threads: Thread[];
  selectedThreadId: string | null | undefined;
  onThreadSelect: (threadId: string) => void;
}

export function ThreadsList({
  threads,
  selectedThreadId,
  onThreadSelect,
}: ThreadsListProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Open":
        return "bg-blue-100 text-blue-700";
      case "ProposedResolvedByAgent":
        return "bg-yellow-100 text-yellow-700";
      case "ProposedResolvedByStakeholder":
        return "bg-orange-100 text-orange-700";
      case "ConfirmedResolved":
        return "bg-green-100 text-green-700";
      case "Archived":
        return "bg-gray-100 text-gray-600";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "ProposedResolvedByAgent":
        return "Proposed Resolved";
      case "ProposedResolvedByStakeholder":
        return "Stakeholder Proposed";
      case "ConfirmedResolved":
        return "Resolved";
      default:
        return status;
    }
  };

  return (
    <div>
      {threads.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
          <svg
            className="w-12 h-12 mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <p className="text-sm font-medium">No threads found</p>
          <p className="text-xs mt-1">Try adjusting your search</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {threads.map((thread) => (
            <button
              key={thread.id}
              onClick={() => onThreadSelect(thread.id)}
              className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                selectedThreadId === thread.id ? "bg-blue-50" : ""
              }`}
            >
              <div className="flex items-start justify-between mb-1">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h3
                      className={`text-sm font-semibold truncate ${
                        thread.stakeholderRemoved
                          ? "text-gray-500 line-through"
                          : "text-gray-900"
                      }`}
                    >
                      {thread.stakeholderName}
                    </h3>
                    {thread.stakeholderRemoved && (
                      <span className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium text-red-700 bg-red-100 rounded">
                        Removed
                      </span>
                    )}
                    {thread.unreadCount > 0 && (
                      <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold text-white bg-blue-500 rounded-full">
                        {thread.unreadCount}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-800 mt-1 line-clamp-1">
                    {thread.topic || "No topic"}
                  </p>
                </div>
                <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                  {thread.lastMessageTime}
                </span>
              </div>

              <p className="text-xs text-gray-600 line-clamp-2 mt-1">
                {thread.lastMessage}
              </p>

              <div className="flex items-center justify-between mt-2">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(thread.status)}`}
                >
                  {getStatusLabel(thread.status)}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
