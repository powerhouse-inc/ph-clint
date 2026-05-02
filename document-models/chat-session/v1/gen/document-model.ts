import type { DocumentModelGlobalState } from 'document-model';

export const documentModel: DocumentModelGlobalState = {
  id: 'powerhouse/chat-session',
  name: 'ChatSession',
  author: {
    name: 'Powerhouse',
    website: 'https://www.powerhouse.inc/',
  },
  extension: 'chat',
  description:
    'Captures the complete transcript of a conversation session with a Mastra-powered AI agent, including system prompts, multi-modal user input, assistant responses, multi-step tool use, reasoning, and error states. Operations are split by actor role (system, user, agent, tool) for permission enforcement.',
  specifications: [
    {
      state: {
        local: {
          schema: '',
          examples: [],
          initialValue: '',
        },
        global: {
          schema:
            'enum SessionStatus {\n  ACTIVE\n  COMPLETED\n  ABORTED\n  ERROR\n}\n\nenum MessageRole {\n  SYSTEM\n  USER\n  ASSISTANT\n  TOOL\n}\n\nenum ContentPartType {\n  TEXT\n  IMAGE\n  FILE\n  TOOL_CALL\n  TOOL_RESULT\n  REASONING\n  ERROR\n}\n\ntype AgentInfo {\n  id: String\n  name: String\n  model: String\n  instructions: String\n}\n\ntype MessageUsage {\n  promptTokens: Int\n  completionTokens: Int\n  totalTokens: Int\n}\n\ntype UsageSummary {\n  totalPromptTokens: Int\n  totalCompletionTokens: Int\n  totalTokens: Int\n  totalSteps: Int\n  totalMessages: Int\n  totalToolCalls: Int\n}\n\ntype ContentPart {\n  id: OID!\n  type: ContentPartType!\n  text: String\n  toolCallId: String\n  toolName: String\n  args: String\n  result: String\n  isError: Boolean\n  mediaType: String\n  url: URL\n  data: String\n  filename: String\n  error: String\n}\n\ntype Message {\n  id: OID!\n  role: MessageRole!\n  content: [ContentPart!]!\n  stepIndex: Int\n  createdAt: DateTime!\n  usage: MessageUsage\n}\n\ntype ChatSessionState {\n  threadId: String\n  resourceId: String\n  agent: AgentInfo\n  status: SessionStatus!\n  startedAt: DateTime\n  endedAt: DateTime\n  messages: [Message!]!\n  usage: UsageSummary\n}',
          examples: [],
          initialValue: '{"threadId":null,"resourceId":null,"agent":null,"status":"ACTIVE","startedAt":null,"endedAt":null,"messages":[],"usage":null}',
        },
      },
      modules: [
        {
          id: 'mod-system',
          name: 'system',
          description: 'Session lifecycle and framework-level operations. Controlled by the system/admin actor.',
          operations: [
            {
              id: 'op-start-session',
              name: 'START_SESSION',
              description: 'Initialize a chat session with thread ID, resource ID, agent info, and start timestamp. Sets status to ACTIVE.',
              schema: 'input AgentInfoInput {\n  id: String\n  name: String\n  model: String\n  instructions: String\n}\n\ninput StartSessionInput {\n  threadId: String!\n  resourceId: String!\n  agent: AgentInfoInput!\n  startedAt: DateTime!\n}',
              template: 'Initialize a chat session with thread ID, resource ID, agent info, and start timestamp. Sets status to ACTIVE.',
              reducer:
                "state.threadId = action.input.threadId;\nstate.resourceId = action.input.resourceId;\nstate.agent = {\n  id: action.input.agent.id || null,\n  name: action.input.agent.name || null,\n  model: action.input.agent.model || null,\n  instructions: action.input.agent.instructions || null,\n};\nstate.status = 'ACTIVE';\nstate.startedAt = action.input.startedAt;\nstate.usage = {\n  totalPromptTokens: 0,\n  totalCompletionTokens: 0,\n  totalTokens: 0,\n  totalSteps: 0,\n  totalMessages: 0,\n  totalToolCalls: 0,\n};",
              errors: [],
              examples: [],
              scope: 'global',
            },
            {
              id: 'op-end-session',
              name: 'END_SESSION',
              description: 'Mark the session as completed or errored with an end timestamp.',
              schema: 'input EndSessionInput {\n  status: SessionStatus!\n  endedAt: DateTime!\n}',
              template: 'Mark the session as completed or errored with an end timestamp.',
              reducer: 'state.status = action.input.status;\nstate.endedAt = action.input.endedAt;',
              errors: [],
              examples: [],
              scope: 'global',
            },
            {
              id: 'op-set-agent-info',
              name: 'SET_AGENT_INFO',
              description: 'Update agent configuration (id, name, model, instructions).',
              schema: 'input SetAgentInfoInput {\n  id: String\n  name: String\n  model: String\n  instructions: String\n}',
              template: 'Update agent configuration (id, name, model, instructions).',
              reducer:
                'if (!state.agent) {\n  state.agent = { id: null, name: null, model: null, instructions: null };\n}\nif (action.input.id) state.agent.id = action.input.id;\nif (action.input.name) state.agent.name = action.input.name;\nif (action.input.model) state.agent.model = action.input.model;\nif (action.input.instructions) state.agent.instructions = action.input.instructions;',
              errors: [],
              examples: [],
              scope: 'global',
            },
            {
              id: 'op-add-system-message',
              name: 'ADD_SYSTEM_MESSAGE',
              description: 'Add a system prompt or instruction message to the conversation.',
              schema: 'input AddSystemMessageInput {\n  id: OID!\n  text: String!\n  createdAt: DateTime!\n}',
              template: 'Add a system prompt or instruction message to the conversation.',
              reducer:
                "state.messages.push({\n  id: action.input.id,\n  role: 'SYSTEM',\n  content: [{\n    id: action.input.id + '-text',\n    type: 'TEXT',\n    text: action.input.text,\n    toolCallId: null,\n    toolName: null,\n    args: null,\n    result: null,\n    isError: null,\n    mediaType: null,\n    url: null,\n    data: null,\n    filename: null,\n    error: null,\n  }],\n  stepIndex: null,\n  createdAt: action.input.createdAt,\n  usage: null,\n});\nif (state.usage) state.usage.totalMessages = (state.usage.totalMessages ?? 0) + 1;",
              errors: [],
              examples: [],
              scope: 'global',
            },
            {
              id: 'op-update-usage-summary',
              name: 'UPDATE_USAGE_SUMMARY',
              description: 'Update cumulative token usage and message/tool-call counts for the session.',
              schema: 'input UpdateUsageSummaryInput {\n  totalPromptTokens: Int\n  totalCompletionTokens: Int\n  totalTokens: Int\n  totalSteps: Int\n  totalMessages: Int\n  totalToolCalls: Int\n}',
              template: 'Update cumulative token usage and message/tool-call counts for the session.',
              reducer:
                'if (!state.usage) {\n  state.usage = { totalPromptTokens: 0, totalCompletionTokens: 0, totalTokens: 0, totalSteps: 0, totalMessages: 0, totalToolCalls: 0 };\n}\nif (action.input.totalPromptTokens !== undefined && action.input.totalPromptTokens !== null) state.usage.totalPromptTokens = action.input.totalPromptTokens;\nif (action.input.totalCompletionTokens !== undefined && action.input.totalCompletionTokens !== null) state.usage.totalCompletionTokens = action.input.totalCompletionTokens;\nif (action.input.totalTokens !== undefined && action.input.totalTokens !== null) state.usage.totalTokens = action.input.totalTokens;\nif (action.input.totalSteps !== undefined && action.input.totalSteps !== null) state.usage.totalSteps = action.input.totalSteps;\nif (action.input.totalMessages !== undefined && action.input.totalMessages !== null) state.usage.totalMessages = action.input.totalMessages;\nif (action.input.totalToolCalls !== undefined && action.input.totalToolCalls !== null) state.usage.totalToolCalls = action.input.totalToolCalls;',
              errors: [],
              examples: [],
              scope: 'global',
            },
          ],
        },
        {
          id: 'mod-user',
          name: 'user',
          description: 'Human user operations: sending messages, deleting own messages, aborting the session.',
          operations: [
            {
              id: 'op-add-user-message',
              name: 'ADD_USER_MESSAGE',
              description: 'Add a user message with text, image, and/or file content parts.',
              schema:
                'input UserContentPartInput {\n  id: OID!\n  type: ContentPartType!\n  text: String\n  mediaType: String\n  url: URL\n  data: String\n  filename: String\n}\n\ninput AddUserMessageInput {\n  id: OID!\n  content: [UserContentPartInput!]!\n  createdAt: DateTime!\n}',
              template: 'Add a user message with text, image, and/or file content parts.',
              reducer:
                "const parts = action.input.content.map(p => ({\n  id: p.id,\n  type: p.type,\n  text: p.text || null,\n  toolCallId: null,\n  toolName: null,\n  args: null,\n  result: null,\n  isError: null,\n  mediaType: p.mediaType || null,\n  url: p.url || null,\n  data: p.data || null,\n  filename: p.filename || null,\n  error: null,\n}));\nstate.messages.push({\n  id: action.input.id,\n  role: 'USER',\n  content: parts,\n  stepIndex: null,\n  createdAt: action.input.createdAt,\n  usage: null,\n});\nif (state.usage) state.usage.totalMessages = (state.usage.totalMessages ?? 0) + 1;",
              errors: [],
              examples: [],
              scope: 'global',
            },
            {
              id: 'op-delete-user-message',
              name: 'DELETE_USER_MESSAGE',
              description: 'Remove a user message by ID. Only messages with role USER can be deleted.',
              schema: 'input DeleteUserMessageInput {\n  messageId: OID!\n}',
              template: 'Remove a user message by ID. Only messages with role USER can be deleted.',
              reducer:
                "const idx = state.messages.findIndex(m => m.id === action.input.messageId);\nif (idx === -1) throw new MessageNotFoundError('Message not found: ' + action.input.messageId);\nif (state.messages[idx].role !== 'USER') throw new NotUserMessageError('Can only delete USER messages');\nstate.messages.splice(idx, 1);\nif (state.usage) state.usage.totalMessages = (state.usage.totalMessages ?? 0) - 1;",
              errors: [
                {
                  id: 'err-msg-not-found-1',
                  name: 'MessageNotFoundError',
                  code: 'MESSAGE_NOT_FOUND',
                  description: 'The specified message ID does not exist in the session.',
                  template: '',
                },
                {
                  id: 'err-not-user-msg',
                  name: 'NotUserMessageError',
                  code: 'NOT_USER_MESSAGE',
                  description: 'Only messages with role USER can be deleted via this operation.',
                  template: '',
                },
              ],
              examples: [],
              scope: 'global',
            },
            {
              id: 'op-abort-session',
              name: 'ABORT_SESSION',
              description: 'User-initiated session abort. Sets status to ABORTED with end timestamp.',
              schema: 'input AbortSessionInput {\n  endedAt: DateTime!\n}',
              template: 'User-initiated session abort. Sets status to ABORTED with end timestamp.',
              reducer: "state.status = 'ABORTED';\nstate.endedAt = action.input.endedAt;",
              errors: [],
              examples: [],
              scope: 'global',
            },
          ],
        },
        {
          id: 'mod-agent',
          name: 'agent',
          description: 'LLM/assistant operations: adding responses, streaming content parts, recording token usage.',
          operations: [
            {
              id: 'op-add-assistant-message',
              name: 'ADD_ASSISTANT_MESSAGE',
              description: 'Add a complete assistant message with text, tool calls, reasoning, and/or file content parts.',
              schema:
                'input AssistantContentPartInput {\n  id: OID!\n  type: ContentPartType!\n  text: String\n  toolCallId: String\n  toolName: String\n  args: String\n  mediaType: String\n  url: URL\n  data: String\n  filename: String\n  error: String\n}\n\ninput AddAssistantMessageInput {\n  id: OID!\n  content: [AssistantContentPartInput!]!\n  stepIndex: Int\n  createdAt: DateTime!\n}',
              template: 'Add a complete assistant message with text, tool calls, reasoning, and/or file content parts.',
              reducer:
                "const parts = action.input.content.map(p => ({\n  id: p.id,\n  type: p.type,\n  text: p.text || null,\n  toolCallId: p.toolCallId || null,\n  toolName: p.toolName || null,\n  args: p.args || null,\n  result: null,\n  isError: null,\n  mediaType: p.mediaType || null,\n  url: p.url || null,\n  data: p.data || null,\n  filename: p.filename || null,\n  error: p.error || null,\n}));\nstate.messages.push({\n  id: action.input.id,\n  role: 'ASSISTANT',\n  content: parts,\n  stepIndex: action.input.stepIndex || null,\n  createdAt: action.input.createdAt,\n  usage: null,\n});\nif (state.usage) {\n  state.usage.totalMessages = (state.usage.totalMessages ?? 0) + 1;\n  const toolCalls = parts.filter(p => p.type === 'TOOL_CALL').length;\n  state.usage.totalToolCalls = (state.usage.totalToolCalls ?? 0) + toolCalls;\n}",
              errors: [],
              examples: [],
              scope: 'global',
            },
            {
              id: 'op-append-assistant-content',
              name: 'APPEND_ASSISTANT_CONTENT',
              description: 'Add a content part to an existing assistant message. Used during streaming to build up a message incrementally.',
              schema: 'input AppendAssistantContentInput {\n  messageId: OID!\n  part: AssistantContentPartInput!\n}',
              template: 'Add a content part to an existing assistant message. Used during streaming to build up a message incrementally.',
              reducer:
                "const msg = state.messages.find(m => m.id === action.input.messageId);\nif (!msg) throw new MessageNotFoundError('Message not found: ' + action.input.messageId);\nif (msg.role !== 'ASSISTANT') throw new NotAssistantMessageError('Can only append to ASSISTANT messages');\nconst p = action.input.part;\nmsg.content.push({\n  id: p.id,\n  type: p.type,\n  text: p.text || null,\n  toolCallId: p.toolCallId || null,\n  toolName: p.toolName || null,\n  args: p.args || null,\n  result: null,\n  isError: null,\n  mediaType: p.mediaType || null,\n  url: p.url || null,\n  data: p.data || null,\n  filename: p.filename || null,\n  error: p.error || null,\n});\nif (state.usage && p.type === 'TOOL_CALL') state.usage.totalToolCalls = (state.usage.totalToolCalls ?? 0) + 1;",
              errors: [
                {
                  id: 'err-msg-not-found-2',
                  name: 'MessageNotFoundError',
                  code: 'MESSAGE_NOT_FOUND',
                  description: 'The specified message ID does not exist in the session.',
                  template: '',
                },
                {
                  id: 'err-not-assistant-msg',
                  name: 'NotAssistantMessageError',
                  code: 'NOT_ASSISTANT_MESSAGE',
                  description: 'Content can only be appended to messages with role ASSISTANT.',
                  template: '',
                },
              ],
              examples: [],
              scope: 'global',
            },
            {
              id: 'op-update-assistant-content',
              name: 'UPDATE_ASSISTANT_CONTENT',
              description: 'Update an existing content part within an assistant message. Used to accumulate streamed text deltas.',
              schema: 'input UpdateAssistantContentInput {\n  messageId: OID!\n  partId: OID!\n  text: String\n  args: String\n  error: String\n}',
              template: 'Update an existing content part within an assistant message. Used to accumulate streamed text deltas.',
              reducer:
                "const msg = state.messages.find(m => m.id === action.input.messageId);\nif (!msg) throw new MessageNotFoundError('Message not found: ' + action.input.messageId);\nconst part = msg.content.find(p => p.id === action.input.partId);\nif (!part) throw new ContentPartNotFoundError('Content part not found: ' + action.input.partId);\nif (action.input.text) part.text = action.input.text;\nif (action.input.args) part.args = action.input.args;\nif (action.input.error) part.error = action.input.error;",
              errors: [
                {
                  id: 'err-msg-not-found-3',
                  name: 'MessageNotFoundError',
                  code: 'MESSAGE_NOT_FOUND',
                  description: 'The specified message ID does not exist in the session.',
                  template: '',
                },
                {
                  id: 'err-part-not-found-1',
                  name: 'ContentPartNotFoundError',
                  code: 'CONTENT_PART_NOT_FOUND',
                  description: 'The specified content part ID does not exist in the message.',
                  template: '',
                },
              ],
              examples: [],
              scope: 'global',
            },
            {
              id: 'op-set-message-usage',
              name: 'SET_MESSAGE_USAGE',
              description: 'Record token usage for a specific message.',
              schema: 'input SetMessageUsageInput {\n  messageId: OID!\n  promptTokens: Int\n  completionTokens: Int\n  totalTokens: Int\n}',
              template: 'Record token usage for a specific message.',
              reducer:
                "const msg = state.messages.find(m => m.id === action.input.messageId);\nif (!msg) throw new MessageNotFoundError('Message not found: ' + action.input.messageId);\nmsg.usage = {\n  promptTokens: action.input.promptTokens || null,\n  completionTokens: action.input.completionTokens || null,\n  totalTokens: action.input.totalTokens || null,\n};",
              errors: [
                {
                  id: 'err-msg-not-found-4',
                  name: 'MessageNotFoundError',
                  code: 'MESSAGE_NOT_FOUND',
                  description: 'The specified message ID does not exist in the session.',
                  template: '',
                },
              ],
              examples: [],
              scope: 'global',
            },
          ],
        },
        {
          id: 'mod-tool',
          name: 'tool',
          description: 'Tool executor operations: returning tool results and progressive output.',
          operations: [
            {
              id: 'op-add-tool-result',
              name: 'ADD_TOOL_RESULT',
              description: 'Add a tool result message containing one or more result parts (success or error). Links back to a tool call via toolCallId.',
              schema:
                'input ToolResultPartInput {\n  id: OID!\n  type: ContentPartType!\n  toolCallId: String!\n  toolName: String!\n  result: String\n  isError: Boolean\n  text: String\n  mediaType: String\n  url: URL\n  data: String\n}\n\ninput AddToolResultInput {\n  id: OID!\n  content: [ToolResultPartInput!]!\n  stepIndex: Int\n  createdAt: DateTime!\n}',
              template: 'Add a tool result message containing one or more result parts (success or error). Links back to a tool call via toolCallId.',
              reducer:
                "const parts = action.input.content.map(p => ({\n  id: p.id,\n  type: p.type,\n  text: p.text || null,\n  toolCallId: p.toolCallId,\n  toolName: p.toolName,\n  args: null,\n  result: p.result || null,\n  isError: p.isError || null,\n  mediaType: p.mediaType || null,\n  url: p.url || null,\n  data: p.data || null,\n  filename: null,\n  error: null,\n}));\nstate.messages.push({\n  id: action.input.id,\n  role: 'TOOL',\n  content: parts,\n  stepIndex: action.input.stepIndex || null,\n  createdAt: action.input.createdAt,\n  usage: null,\n});\nif (state.usage) state.usage.totalMessages = (state.usage.totalMessages ?? 0) + 1;",
              errors: [],
              examples: [],
              scope: 'global',
            },
            {
              id: 'op-add-tool-output',
              name: 'ADD_TOOL_OUTPUT',
              description: 'Add progressive output from a running tool. Appends a TEXT content part to an existing tool message.',
              schema: 'input AddToolOutputInput {\n  messageId: OID!\n  partId: OID!\n  toolCallId: String!\n  toolName: String!\n  text: String!\n}',
              template: 'Add progressive output from a running tool. Appends a TEXT content part to an existing tool message.',
              reducer:
                "const msg = state.messages.find(m => m.id === action.input.messageId);\nif (!msg) throw new MessageNotFoundError('Message not found: ' + action.input.messageId);\nmsg.content.push({\n  id: action.input.partId,\n  type: 'TEXT',\n  text: action.input.text,\n  toolCallId: action.input.toolCallId,\n  toolName: action.input.toolName,\n  args: null,\n  result: null,\n  isError: null,\n  mediaType: null,\n  url: null,\n  data: null,\n  filename: null,\n  error: null,\n});",
              errors: [
                {
                  id: 'err-msg-not-found-5',
                  name: 'MessageNotFoundError',
                  code: 'MESSAGE_NOT_FOUND',
                  description: 'The specified message ID does not exist in the session.',
                  template: '',
                },
              ],
              examples: [],
              scope: 'global',
            },
          ],
        },
      ],
      version: 1,
      changeLog: [],
    },
  ],
};
