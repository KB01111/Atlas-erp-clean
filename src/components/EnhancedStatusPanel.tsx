"use client";

import { useState, useEffect } from "react";
import { CheckCircle, XCircle, AlertCircle, RefreshCw, AlertTriangle } from "lucide-react";
import { ShineBorder } from "@/components/ui/shine-border";
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text";
import { MagicCard } from "@/components/magicui/magic-card";
import { Ripple } from "@/components/magicui/ripple";

interface ServiceStatus {
  name: string;
  status: "operational" | "degraded" | "down" | "unknown";
  lastChecked: Date;
  details?: string;
}

export default function EnhancedStatusPanel() {
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
        details = 'Storage service available with limited functionality';
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
        details = 'Language model API ready';
        break;
      case 'degraded':
        details = 'Language model API available with limited functionality';
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
        details = 'Workflow orchestration ready';
        break;
      case 'degraded':
        details = 'Workflow orchestration available with limited functionality';
        break;
      case 'down':
        details = 'Workflow orchestration unavailable';
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
      // Test the MinIO connection by making a simple request
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

  // Helper function to format the last checked time
  const formatLastChecked = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) {
      return "just now";
    } else if (diffInMinutes === 1) {
      return "1 minute ago";
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`;
    } else if (diffInMinutes < 120) {
      return "1 hour ago";
    } else {
      return `${Math.floor(diffInMinutes / 60)} hours ago`;
    }
  };

  // Get the overall system status
  const getOverallStatus = (): ServiceStatus["status"] => {
    if (services.some(service => service.status === "down")) {
      return "down";
    } else if (services.some(service => service.status === "degraded")) {
      return "degraded";
    } else if (services.every(service => service.status === "operational")) {
      return "operational";
    } else {
      return "unknown";
    }
  };

  const overallStatus = getOverallStatus();

  return (
    <div className="relative group transition-all duration-300 hover:scale-[1.01] h-full">
      <MagicCard
        className="rounded-xl overflow-hidden h-full"
        focus
        glare
        glareSize={0.3}
        glareOpacity={0.2}
        glarePosition="all"
        glareColor={
          overallStatus === 'operational' ? 'rgba(34, 197, 94, 0.6)' :
          overallStatus === 'degraded' ? 'rgba(245, 158, 11, 0.6)' :
          overallStatus === 'down' ? 'rgba(239, 68, 68, 0.6)' :
          'rgba(156, 163, 175, 0.6)'
        }
        glareBorderRadius="0.75rem"
      >
        <div className="bg-card rounded-xl shadow-sm p-4 h-full">
          <div className="flex items-center justify-between mb-4 relative">
            <div className="flex items-center gap-2">
              {getStatusIcon(overallStatus)}
              <AnimatedGradientText
                text="System Status"
                className="text-lg font-semibold"
                gradient={
                  overallStatus === 'operational' ? 'linear-gradient(to right, #22c55e, #16a34a)' :
                  overallStatus === 'degraded' ? 'linear-gradient(to right, #f59e0b, #d97706)' :
                  overallStatus === 'down' ? 'linear-gradient(to right, #ef4444, #dc2626)' :
                  'linear-gradient(to right, #9ca3af, #6b7280)'
                }
              />
              {overallStatus === 'operational' && (
                <div className="absolute left-0 -z-10">
                  <Ripple
                    className="opacity-20"
                    mainCircleSize={100}
                    numCircles={3}
                  />
                </div>
              )}
            </div>
            <button
              onClick={checkServiceStatus}
              disabled={isRefreshing}
              className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 disabled:text-primary/40 transition-all duration-200 hover:scale-105"
            >
              <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
              <span>{isRefreshing ? "Checking..." : "Refresh"}</span>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-md flex items-center gap-2">
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-3">
            {services.map((service) => (
              <div
                key={service.name}
                className="flex items-center justify-between py-2 border-b border-border last:border-0 transition-all duration-200 hover:bg-muted/50 rounded-md px-2"
              >
                <div className="flex items-center gap-2">
                  {getStatusIcon(service.status)}
                  <div>
                    <span className="font-medium text-card-foreground">{service.name}</span>
                    {service.details && (
                      <p className="text-xs text-card-foreground/60 mt-0.5">{service.details}</p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    service.status === 'operational' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                    service.status === 'degraded' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300' :
                    service.status === 'down' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' :
                    'bg-gray-100 dark:bg-gray-800/50 text-gray-800 dark:text-gray-300'
                  }`}>
                    {service.status}
                  </span>
                  <span className="text-xs text-card-foreground/60 mt-1">
                    {formatLastChecked(service.lastChecked)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </MagicCard>
    </div>
  );
}
