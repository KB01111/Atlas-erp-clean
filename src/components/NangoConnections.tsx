"use client";

import { useState, useEffect } from "react";
import {
  Loader2, CheckCircle, XCircle, RefreshCw, ExternalLink,
  AlertCircle, Link as LinkIcon
} from "lucide-react";
import {
  NangoConnection,
  NangoProvider as NangoProviderType,
  getConnections,
  deleteConnection,
  getSupportedProviders
} from "@/lib/nango-service";

// Mock components for NangoProvider and NangoButton since @nangohq/react is not available
const NangoProvider = ({ children, publicKey }: { children: React.ReactNode, publicKey: string }) => {
  return <>{children}</>;
};

const NangoButton = ({
  children,
  providerConfigKey,
  connectionId,
  onSuccess,
  onError,
  className
}: {
  children: React.ReactNode,
  providerConfigKey: string,
  connectionId: string,
  onSuccess: () => void,
  onError: (error: unknown) => void,
  className?: string
}) => {
  return (
    <button
      className={className}
      onClick={() => {
        // Mock successful connection
        setTimeout(() => {
          onSuccess();
        }, 500);
      }}
    >
      {children}
    </button>
  );
};

export default function NangoConnections() {
  const [connections, setConnections] = useState<NangoConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const nangoPublicKey = process.env.NEXT_PUBLIC_NANGO_PUBLIC_KEY || "your-nango-public-key";

  // Get supported integrations from the service
  const supportedIntegrations = getSupportedProviders();

  // Fetch connections on component mount
  useEffect(() => {
    fetchConnections();
  }, []);

  // Function to fetch connections
  const fetchConnections = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const fetchedConnections = await getConnections();
      setConnections(fetchedConnections);
    } catch (error) {
      console.error("Error fetching connections:", error);
      setError(error instanceof Error ? error.message : "Failed to fetch connections");
    } finally {
      setIsLoading(false);
    }
  };

  // Function to delete a connection
  const handleDeleteConnection = async (connectionId: string) => {
    if (!confirm("Are you sure you want to delete this connection?")) {
      return;
    }

    try {
      const success = await deleteConnection(connectionId);

      if (!success) {
        throw new Error("Failed to delete connection");
      }

      // Refresh connections
      fetchConnections();
    } catch (error) {
      console.error("Error deleting connection:", error);
      alert(`Failed to delete connection: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  // Function to handle successful connection
  const handleSuccess = (providerName: string) => {
    alert(`Successfully connected to ${providerName}`);
    fetchConnections();
  };

  // Function to handle connection error
  const handleError = (error: unknown) => {
    console.error("Connection error:", error);
    alert(`Failed to connect: ${error.message || "Unknown error"}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">External Integrations</h2>
        <button
          onClick={fetchConnections}
          disabled={isLoading}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-md hover:bg-slate-50"
        >
          <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-md flex items-center gap-2">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Integration Categories */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedProvider(null)}
          className={`px-3 py-1.5 text-sm rounded-md ${
            selectedProvider === null
              ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
              : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
          }`}
        >
          All
        </button>
        {['Google', 'Microsoft', 'Productivity', 'CRM'].map(category => (
          <button
            key={category}
            onClick={() => setSelectedProvider(category.toLowerCase())}
            className={`px-3 py-1.5 text-sm rounded-md ${
              selectedProvider === category.toLowerCase()
                ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 size={32} className="animate-spin text-indigo-600" />
          <span className="ml-2 text-slate-600">Loading connections...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {supportedIntegrations
            .filter(integration =>
              !selectedProvider ||
              integration.provider.includes(selectedProvider) ||
              integration.name.toLowerCase().includes(selectedProvider)
            )
            .map((integration) => {
              // Check if this integration is already connected
              const existingConnection = connections.find(
                (conn) => conn.provider_name === integration.provider
              );

              return (
                <div
                  key={integration.provider}
                  className="bg-white rounded-lg shadow-md p-4 border border-slate-200 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 flex items-center justify-center bg-slate-100 rounded-md">
                      <img
                        src={integration.icon}
                        alt={integration.name}
                        className="w-8 h-8"
                        onError={(e) => {
                          // If image fails to load, show the first letter of the name
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.parentElement!.innerText = integration.name[0];
                        }}
                      />
                    </div>
                    <div>
                      <h3 className="font-medium">{integration.name}</h3>
                      <p className="text-sm text-slate-500">{integration.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    {existingConnection ? (
                      <>
                        <div className="flex items-center gap-2">
                          <CheckCircle size={18} className="text-green-600" />
                          <span className="text-sm text-slate-700">Connected</span>
                        </div>
                        <button
                          onClick={() => handleDeleteConnection(existingConnection.connection_id)}
                          className="text-sm text-red-600 hover:text-red-800"
                        >
                          Disconnect
                        </button>
                      </>
                    ) : (
                      <NangoProvider publicKey={nangoPublicKey}>
                        <NangoButton
                          providerConfigKey={integration.provider}
                          connectionId={`atlas-erp-${integration.provider}`}
                          onSuccess={() => handleSuccess(integration.name)}
                          onError={handleError}
                          className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center justify-center gap-2"
                        >
                          <LinkIcon size={16} />
                          <span>Connect {integration.name}</span>
                        </NangoButton>
                      </NangoProvider>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {connections.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-medium mb-4">Active Connections</h3>
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Provider</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Connected On</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {connections.map((connection) => {
                  // Find the provider details
                  const provider = supportedIntegrations.find(p => p.provider === connection.provider_name);

                  return (
                    <tr key={connection.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {provider && (
                            <div className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-md">
                              <img
                                src={provider.icon}
                                alt={provider.name}
                                className="w-5 h-5"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  target.parentElement!.innerText = provider.name[0];
                                }}
                              />
                            </div>
                          )}
                          <div>
                            <div className="font-medium">{provider?.name || connection.provider_name}</div>
                            <div className="text-xs text-slate-500">ID: {connection.connection_id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {connection.status === "active" ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Active
                          </span>
                        ) : connection.status === "error" ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Error
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {new Date(connection.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDeleteConnection(connection.connection_id)}
                            className="text-sm text-red-600 hover:text-red-800"
                          >
                            Disconnect
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-6 p-4 bg-slate-50 rounded-md">
        <h3 className="text-sm font-medium mb-2">About Nango Integrations</h3>
        <p className="text-sm text-slate-600 mb-2">
          Atlas-ERP uses Nango to securely connect to external services. Your credentials are never stored in Atlas-ERP.
        </p>
        <a
          href="https://docs.nango.dev/integrations"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
        >
          <span>Learn more about Nango</span>
          <ExternalLink size={14} />
        </a>
      </div>
    </div>
  );
}
