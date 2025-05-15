"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { CheckCircle, XCircle, AlertCircle, RefreshCw, AlertTriangle, RotateCcw, Wifi, WifiOff } from "lucide-react";
import { ShineBorder } from "@/components/ui/shine-border";
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text";
import { MagicCard } from "@/components/magicui/magic-card";
import { Ripple } from "@/components/magicui/ripple";
import { useRateLimit } from "@/context/RateLimitContext";
import { initWebSocketClient, EventType, StatusUpdate } from "@/lib/socket-io-client";

interface ServiceStatus {
  name: string;
  status: "operational" | "degraded" | "down" | "unknown";
  lastChecked: Date;
  details?: string;
  responseTime?: number;
  recoveryAttempts?: number;
}

export default function EnhancedStatusPanelV2() {
  const [services, setServices] = useState<ServiceStatus[]>([
    { name: "SurrealDB", status: "unknown", lastChecked: new Date() },
    { name: "MinIO Storage", status: "unknown", lastChecked: new Date() },
    { name: "CopilotKit", status: "unknown", lastChecked: new Date() },
    { name: "LLM API", status: "unknown", lastChecked: new Date() },
    { name: "Temporal Cloud", status: "unknown", lastChecked: new Date() },
    { name: "ArangoDB", status: "unknown", lastChecked: new Date() },
  ]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(60000); // 1 minute
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);
  const { rateLimitOperation } = useRateLimit();
  const socketRef = useRef<any>(null);

  // Real functions to check service status
  const checkSurrealDBWithDetails = async (): Promise<{
    status: ServiceStatus["status"];
    message: string;
    responseTime: number;
  }> => {
    const startTime = performance.now();
    try {
      // Test the SurrealDB connection by making a simple query
      const response = await fetch('/api/health/surrealdb', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });

      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);

      if (response.ok) {
        const data = await response.json();
        return {
          status: data.status === 'connected' ? 'operational' : 'degraded',
          message: data.message || 'SurrealDB is operational',
          responseTime,
        };
      } else if (response.status >= 500) {
        return {
          status: 'down',
          message: `SurrealDB is down: ${response.statusText}`,
          responseTime,
        };
      } else {
        return {
          status: 'degraded',
          message: `SurrealDB is degraded: ${response.statusText}`,
          responseTime,
        };
      }
    } catch (error) {
      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);
      console.error('Error checking SurrealDB status:', error);
      return {
        status: 'down',
        message: `Error connecting to SurrealDB: ${error instanceof Error ? error.message : 'Unknown error'}`,
        responseTime,
      };
    }
  };

  // Similar functions for other services
  const checkMinIOWithDetails = async () => {
    const startTime = performance.now();
    try {
      const response = await fetch('/api/health/minio', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      });

      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);

      if (response.ok) {
        const data = await response.json();
        return {
          status: data.status === 'connected' ? 'operational' : 'degraded',
          message: data.message || 'MinIO is operational',
          responseTime,
        };
      } else {
        return {
          status: response.status >= 500 ? 'down' : 'degraded',
          message: `MinIO issue: ${response.statusText}`,
          responseTime,
        };
      }
    } catch (error) {
      const endTime = performance.now();
      return {
        status: 'down',
        message: `Error connecting to MinIO: ${error instanceof Error ? error.message : 'Unknown error'}`,
        responseTime: Math.round(endTime - startTime),
      };
    }
  };

  // Mock functions for services without health endpoints
  const checkCopilotKitWithDetails = async () => {
    const startTime = performance.now();
    // Simulate a check by making a simple request to the CopilotKit API
    try {
      const response = await fetch('/api/copilotkit', {
        method: 'HEAD',
        cache: 'no-store',
      });

      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);

      return {
        status: response.ok ? 'operational' : 'degraded',
        message: response.ok ? 'CopilotKit is operational' : `CopilotKit issue: ${response.statusText}`,
        responseTime,
      };
    } catch (error) {
      const endTime = performance.now();
      return {
        status: 'down',
        message: `Error connecting to CopilotKit: ${error instanceof Error ? error.message : 'Unknown error'}`,
        responseTime: Math.round(endTime - startTime),
      };
    }
  };

  const checkLLMAPIWithDetails = async () => {
    const startTime = performance.now();
    try {
      // Load LLM settings from local storage
      const llmSettings = typeof window !== 'undefined'
        ? JSON.parse(localStorage.getItem('llm-settings') || '{}')
        : {};

      // If no API key is configured, return a warning status
      if (!llmSettings.apiKey) {
        return {
          status: 'degraded',
          message: 'LLM API key not configured',
          responseTime: 0,
        };
      }

      // If provider requires API base but none is configured
      const requiresApiBase = ["ollama", "local", "azure"].includes((llmSettings.provider || '').toLowerCase());
      if (requiresApiBase && !llmSettings.apiBase) {
        return {
          status: 'degraded',
          message: `${llmSettings.provider} requires an API base URL`,
          responseTime: 0,
        };
      }

      // Test the LLM connection with a simple request
      const response = await fetch('/api/settings/llm', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: llmSettings.provider || 'openai',
          model: llmSettings.model || 'gpt-4o',
          apiKey: llmSettings.apiKey,
          apiBase: llmSettings.apiBase,
        }),
      });

      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          return {
            status: 'operational',
            message: `Connected to ${data.model || llmSettings.provider}`,
            responseTime: data.responseTime || responseTime,
          };
        } else {
          return {
            status: 'degraded',
            message: data.error || data.message || 'LLM API connection issue',
            responseTime,
          };
        }
      } else {
        // Handle specific HTTP status codes
        if (response.status === 401 || response.status === 403) {
          return {
            status: 'degraded',
            message: 'Invalid API key or authentication error',
            responseTime,
          };
        } else if (response.status === 429) {
          return {
            status: 'degraded',
            message: 'Rate limit exceeded for LLM API',
            responseTime,
          };
        } else if (response.status === 408 || response.status === 504) {
          return {
            status: 'degraded',
            message: 'LLM API request timed out',
            responseTime,
          };
        } else if (response.status >= 500) {
          return {
            status: 'down',
            message: `LLM API server error: ${response.statusText}`,
            responseTime,
          };
        } else {
          return {
            status: 'degraded',
            message: `LLM API issue: ${response.statusText}`,
            responseTime,
          };
        }
      }
    } catch (error) {
      const endTime = performance.now();
      return {
        status: 'down',
        message: `Error connecting to LLM API: ${error instanceof Error ? error.message : 'Unknown error'}`,
        responseTime: Math.round(endTime - startTime),
      };
    }
  };

  const checkTemporalCloudWithDetails = async () => {
    const startTime = performance.now();
    try {
      const response = await fetch('/api/health/temporal', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      });

      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);

      if (response.ok) {
        const data = await response.json();
        return {
          status: data.status === 'connected' ? 'operational' : 'degraded',
          message: data.message || 'Temporal is operational',
          responseTime,
        };
      } else {
        return {
          status: response.status >= 500 ? 'down' : 'degraded',
          message: `Temporal issue: ${response.statusText}`,
          responseTime,
        };
      }
    } catch (error) {
      const endTime = performance.now();
      return {
        status: 'down',
        message: `Error connecting to Temporal: ${error instanceof Error ? error.message : 'Unknown error'}`,
        responseTime: Math.round(endTime - startTime),
      };
    }
  };

  const checkArangoDBWithDetails = async () => {
    const startTime = performance.now();
    try {
      // Make a real check to the ArangoDB health endpoint
      const response = await fetch('/api/health/arangodb', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      });

      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);

      if (response.ok) {
        const data = await response.json();
        return {
          status: data.status === 'connected' ? 'operational' : 'degraded',
          message: data.message || 'ArangoDB is operational',
          responseTime,
        };
      } else {
        return {
          status: response.status >= 500 ? 'down' : 'degraded',
          message: `ArangoDB issue: ${response.statusText}`,
          responseTime,
        };
      }
    } catch (error) {
      const endTime = performance.now();
      return {
        status: 'down',
        message: `Error connecting to ArangoDB: ${error instanceof Error ? error.message : 'Unknown error'}`,
        responseTime: Math.round(endTime - startTime),
      };
    }
  };

  // Function to check service status with rate limiting
  const checkServiceStatus = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);

    try {
      // Check all services in parallel for better performance
      const [
        surrealResult,
        minioResult,
        copilotResult,
        llmResult,
        temporalResult,
        arangoResult
      ] = await Promise.allSettled([
        checkSurrealDBWithDetails(),
        checkMinIOWithDetails(),
        checkCopilotKitWithDetails(),
        checkLLMAPIWithDetails(),
        checkTemporalCloudWithDetails(),
        checkArangoDBWithDetails()
      ]);

      // Process results and update services
      const updatedServices: ServiceStatus[] = [];

      // Helper function to process results
      const processResult = (result: PromiseSettledResult<any>, serviceName: string): ServiceStatus => {
        const existingService = services.find(s => s.name === serviceName);
        const recoveryAttempts = existingService?.recoveryAttempts || 0;

        if (result.status === 'fulfilled') {
          return {
            name: serviceName,
            status: result.value.status,
            lastChecked: new Date(),
            details: result.value.message,
            responseTime: result.value.responseTime,
            recoveryAttempts: result.value.status === 'down' ? recoveryAttempts + 1 : 0,
          };
        } else {
          return {
            name: serviceName,
            status: 'down',
            lastChecked: new Date(),
            details: `Error: ${result.reason?.message || 'Unknown error'}`,
            recoveryAttempts: recoveryAttempts + 1,
          };
        }
      };

      // Process each service result
      updatedServices.push(processResult(surrealResult, 'SurrealDB'));
      updatedServices.push(processResult(minioResult, 'MinIO Storage'));
      updatedServices.push(processResult(copilotResult, 'CopilotKit'));
      updatedServices.push(processResult(llmResult, 'LLM API'));
      updatedServices.push(processResult(temporalResult, 'Temporal Cloud'));
      updatedServices.push(processResult(arangoResult, 'ArangoDB'));

      // Update services state
      setServices(updatedServices);
    } catch (error) {
      console.error("Error checking service status:", error);
      setError(`Failed to check services: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRefreshing(false);
    }
  }, [services]);

  // Rate-limited version of checkServiceStatus
  const handleRefresh = useCallback(() => {
    rateLimitOperation(checkServiceStatus, {
      delay: 3000, // 3 seconds minimum between refreshes
      onLimitReached: () => {
        // Show visual feedback when rate limited
        setError("Rate limited. Please wait before refreshing again.");
        setTimeout(() => {
          setError(null);
        }, 2000);
      }
    })();
  }, [checkServiceStatus, rateLimitOperation]);

  // Initialize WebSocket connection
  useEffect(() => {
    // Initialize WebSocket client
    socketRef.current = initWebSocketClient();

    // Set up event listeners
    socketRef.current.on('connect', () => {
      console.log('Connected to WebSocket server');
      setIsWebSocketConnected(true);
    });

    socketRef.current.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
      setIsWebSocketConnected(false);
    });

    // Listen for status updates
    socketRef.current.on(EventType.STATUS_UPDATE, (update: StatusUpdate) => {
      console.log('Received status update:', update);

      // Update the corresponding service
      setServices(prevServices => {
        return prevServices.map(service => {
          if (service.name === update.service) {
            return {
              ...service,
              status: update.status,
              details: update.message,
              responseTime: update.responseTime,
              lastChecked: new Date(),
            };
          }
          return service;
        });
      });
    });

    // Clean up on component unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Auto-refresh services based on the interval
  useEffect(() => {
    if (!autoRefresh) return;

    // Initial check
    checkServiceStatus();

    // If WebSocket is connected, we don't need to poll as frequently
    const effectiveInterval = isWebSocketConnected ? refreshInterval * 2 : refreshInterval;

    // Set up interval for auto-refresh
    const interval = setInterval(checkServiceStatus, effectiveInterval);

    // Clean up interval on component unmount
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, checkServiceStatus, isWebSocketConnected]);

  // Calculate overall status
  const overallStatus = services.every(s => s.status === 'operational')
    ? 'operational'
    : services.some(s => s.status === 'down')
      ? 'down'
      : 'degraded';

  // Format last checked time
  const formatLastChecked = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);

    if (diffSec < 60) return `${diffSec}s ago`;
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    return `${Math.floor(diffSec / 3600)}h ago`;
  };

  // Attempt recovery for down services
  const attemptRecovery = async (serviceName: string) => {
    // Find the service
    const serviceIndex = services.findIndex(s => s.name === serviceName);
    if (serviceIndex === -1) return;

    const service = services[serviceIndex];

    // Update recovery attempts
    const updatedService = {
      ...service,
      recoveryAttempts: (service.recoveryAttempts || 0) + 1,
      status: 'unknown' as const,
      details: 'Attempting recovery...',
    };

    // Update services state
    const updatedServices = [...services];
    updatedServices[serviceIndex] = updatedService;
    setServices(updatedServices);

    // Attempt to check the service again
    try {
      let result;
      switch (serviceName) {
        case 'SurrealDB':
          result = await checkSurrealDBWithDetails();
          break;
        case 'MinIO Storage':
          result = await checkMinIOWithDetails();
          break;
        case 'CopilotKit':
          result = await checkCopilotKitWithDetails();
          break;
        case 'LLM API':
          result = await checkLLMAPIWithDetails();
          break;
        case 'Temporal Cloud':
          result = await checkTemporalCloudWithDetails();
          break;
        case 'ArangoDB':
          result = await checkArangoDBWithDetails();
          break;
        default:
          throw new Error('Unknown service');
      }

      // Update service with result
      const recoveredService = {
        ...service,
        status: result.status,
        lastChecked: new Date(),
        details: result.message,
        responseTime: result.responseTime,
        recoveryAttempts: updatedService.recoveryAttempts,
      };

      // Update services state
      const finalServices = [...services];
      finalServices[serviceIndex] = recoveredService;
      setServices(finalServices);
    } catch (error) {
      // Update service with error
      const failedService = {
        ...service,
        status: 'down' as const,
        lastChecked: new Date(),
        details: `Recovery failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        recoveryAttempts: updatedService.recoveryAttempts,
      };

      // Update services state
      const finalServices = [...services];
      finalServices[serviceIndex] = failedService;
      setServices(finalServices);
    }
  };

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
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={() => setAutoRefresh(!autoRefresh)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                  <span className="ml-2 text-xs text-card-foreground/70">Auto</span>
                </label>
              </div>
              <div
                className="flex items-center gap-1 text-xs text-muted-foreground"
                title={isWebSocketConnected ? "Real-time updates enabled" : "Real-time updates disabled"}
              >
                {isWebSocketConnected ? (
                  <>
                    <Wifi size={14} className="text-green-500" />
                    <span className="sr-only md:not-sr-only">Real-time</span>
                  </>
                ) : (
                  <>
                    <WifiOff size={14} className="text-gray-400" />
                    <span className="sr-only md:not-sr-only">Polling</span>
                  </>
                )}
              </div>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 disabled:text-primary/40 transition-all duration-200 hover:scale-105"
                title={autoRefresh ? `Auto-refreshing every ${refreshInterval/1000} seconds` : "Manual refresh"}
              >
                <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
                <span className="sr-only">{isRefreshing ? "Checking..." : "Refresh"}</span>
              </button>
            </div>
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
                className="flex items-center justify-between p-2 rounded-md hover:bg-card-foreground/5 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="flex-shrink-0">
                    {getStatusIcon(service.status)}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{service.name}</div>
                    <div className="text-xs text-card-foreground/60">
                      {service.responseTime && `${service.responseTime}ms • `}
                      {service.details || `Status: ${service.status}`}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-1">
                    {service.status === 'down' && (
                      <button
                        onClick={() => attemptRecovery(service.name)}
                        className="p-1 text-primary hover:text-primary/80 rounded-full transition-colors"
                        title="Attempt recovery"
                      >
                        <RotateCcw size={14} />
                      </button>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      service.status === 'operational' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                      service.status === 'degraded' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300' :
                      service.status === 'down' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' :
                      'bg-gray-100 dark:bg-gray-800/50 text-gray-800 dark:text-gray-300'
                    }`}>
                      {service.status}
                    </span>
                  </div>
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
