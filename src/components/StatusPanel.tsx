"use client";

import { useState, useEffect } from "react";
import { CheckCircle, XCircle, AlertCircle, RefreshCw, AlertTriangle } from "lucide-react";

interface ServiceStatus {
  name: string;
  status: "operational" | "degraded" | "down" | "unknown";
  lastChecked: Date;
  details?: string;
}

export default function StatusPanel() {
  const [services, setServices] = useState<ServiceStatus[]>([
    { name: "SurrealDB", status: "unknown", lastChecked: new Date() },
    { name: "MinIO Storage", status: "unknown", lastChecked: new Date() },
    { name: "CopilotKit", status: "unknown", lastChecked: new Date() },
    { name: "LLM API", status: "unknown", lastChecked: new Date() },
    { name: "Temporal Cloud", status: "unknown", lastChecked: new Date() },
  ]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to check service status
  const checkServiceStatus = async () => {
    setIsRefreshing(true);
    setError(null);

    try {
      // Check all services in parallel for better performance
      const [
        surrealResult,
        minioResult,
        copilotResult,
        llmResult,
        temporalResult
      ] = await Promise.allSettled([
        checkSurrealDBWithDetails(),
        checkMinIOWithDetails(),
        checkCopilotKitWithDetails(),
        checkLLMAPIWithDetails(),
        checkTemporalCloudWithDetails()
      ]);

      // Process results and update services state
      const updatedServices: ServiceStatus[] = [];

      // Helper function to process results
      const processResult = (
        result: PromiseSettledResult<{ status: ServiceStatus["status"], details?: string }>,
        name: string
      ): ServiceStatus => {
        if (result.status === 'fulfilled') {
          return {
            name,
            status: result.value.status,
            details: result.value.details,
            lastChecked: new Date()
          };
        } else {
          console.error(`Error checking ${name} status:`, result.reason);
          return {
            name,
            status: 'down',
            details: `Error: ${result.reason.message || 'Unknown error'}`,
            lastChecked: new Date()
          };
        }
      };

      // Process each service result
      updatedServices.push(processResult(surrealResult, 'SurrealDB'));
      updatedServices.push(processResult(minioResult, 'MinIO Storage'));
      updatedServices.push(processResult(copilotResult, 'CopilotKit'));
      updatedServices.push(processResult(llmResult, 'LLM API'));
      updatedServices.push(processResult(temporalResult, 'Temporal Cloud'));

      // Update services state
      setServices(updatedServices);
    } catch (error) {
      console.error("Error checking service status:", error);
      setError(`Failed to check services: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Enhanced check functions that return both status and details
  const checkSurrealDBWithDetails = async () => {
    const status = await checkSurrealDB();
    let details = '';

    switch (status) {
      case 'operational':
        details = 'Connected to database';
        break;
      case 'degraded':
        details = 'Connected but with performance issues';
        break;
      case 'down':
        details = 'Unable to connect to database';
        break;
      default:
        details = 'Status unknown';
    }

    return { status, details };
  };

  const checkMinIOWithDetails = async () => {
    const status = await checkMinIO();
    let details = '';

    switch (status) {
      case 'operational':
        details = 'Storage service available';
        break;
      case 'degraded':
        details = 'Storage available with limited functionality';
        break;
      case 'down':
        details = 'Storage service unavailable';
        break;
      default:
        details = 'Status unknown';
    }

    return { status, details };
  };

  const checkCopilotKitWithDetails = async () => {
    const status = await checkCopilotKit();
    let details = '';

    switch (status) {
      case 'operational':
        details = 'AI assistant ready';
        break;
      case 'degraded':
        details = 'AI assistant available with limited functionality';
        break;
      case 'down':
        details = 'AI assistant unavailable';
        break;
      default:
        details = 'Status unknown';
    }

    return { status, details };
  };

  const checkLLMAPIWithDetails = async () => {
    const status = await checkLLMAPI();
    let details = '';

    switch (status) {
      case 'operational':
        details = 'Language model API connected';
        break;
      case 'degraded':
        details = 'Language model API responding with issues';
        break;
      case 'down':
        details = 'Language model API unavailable';
        break;
      default:
        details = 'Status unknown';
    }

    return { status, details };
  };

  const checkTemporalCloudWithDetails = async () => {
    const status = await checkTemporalCloud();
    let details = '';

    switch (status) {
      case 'operational':
        details = 'Workflow service running';
        break;
      case 'degraded':
        details = 'Workflow service running with issues';
        break;
      case 'down':
        details = 'Workflow service unavailable';
        break;
      default:
        details = 'Status unknown';
    }

    return { status, details };
  };

  // Real functions to check service status
  const checkSurrealDB = async (): Promise<ServiceStatus["status"]> => {
    try {
      // Test the SurrealDB connection by making a simple query
      const response = await fetch('/api/health/surrealdb', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });

      if (response.ok) {
        const data = await response.json();
        return data.status === 'connected' ? 'operational' : 'degraded';
      } else if (response.status >= 500) {
        return 'down';
      } else {
        return 'degraded';
      }
    } catch (error) {
      console.error('Error checking SurrealDB status:', error);
      return 'down';
    }
  };

  const checkMinIO = async (): Promise<ServiceStatus["status"]> => {
    try {
      // Test the MinIO connection by checking the health endpoint
      const response = await fetch('/api/health/minio', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });

      if (response.ok) {
        const data = await response.json();
        return data.status === 'connected' ? 'operational' : 'degraded';
      } else if (response.status >= 500) {
        return 'down';
      } else {
        return 'degraded';
      }
    } catch (error) {
      console.error('Error checking MinIO status:', error);
      return 'down';
    }
  };

  const checkCopilotKit = async (): Promise<ServiceStatus["status"]> => {
    try {
      // Test the CopilotKit API endpoint with a simple request
      const response = await fetch("/api/copilotkit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `
            query {
              __typename
            }
          `
        }),
        cache: 'no-store',
      });

      if (response.ok) {
        return "operational";
      } else if (response.status >= 500) {
        return "down";
      } else {
        return "degraded";
      }
    } catch (error) {
      console.error("Error checking CopilotKit status:", error);
      return "down";
    }
  };

  const checkLLMAPI = async (): Promise<ServiceStatus["status"]> => {
    try {
      // Test the LLM API through the settings endpoint
      const response = await fetch("/api/settings/llm", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: 'no-store',
      });

      if (response.ok) {
        const data = await response.json();
        // Check if we have a valid provider and model
        if (data.provider && data.model) {
          return "operational";
        } else {
          return "degraded";
        }
      } else if (response.status >= 500) {
        return "down";
      } else {
        return "degraded";
      }
    } catch (error) {
      console.error("Error checking LLM API status:", error);
      return "down";
    }
  };

  const checkTemporalCloud = async (): Promise<ServiceStatus["status"]> => {
    try {
      // Test the Temporal Cloud connection
      const response = await fetch('/api/health/temporal', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });

      if (response.ok) {
        const data = await response.json();
        return data.status === 'connected' ? 'operational' : 'degraded';
      } else if (response.status >= 500) {
        return 'down';
      } else {
        return 'degraded';
      }
    } catch (error) {
      console.error('Error checking Temporal Cloud status:', error);
      return 'down';
    }
  };

  // Check service status on component mount
  useEffect(() => {
    checkServiceStatus();

    // Set up interval to check status every 5 minutes
    const interval = setInterval(checkServiceStatus, 5 * 60 * 1000);

    // Clean up interval on component unmount
    return () => clearInterval(interval);
  }, []);

  // Helper function to render status icon
  const getStatusIcon = (status: ServiceStatus["status"]) => {
    switch (status) {
      case "operational":
        return <CheckCircle className="text-green-500" size={18} />;
      case "degraded":
        return <AlertCircle className="text-amber-500" size={18} />;
      case "down":
        return <XCircle className="text-red-500" size={18} />;
      default:
        return <AlertCircle className="text-gray-400" size={18} />;
    }
  };

  // Helper function to format last checked time
  const formatLastChecked = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">System Status</h2>
        <button
          onClick={checkServiceStatus}
          disabled={isRefreshing}
          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 disabled:text-blue-300"
        >
          <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
          <span>{isRefreshing ? "Checking..." : "Refresh"}</span>
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md flex items-center gap-2">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-2">
        {services.map((service) => (
          <div
            key={service.name}
            className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
          >
            <div className="flex items-center gap-2">
              {getStatusIcon(service.status)}
              <div>
                <span className="font-medium">{service.name}</span>
                {service.details && (
                  <p className="text-xs text-gray-500 mt-0.5">{service.details}</p>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                service.status === 'operational' ? 'bg-green-100 text-green-800' :
                service.status === 'degraded' ? 'bg-amber-100 text-amber-800' :
                service.status === 'down' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {service.status}
              </span>
              <span className="text-xs text-gray-500 mt-1">
                {formatLastChecked(service.lastChecked)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
