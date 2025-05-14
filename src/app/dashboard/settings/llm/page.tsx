"use client";

import { useState, useEffect } from "react";
import {
  LLMSettings,
  defaultLLMSettings,
  llmProviders,
  getProviderById,
  saveLLMSettings,
  loadLLMSettings
} from "@/lib/llm-settings";
import { AlertCircle, Check, Info, RefreshCw, Save } from "lucide-react";

export default function LLMSettingsPage() {
  const [settings, setSettings] = useState<LLMSettings>(defaultLLMSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showFallbackApiKey, setShowFallbackApiKey] = useState(false);
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [testMessage, setTestMessage] = useState<string | null>(null);

  // Load settings on component mount
  useEffect(() => {
    // First load from local storage for immediate display
    const localSettings = loadLLMSettings();
    setSettings(localSettings);

    // Then try to load from the server
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/settings/llm");
        if (response.ok) {
          const serverSettings = await response.json();
          // Only update if we got valid settings
          if (serverSettings && serverSettings.provider && serverSettings.model) {
            // Handle masked API keys - if the key is masked (contains asterisks),
            // keep the local value if it exists
            if (serverSettings.apiKey && serverSettings.apiKey.includes('*') && localSettings.apiKey) {
              serverSettings.apiKey = localSettings.apiKey;
            }

            if (serverSettings.fallbackApiKey && serverSettings.fallbackApiKey.includes('*') && localSettings.fallbackApiKey) {
              serverSettings.fallbackApiKey = localSettings.fallbackApiKey;
            }

            setSettings(serverSettings);
            // Also update local storage, but only for non-sensitive data
            const settingsToSave = { ...serverSettings };
            // Don't overwrite existing API keys in local storage with masked values
            if (settingsToSave.apiKey && settingsToSave.apiKey.includes('*') && localSettings.apiKey) {
              settingsToSave.apiKey = localSettings.apiKey;
            }
            if (settingsToSave.fallbackApiKey && settingsToSave.fallbackApiKey.includes('*') && localSettings.fallbackApiKey) {
              settingsToSave.fallbackApiKey = localSettings.fallbackApiKey;
            }
            saveLLMSettings(settingsToSave);
          }
        }
      } catch (error) {
        console.error("Error loading settings from server:", error);
        // Continue using local settings if server fails
      }
    };

    fetchSettings();
  }, []);

  // Get the selected provider
  const selectedProvider = getProviderById(settings.provider);
  const fallbackProvider = settings.fallbackProvider ? getProviderById(settings.fallbackProvider) : undefined;

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    try {
      // Validate required fields
      if (!settings.provider || !settings.model) {
        setSaveError("Provider and model are required.");
        setIsSaving(false);
        return;
      }

      const provider = getProviderById(settings.provider);
      if (!provider) {
        setSaveError("Invalid provider selected.");
        setIsSaving(false);
        return;
      }

      if (provider.requiresApiKey && !settings.apiKey) {
        setSaveError(`${provider.name} requires an API key.`);
        setIsSaving(false);
        return;
      }

      if (provider.requiresApiBase && !settings.apiBase) {
        setSaveError(`${provider.name} requires an API base URL.`);
        setIsSaving(false);
        return;
      }

      // If fallback is enabled, validate fallback settings
      if (settings.fallbackProvider) {
        if (!settings.fallbackModel) {
          setSaveError("Fallback model is required when fallback provider is enabled.");
          setIsSaving(false);
          return;
        }

        const fallbackProvider = getProviderById(settings.fallbackProvider);
        if (!fallbackProvider) {
          setSaveError("Invalid fallback provider selected.");
          setIsSaving(false);
          return;
        }

        if (fallbackProvider.requiresApiKey && !settings.fallbackApiKey) {
          setSaveError(`Fallback provider ${fallbackProvider.name} requires an API key.`);
          setIsSaving(false);
          return;
        }

        if (fallbackProvider.requiresApiBase && !settings.fallbackApiBase) {
          setSaveError(`Fallback provider ${fallbackProvider.name} requires an API base URL.`);
          setIsSaving(false);
          return;
        }
      }

      // Save settings to local storage
      saveLLMSettings(settings);

      // Save settings to the server
      const response = await fetch("/api/settings/llm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        const errorStatus = response.status;
        let errorData;

        try {
          errorData = await response.json();
        } catch (e) {
          throw new Error(`Server error (${errorStatus}): Unable to save settings.`);
        }

        throw new Error(errorData.error || `Server error (${errorStatus}): Failed to save settings`);
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "Failed to save settings. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Handle test connection
  const handleTestConnection = async () => {
    setTestStatus("testing");
    setTestMessage(null);

    try {
      // Validate required fields before testing
      if (!settings.provider || !settings.model) {
        setTestStatus("error");
        setTestMessage("Provider and model are required.");
        return;
      }

      const provider = getProviderById(settings.provider);
      if (!provider) {
        setTestStatus("error");
        setTestMessage("Invalid provider selected.");
        return;
      }

      if (provider.requiresApiKey && !settings.apiKey) {
        setTestStatus("error");
        setTestMessage(`${provider.name} requires an API key.`);
        return;
      }

      if (provider.requiresApiBase && !settings.apiBase) {
        setTestStatus("error");
        setTestMessage(`${provider.name} requires an API base URL.`);
        return;
      }

      // Test connection with the API
      const response = await fetch("/api/settings/llm", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          provider: settings.provider,
          model: settings.model,
          apiKey: settings.apiKey,
          apiBase: settings.apiBase,
        }),
      });

      if (!response.ok) {
        const errorStatus = response.status;
        let errorData;

        try {
          errorData = await response.json();
        } catch (e) {
          // If we can't parse the JSON, use a generic error message
          setTestStatus("error");
          setTestMessage(`Server error (${errorStatus}): Unable to connect to the LLM provider.`);
          return;
        }

        setTestStatus("error");
        setTestMessage(errorData.message || `Server error (${errorStatus}): ${errorData.error || "Unknown error"}`);
        return;
      }

      const data = await response.json();

      if (data.success) {
        setTestStatus("success");
        setTestMessage(`Connection successful! Connected to ${data.model || "the model"}.`);
      } else {
        setTestStatus("error");
        setTestMessage(data.message || "Connection failed. Please check your API key and try again.");
      }
    } catch (error) {
      setTestStatus("error");
      setTestMessage(
        error instanceof Error
          ? `Error: ${error.message}`
          : "An error occurred while testing the connection."
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">LLM Settings</h1>
        <div className="flex items-center gap-2">
          {saveSuccess && (
            <div className="flex items-center gap-1 text-green-600">
              <Check size={16} />
              <span>Settings saved</span>
            </div>
          )}
          {saveError && (
            <div className="flex items-center gap-1 text-red-600">
              <AlertCircle size={16} />
              <span>{saveError}</span>
            </div>
          )}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-300 flex items-center gap-2"
          >
            {isSaving ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
            <span>{isSaving ? "Saving..." : "Save Settings"}</span>
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Primary LLM Provider */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Primary LLM Provider</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Provider
                  </label>
                  <select
                    value={settings.provider}
                    onChange={(e) => {
                      const newProvider = e.target.value;
                      const provider = getProviderById(newProvider);
                      setSettings({
                        ...settings,
                        provider: newProvider,
                        model: provider?.models[0]?.id || "",
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {llmProviders.map((provider) => (
                      <option key={provider.id} value={provider.id}>
                        {provider.name}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-sm text-slate-500">
                    {selectedProvider?.description}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Model
                  </label>
                  <select
                    value={settings.model}
                    onChange={(e) =>
                      setSettings({ ...settings, model: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {selectedProvider?.models.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-sm text-slate-500">
                    {selectedProvider?.models.find(
                      (m) => m.id === settings.model
                    )?.description}
                  </p>
                </div>

                {selectedProvider?.requiresApiKey && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      API Key
                    </label>
                    <div className="relative">
                      <input
                        type={showApiKey ? "text" : "password"}
                        value={settings.apiKey || ""}
                        onChange={(e) =>
                          setSettings({ ...settings, apiKey: e.target.value })
                        }
                        placeholder={`Enter your ${selectedProvider.name} API key`}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700"
                      >
                        {showApiKey ? "Hide" : "Show"}
                      </button>
                    </div>
                  </div>
                )}

                {selectedProvider?.requiresApiBase && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      API Base URL
                    </label>
                    <input
                      type="text"
                      value={settings.apiBase || ""}
                      onChange={(e) =>
                        setSettings({ ...settings, apiBase: e.target.value })
                      }
                      placeholder={`Enter the API base URL for ${selectedProvider.name}`}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}

                <div className="md:col-span-2">
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testStatus === "testing"}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 disabled:bg-slate-50 disabled:text-slate-400 flex items-center gap-2"
                  >
                    {testStatus === "testing" ? (
                      <RefreshCw className="animate-spin" size={16} />
                    ) : testStatus === "success" ? (
                      <Check className="text-green-600" size={16} />
                    ) : testStatus === "error" ? (
                      <AlertCircle className="text-red-600" size={16} />
                    ) : (
                      <Info size={16} />
                    )}
                    <span>
                      {testStatus === "testing"
                        ? "Testing connection..."
                        : "Test Connection"}
                    </span>
                  </button>
                  {testMessage && (
                    <p
                      className={`mt-2 text-sm ${
                        testStatus === "success"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {testMessage}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Fallback LLM Provider */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Fallback LLM Provider</h2>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="enable-fallback"
                    checked={!!settings.fallbackProvider}
                    onChange={(e) => {
                      if (e.target.checked) {
                        // Enable fallback with first provider that's not the primary
                        const fallbackProviderId = llmProviders.find(
                          (p) => p.id !== settings.provider
                        )?.id;
                        const fallbackProvider = getProviderById(fallbackProviderId || "");
                        setSettings({
                          ...settings,
                          fallbackProvider: fallbackProviderId,
                          fallbackModel: fallbackProvider?.models[0]?.id,
                        });
                      } else {
                        // Disable fallback
                        setSettings({
                          ...settings,
                          fallbackProvider: undefined,
                          fallbackModel: undefined,
                          fallbackApiKey: undefined,
                          fallbackApiBase: undefined,
                        });
                      }
                    }}
                    className="rounded"
                  />
                  <label htmlFor="enable-fallback" className="text-sm">
                    Enable fallback provider
                  </label>
                </div>
              </div>

              {settings.fallbackProvider && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Fallback Provider
                    </label>
                    <select
                      value={settings.fallbackProvider}
                      onChange={(e) => {
                        const newProvider = e.target.value;
                        const provider = getProviderById(newProvider);
                        setSettings({
                          ...settings,
                          fallbackProvider: newProvider,
                          fallbackModel: provider?.models[0]?.id || "",
                        });
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {llmProviders
                        .filter((p) => p.id !== settings.provider)
                        .map((provider) => (
                          <option key={provider.id} value={provider.id}>
                            {provider.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Fallback Model
                    </label>
                    <select
                      value={settings.fallbackModel}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          fallbackModel: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {fallbackProvider?.models.map((model) => (
                        <option key={model.id} value={model.id}>
                          {model.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {fallbackProvider?.requiresApiKey && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Fallback API Key
                      </label>
                      <div className="relative">
                        <input
                          type={showFallbackApiKey ? "text" : "password"}
                          value={settings.fallbackApiKey || ""}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              fallbackApiKey: e.target.value,
                            })
                          }
                          placeholder={`Enter your ${fallbackProvider.name} API key`}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowFallbackApiKey(!showFallbackApiKey)
                          }
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700"
                        >
                          {showFallbackApiKey ? "Hide" : "Show"}
                        </button>
                      </div>
                    </div>
                  )}

                  {fallbackProvider?.requiresApiBase && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Fallback API Base URL
                      </label>
                      <input
                        type="text"
                        value={settings.fallbackApiBase || ""}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            fallbackApiBase: e.target.value,
                          })
                        }
                        placeholder={`Enter the API base URL for ${fallbackProvider.name}`}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Advanced Settings */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Advanced Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Temperature
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={settings.temperature}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        temperature: parseFloat(e.target.value),
                      })
                    }
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-slate-500">
                    <span>0 (More deterministic)</span>
                    <span>{settings.temperature}</span>
                    <span>1 (More creative)</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Max Tokens
                  </label>
                  <input
                    type="number"
                    value={settings.maxTokens || ""}
                    onChange={(e) => {
                      const value = e.target.value
                        ? parseInt(e.target.value)
                        : undefined;
                      setSettings({ ...settings, maxTokens: value });
                    }}
                    placeholder="Leave empty for model default"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="mt-1 text-sm text-slate-500">
                    Maximum number of tokens to generate
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Max Retries
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={settings.maxRetries}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        maxRetries: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="mt-1 text-sm text-slate-500">
                    Number of retry attempts on failure
                  </p>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
