import type { AgentInfo } from 'document-models/chat-session';
import { BotIcon, BrainIcon, BookOpenIcon } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../lib/utils.js';

interface AgentInfoHeaderProps {
  agent: AgentInfo | null | undefined;
}

export function AgentInfoHeader({ agent }: AgentInfoHeaderProps) {
  const [showInstructions, setShowInstructions] = useState(false);

  if (!agent) return null;

  return (
    <div className="border-b border-border bg-muted/30 px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex size-8 items-center justify-center rounded-full bg-primary/10">
          <BotIcon className="size-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">{agent.name || 'Unnamed Agent'}</span>
            {agent.model && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <BrainIcon className="size-3" />
                {agent.model}
              </span>
            )}
          </div>
          {agent.id && <span className="text-xs text-muted-foreground font-mono">{agent.id}</span>}
        </div>
        {agent.instructions && (
          <button
            type="button"
            onClick={() => setShowInstructions(!showInstructions)}
            className={cn('flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted transition-colors', showInstructions && 'bg-muted text-foreground')}
          >
            <BookOpenIcon className="size-3" />
            Instructions
          </button>
        )}
      </div>
      {showInstructions && agent.instructions && <div className="mt-3 rounded-md bg-muted/50 p-3 text-xs text-muted-foreground whitespace-pre-wrap">{agent.instructions}</div>}
    </div>
  );
}
