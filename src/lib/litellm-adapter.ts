import { LLMAdapter, LLMMessage, LLMChatCompletionOptions, LLMChatCompletionResponse, LLMChatCompletionResponseChunk } from "@copilotkit/runtime";
import { completion } from "litellm";

/**
 * LiteLLMAdapter for CopilotKit
 *
 * This adapter integrates LiteLLM with CopilotKit, allowing the use of 100+ LLM providers
 * through a unified interface.
 */
export class LiteLLMAdapter implements LLMAdapter {
  private model: string;
  private apiKey?: string;
  private apiBase?: string;
  private fallbackModels?: string[];
  private fallbackApiKey?: string;
  private fallbackApiBase?: string;
  private maxRetries: number;
  private temperature: number;
  private maxTokens?: number;
  private additionalParams: Record<string, any>;

  constructor({
    model,
    apiKey,
    apiBase,
    fallbackModels,
    fallbackApiKey,
    fallbackApiBase,
    maxRetries = 3,
    temperature = 0.7,
    maxTokens,
    ...additionalParams
  }: {
    model: string;
    apiKey?: string;
    apiBase?: string;
    fallbackModels?: string[];
    fallbackApiKey?: string;
    fallbackApiBase?: string;
    maxRetries?: number;
    temperature?: number;
    maxTokens?: number;
    [key: string]: any;
  }) {
    this.model = model;
    this.apiKey = apiKey;
    this.apiBase = apiBase;
    this.fallbackModels = fallbackModels;
    this.fallbackApiKey = fallbackApiKey;
    this.fallbackApiBase = fallbackApiBase;
    this.maxRetries = maxRetries;
    this.temperature = temperature;
    this.maxTokens = maxTokens;
    this.additionalParams = additionalParams;
  }

  /**
   * Convert CopilotKit messages to LiteLLM format
   */
  private convertMessages(messages: LLMMessage[]): any[] {
    return messages.map((message) => ({
      role: message.role,
      content: message.content,
    }));
  }

  /**
   * Process a chat completion request
   */
  async chatCompletion(
    messages: LLMMessage[],
    options?: LLMChatCompletionOptions
  ): Promise<LLMChatCompletionResponse> {
    try {
      const convertedMessages = this.convertMessages(messages);

      const response = await completion({
        model: this.model,
        messages: convertedMessages,
        temperature: options?.temperature ?? this.temperature,
        max_tokens: options?.maxTokens ?? this.maxTokens,
        api_key: this.apiKey,
        api_base: this.apiBase,
        fallbacks: this.fallbackModels ? this.fallbackModels.map(model => ({
          model,
          api_key: this.fallbackApiKey,
          api_base: this.fallbackApiBase,
        })) : undefined,
        num_retries: this.maxRetries,
        ...this.additionalParams,
        ...options?.additionalParams,
      });

      // Convert LiteLLM response to CopilotKit format
      return {
        id: response.id,
        object: response.object,
        created: response.created,
        model: response.model,
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: response.choices[0]?.message?.content || "",
            },
            finish_reason: response.choices[0]?.finish_reason || "stop",
          },
        ],
        usage: response.usage,
      };
    } catch (error) {
      console.error("LiteLLM chat completion error:", error);

      // Categorize errors for better handling
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();

        if (errorMessage.includes("rate limit") || errorMessage.includes("ratelimit")) {
          throw new Error(`Rate limit exceeded: ${error.message}`);
        } else if (errorMessage.includes("authentication") || errorMessage.includes("auth") || errorMessage.includes("api key")) {
          throw new Error(`Authentication error: ${error.message}`);
        } else if (errorMessage.includes("timeout") || errorMessage.includes("timed out")) {
          throw new Error(`Request timed out: ${error.message}`);
        } else if (errorMessage.includes("not found") || errorMessage.includes("404")) {
          throw new Error(`Resource not found: ${error.message}`);
        }
      }

      // If we couldn't categorize the error, rethrow it
      throw error;
    }
  }

  /**
   * Process a streaming chat completion request
   */
  async chatCompletionStream(
    messages: LLMMessage[],
    options?: LLMChatCompletionOptions
  ): Promise<AsyncIterable<LLMChatCompletionResponseChunk>> {
    try {
      const convertedMessages = this.convertMessages(messages);

      const response = await completion({
        model: this.model,
        messages: convertedMessages,
        temperature: options?.temperature ?? this.temperature,
        max_tokens: options?.maxTokens ?? this.maxTokens,
        api_key: this.apiKey,
        api_base: this.apiBase,
        fallbacks: this.fallbackModels ? this.fallbackModels.map(model => ({
          model,
          api_key: this.fallbackApiKey,
          api_base: this.fallbackApiBase,
        })) : undefined,
        num_retries: this.maxRetries,
        stream: true,
        ...this.additionalParams,
        ...options?.additionalParams,
      });

      // Create an async generator to yield chunks
      return {
        [Symbol.asyncIterator]: async function* () {
          for await (const chunk of response) {
            // Convert LiteLLM chunk to CopilotKit format
            yield {
              id: chunk.id,
              object: "chat.completion.chunk",
              created: chunk.created,
              model: chunk.model,
              choices: [
                {
                  index: 0,
                  delta: {
                    role: chunk.choices[0]?.delta?.role || "assistant",
                    content: chunk.choices[0]?.delta?.content || "",
                  },
                  finish_reason: chunk.choices[0]?.finish_reason || null,
                },
              ],
            };
          }
        },
      };
    } catch (error) {
      console.error("LiteLLM chat completion stream error:", error);

      // Categorize errors for better handling
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();

        if (errorMessage.includes("rate limit") || errorMessage.includes("ratelimit")) {
          throw new Error(`Rate limit exceeded: ${error.message}`);
        } else if (errorMessage.includes("authentication") || errorMessage.includes("auth") || errorMessage.includes("api key")) {
          throw new Error(`Authentication error: ${error.message}`);
        } else if (errorMessage.includes("timeout") || errorMessage.includes("timed out")) {
          throw new Error(`Request timed out: ${error.message}`);
        } else if (errorMessage.includes("not found") || errorMessage.includes("404")) {
          throw new Error(`Resource not found: ${error.message}`);
        } else if (errorMessage.includes("streaming") || errorMessage.includes("stream")) {
          throw new Error(`Streaming error: ${error.message}`);
        }
      }

      // If we couldn't categorize the error, rethrow it
      throw error;
    }
  }
}
