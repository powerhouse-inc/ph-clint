import { DocumentToolbar } from '@powerhousedao/design-system/connect';
import { useSelectedChatSessionDocument } from 'document-models/chat-session';
import { ChatSession } from './ChatSession.js';

export { ChatSession } from './ChatSession.js';
export type { ChatSessionProps } from './ChatSession.js';

export default function Editor() {
  const [document, dispatch] = useSelectedChatSessionDocument();
  return <ChatSession document={document} dispatch={dispatch} className="absolute inset-0" header={<DocumentToolbar />} />;
}
