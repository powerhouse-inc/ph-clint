import type { DocumentModelGlobalState } from "document-model";

export const documentModel: DocumentModelGlobalState = {
  id: "powerhouse/agent-chat",
  name: "Agent Chat",
  author: {
    name: "Prometheus",
    website: "https://powerhouse.inc",
  },
  extension: ".agcht",
  description:
    "Default document model for ph-clint agent chats with stakeholders and other agents. Capable of handling text/markdown messages, tool calls and results, and error messages.",
  specifications: [
    {
      state: {
        local: {
          schema: "",
          examples: [],
          initialValue: "",
        },
        global: {
          schema:
            'type AgentChatState {\n  """Optional topic or subject line describing the chat\'s purpose"""\n  topic: String\n\n  """Participating agents"""\n  agents: [AgentInfo!]!\n\n  """Participating stakeholders"""\n  stakeholders: [Stakeholder!]!\n\n  """Messages in this chat"""\n  messages: [ChatMessage!]!\n\n  """Number of messages that are kept in the chat state"""\n  pruneLength: Int\n}\n\n"""Profile information for the agent who owns this inbox.\nContains identity, role, and contact information."""\ntype AgentInfo {\n  """Unique identifier for this agent"""\n  id: OID!\n  \n  """Display name of the agent for identification in conversations"""\n  name: String\n  \n  """Ethereum wallet address for on-chain identity verification and transactions"""\n  ethAddress: String\n  \n  """Professional role or title describing the agent\'s responsibilities"""\n  role: String\n  \n  """Detailed description of the agent\'s expertise, services, or background"""\n  description: String\n  \n  """URL to the agent\'s profile picture or avatar image"""\n  avatar: URL\n\n  """Soft deletion flag - true if stakeholder access has been revoked"""\n  removed: Boolean!\n}\n\n"""Authorized participant who can communicate with the agent.\nContains identity information and removal status."""\ntype Stakeholder {\n  """Unique identifier for this stakeholder"""\n  id: OID!\n  \n  """Display name of the stakeholder for identification"""\n  name: String!\n  \n  """Optional Ethereum wallet address for identity verification"""\n  ethAddress: String\n  \n  """URL to the stakeholder\'s profile picture or avatar"""\n  avatar: URL\n  \n  """Soft deletion flag - true if stakeholder access has been revoked"""\n  removed: Boolean!\n}\n\n"""Individual message within a conversation thread.\nTracks content, timing, direction, and read status."""\ntype ChatMessage {\n  """Unique identifier for this message"""\n  id: OID!\n  \n  """Sender Agent or Stakeholder"""\n  sender: OID!\n\n  """Recipient Agents or Stakeholders tagged in the message"""\n  mentioned: [OID!]!\n  \n  """Timestamp when the message was sent"""\n  when: DateTime!\n\n  """Optional timestamp when the last text chunk was appended"""\n  updated: DateTime\n\n  """Mandatory type indication"""\n  type: MessageType!\n\n  """Optional hint about the message format (only for types Text, ToolResult and Error.) Not set = unknown. It will switch to Mixed when appending multipe text message with different type\n  """\n  format: MessageFormat\n  \n  """Text chunks in the message (only for type Text)"""\n  text: [String!]\n\n  """Tool call information (only for type ToolCall)"""\n  toolCall: ToolCall\n\n  """Tool results in the message (only for type Text)"""\n  toolResult: ToolResult\n\n  """Error message (only for type Error)"""\n  error: String\n\n  """List with reactions, unique sender/emoji combinations"""\n  reactions: [Reaction!]\n  \n  """Which recipients have read the message"""\n  readBy: [OID!]\n}\n\ntype Reaction {\n  sender: OID!\n  """Only :cldr-short-name: notation allowed"""\n  emoji: String!\n}\n\nenum MessageType {\n  Text\n  Error\n  ToolCall\n  ToolResult\n}\n\ntype ToolCall {\n  name: String!\n  argsJson: String!\n}\n\ntype ToolResult {\n  name: String!\n  result: String!\n  isError: Boolean!\n}\n\nenum MessageFormat {\n  Text\n  MarkDown\n  Json\n  Binary\n  Mixed\n}',
          examples: [],
          initialValue:
            '{\n  "topic": null,\n  "agents": [],\n  "stakeholders": [],\n  "messages": [],\n  "pruneLength": null\n}',
        },
      },
      modules: [
        {
          id: "ae359a21-bbcd-44f9-ba81-33b955eafba1",
          name: "base",
          description: "",
          operations: [
            {
              id: "f90c9cd5-b141-492d-ad95-f2f7d6cf9d64",
              name: "SET_TOPIC",
              description: "Set the chat topic or subject line",
              schema: "input SetTopicInput {\n  topic: String!\n}",
              template: "",
              reducer: "",
              errors: [],
              examples: [],
              scope: "global",
            },
            {
              id: "dc4f52b3-fb98-4b18-bc33-0ead1535fd20",
              name: "CLEAR_TOPIC",
              description: "Clear the chat topic",
              schema: "input ClearTopicInput {\n  _placeholder: String\n}",
              template: "",
              reducer: "",
              errors: [],
              examples: [],
              scope: "global",
            },
            {
              id: "7c21468f-4629-44cb-b856-9554514cb6fb",
              name: "SET_PRUNE_LENGTH",
              description:
                "Set the maximum number of messages to retain in the chat",
              schema: "input SetPruneLengthInput {\n  pruneLength: Int!\n}",
              template: "",
              reducer: "",
              errors: [
                {
                  id: "invalid-prune-length-error",
                  name: "InvalidPruneLengthError",
                  code: "INVALID_PRUNE_LENGTH_ERROR",
                  description: "Prune length must be greater than 0",
                  template: "",
                },
              ],
              examples: [],
              scope: "global",
            },
            {
              id: "eecea951-d767-4209-9e31-80bf30c07c47",
              name: "REMOVE_PRUNE_LENGTH",
              description: "Remove the message pruning limit",
              schema:
                "input RemovePruneLengthInput {\n  _placeholder: String\n}",
              template: "",
              reducer: "",
              errors: [],
              examples: [],
              scope: "global",
            },
          ],
        },
        {
          id: "6d0484af-652d-48fc-b552-14383ee0d9aa",
          name: "stakeholders",
          description: "",
          operations: [
            {
              id: "4f71b314-ee73-4720-9c71-e569a9a6a2d2",
              name: "ADD_STAKEHOLDER",
              description: "Add a new stakeholder to the chat",
              schema:
                "input AddStakeholderInput {\n  id: OID!\n  name: String!\n  ethAddress: String\n  avatar: URL\n}",
              template: "",
              reducer: "",
              errors: [
                {
                  id: "duplicate-stakeholder-error",
                  name: "DuplicateStakeholderError",
                  code: "DUPLICATE_STAKEHOLDER_ERROR",
                  description: "A stakeholder with this ID already exists",
                  template: "",
                },
              ],
              examples: [],
              scope: "global",
            },
            {
              id: "set-stakeholder-name-op",
              name: "SET_STAKEHOLDER_NAME",
              description: "Update a stakeholder's name",
              schema:
                "input SetStakeholderNameInput {\n  id: OID!\n  name: String!\n}",
              template: "Update a stakeholder's name",
              reducer: "",
              errors: [
                {
                  id: "stakeholder-not-found-error-1",
                  name: "StakeholderNotFoundError",
                  code: "STAKEHOLDER_NOT_FOUND_ERROR",
                  description: "Stakeholder with the specified ID not found",
                  template: "",
                },
              ],
              examples: [],
              scope: "global",
            },
            {
              id: "set-stakeholder-eth-address-op",
              name: "SET_STAKEHOLDER_ETH_ADDRESS",
              description: "Update a stakeholder's Ethereum address",
              schema:
                "input SetStakeholderEthAddressInput {\n  id: OID!\n  ethAddress: String\n}",
              template: "Update a stakeholder's Ethereum address",
              reducer: "",
              errors: [
                {
                  id: "stakeholder-not-found-error-2",
                  name: "StakeholderNotFoundError",
                  code: "STAKEHOLDER_NOT_FOUND_ERROR",
                  description: "Stakeholder with the specified ID not found",
                  template: "",
                },
              ],
              examples: [],
              scope: "global",
            },
            {
              id: "set-stakeholder-avatar-op",
              name: "SET_STAKEHOLDER_AVATAR",
              description: "Update a stakeholder's avatar URL",
              schema:
                "input SetStakeholderAvatarInput {\n  id: OID!\n  avatar: URL\n}",
              template: "Update a stakeholder's avatar URL",
              reducer: "",
              errors: [
                {
                  id: "stakeholder-not-found-error-3",
                  name: "StakeholderNotFoundError",
                  code: "STAKEHOLDER_NOT_FOUND_ERROR",
                  description: "Stakeholder with the specified ID not found",
                  template: "",
                },
              ],
              examples: [],
              scope: "global",
            },
            {
              id: "remove-stakeholder-op",
              name: "REMOVE_STAKEHOLDER",
              description: "Soft-delete a stakeholder from the chat",
              schema: "input RemoveStakeholderInput {\n  id: OID!\n}",
              template: "Soft-delete a stakeholder from the chat",
              reducer: "",
              errors: [
                {
                  id: "stakeholder-not-found-error-4",
                  name: "StakeholderNotFoundError",
                  code: "STAKEHOLDER_NOT_FOUND_ERROR",
                  description: "Stakeholder with the specified ID not found",
                  template: "",
                },
              ],
              examples: [],
              scope: "global",
            },
            {
              id: "readd-stakeholder-op",
              name: "READD_STAKEHOLDER",
              description:
                "Re-add a previously removed stakeholder to the chat",
              schema: "input ReaddStakeholderInput {\n  id: OID!\n}",
              template: "Re-add a previously removed stakeholder to the chat",
              reducer: "",
              errors: [
                {
                  id: "stakeholder-not-found-error-5",
                  name: "StakeholderNotFoundError",
                  code: "STAKEHOLDER_NOT_FOUND_ERROR",
                  description: "Stakeholder with the specified ID not found",
                  template: "",
                },
              ],
              examples: [],
              scope: "global",
            },
          ],
        },
        {
          id: "72cf55a5-e2d0-4dc4-9b9c-fb57613c290d",
          name: "agents",
          description: "",
          operations: [
            {
              id: "86d7808e-49d3-4a63-bd92-26e108deb51b",
              name: "ADD_AGENT",
              description: "Add a new agent to the chat",
              schema:
                "input AddAgentInput {\n  id: OID!\n  name: String\n  ethAddress: String\n  role: String\n  description: String\n  avatar: URL\n}",
              template: "",
              reducer: "",
              errors: [
                {
                  id: "duplicate-agent-error",
                  name: "DuplicateAgentError",
                  code: "DUPLICATE_AGENT_ERROR",
                  description: "An agent with this ID already exists",
                  template: "",
                },
              ],
              examples: [],
              scope: "global",
            },
            {
              id: "set-agent-name-op",
              name: "SET_AGENT_NAME",
              description: "Update an agent's name",
              schema:
                "input SetAgentNameInput {\n  id: OID!\n  name: String\n}",
              template: "Update an agent's name",
              reducer: "",
              errors: [
                {
                  id: "agent-not-found-error-1",
                  name: "AgentNotFoundError",
                  code: "AGENT_NOT_FOUND_ERROR",
                  description: "Agent with the specified ID not found",
                  template: "",
                },
              ],
              examples: [],
              scope: "global",
            },
            {
              id: "set-agent-eth-address-op",
              name: "SET_AGENT_ETH_ADDRESS",
              description: "Update an agent's Ethereum address",
              schema:
                "input SetAgentEthAddressInput {\n  id: OID!\n  ethAddress: String\n}",
              template: "Update an agent's Ethereum address",
              reducer: "",
              errors: [
                {
                  id: "agent-not-found-error-2",
                  name: "AgentNotFoundError",
                  code: "AGENT_NOT_FOUND_ERROR",
                  description: "Agent with the specified ID not found",
                  template: "",
                },
              ],
              examples: [],
              scope: "global",
            },
            {
              id: "set-agent-role-op",
              name: "SET_AGENT_ROLE",
              description: "Update an agent's role",
              schema:
                "input SetAgentRoleInput {\n  id: OID!\n  role: String\n}",
              template: "Update an agent's role",
              reducer: "",
              errors: [
                {
                  id: "agent-not-found-error-3",
                  name: "AgentNotFoundError",
                  code: "AGENT_NOT_FOUND_ERROR",
                  description: "Agent with the specified ID not found",
                  template: "",
                },
              ],
              examples: [],
              scope: "global",
            },
            {
              id: "set-agent-description-op",
              name: "SET_AGENT_DESCRIPTION",
              description: "Update an agent's description",
              schema:
                "input SetAgentDescriptionInput {\n  id: OID!\n  description: String\n}",
              template: "Update an agent's description",
              reducer: "",
              errors: [
                {
                  id: "agent-not-found-error-4",
                  name: "AgentNotFoundError",
                  code: "AGENT_NOT_FOUND_ERROR",
                  description: "Agent with the specified ID not found",
                  template: "",
                },
              ],
              examples: [],
              scope: "global",
            },
            {
              id: "set-agent-avatar-op",
              name: "SET_AGENT_AVATAR",
              description: "Update an agent's avatar URL",
              schema:
                "input SetAgentAvatarInput {\n  id: OID!\n  avatar: URL\n}",
              template: "Update an agent's avatar URL",
              reducer: "",
              errors: [
                {
                  id: "agent-not-found-error-5",
                  name: "AgentNotFoundError",
                  code: "AGENT_NOT_FOUND_ERROR",
                  description: "Agent with the specified ID not found",
                  template: "",
                },
              ],
              examples: [],
              scope: "global",
            },
            {
              id: "remove-agent-op",
              name: "REMOVE_AGENT",
              description: "Soft-delete an agent from the chat",
              schema: "input RemoveAgentInput {\n  id: OID!\n}",
              template: "Soft-delete an agent from the chat",
              reducer: "",
              errors: [
                {
                  id: "agent-not-found-error-6",
                  name: "AgentNotFoundError",
                  code: "AGENT_NOT_FOUND_ERROR",
                  description: "Agent with the specified ID not found",
                  template: "",
                },
              ],
              examples: [],
              scope: "global",
            },
            {
              id: "readd-agent-op",
              name: "READD_AGENT",
              description: "Re-add a previously removed agent to the chat",
              schema: "input ReaddAgentInput {\n  id: OID!\n}",
              template: "Re-add a previously removed agent to the chat",
              reducer: "",
              errors: [
                {
                  id: "agent-not-found-error-7",
                  name: "AgentNotFoundError",
                  code: "AGENT_NOT_FOUND_ERROR",
                  description: "Agent with the specified ID not found",
                  template: "",
                },
              ],
              examples: [],
              scope: "global",
            },
          ],
        },
        {
          id: "362f67b3-5c45-4c81-ab5e-d72ceb53ab12",
          name: "messages",
          description: "",
          operations: [
            {
              id: "send-text-op",
              name: "SEND_TEXT",
              description:
                "Send a text message. Auto-appends to last message if sender and type match.",
              schema:
                "input SendTextInput {\n  id: OID!\n  sender: OID!\n  text: String!\n  format: MessageFormat\n  mentioned: [OID!]\n  when: DateTime!\n}",
              template:
                "Send a text message. Auto-appends to last message if sender and type match.",
              reducer: "",
              errors: [
                {
                  id: "sender-not-found-error-1",
                  name: "SenderNotFoundError",
                  code: "SENDER_NOT_FOUND_ERROR",
                  description: "Sender agent or stakeholder not found",
                  template: "",
                },
                {
                  id: "invalid-mention-error-1",
                  name: "InvalidMentionError",
                  code: "INVALID_MENTION_ERROR",
                  description: "One or more mentioned users do not exist",
                  template: "",
                },
              ],
              examples: [],
              scope: "global",
            },
            {
              id: "send-error-op",
              name: "SEND_ERROR",
              description: "Send an error message",
              schema:
                "input SendErrorInput {\n  id: OID!\n  sender: OID!\n  error: String!\n  format: MessageFormat\n  mentioned: [OID!]\n  when: DateTime!\n}",
              template: "Send an error message",
              reducer: "",
              errors: [
                {
                  id: "sender-not-found-error-2",
                  name: "SenderNotFoundError",
                  code: "SENDER_NOT_FOUND_ERROR",
                  description: "Sender agent or stakeholder not found",
                  template: "",
                },
                {
                  id: "invalid-mention-error-2",
                  name: "InvalidMentionError",
                  code: "INVALID_MENTION_ERROR",
                  description: "One or more mentioned users do not exist",
                  template: "",
                },
              ],
              examples: [],
              scope: "global",
            },
            {
              id: "send-tool-call-op",
              name: "SEND_TOOL_CALL",
              description: "Send a tool call message",
              schema:
                "input SendToolCallInput {\n  id: OID!\n  sender: OID!\n  toolName: String!\n  argsJson: String!\n  mentioned: [OID!]\n  when: DateTime!\n}",
              template: "Send a tool call message",
              reducer: "",
              errors: [
                {
                  id: "sender-not-found-error-3",
                  name: "SenderNotFoundError",
                  code: "SENDER_NOT_FOUND_ERROR",
                  description: "Sender agent or stakeholder not found",
                  template: "",
                },
                {
                  id: "invalid-mention-error-3",
                  name: "InvalidMentionError",
                  code: "INVALID_MENTION_ERROR",
                  description: "One or more mentioned users do not exist",
                  template: "",
                },
              ],
              examples: [],
              scope: "global",
            },
            {
              id: "send-tool-result-op",
              name: "SEND_TOOL_RESULT",
              description: "Send a tool result message",
              schema:
                "input SendToolResultInput {\n  id: OID!\n  sender: OID!\n  toolName: String!\n  result: String!\n  isError: Boolean!\n  format: MessageFormat\n  mentioned: [OID!]\n  when: DateTime!\n}",
              template: "Send a tool result message",
              reducer: "",
              errors: [
                {
                  id: "sender-not-found-error-4",
                  name: "SenderNotFoundError",
                  code: "SENDER_NOT_FOUND_ERROR",
                  description: "Sender agent or stakeholder not found",
                  template: "",
                },
                {
                  id: "invalid-mention-error-4",
                  name: "InvalidMentionError",
                  code: "INVALID_MENTION_ERROR",
                  description: "One or more mentioned users do not exist",
                  template: "",
                },
              ],
              examples: [],
              scope: "global",
            },
            {
              id: "delete-message-op",
              name: "DELETE_MESSAGE",
              description: "Delete a message from the chat",
              schema: "input DeleteMessageInput {\n  id: OID!\n}",
              template: "Delete a message from the chat",
              reducer: "",
              errors: [
                {
                  id: "message-not-found-error-1",
                  name: "MessageNotFoundError",
                  code: "MESSAGE_NOT_FOUND_ERROR",
                  description: "Message with the specified ID not found",
                  template: "",
                },
              ],
              examples: [],
              scope: "global",
            },
            {
              id: "mark-as-read-op",
              name: "MARK_AS_READ",
              description: "Mark a message as read by a user",
              schema:
                "input MarkAsReadInput {\n  messageId: OID!\n  readBy: OID!\n}",
              template: "Mark a message as read by a user",
              reducer: "",
              errors: [
                {
                  id: "message-not-found-error-2",
                  name: "MessageNotFoundError",
                  code: "MESSAGE_NOT_FOUND_ERROR",
                  description: "Message with the specified ID not found",
                  template: "",
                },
                {
                  id: "reader-not-found-error",
                  name: "ReaderNotFoundError",
                  code: "READER_NOT_FOUND_ERROR",
                  description: "Reader agent or stakeholder not found",
                  template: "",
                },
              ],
              examples: [],
              scope: "global",
            },
          ],
        },
        {
          id: "reactions-module",
          name: "reactions",
          description: "Operations for managing emoji reactions on messages",
          operations: [
            {
              id: "add-reaction-op",
              name: "ADD_REACTION",
              description: "Add an emoji reaction to a message",
              schema:
                "input AddReactionInput {\n  messageId: OID!\n  sender: OID!\n  emoji: String!\n}",
              template: "Add an emoji reaction to a message",
              reducer: "",
              errors: [
                {
                  id: "message-not-found-error-3",
                  name: "MessageNotFoundError",
                  code: "MESSAGE_NOT_FOUND_ERROR",
                  description: "Message with the specified ID not found",
                  template: "",
                },
                {
                  id: "sender-not-found-error-5",
                  name: "SenderNotFoundError",
                  code: "SENDER_NOT_FOUND_ERROR",
                  description: "Sender agent or stakeholder not found",
                  template: "",
                },
                {
                  id: "duplicate-reaction-error",
                  name: "DuplicateReactionError",
                  code: "DUPLICATE_REACTION_ERROR",
                  description:
                    "This sender has already reacted with this emoji to this message",
                  template: "",
                },
              ],
              examples: [],
              scope: "global",
            },
            {
              id: "remove-reaction-op",
              name: "REMOVE_REACTION",
              description: "Remove an emoji reaction from a message",
              schema:
                "input RemoveReactionInput {\n  messageId: OID!\n  sender: OID!\n  emoji: String!\n}",
              template: "Remove an emoji reaction from a message",
              reducer: "",
              errors: [
                {
                  id: "message-not-found-error-4",
                  name: "MessageNotFoundError",
                  code: "MESSAGE_NOT_FOUND_ERROR",
                  description: "Message with the specified ID not found",
                  template: "",
                },
                {
                  id: "reaction-not-found-error",
                  name: "ReactionNotFoundError",
                  code: "REACTION_NOT_FOUND_ERROR",
                  description:
                    "Reaction with the specified sender and emoji not found on this message",
                  template: "",
                },
              ],
              examples: [],
              scope: "global",
            },
          ],
        },
      ],
      version: 1,
      changeLog: [],
    },
  ],
};
