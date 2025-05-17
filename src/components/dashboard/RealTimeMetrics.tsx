"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useCopilotReadable, useCopilotAction } from "@copilotkit/react-core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Activity, Server, Database, FileText, Users, Bot, Workflow,
  RefreshCw, Wifi, WifiOff, Filter, Download, BarChart, Settings,
  AlertCircle, CheckCircle, Clock, ChevronDown, ChevronUp,
  Zap, Gauge, Cpu, HardDrive, MessageSquare, Calendar,
  MemoryStick // Use MemoryStick instead of Memory which is not exported
} from 'lucide-react';
import { initWebSocketClient, EventType, MetricsUpdate } from '@/lib/socket-io-client';
import { useRateLimit } from "@/context/RateLimitContext";
import { usePerformanceOptimization } from "@/hooks/usePerformanceOptimization";

interface RealTimeMetricsProps {
  className?: string;
  refreshInterval?: number; // in milliseconds
  showFilters?: boolean;
  showExport?: boolean;
  showSettings?: boolean;
  maxItems?: number;
  showHeader?: boolean;
  compact?: boolean;
}

interface Metric {
  id: string;
  name: string;
  value: number;
  previousValue: number;
  unit: string;
  icon: React.ReactNode;
  color: string;
  category?: 'system' | 'usage' | 'performance';
  description?: string;
}

export default function RealTimeMetrics({
  className = '',
  refreshInterval = 5000, // 5 seconds by default
  showFilters = false,
  showExport = false,
  showSettings = false,
  maxItems = 8,
  showHeader = true,
  compact = false,
}: RealTimeMetricsProps) {
  const [metrics, setMetrics] = useState<Metric[]>([
    {
      id: 'cpu',
      name: 'CPU Usage',
      value: 0,
      previousValue: 0,
      unit: '%',
      icon: <Server size={20} />,
      color: 'bg-blue-500',
      category: 'system',
      description: 'Current CPU usage across all cores',
    },
    {
      id: 'memory',
      name: 'Memory Usage',
      value: 0,
      previousValue: 0,
      unit: '%',
      icon: <Activity size={20} />,
      color: 'bg-purple-500',
      category: 'system',
      description: 'Current memory usage as percentage of total available memory',
    },
    {
      id: 'storage',
      name: 'Storage Usage',
      value: 0,
      previousValue: 0,
      unit: '%',
      icon: <Database size={20} />,
      color: 'bg-amber-500',
      category: 'system',
      description: 'Current storage usage as percentage of total available storage',
    },
    {
      id: 'documents',
      name: 'Documents',
      value: 0,
      previousValue: 0,
      unit: '',
      icon: <FileText size={20} />,
      color: 'bg-green-500',
      category: 'usage',
      description: 'Total number of documents in the system',
    },
    {
      id: 'users',
      name: 'Active Users',
      value: 0,
      previousValue: 0,
      unit: '',
      icon: <Users size={20} />,
      color: 'bg-red-500',
      category: 'usage',
      description: 'Number of users currently active in the system',
    },
    {
      id: 'agents',
      name: 'Agent Executions',
      value: 0,
      previousValue: 0,
      unit: '',
      icon: <Bot size={20} />,
      color: 'bg-indigo-500',
      category: 'performance',
      description: 'Number of AI agent executions in the last hour',
    },
    {
      id: 'workflows',
      name: 'Workflow Runs',
      value: 0,
      previousValue: 0,
      unit: '',
      icon: <Workflow size={20} />,
      color: 'bg-pink-500',
      category: 'performance',
      description: 'Number of workflow executions in the last hour',
    },
    {
      id: 'response_time',
      name: 'Avg Response Time',
      value: 0,
      previousValue: 0,
      unit: 'ms',
      icon: <Clock size={20} />,
      color: 'bg-cyan-500',
      category: 'performance',
      description: 'Average API response time in milliseconds',
    },
  ]);

  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isWebSocketConnected, setIsWebSocketConnected] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'system' | 'usage' | 'performance'>('all');
  const [error, setError] = useState<string | null>(null);
  const [showTooltip, setShowTooltip] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<boolean>(!compact);
  const socketRef = useRef<any>(null);
  const { throttle } = useRateLimit();
  const { isLowEndDevice } = usePerformanceOptimization();
  const containerRef = useRef<HTMLDivElement>(null);

  // Make metrics readable by CopilotKit
  useCopilotReadable({
    name: "real_time_metrics",
    description: "Real-time system and application metrics",
    value: {
      metrics: metrics.map(m => ({
        id: m.id,
        name: m.name,
        value: m.value,
        unit: m.unit,
        category: m.category,
      })),
      lastUpdated: lastUpdated.toISOString(),
      isWebSocketConnected,
      selectedCategory,
    },
  });

  // Register the refresh action with CopilotKit
  useCopilotAction({
    name: "refresh_metrics",
    description: "Refresh the real-time metrics data",
    parameters: [],
    handler: async () => {
      await fetchMetrics();
      return "Metrics refreshed successfully";
    },
  });

  // Register the export action with CopilotKit
  useCopilotAction({
    name: "export_metrics",
    description: "Export the metrics data as JSON",
    parameters: [],
    handler: async () => {
      exportMetrics();
      return "Metrics exported successfully";
    },
  });

  // Function to fetch metrics
  const fetchMetrics = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // In a real implementation, you would fetch metrics from an API
      // For now, we'll simulate random changes with throttling
      await throttle('metrics-refresh', async () => {
        // Add a subtle animation to the container when refreshing
        if (containerRef.current) {
          containerRef.current.classList.add('pulse-subtle');
          setTimeout(() => {
            if (containerRef.current) {
              containerRef.current.classList.remove('pulse-subtle');
            }
          }, 500);
        }

        setMetrics(prevMetrics => prevMetrics.map(metric => {
          // Store previous value
          const previousValue = metric.value;

          // Generate a new random value with some trend continuity
          // (values tend to change in the same direction as before)
          let newValue: number;
          const trend = Math.random() > 0.3; // 70% chance to continue trend
          const prevTrend = metric.value > metric.previousValue;
          const followTrend = trend ? prevTrend : !prevTrend;

          // Base change amount
          let changeAmount = 0;

          if (metric.id === 'cpu' || metric.id === 'memory' || metric.id === 'storage') {
            // For percentage metrics, change by 5-15%
            changeAmount = Math.floor(Math.random() * 10) + 5;
            // Ensure value stays between 10% and 90%
            newValue = Math.min(Math.max(
              followTrend ? metric.value + changeAmount : metric.value - changeAmount,
              10), 90);
          } else if (metric.id === 'documents') {
            // For documents, change by 10-50
            changeAmount = Math.floor(Math.random() * 40) + 10;
            // Ensure value stays between 100 and 500
            newValue = Math.min(Math.max(
              followTrend ? metric.value + changeAmount : metric.value - changeAmount,
              100), 500);
          } else if (metric.id === 'users') {
            // For users, change by 1-3
            changeAmount = Math.floor(Math.random() * 3) + 1;
            // Ensure value stays between 1 and 20
            newValue = Math.min(Math.max(
              followTrend ? metric.value + changeAmount : metric.value - changeAmount,
              1), 20);
          } else if (metric.id === 'agents') {
            // For agent executions, change by 2-10
            changeAmount = Math.floor(Math.random() * 8) + 2;
            // Ensure value stays between 0 and 50
            newValue = Math.min(Math.max(
              followTrend ? metric.value + changeAmount : metric.value - changeAmount,
              0), 50);
          } else if (metric.id === 'workflows') {
            // For workflow runs, change by 1-5
            changeAmount = Math.floor(Math.random() * 4) + 1;
            // Ensure value stays between 0 and 30
            newValue = Math.min(Math.max(
              followTrend ? metric.value + changeAmount : metric.value - changeAmount,
              0), 30);
          } else if (metric.id === 'response_time') {
            // For response time, change by 10-50 ms
            changeAmount = Math.floor(Math.random() * 40) + 10;
            // Ensure value stays between 50 and 500 ms
            newValue = Math.min(Math.max(
              followTrend ? metric.value + changeAmount : metric.value - changeAmount,
              50), 500);
          } else {
            // Default case
            changeAmount = Math.floor(Math.random() * 10) + 1;
            newValue = Math.min(Math.max(
              followTrend ? metric.value + changeAmount : metric.value - changeAmount,
              0), 100);
          }

          return {
            ...metric,
            value: newValue,
            previousValue,
          };
        }));
      }, isLowEndDevice ? 5000 : 3000); // Longer throttle for low-end devices

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching metrics:', error);
      setError('Failed to fetch metrics. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [throttle, isLowEndDevice]);

  // Initialize WebSocket connection
  useEffect(() => {
    // Initialize WebSocket client
    try {
      socketRef.current = initWebSocketClient();

      // Set up event listeners
      socketRef.current.on('connect', () => {
        console.log('Connected to WebSocket server for metrics');
        setIsWebSocketConnected(true);
        setError(null);
      });

      socketRef.current.on('disconnect', () => {
        console.log('Disconnected from WebSocket server for metrics');
        setIsWebSocketConnected(false);
      });

      socketRef.current.on('connect_error', (err: Error) => {
        console.error('WebSocket connection error:', err);
        setIsWebSocketConnected(false);
        // Don't set error here to avoid showing error messages for connection issues
        // as we'll fall back to polling
      });

      // Listen for metrics updates
      socketRef.current.on(EventType.METRICS_UPDATE, (update: MetricsUpdate) => {
        console.log('Received metrics update:', update);

        // Update the corresponding metric
        setMetrics(prevMetrics => {
          return prevMetrics.map(metric => {
            if (metric.id === update.id) {
              return {
                ...metric,
                value: update.value,
                previousValue: metric.value, // Store current value as previous
              };
            }
            return metric;
          });
        });

        setLastUpdated(new Date(update.timestamp));
      });
    } catch (error) {
      console.error('Failed to initialize WebSocket client:', error);
      setIsWebSocketConnected(false);
    }

    // Clean up on component unmount
    return () => {
      if (socketRef.current) {
        try {
          socketRef.current.disconnect();
        } catch (error) {
          console.error('Error disconnecting WebSocket:', error);
        }
      }
    };
  }, []);

  // Export metrics data as JSON
  const exportMetrics = useCallback(() => {
    try {
      const dataStr = JSON.stringify({
        metrics: metrics.map(m => ({
          id: m.id,
          name: m.name,
          value: m.value,
          unit: m.unit,
          category: m.category,
          timestamp: new Date().toISOString(),
        })),
        timestamp: new Date().toISOString(),
      }, null, 2);

      const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;

      const exportFileDefaultName = `atlas-erp-metrics-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;

      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    } catch (error) {
      console.error('Error exporting metrics:', error);
      setError('Failed to export metrics');
    }
  }, [metrics]);

  // Filter metrics by category
  const filteredMetrics = selectedCategory === 'all'
    ? metrics
    : metrics.filter(metric => metric.category === selectedCategory);

  // Fetch metrics on component mount and at regular intervals
  useEffect(() => {
    // Fetch metrics immediately
    fetchMetrics();

    // If WebSocket is connected, we don't need to poll as frequently
    const effectiveInterval = isWebSocketConnected ? refreshInterval * 2 : refreshInterval;

    // Set up interval for regular updates
    const intervalId = setInterval(fetchMetrics, effectiveInterval);

    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [refreshInterval, isWebSocketConnected, fetchMetrics]);

  // Format the last updated time
  const formatLastUpdated = () => {
    return lastUpdated.toLocaleTimeString();
  };

  // Calculate the change percentage
  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  // Handle tooltip display
  const handleMouseEnter = (metricId: string) => {
    setShowTooltip(metricId);
  };

  const handleMouseLeave = () => {
    setShowTooltip(null);
  };

  // Toggle expanded state
  const toggleExpanded = useCallback(() => {
    setExpanded(prev => !prev);
  }, []);

  // Get icon for metric
  const getMetricIcon = useCallback((metricId: string) => {
    switch (metricId) {
      case 'cpu':
        return <Cpu size={18} />;
      case 'memory':
        return <MemoryStick size={18} />; // Using MemoryStick instead of Memory
      case 'storage':
        return <HardDrive size={18} />;
      case 'documents':
        return <FileText size={18} />;
      case 'users':
        return <Users size={18} />;
      case 'agents':
        return <Bot size={18} />;
      case 'workflows':
        return <Workflow size={18} />;
      case 'response_time':
        return <Gauge size={18} />;
      default:
        return <Activity size={18} />;
    }
  }, []);

  return (
    <Card className={`${className}`} ref={containerRef}>
      {showHeader && (
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">
                Real-Time Metrics
              </CardTitle>
              {isWebSocketConnected ? (
                <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                  <Wifi className="mr-1" size={12} />
                  Live
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                  <Clock className="mr-1" size={12} />
                  Polling
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              {showFilters && (
                <Select
                  value={selectedCategory}
                  onValueChange={(value) => setSelectedCategory(value as any)}
                >
                  <SelectTrigger className="w-[130px] h-8">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                    <SelectItem value="usage">Usage</SelectItem>
                    <SelectItem value="performance">Performance</SelectItem>
                  </SelectContent>
                </Select>
              )}

              {compact && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={toggleExpanded}
                >
                  {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </Button>
              )}

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => fetchMetrics()}
                disabled={isLoading}
              >
                <RefreshCw
                  size={14}
                  className={isLoading ? "animate-spin" : ""}
                />
              </Button>

              {showExport && (
                <Button variant="outline" size="sm" className="h-8" onClick={exportMetrics}>
                  <Download size={14} className="mr-1" />
                  Export
                </Button>
              )}

              {showSettings && (
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Settings size={14} />
                </Button>
              )}
            </div>
          </div>

          <div className="text-xs text-muted-foreground mt-1">
            Last updated: {formatLastUpdated()}
          </div>
        </CardHeader>
      )}

      <CardContent className={compact ? "p-3" : "pt-0"}>
        {error && (
          <div className="bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400 p-3 rounded-md mb-4 text-sm">
            <AlertCircle className="inline-block mr-2" size={14} />
            {error}
          </div>
        )}

        {expanded ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-4">
            {filteredMetrics.slice(0, maxItems).map((metric) => (
              <div
                key={metric.id}
                className="bg-card border rounded-lg p-4 hover:shadow-sm transition-shadow"
                onMouseEnter={() => handleMouseEnter(metric.id)}
                onMouseLeave={handleMouseLeave}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`${metric.color} p-2 rounded-full`}>
                      {getMetricIcon(metric.id)}
                    </div>
                    <div className="font-medium">{metric.name}</div>
                  </div>
                  {metric.previousValue > 0 && (
                    <div className={`${
                      calculateChange(metric.value, metric.previousValue) > 0
                        ? 'text-green-500'
                        : calculateChange(metric.value, metric.previousValue) < 0
                          ? 'text-red-500'
                          : 'text-gray-500'
                    }`}>
                      {calculateChange(metric.value, metric.previousValue) > 0 ? (
                        <ChevronUp size={16} />
                      ) : calculateChange(metric.value, metric.previousValue) < 0 ? (
                        <ChevronDown size={16} />
                      ) : (
                        <span>—</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-2">
                  <div className="flex items-end justify-between mb-1">
                    <span className="text-2xl font-bold">
                      {metric.value}
                      <span className="text-sm ml-1 font-normal text-muted-foreground">
                        {metric.unit}
                      </span>
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {metric.category}
                    </Badge>
                  </div>

                  <Progress
                    value={metric.unit === '%' ? metric.value : Math.min(100, (metric.value / 500) * 100)}
                    className="h-1.5 mt-2"
                  />
                </div>

                {/* Tooltip */}
                {showTooltip === metric.id && metric.description && (
                  <div className="absolute z-10 bottom-full left-1/2 transform -translate-x-1/2 mb-2 p-2 bg-popover text-popover-foreground text-xs rounded shadow-lg w-48">
                    {metric.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-3 mt-4">
            {filteredMetrics.slice(0, 4).map((metric) => (
              <div
                key={metric.id}
                className="flex items-center gap-2 border rounded-lg px-3 py-2"
              >
                <div className={`${metric.color.replace('bg-', 'bg-opacity-20 text-')} p-1 rounded-full`}>
                  {getMetricIcon(metric.id)}
                </div>
                <div>
                  <div className="text-sm font-medium">{metric.name}</div>
                  <div className="flex items-center">
                    <span className="font-bold">{metric.value}{metric.unit}</span>
                    {metric.previousValue > 0 && (
                      <span className={`text-xs ml-2 ${
                        calculateChange(metric.value, metric.previousValue) > 0
                          ? 'text-green-500'
                          : calculateChange(metric.value, metric.previousValue) < 0
                            ? 'text-red-500'
                            : 'text-gray-500'
                      }`}>
                        {calculateChange(metric.value, metric.previousValue) > 0 ? '+' : ''}
                        {calculateChange(metric.value, metric.previousValue).toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
