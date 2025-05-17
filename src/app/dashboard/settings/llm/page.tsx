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
import {
  AlertCircle,
  Check,
  Info,
  RefreshCw,
  Save,
  Copy,
  CheckCircle,
  RotateCcw,
  Key,
  ExternalLink,
  Settings
} from "lucide-react";
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text";
import { BorderContainer } from "@/components/ui/shine-border";
import { EnhancedActionButton } from "@/components/ui/enhanced-action-button";
import { EnhancedCard } from "@/components/ui/enhanced-card";

export default function LLMSettingsPage() {
  const [settings, setSettings] = useState<LLMSettings>(defaultLLMSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showFallbackApiKey, setShowFallbackApiKey] = useState(false);
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [testMessage, setTestMessage] = useState<string | null>(null);
  const [copiedApiKey, setCopiedApiKey] = useState(false);
  const [copiedFallbackApiKey, setCopiedFallbackApiKey] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

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

  // Handle reset to defaults
  const handleResetToDefaults = () => {
    if (showResetConfirm) {
      setSettings(defaultLLMSettings);
      setShowResetConfirm(false);
      setSaveSuccess(false);
      setSaveError(null);
      setTestStatus("idle");
      setTestMessage(null);
    } else {
      setShowResetConfirm(true);
      // Auto-hide the confirmation after 5 seconds
      setTimeout(() => setShowResetConfirm(false), 5000);
    }
  };

  // Handle copy API key to clipboard
  const handleCopyApiKey = (key: string, isFallback: boolean = false) => {
    if (!key) return;

    navigator.clipboard.writeText(key).then(() => {
      if (isFallback) {
        setCopiedFallbackApiKey(true);
        setTimeout(() => setCopiedFallbackApiKey(false), 2000);
      } else {
        setCopiedApiKey(true);
        setTimeout(() => setCopiedApiKey(false), 2000);
      }
    });
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
      <div className="flex justify-between items-center mb-8">
        <div>
          <AnimatedGradientText
            text="LLM Settings"
            className="text-3xl font-bold"
            gradient="linear-gradient(to right, #3b82f6, #8b5cf6, #ec4899)"
          />
          <p className="text-muted-foreground mt-2">
            Configure your Language Model providers and API keys
          </p>
        </div>
        <div className="flex items-center gap-2">
          {saveSuccess && (
            <div className="flex items-center gap-1 text-green-600 bg-green-50 px-3 py-1 rounded-md">
              <CheckCircle size={16} />
              <span>Settings saved</span>
            </div>
          )}
          {saveError && (
            <div className="flex items-center gap-1 text-red-600 bg-red-50 px-3 py-1 rounded-md">
              <AlertCircle size={16} />
              <span>{saveError}</span>
            </div>
          )}
          {showResetConfirm && (
            <div className="flex items-center gap-1 text-amber-600 bg-amber-50 px-3 py-1 rounded-md">
              <AlertCircle size={16} />
              <span>Confirm reset?</span>
            </div>
          )}
          <button
            type="button"
            onClick={handleResetToDefaults}
            className="px-3 py-2 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 flex items-center gap-2"
          >
            <RotateCcw size={16} />
            <span>{showResetConfirm ? "Confirm Reset" : "Reset to Defaults"}</span>
          </button>
          <EnhancedActionButton
            onClick={handleSubmit}
            disabled={isSaving}
            className="px-4 py-2 rounded-md font-medium bg-primary text-primary-foreground flex items-center gap-2"
           variant="default" size="sm" hover="lift">
            {isSaving ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
            <span>{isSaving ? "Saving..." : "Save Settings"}</span>
          </EnhancedActionButton>
        </div>
      </div>

      <BorderContainer
        borderColor="rgba(59, 130, 246, 0.2)"
        shineBorderColor="rgba(59, 130, 246, 0.6)"
        borderRadius="0.75rem"
        className="w-full"
       variant="primary" rounded="xl">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <form onSubmit={handleSubmit}>
            <div className="space-y-8">
              {/* Primary LLM Provider */}
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Key className="text-primary" size={20} />
                  <span>Primary LLM Provider</span>
                </h2>
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
                    <label className="flex text-sm font-medium text-slate-700 mb-1 items-center justify-between">
                      <span>API Key</span>
                      {selectedProvider.id === "openai" && (
                        <a
                          href="https://platform.openai.com/api-keys"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          <span>Get API Key</span>
                          <ExternalLink size={12} />
                        </a>
                      )}
                      {selectedProvider.id === "anthropic" && (
                        <a
                          href="https://console.anthropic.com/settings/keys"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          <span>Get API Key</span>
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </label>
                    <div className="relative">
                      <input
                        type={showApiKey ? "text" : "password"}
                        value={settings.apiKey || ""}
                        onChange={(e) =>
                          setSettings({ ...settings, apiKey: e.target.value })
                        }
                        placeholder={`Enter your ${selectedProvider.name} API key`}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-20"
                      />
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                        {settings.apiKey && (
                          <button
                            type="button"
                            onClick={() => handleCopyApiKey(settings.apiKey || "")}
                            className="text-slate-500 hover:text-slate-700 p-1"
                            title="Copy API key"
                          >
                            {copiedApiKey ? <CheckCircle size={16} className="text-green-600" /> : <Copy size={16} />}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="text-slate-500 hover:text-slate-700 p-1"
                          title={showApiKey ? "Hide API key" : "Show API key"}
                        >
                          {showApiKey ? "Hide" : "Show"}
                        </button>
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      Your API key is stored securely and never shared
                    </p>
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
                  <EnhancedCard
                    className={`p-4 rounded-lg ${
                      testStatus === "success"
                        ? "bg-green-50 border border-green-100"
                        : testStatus === "error"
                        ? "bg-red-50 border border-red-100"
                        : "bg-slate-50 border border-slate-100"
                    }`}
                    focus={testStatus !== "idle"}
                    glare={testStatus === "success"}
                   interactive hoverEffect="shadow">
                    <div className="flex flex-col">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium">Connection Status</h3>
                        <EnhancedActionButton
                          onClick={handleTestConnection}
                          disabled={testStatus === "testing"}
                          className={`px-3 py-1 rounded-md text-sm font-medium flex items-center gap-2 ${
                            testStatus === "success"
                              ? "bg-green-600 text-white"
                              : testStatus === "error"
                              ? "bg-red-600 text-white"
                              : "bg-slate-700 text-white"
                          }`}
                         variant="default" size="sm" hover="lift">
                          {testStatus === "testing" ? (
                            <RefreshCw className="animate-spin" size={14} />
                          ) : testStatus === "success" ? (
                            <Check size={14} />
                          ) : testStatus === "error" ? (
                            <AlertCircle size={14} />
                          ) : (
                            <Info size={14} />
                          )}
                          <span>
                            {testStatus === "testing"
                              ? "Testing..."
                              : testStatus === "success"
                              ? "Test Again"
                              : testStatus === "error"
                              ? "Retry"
                              : "Test Connection"}
                          </span>
                        </EnhancedActionButton>
                      </div>
                      {testMessage ? (
                        <p
                          className={`text-sm ${
                            testStatus === "success"
                              ? "text-green-700"
                              : "text-red-700"
                          }`}
                        >
                          {testMessage}
                        </p>
                      ) : (
                        <p className="text-sm text-slate-500">
                          Test your connection to the LLM provider
                        </p>
                      )}
                    </div>
                  </EnhancedCard>
                </div>
              </div>
            </div>

            {/* Fallback LLM Provider */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Key className="text-slate-500" size={20} />
                  <span>Fallback LLM Provider</span>
                </h2>
                <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-md border border-slate-200">
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
                    className="rounded text-primary focus:ring-primary"
                  />
                  <label htmlFor="enable-fallback" className="text-sm font-medium cursor-pointer">
                    Enable fallback provider
                  </label>
                </div>
              </div>

              {!settings.fallbackProvider && (
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-700 flex items-center gap-2">
                    <Info size={16} />
                    <span>A fallback provider ensures your application continues to function if the primary provider is unavailable.</span>
                  </p>
                </div>
              )}

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
                      <label className="flex text-sm font-medium text-slate-700 mb-1 items-center justify-between">
                        <span>Fallback API Key</span>
                        {fallbackProvider.id === "openai" && (
                          <a
                            href="https://platform.openai.com/api-keys"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                          >
                            <span>Get API Key</span>
                            <ExternalLink size={12} />
                          </a>
                        )}
                        {fallbackProvider.id === "anthropic" && (
                          <a
                            href="https://console.anthropic.com/settings/keys"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                          >
                            <span>Get API Key</span>
                            <ExternalLink size={12} />
                          </a>
                        )}
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
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-20"
                        />
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                          {settings.fallbackApiKey && (
                            <button
                              type="button"
                              onClick={() => handleCopyApiKey(settings.fallbackApiKey || "", true)}
                              className="text-slate-500 hover:text-slate-700 p-1"
                              title="Copy API key"
                            >
                              {copiedFallbackApiKey ? <CheckCircle size={16} className="text-green-600" /> : <Copy size={16} />}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setShowFallbackApiKey(!showFallbackApiKey)}
                            className="text-slate-500 hover:text-slate-700 p-1"
                            title={showFallbackApiKey ? "Hide API key" : "Show API key"}
                          >
                            {showFallbackApiKey ? "Hide" : "Show"}
                          </button>
                        </div>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        Your fallback API key is stored securely and never shared
                      </p>
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
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Settings className="text-slate-500" size={20} />
                <span>Advanced Settings</span>
              </h2>
              <EnhancedCard
                className="p-6 rounded-lg border border-slate-100"
                focus={false}
               interactive hoverEffect="shadow">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="flex text-sm font-medium text-slate-700 mb-1 items-center justify-between">
                      <span>Temperature</span>
                      <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full">
                        {settings.temperature}
                      </span>
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
                      className="w-full accent-primary"
                    />
                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                      <span>0 (More deterministic)</span>
                      <span>1 (More creative)</span>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      Controls randomness: lower values are more predictable, higher values more creative
                    </p>
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
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <p className="mt-2 text-xs text-slate-500">
                      Maximum number of tokens to generate in each response
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
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <p className="mt-2 text-xs text-slate-500">
                      Number of retry attempts on failure (0-10)
                    </p>
                  </div>
                </div>
              </EnhancedCard>
            </div>
          </div>
        </form>
      </div>
      </BorderContainer>
    </div>
  );
}
