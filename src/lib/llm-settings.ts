/**
 * LLM Provider information
 */
export interface LLMProvider {
  id: string;
  name: string;
  description: string;
  requiresApiKey: boolean;
  requiresApiBase?: boolean;
  models: LLMModel[];
}

/**
 * LLM Model information
 */
export interface LLMModel {
  id: string;
  name: string;
  description: string;
  contextWindow?: number;
  costPer1KInput?: number;
  costPer1KOutput?: number;
}

/**
 * LLM Settings
 */
export interface LLMSettings {
  provider: string;
  model: string;
  apiKey?: string;
  apiBase?: string;
  fallbackProvider?: string;
  fallbackModel?: string;
  fallbackApiKey?: string;
  fallbackApiBase?: string;
  temperature: number;
  maxTokens?: number;
  maxRetries: number;
}

/**
 * Default LLM settings
 */
export const defaultLLMSettings: LLMSettings = {
  provider: "openai",
  model: "gpt-4o",
  temperature: 0.7,
  maxRetries: 3,
};

/**
 * Available LLM providers
 */
export const llmProviders: LLMProvider[] = [
  {
    id: "openai",
    name: "OpenAI",
    description: "OpenAI's models including GPT-4o, GPT-4, and GPT-3.5 Turbo",
    requiresApiKey: true,
    models: [
      {
        id: "gpt-4o",
        name: "GPT-4o",
        description: "OpenAI's most advanced model with vision capabilities",
        contextWindow: 128000,
        costPer1KInput: 0.005,
        costPer1KOutput: 0.015,
      },
      {
        id: "gpt-4-turbo",
        name: "GPT-4 Turbo",
        description: "Optimized version of GPT-4 with improved performance",
        contextWindow: 128000,
        costPer1KInput: 0.01,
        costPer1KOutput: 0.03,
      },
      {
        id: "gpt-3.5-turbo",
        name: "GPT-3.5 Turbo",
        description: "Fast and cost-effective model for most tasks",
        contextWindow: 16000,
        costPer1KInput: 0.0005,
        costPer1KOutput: 0.0015,
      },
    ],
  },
  {
    id: "anthropic",
    name: "Anthropic",
    description: "Anthropic's Claude models known for safety and helpfulness",
    requiresApiKey: true,
    models: [
      {
        id: "claude-3-opus-20240229",
        name: "Claude 3 Opus",
        description: "Anthropic's most powerful model for complex tasks",
        contextWindow: 200000,
        costPer1KInput: 0.015,
        costPer1KOutput: 0.075,
      },
      {
        id: "claude-3-sonnet-20240229",
        name: "Claude 3 Sonnet",
        description: "Balanced model for most use cases",
        contextWindow: 200000,
        costPer1KInput: 0.003,
        costPer1KOutput: 0.015,
      },
      {
        id: "claude-3-haiku-20240307",
        name: "Claude 3 Haiku",
        description: "Fast and cost-effective model for simpler tasks",
        contextWindow: 200000,
        costPer1KInput: 0.00025,
        costPer1KOutput: 0.00125,
      },
    ],
  },
  {
    id: "azure",
    name: "Azure OpenAI",
    description: "Microsoft Azure's OpenAI service with enterprise features",
    requiresApiKey: true,
    requiresApiBase: true,
    models: [
      {
        id: "gpt-4",
        name: "GPT-4",
        description: "Azure's deployment of GPT-4",
        contextWindow: 8192,
      },
      {
        id: "gpt-35-turbo",
        name: "GPT-3.5 Turbo",
        description: "Azure's deployment of GPT-3.5 Turbo",
        contextWindow: 16000,
      },
    ],
  },
  {
    id: "ollama",
    name: "Ollama",
    description: "Run open-source models locally with Ollama",
    requiresApiKey: false,
    requiresApiBase: true,
    models: [
      {
        id: "llama3",
        name: "Llama 3",
        description: "Meta's Llama 3 model",
        contextWindow: 8192,
      },
      {
        id: "mistral",
        name: "Mistral",
        description: "Mistral AI's open-source model",
        contextWindow: 8192,
      },
      {
        id: "codellama",
        name: "CodeLlama",
        description: "Specialized model for code generation",
        contextWindow: 16000,
      },
    ],
  },
];

/**
 * Get provider by ID
 */
export function getProviderById(providerId: string): LLMProvider | undefined {
  return llmProviders.find((provider) => provider.id === providerId);
}

/**
 * Get model by provider ID and model ID
 */
export function getModelByProviderAndId(providerId: string, modelId: string): LLMModel | undefined {
  const provider = getProviderById(providerId);
  if (!provider) return undefined;
  return provider.models.find((model) => model.id === modelId);
}

/**
 * Convert provider and model to LiteLLM format
 */
export function toLiteLLMModelFormat(providerId: string, modelId: string): string {
  // For most providers, the format is "provider/model"
  // Some providers like Azure have special formats
  if (providerId === "azure") {
    return `azure/${modelId}`;
  }

  return `${providerId}/${modelId}`;
}

/**
 * Save LLM settings to local storage
 */
export function saveLLMSettings(settings: LLMSettings): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("llm-settings", JSON.stringify(settings));
  }
}

/**
 * Load LLM settings from local storage
 */
export function loadLLMSettings(): LLMSettings {
  if (typeof window !== "undefined") {
    const savedSettings = localStorage.getItem("llm-settings");
    if (savedSettings) {
      try {
        return JSON.parse(savedSettings);
      } catch (error) {
        console.error("Error parsing LLM settings:", error);
      }
    }
  }
  return defaultLLMSettings;
}

/**
 * Get LLM settings from environment variables or default settings
 * @returns LLM settings
 */
export function getLLMSettings(): LLMSettings {
  // For server-side, use environment variables
  if (typeof window === "undefined") {
    return {
      provider: process.env.LLM_PROVIDER || defaultLLMSettings.provider,
      model: process.env.LLM_MODEL || defaultLLMSettings.model,
      apiKey: process.env.LLM_API_KEY,
      apiBase: process.env.LLM_API_BASE,
      temperature: parseFloat(process.env.LLM_TEMPERATURE || defaultLLMSettings.temperature.toString()),
      maxTokens: process.env.LLM_MAX_TOKENS ? parseInt(process.env.LLM_MAX_TOKENS, 10) : undefined,
      maxRetries: parseInt(process.env.LLM_MAX_RETRIES || defaultLLMSettings.maxRetries.toString(), 10),
    };
  }

  // For client-side, use local storage
  return loadLLMSettings();
}
