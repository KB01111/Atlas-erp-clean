"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { CheckCircle, XCircle, AlertCircle, RefreshCw, AlertTriangle, RotateCcw, Wifi, WifiOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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

interface StatusPanelProps {
  className?: string;
  showRefreshButton?: boolean;
}

export default function StatusPanel({
  className = "",
  showRefreshButton = true,
}: StatusPanelProps) {
  const [services, setServices] = useState<ServiceStatus[]>([
    { name: "SurrealDB", status: "unknown", lastChecked: new Date() },
    { name: "MinIO", status: "unknown", lastChecked: new Date() },
    { name: "CopilotKit", status: "unknown", lastChecked: new Date() },
    { name: "LLM API", status: "unknown", lastChecked: new Date() },
    { name: "Temporal", status: "unknown", lastChecked: new Date() },
    { name: "ArangoDB", status: "unknown", lastChecked: new Date() },
  ]);
  const [overallStatus, setOverallStatus] = useState<"operational" | "degraded" | "down" | "unknown">("unknown");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);
  const socketRef = useRef<any>(null);
  const { throttle } = useRateLimit();

  // Function to get the overall status based on individual service statuses
  const calculateOverallStatus = useCallback((serviceList: ServiceStatus[]) => {
    if (serviceList.some(service => service.status === "down")) {
      return "down";
    } else if (serviceList.some(service => service.status === "degraded")) {
      return "degraded";
    } else if (serviceList.every(service => service.status === "operational")) {
      return "operational";
    } else {
      return "unknown";
    }
  }, []);

  // Function to get the appropriate icon based on status
  const getStatusIcon = (status: "operational" | "degraded" | "down" | "unknown") => {
    switch (status) {
      case "operational":
        return <CheckCircle className="text-green-500 dark:text-green-400" size={16} />;
      case "degraded":
        return <AlertTriangle className="text-yellow-500 dark:text-yellow-400" size={16} />;
      case "down":
        return <XCircle className="text-red-500 dark:text-red-400" size={16} />;
      default:
        return <AlertCircle className="text-gray-400" size={16} />;
    }
  };

  // Function to get the appropriate badge based on status
  const getStatusBadge = (status: "operational" | "degraded" | "down" | "unknown") => {
    switch (status) {
      case "operational":
        return <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800">Operational</Badge>;
      case "degraded":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800">Degraded</Badge>;
      case "down":
        return <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800">Down</Badge>;
      default:
        return <Badge variant="outline" className="bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200 dark:border-gray-800">Unknown</Badge>;
    }
  };

  // Function to check SurrealDB status
  const checkSurrealDBWithDetails = async () => {
    const startTime = performance.now();
    try {
      const response = await fetch('/api/health/surrealdb');
      const endTime = performance.now();
      
      if (!response.ok) {
        return {
          status: 'degraded',
          message: `SurrealDB responded with status ${response.status}`,
          responseTime: Math.round(endTime - startTime),
        };
      }
      
      const data = await response.json();
      return {
        status: data.status === 'connected' ? 'operational' : 'degraded',
        message: data.message || 'Connected to SurrealDB',
        responseTime: Math.round(endTime - startTime),
      };
    } catch (error) {
      const endTime = performance.now();
      return {
        status: 'down',
        message: `Error connecting to SurrealDB: ${error instanceof Error ? error.message : 'Unknown error'}`,
        responseTime: Math.round(endTime - startTime),
      };
    }
  };

  // Similar functions for other services would be implemented here
  // For brevity, we'll use a simplified version that returns mock data

  // Function to check service status with rate limiting
  const checkServiceStatus = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);

    try {
      // In a real implementation, we would check all services
      // For now, we'll simulate with random statuses
      const updatedServices = services.map(service => {
        const randomStatus = Math.random();
        let status: "operational" | "degraded" | "down" | "unknown";
        
        if (randomStatus > 0.8) {
          status = "operational";
        } else if (randomStatus > 0.6) {
          status = "degraded";
        } else if (randomStatus > 0.4) {
          status = "down";
        } else {
          status = "unknown";
        }
        
        return {
          ...service,
          status,
          lastChecked: new Date(),
          responseTime: Math.floor(Math.random() * 200) + 50,
          details: `Status checked at ${new Date().toLocaleTimeString()}`
        };
      });

      setServices(updatedServices);
      setOverallStatus(calculateOverallStatus(updatedServices));
    } catch (error) {
      setError(`Failed to check service status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRefreshing(false);
    }
  }, [services, calculateOverallStatus]);

  // Function to attempt recovery for a service
  const attemptRecovery = useCallback((serviceName: string) => {
    setServices(prev => prev.map(service => 
      service.name === serviceName 
        ? { 
            ...service, 
            status: "unknown", 
            details: "Attempting recovery...",
            recoveryAttempts: (service.recoveryAttempts || 0) + 1
          }
        : service
    ));

    // Simulate recovery attempt
    setTimeout(() => {
      setServices(prev => prev.map(service => 
        service.name === serviceName 
          ? { 
              ...service, 
              status: Math.random() > 0.5 ? "operational" : "degraded", 
              details: Math.random() > 0.5 
                ? "Recovery successful" 
                : "Partial recovery - some features may be limited",
              lastChecked: new Date()
            }
          : service
      ));
    }, 2000);
  }, []);

  // Initialize WebSocket connection
  useEffect(() => {
    const initSocket = async () => {
      try {
        socketRef.current = await initWebSocketClient();
        setIsWebSocketConnected(true);

        // Listen for status updates
        socketRef.current.on(EventType.STATUS_UPDATE, (update: StatusUpdate) => {
          setServices(prev => prev.map(service => 
            service.name === update.service 
              ? { 
                  ...service, 
                  status: update.status, 
                  details: update.details,
                  responseTime: update.responseTime,
                  lastChecked: new Date(update.timestamp)
                }
              : service
          ));
        });
      } catch (error) {
        console.error('Failed to initialize WebSocket client:', error);
        setIsWebSocketConnected(false);
      }
    };

    initSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Check service status on component mount
  useEffect(() => {
    checkServiceStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Card className={`h-full ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon(overallStatus)}
            <CardTitle className="text-lg">System Status</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {isWebSocketConnected ? (
              <Wifi className="text-green-500 dark:text-green-400" size={14} />
            ) : (
              <WifiOff className="text-red-500 dark:text-red-400" size={14} />
            )}
            {showRefreshButton && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8" 
                      onClick={() => throttle('status-refresh', checkServiceStatus, 3000)}
                      disabled={isRefreshing}
                    >
                      <RefreshCw 
                        size={14} 
                        className={isRefreshing ? "animate-spin" : ""} 
                      />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Refresh status</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
        <div className="mt-1">
          {getStatusBadge(overallStatus)}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
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
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => attemptRecovery(service.name)}
                          >
                            <RotateCcw size={12} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Attempt recovery</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
