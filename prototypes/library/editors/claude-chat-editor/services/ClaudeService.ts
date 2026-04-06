import Anthropic from "@anthropic-ai/sdk";
import type {
  Agent,
  Message,
} from "@powerhousedao/agent-manager/document-models/claude-chat";

export interface ClaudeResponse {
  content: string;
  model: string;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
}

export interface ClaudeError {
  message: string;
  type: string;
  code?: string;
}

export class ClaudeService {
  private anthropic: Anthropic | null = null;

  constructor(apiKey: string) {
    if (!apiKey || !apiKey.trim()) {
      throw new Error("API key is required");
    }

    try {
      this.anthropic = new Anthropic({
        apiKey: apiKey.trim(),
        dangerouslyAllowBrowser: true, // Note: In production, API calls should go through a backend
      });
    } catch (error) {
      throw new Error(
        `Failed to initialize Anthropic client: ${String(error)}`,
      );
    }
  }

  /**
   * Sends a message to Claude and returns the response
   */
  async sendMessage(
    agent: Agent,
    messages: Message[],
    userMessage: string,
  ): Promise<ClaudeResponse> {
    if (!this.anthropic) {
      throw new Error("Anthropic client not initialized");
    }

    if (!this.isSupportedModel(agent.model)) {
      throw new Error(
        `Unsupported model: ${agent.model}. Only Claude models are supported.`,
      );
    }

    try {
      // Convert our message format to Anthropic's format
      const anthropicMessages = this.formatMessagesForClaude(
        agent,
        messages,
        userMessage,
      );

      const response = await this.anthropic.messages.create({
        model: agent.model,
        max_tokens: 4096,
        messages: anthropicMessages,
        temperature: 0.7,
      });

      // Extract text content from the response
      let content = "";
      for (const block of response.content) {
        if (block.type === "text") {
          content += block.text;
        }
      }

      return {
        content,
        model: response.model,
        usage: {
          input_tokens: response.usage.input_tokens,
          output_tokens: response.usage.output_tokens,
        },
      };
    } catch (error: unknown) {
      console.error("Claude API Error:", error);

      // Handle different types of errors
      const errorObj = error as { status?: number; message?: string };
      if (errorObj.status === 401) {
        throw new Error("Invalid API key. Please check your Claude API key.");
      } else if (errorObj.status === 429) {
        throw new Error("Rate limit exceeded. Please try again in a moment.");
      } else if (errorObj.status === 400) {
        throw new Error(
          `Bad request: ${errorObj.message || "Invalid parameters"}`,
        );
      } else if (errorObj.status === 500) {
        throw new Error(
          "Claude API is temporarily unavailable. Please try again later.",
        );
      } else {
        throw new Error(
          `Claude API error: ${errorObj.message || "Unknown error"}`,
        );
      }
    }
  }

  /**
   * Checks if the model is a supported Claude model
   */
  private isSupportedModel(model: string): boolean {
    return ClaudeService.getSupportedModels().some((m) => m.id === model);
  }

  /**
   * Gets the list of supported Claude models
   */
  static getSupportedModels() {
    return [
      {
        id: "claude-3-5-sonnet-20241022",
        name: "Claude 3.5 Sonnet (Latest)",
        description: "Most intelligent model for complex tasks",
      },
      {
        id: "claude-3-5-haiku-20241022",
        name: "Claude 3.5 Haiku (Latest)",
        description: "Fastest model for quick responses",
      },
      {
        id: "claude-3-opus-20240229",
        name: "Claude 3 Opus",
        description: "Previous top-tier model for complex reasoning",
      },
      {
        id: "claude-3-sonnet-20240229",
        name: "Claude 3 Sonnet",
        description: "Balanced model for most tasks",
      },
      {
        id: "claude-3-haiku-20240307",
        name: "Claude 3 Haiku",
        description: "Fast model for simple tasks",
      },
    ];
  }

  /**
   * Converts our internal message format to Anthropic's format
   */
  private formatMessagesForClaude(
    agent: Agent,
    previousMessages: Message[],
    userMessage: string,
  ): Anthropic.Messages.MessageParam[] {
    const anthropicMessages: Anthropic.Messages.MessageParam[] = [];

    // Add initial prompt as the first system-like message if it exists
    if (agent.initialPrompt) {
      anthropicMessages.push({
        role: "user",
        content: agent.initialPrompt,
      });
      anthropicMessages.push({
        role: "assistant",
        content:
          "Understood. I will follow these instructions for our conversation.",
      });
    }

    // Add previous messages
    for (const message of previousMessages) {
      anthropicMessages.push({
        role: message.agent ? "assistant" : "user",
        content: message.content,
      });
    }

    // Add the new user message
    anthropicMessages.push({
      role: "user",
      content: userMessage,
    });

    return anthropicMessages;
  }

  /**
   * Validates that an agent can be used with Claude service
   */
  static validateAgent(agent: Agent): void {
    if (!agent.apiKey || agent.apiKey.trim().length === 0) {
      throw new Error("Agent must have an API key configured");
    }

    const service = new ClaudeService(agent.apiKey);
    if (!service.isSupportedModel(agent.model)) {
      throw new Error(
        `Agent model "${agent.model}" is not supported. Only Claude models are supported.`,
      );
    }
  }
}

/**
 * Factory function to create a ClaudeService instance for an agent
 */
export function createClaudeService(agent: Agent): ClaudeService {
  ClaudeService.validateAgent(agent);
  return new ClaudeService(agent.apiKey);
}
