import { useState, useRef } from "react";
import type { AgentInfo } from "document-models/agent-chat";

interface ChatHeaderProps {
  topic: string | null | undefined;
  agents: AgentInfo[];
  onSetTopic: (topic: string) => void;
}

export function ChatHeader({ topic, agents, onSetTopic }: ChatHeaderProps) {
  const [isEditingTopic, setIsEditingTopic] = useState(false);
  const [tempTopic, setTempTopic] = useState("");
  const topicInputRef = useRef<HTMLInputElement>(null);

  const activeAgents = agents.filter((a) => !a.removed);

  const handleStartEdit = () => {
    setTempTopic(topic || "");
    setIsEditingTopic(true);
    setTimeout(() => {
      topicInputRef.current?.focus();
      topicInputRef.current?.select();
    }, 0);
  };

  const handleSave = () => {
    const newTopic = tempTopic.trim();
    if (newTopic && newTopic !== (topic || "")) {
      onSetTopic(newTopic);
    }
    setIsEditingTopic(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      setIsEditingTopic(false);
    }
  };

  return (
    <div className="px-6 py-4 border-b border-gray-200 bg-white flex-shrink-0">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          {isEditingTopic ? (
            <input
              ref={topicInputRef}
              type="text"
              value={tempTopic}
              onChange={(e) => setTempTopic(e.target.value)}
              onBlur={handleSave}
              onKeyDown={handleKeyDown}
              placeholder="Enter topic..."
              className="text-lg font-semibold text-gray-900 bg-gray-50 px-3 py-1 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-lg"
            />
          ) : (
            <h2
              className="text-lg font-semibold text-gray-900 cursor-pointer hover:bg-gray-50 px-3 py-1 -ml-3 rounded inline-block"
              onClick={handleStartEdit}
            >
              {topic || "Click to set topic"}
            </h2>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {activeAgents.map((agent) => (
            <div
              key={agent.id}
              className="flex items-center space-x-1.5 px-2 py-1 bg-blue-50 rounded-full"
            >
              <img
                src={
                  agent.avatar ||
                  `https://api.dicebear.com/7.x/initials/svg?seed=${agent.name || "Agent"}`
                }
                alt={agent.name || "Agent"}
                className="w-5 h-5 rounded-full"
              />
              <span className="text-xs font-medium text-blue-700">
                {agent.name || "Agent"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
