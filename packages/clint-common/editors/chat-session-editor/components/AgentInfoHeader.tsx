import type { AgentInfo } from 'document-models/chat-session';
import { BotIcon, BrainIcon, ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import { useState } from 'react';

interface AgentInfoHeaderProps {
  agent: AgentInfo | null | undefined;
}

export function AgentInfoHeader({ agent }: AgentInfoHeaderProps) {
  const [collapsed, setCollapsed] = useState(false);

  if (!agent) return null;

  const avatarSrc = agent.imageUrl ?? (agent.image ? `data:${agent.imageMediaType ?? 'image/png'};base64,${agent.image}` : null);

  if (collapsed) {
    return (
      <div className="shrink-0 flex items-center gap-2 border-b border-border bg-muted/30 px-4 py-1.5 cursor-pointer select-none" onClick={() => setCollapsed(false)}>
        {avatarSrc ? (
          <img src={avatarSrc} alt="" className="size-6 rounded-full object-cover" />
        ) : (
          <div className="flex size-6 items-center justify-center rounded-full bg-primary/10">
            <BotIcon className="size-3 text-primary" />
          </div>
        )}
        <span className="text-sm font-medium truncate">{agent.name || 'Unnamed Agent'}</span>
        {agent.model && <span className="text-xs text-muted-foreground truncate">{agent.model}</span>}
        <ChevronDownIcon className="ml-auto size-4 text-muted-foreground shrink-0" />
      </div>
    );
  }

  return (
    <div className="shrink-0 border-b border-border bg-muted/30 px-4 py-3">
      <div className="flex items-center gap-3">
        {avatarSrc ? (
          <img src={avatarSrc} alt="" className="size-8 rounded-full object-cover" />
        ) : (
          <div className="flex size-8 items-center justify-center rounded-full bg-primary/10">
            <BotIcon className="size-4 text-primary" />
          </div>
        )}
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
          {agent.description && <p className="text-xs text-muted-foreground mt-1">{agent.description}</p>}
        </div>
        <button type="button" onClick={() => setCollapsed(true)} className="flex items-center rounded-md p-1 text-muted-foreground hover:bg-muted transition-colors">
          <ChevronUpIcon className="size-4" />
        </button>
      </div>
    </div>
  );
}
