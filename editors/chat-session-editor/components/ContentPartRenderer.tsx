import type { ContentPart } from 'document-models/chat-session';
import { Reasoning, ReasoningTrigger, ReasoningContent } from './ai-elements/reasoning.js';
import { Tool, ToolHeader, ToolContent, ToolInput, ToolOutput } from './ai-elements/tool.js';
import { MessageResponse } from './ai-elements/message.js';
import { AlertTriangleIcon, FileIcon, ImageIcon } from 'lucide-react';

interface ContentPartRendererProps {
  part: ContentPart;
  linkedResult?: ContentPart;
}

export function ContentPartRenderer({ part, linkedResult }: ContentPartRendererProps) {
  switch (part.type) {
    case 'TEXT':
      return <MessageResponse>{part.text ?? ''}</MessageResponse>;

    case 'REASONING':
      return (
        <Reasoning defaultOpen={false}>
          <ReasoningTrigger />
          <ReasoningContent>{part.text ?? ''}</ReasoningContent>
        </Reasoning>
      );

    case 'TOOL_CALL':
      return <ToolCallRenderer part={part} linkedResult={linkedResult} />;

    case 'TOOL_RESULT':
      return <ToolResultRenderer part={part} />;

    case 'IMAGE':
      return <ImagePartRenderer part={part} />;

    case 'FILE':
      return <FilePartRenderer part={part} />;

    case 'ERROR':
      return <ErrorPartRenderer part={part} />;

    default:
      return <div className="rounded-md bg-muted p-2 text-xs text-muted-foreground">Unknown content type: {part.type}</div>;
  }
}

function ToolCallRenderer({ part, linkedResult }: { part: ContentPart; linkedResult?: ContentPart }) {
  let parsedArgs: unknown = undefined;
  if (part.args) {
    try {
      parsedArgs = JSON.parse(part.args);
    } catch {
      parsedArgs = part.args;
    }
  }

  let parsedResult: unknown = undefined;
  if (linkedResult?.result) {
    try {
      parsedResult = JSON.parse(linkedResult.result);
    } catch {
      parsedResult = linkedResult.result;
    }
  }

  const hasResult = !!linkedResult;
  const isError = linkedResult?.isError ?? false;

  return (
    <Tool>
      <ToolHeader type="dynamic-tool" toolName={part.toolName ?? 'unknown'} title={part.toolName ?? 'Tool Call'} state={isError ? 'output-error' : hasResult ? 'output-available' : 'input-available'} />
      <ToolContent>
        {parsedArgs !== undefined && <ToolInput input={parsedArgs} />}
        {hasResult && <ToolOutput output={parsedResult} errorText={isError ? (linkedResult.result ?? 'Error') : undefined} />}
      </ToolContent>
    </Tool>
  );
}

function ToolResultRenderer({ part }: { part: ContentPart }) {
  let parsedResult: unknown = undefined;
  if (part.result) {
    try {
      parsedResult = JSON.parse(part.result);
    } catch {
      parsedResult = part.result;
    }
  }

  return (
    <Tool>
      <ToolHeader type="dynamic-tool" toolName={part.toolName ?? 'unknown'} title={`${part.toolName ?? 'Tool'} result`} state={part.isError ? 'output-error' : 'output-available'} />
      <ToolContent>
        <ToolOutput output={parsedResult} errorText={part.isError ? (part.result ?? 'Error') : undefined} />
      </ToolContent>
    </Tool>
  );
}

function ImagePartRenderer({ part }: { part: ContentPart }) {
  return (
    <div className="space-y-1">
      {part.url ? (
        <img src={part.url} alt={part.filename ?? 'Image'} className="max-h-64 rounded-md border border-border" />
      ) : part.data ? (
        <img src={`data:${part.mediaType ?? 'image/png'};base64,${part.data}`} alt={part.filename ?? 'Image'} className="max-h-64 rounded-md border border-border" />
      ) : (
        <div className="flex items-center gap-2 rounded-md bg-muted p-3 text-sm text-muted-foreground">
          <ImageIcon className="size-4" />
          {part.filename ?? 'Image (no source)'}
        </div>
      )}
    </div>
  );
}

function FilePartRenderer({ part }: { part: ContentPart }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-border bg-muted/50 p-3 text-sm">
      <FileIcon className="size-4 text-muted-foreground" />
      <span>{part.filename ?? 'File'}</span>
      {part.mediaType && <span className="text-xs text-muted-foreground">({part.mediaType})</span>}
    </div>
  );
}

function ErrorPartRenderer({ part }: { part: ContentPart }) {
  return (
    <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
      <AlertTriangleIcon className="mt-0.5 size-4 shrink-0" />
      <span>{part.error ?? part.text ?? 'Unknown error'}</span>
    </div>
  );
}
