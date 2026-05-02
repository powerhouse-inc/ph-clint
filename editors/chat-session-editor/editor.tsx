import { DocumentToolbar } from '@powerhousedao/design-system/connect';
import { useSelectedChatSessionDocument } from 'document-models/chat-session';
import { useState, useEffect, useCallback, useRef } from 'react';
import { AgentInfoHeader } from './components/AgentInfoHeader.js';
import { ChatInputBar } from './components/ChatInputBar.js';
import { ConversationView } from './components/ConversationView.js';
import { SessionStatusBar } from './components/SessionStatusBar.js';
import { TestPane } from './components/test-pane/TestPane.js';
import { PanelRightOpenIcon, PanelRightCloseIcon, SunIcon, MoonIcon } from 'lucide-react';
import { cn } from './lib/utils.js';
import { useDarkMode } from './hooks/useDarkMode.js';

export default function Editor() {
  const [document, dispatch] = useSelectedChatSessionDocument();
  const [showTestPane, setShowTestPane] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const { isDark, toggle: toggleDarkMode } = useDarkMode(rootRef);

  const state = document.state.global;

  const toggleTestPane = useCallback(() => {
    setShowTestPane((prev) => !prev);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 't' && (e.metaKey || e.ctrlKey) && e.shiftKey) {
        e.preventDefault();
        toggleTestPane();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleTestPane]);

  return (
    <div ref={rootRef} className="absolute inset-0 flex flex-col overflow-hidden bg-background text-foreground">
      <DocumentToolbar />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col min-w-0">
          <AgentInfoHeader agent={state.agent} />
          <ConversationView messages={state.messages} />
          <ChatInputBar dispatch={dispatch} disabled={state.status !== 'ACTIVE'} />
          <SessionStatusBar status={state.status} startedAt={state.startedAt} endedAt={state.endedAt} usage={state.usage} messageCount={state.messages.length}>
            <button type="button" onClick={toggleDarkMode} className="flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors bg-secondary text-secondary-foreground hover:bg-secondary/80" title="Toggle Dark Mode">
              {isDark ? <SunIcon className="size-3.5" /> : <MoonIcon className="size-3.5" />}
            </button>
            <button
              type="button"
              onClick={toggleTestPane}
              className={cn('flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors', showTestPane ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80')}
              title="Toggle Test Pane (Ctrl+Shift+T)"
            >
              {showTestPane ? <PanelRightCloseIcon className="size-3.5" /> : <PanelRightOpenIcon className="size-3.5" />}
              Test
            </button>
          </SessionStatusBar>
        </div>

        {showTestPane && (
          <div className="w-[380px] shrink-0 overflow-hidden">
            <TestPane dispatch={dispatch} />
          </div>
        )}
      </div>
    </div>
  );
}
