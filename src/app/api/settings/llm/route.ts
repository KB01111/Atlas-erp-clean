import { NextRequest, NextResponse } from "next/server";
import { LLMSettings, defaultLLMSettings } from "@/lib/llm-settings";
import { completion } from "litellm";
import fs from 'fs';
import path from 'path';

// File-based persistence for settings
const SETTINGS_FILE = path.join(process.cwd(), 'data', 'llm-settings.json');

// Initialize settings with defaults
let cachedSettings: LLMSettings = { ...defaultLLMSettings };

// Create data directory if it doesn't exist
try {
  if (!fs.existsSync(path.join(process.cwd(), 'data'))) {
    fs.mkdirSync(path.join(process.cwd(), 'data'), { recursive: true });
  }

  // Load settings from file if it exists
  if (fs.existsSync(SETTINGS_FILE)) {
    const fileContent = fs.readFileSync(SETTINGS_FILE, 'utf8');
    const savedSettings = JSON.parse(fileContent);
    cachedSettings = { ...defaultLLMSettings, ...savedSettings };
  }
} catch (error) {
  console.error('Error loading LLM settings from file:', error);
  // Continue with default settings if file loading fails
}

/**
 * Mask API keys for security
 */
function maskApiKeys(settings: LLMSettings): LLMSettings {
  const maskedSettings = { ...settings };

  // Mask API keys if they exist
  if (maskedSettings.apiKey) {
    // Keep first 4 and last 4 characters, mask the rest
    const apiKeyLength = maskedSettings.apiKey.length;
    if (apiKeyLength > 8) {
      maskedSettings.apiKey =
        maskedSettings.apiKey.substring(0, 4) +
        '*'.repeat(apiKeyLength - 8) +
        maskedSettings.apiKey.substring(apiKeyLength - 4);
    } else {
      maskedSettings.apiKey = '********';
    }
  }

  // Do the same for fallback API key
  if (maskedSettings.fallbackApiKey) {
    const apiKeyLength = maskedSettings.fallbackApiKey.length;
    if (apiKeyLength > 8) {
      maskedSettings.fallbackApiKey =
        maskedSettings.fallbackApiKey.substring(0, 4) +
        '*'.repeat(apiKeyLength - 8) +
        maskedSettings.fallbackApiKey.substring(apiKeyLength - 4);
    } else {
      maskedSettings.fallbackApiKey = '********';
    }
  }

  return maskedSettings;
}

/**
 * GET handler to retrieve LLM settings
 */
export async function GET() {
  try {
    // Return settings with masked API keys
    return NextResponse.json(maskApiKeys(cachedSettings));
  } catch (error) {
    console.error("Error retrieving LLM settings:", error);
    return NextResponse.json(
      { error: "Failed to retrieve LLM settings" },
      { status: 500 }
    );
  }
}

/**
 * POST handler to save LLM settings
 */
export async function POST(req: NextRequest) {
  try {
    const settings = await req.json();

    // Validate settings
    if (!settings.provider || !settings.model) {
      return NextResponse.json(
        { error: "Provider and model are required" },
        { status: 400 }
      );
    }

    // Update cached settings
    cachedSettings = settings;

    // Save settings to file
    try {
      fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf8');
    } catch (error) {
      console.error('Error saving LLM settings to file:', error);
      return NextResponse.json(
        { error: "Failed to save settings to disk" },
        { status: 500 }
      );
    }

    // Set environment variables for the current process
    // Note: These will be reset when the server restarts
    process.env.LLM_PROVIDER = settings.provider;
    process.env.LLM_MODEL = settings.model;

    if (settings.fallbackProvider) {
      process.env.LLM_FALLBACK_PROVIDER = settings.fallbackProvider;
      process.env.LLM_FALLBACK_MODEL = settings.fallbackModel;
    } else {
      // Clear fallback environment variables if not set
      delete process.env.LLM_FALLBACK_PROVIDER;
      delete process.env.LLM_FALLBACK_MODEL;
    }

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error("Error saving LLM settings:", error);
    return NextResponse.json(
      { error: "Failed to save LLM settings" },
      { status: 500 }
    );
  }
}

/**
 * Test LLM connection
 */
export async function PUT(req: NextRequest) {
  try {
    const { provider, model, apiKey, apiBase } = await req.json();

    // Validate required fields
    if (!provider || !model) {
      return NextResponse.json(
        { success: false, error: "Provider and model are required" },
        { status: 400 }
      );
    }

    // Check if this provider requires an API key
    const requiresApiKey = !["ollama", "local"].includes(provider.toLowerCase());
    if (requiresApiKey && !apiKey) {
      return NextResponse.json(
        { success: false, error: `${provider} requires an API key` },
        { status: 400 }
      );
    }

    // Check if this provider requires an API base URL
    const requiresApiBase = ["azure", "ollama", "local"].includes(provider.toLowerCase());
    if (requiresApiBase && !apiBase) {
      return NextResponse.json(
        { success: false, error: `${provider} requires an API base URL` },
        { status: 400 }
      );
    }

    // Format the model name for LiteLLM
    const modelName = `${provider}/${model}`;

    try {
      // Test the connection with a simple completion
      const response = await completion({
        model: modelName,
        messages: [{ role: "user", content: "Hello, this is a test message." }],
        api_key: apiKey,
        api_base: apiBase,
        max_tokens: 10, // Keep it small for testing
        timeout: 10, // Set a short timeout for testing
      });

      return NextResponse.json({
        success: true,
        message: "Connection successful",
        model: response.model,
      });
    } catch (error) {
      // Handle specific LiteLLM errors
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();

        if (errorMessage.includes("rate limit") || errorMessage.includes("ratelimit")) {
          return NextResponse.json(
            { success: false, error: "Rate limit exceeded", message: error.message },
            { status: 429 }
          );
        } else if (errorMessage.includes("authentication") || errorMessage.includes("auth") || errorMessage.includes("api key")) {
          return NextResponse.json(
            { success: false, error: "Authentication error", message: error.message },
            { status: 401 }
          );
        } else if (errorMessage.includes("timeout") || errorMessage.includes("timed out")) {
          return NextResponse.json(
            { success: false, error: "Request timed out", message: error.message },
            { status: 408 }
          );
        } else if (errorMessage.includes("not found") || errorMessage.includes("404")) {
          return NextResponse.json(
            { success: false, error: "Resource not found", message: error.message },
            { status: 404 }
          );
        }
      }

      // Generic error handling
      console.error("Error testing LLM connection:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Connection failed",
          message: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error processing test connection request:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Invalid request",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 400 }
    );
  }
}
