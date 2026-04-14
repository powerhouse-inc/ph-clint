import {
  DocumentToolbar,
} from "@powerhousedao/design-system/connect/index";
import {
  useSelectedAgentChatDocument,
  actions,
} from "document-models/agent-chat";
import { ChatHeader } from "./components/ChatHeader.js";
import { ChatMessages } from "./components/ChatMessages.js";
import { ChatInput } from "./components/ChatInput.js";

export default function Editor() {
  const [document, dispatch] = useSelectedAgentChatDocument();

  if (!document || !dispatch) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        No document selected
      </div>
    );
  }

  const state = document.state.global;
  const { topic, agents, stakeholders, messages } = state;

  // Use the first non-removed stakeholder as the active sender
  const activeSender = stakeholders.find((s) => !s.removed);

  const handleSetTopic = (newTopic: string) => {
    dispatch(actions.setTopic({ topic: newTopic }));
  };

  const handleSendMessage = (input: {
    id: string;
    sender: string;
    text: string;
    when: string;
  }) => {
    dispatch(
      actions.sendText({
        id: input.id,
        sender: input.sender,
        text: input.text,
        when: input.when,
        format: "Text",
      }),
    );
  };

  return (
    <div className="flex flex-col pt-4 px-4 w-full h-[calc(100vh-1rem)] mx-auto max-w-[1600px]">
      <div className="pb-6 flex-0">
        <DocumentToolbar />
      </div>

      <div className="overflow-hidden flex-1 flex flex-col border border-gray-200 shadow-md">
        <ChatHeader
          topic={topic}
          agents={agents}
          onSetTopic={handleSetTopic}
        />

        <ChatMessages
          messages={messages}
          agents={agents}
          stakeholders={stakeholders}
        />

        <ChatInput
          stakeholder={activeSender}
          onSend={handleSendMessage}
        />
      </div>
    </div>
  );
}
