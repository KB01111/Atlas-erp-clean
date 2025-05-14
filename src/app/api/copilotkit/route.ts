import {
  CopilotRuntime,
  OpenAIAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from '@copilotkit/runtime';
import { NextRequest } from 'next/server';
import { LiteLLMAdapter } from "@/lib/litellm-adapter";
import {
  loadLLMSettings,
  defaultLLMSettings,
  toLiteLLMModelFormat
} from "@/lib/llm-settings";

/**
 * Create a service adapter for the CopilotKit runtime
 * based on the settings.
 *
 * @returns Service adapter instance
 */
function createServiceAdapter() {
  // Try to load settings from file first
  let settings;
  try {
    settings = loadLLMSettings();
  } catch (error) {
    console.warn("Failed to load LLM settings from file, using defaults and environment variables:", error);
    settings = defaultLLMSettings;
  }

  // Use settings from file or fall back to environment variables
  const primaryModel = settings.model || process.env.LLM_MODEL || "gpt-4o";
  const primaryProvider = settings.provider || process.env.LLM_PROVIDER || "openai";

  // Validate required API keys
  let apiKey: string | undefined;
  if (primaryProvider === "openai") {
    apiKey = settings.apiKey || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.warn("OpenAI API key is not set. OpenAI API calls will fail.");
    }
  } else if (primaryProvider === "anthropic") {
    apiKey = settings.apiKey || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.warn("Anthropic API key is not set. Anthropic API calls will fail.");
    }
  } else if (primaryProvider === "azure") {
    apiKey = settings.apiKey || process.env.AZURE_API_KEY;
    if (!apiKey) {
      console.warn("Azure API key is not set. Azure OpenAI API calls will fail.");
    }
  } else {
    // For other providers, use the generic API key
    apiKey = settings.apiKey || process.env.OPENAI_API_KEY;
  }

  const apiBase = settings.apiBase || process.env.OPENAI_API_BASE ||
                 (primaryProvider === "azure" ? process.env.AZURE_API_BASE : undefined);

  // For fallback models
  const fallbackProvider = settings.fallbackProvider || process.env.LLM_FALLBACK_PROVIDER;
  const fallbackModel = settings.fallbackModel || process.env.LLM_FALLBACK_MODEL;

  // Get the appropriate fallback API key based on the provider
  let fallbackApiKey: string | undefined;
  if (fallbackProvider === "openai") {
    fallbackApiKey = settings.fallbackApiKey || process.env.OPENAI_API_KEY;
  } else if (fallbackProvider === "anthropic") {
    fallbackApiKey = settings.fallbackApiKey || process.env.ANTHROPIC_API_KEY;
  } else if (fallbackProvider === "azure") {
    fallbackApiKey = settings.fallbackApiKey || process.env.AZURE_API_KEY;
  } else if (fallbackProvider) {
    // For other providers, use the fallback API key or the generic one
    fallbackApiKey = settings.fallbackApiKey || process.env.LLM_FALLBACK_API_KEY || process.env.OPENAI_API_KEY;
  }

  const fallbackApiBase = settings.fallbackApiBase || process.env.LLM_FALLBACK_API_BASE ||
                         (fallbackProvider === "azure" ? process.env.AZURE_API_BASE : undefined);

  // If we're using OpenAI without fallbacks, use the native OpenAIAdapter for best performance
  if (primaryProvider === "openai" && !fallbackProvider) {
    return new OpenAIAdapter({
      model: primaryModel,
      apiKey,
      apiBase,
    });
  }

  // Otherwise, use our LiteLLM adapter
  const primaryModelFormat = toLiteLLMModelFormat(primaryProvider, primaryModel);

  // Configure fallback models if available
  const fallbackModels = fallbackProvider && fallbackModel
    ? [toLiteLLMModelFormat(fallbackProvider, fallbackModel)]
    : undefined;

  return new LiteLLMAdapter({
    model: primaryModelFormat,
    apiKey,
    apiBase,
    fallbackModels,
    fallbackApiKey,
    fallbackApiBase,
    temperature: 0.7,
    maxRetries: 3,
  });
}

// Initialize the service adapter
const serviceAdapter = createServiceAdapter();
const runtime = new CopilotRuntime();

// Define the POST handler for the API route
export const POST = async (req: NextRequest) => {
  try {
    const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
      runtime,
      serviceAdapter,
      endpoint: '/api/copilotkit',
    });

    return handleRequest(req);
  } catch (error) {
    console.error("Error handling CopilotKit request:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to process request",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
