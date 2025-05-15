"use client";

import React, { useState, useEffect, useRef } from 'react';
import { MagicCard } from "@/components/magicui/magic-card";
import { ShineBorder } from "@/components/ui/shine-border";
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text";
import { NumberTicker } from "@/components/ui/number-ticker";
import { AnimatedCircularProgressBar } from "@/components/ui/animated-circular-progress-bar";
import { Activity, Server, Database, FileText, Users, Bot, Workflow, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { initWebSocketClient, EventType, MetricsUpdate } from '@/lib/socket-io-client';

interface RealTimeMetricsProps {
  className?: string;
  refreshInterval?: number; // in milliseconds
}

interface Metric {
  id: string;
  name: string;
  value: number;
  previousValue: number;
  unit: string;
  icon: React.ReactNode;
  color: string;
}

export default function RealTimeMetrics({
  className = '',
  refreshInterval = 5000, // 5 seconds by default
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
    },
    {
      id: 'memory',
      name: 'Memory Usage',
      value: 0,
      previousValue: 0,
      unit: '%',
      icon: <Activity size={20} />,
      color: 'bg-purple-500',
    },
    {
      id: 'storage',
      name: 'Storage Usage',
      value: 0,
      previousValue: 0,
      unit: '%',
      icon: <Database size={20} />,
      color: 'bg-amber-500',
    },
    {
      id: 'documents',
      name: 'Documents',
      value: 0,
      previousValue: 0,
      unit: '',
      icon: <FileText size={20} />,
      color: 'bg-green-500',
    },
    {
      id: 'users',
      name: 'Active Users',
      value: 0,
      previousValue: 0,
      unit: '',
      icon: <Users size={20} />,
      color: 'bg-red-500',
    },
    {
      id: 'agents',
      name: 'Agent Executions',
      value: 0,
      previousValue: 0,
      unit: '',
      icon: <Bot size={20} />,
      color: 'bg-indigo-500',
    },
    {
      id: 'workflows',
      name: 'Workflow Runs',
      value: 0,
      previousValue: 0,
      unit: '',
      icon: <Workflow size={20} />,
      color: 'bg-pink-500',
    },
  ]);

  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isWebSocketConnected, setIsWebSocketConnected] = useState<boolean>(false);
  const socketRef = useRef<any>(null);

  // Function to fetch metrics
  const fetchMetrics = async () => {
    setIsLoading(true);

    try {
      // In a real implementation, you would fetch metrics from an API
      // For now, we'll simulate random changes

      setMetrics(prevMetrics => prevMetrics.map(metric => {
        // Store previous value
        const previousValue = metric.value;

        // Generate a new random value
        let newValue: number;

        if (metric.id === 'cpu' || metric.id === 'memory' || metric.id === 'storage') {
          // For percentage metrics, generate a value between 10% and 90%
          newValue = Math.floor(Math.random() * 80) + 10;
        } else if (metric.id === 'documents') {
          // For documents, generate a value between 100 and 500
          newValue = Math.floor(Math.random() * 400) + 100;
        } else if (metric.id === 'users') {
          // For users, generate a value between 1 and 20
          newValue = Math.floor(Math.random() * 19) + 1;
        } else if (metric.id === 'agents') {
          // For agent executions, generate a value between 0 and 50
          newValue = Math.floor(Math.random() * 50);
        } else if (metric.id === 'workflows') {
          // For workflow runs, generate a value between 0 and 30
          newValue = Math.floor(Math.random() * 30);
        } else {
          // Default case
          newValue = Math.floor(Math.random() * 100);
        }

        return {
          ...metric,
          value: newValue,
          previousValue,
        };
      }));

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize WebSocket connection
  useEffect(() => {
    // Initialize WebSocket client
    socketRef.current = initWebSocketClient();

    // Set up event listeners
    socketRef.current.on('connect', () => {
      console.log('Connected to WebSocket server for metrics');
      setIsWebSocketConnected(true);
    });

    socketRef.current.on('disconnect', () => {
      console.log('Disconnected from WebSocket server for metrics');
      setIsWebSocketConnected(false);
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

    // Clean up on component unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

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
  }, [refreshInterval, isWebSocketConnected]);

  // Format the last updated time
  const formatLastUpdated = () => {
    return lastUpdated.toLocaleTimeString();
  };

  // Calculate the change percentage
  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  return (
    <MagicCard className={`rounded-xl overflow-hidden ${className}`}>
      <ShineBorder borderRadius="0.75rem" className="p-0.5">
        <div className="bg-card rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold flex items-center">
              <Activity className="mr-2 text-primary" size={20} />
              Real-Time Metrics
            </h3>

            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div
                className="flex items-center gap-1"
                title={isWebSocketConnected ? "Real-time updates enabled" : "Real-time updates disabled"}
              >
                {isWebSocketConnected ? (
                  <>
                    <Wifi size={14} className="text-green-500" />
                    <span className="sr-only md:not-sr-only text-xs">Real-time</span>
                  </>
                ) : (
                  <>
                    <WifiOff size={14} className="text-gray-400" />
                    <span className="sr-only md:not-sr-only text-xs">Polling</span>
                  </>
                )}
              </div>
              <div className="flex items-center">
                <RefreshCw size={14} className={`mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Last updated: {formatLastUpdated()}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {metrics.map(metric => (
              <div
                key={metric.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-full ${metric.color.replace('bg-', 'bg-opacity-20 text-')}`}>
                      {metric.icon}
                    </div>
                    <h4 className="ml-2 font-medium">{metric.name}</h4>
                  </div>

                  {metric.id === 'cpu' || metric.id === 'memory' || metric.id === 'storage' ? (
                    <div className="w-10 h-10">
                      <AnimatedCircularProgressBar
                        value={metric.value}
                        color={metric.color.replace('bg-', 'text-')}
                      />
                    </div>
                  ) : null}
                </div>

                <div className="flex items-end justify-between">
                  <div className="text-2xl font-bold">
                    <NumberTicker value={metric.value} />
                    <span className="text-sm ml-1">{metric.unit}</span>
                  </div>

                  {metric.previousValue > 0 && (
                    <div className={`text-sm ${
                      calculateChange(metric.value, metric.previousValue) > 0
                        ? 'text-green-500'
                        : calculateChange(metric.value, metric.previousValue) < 0
                          ? 'text-red-500'
                          : 'text-gray-500'
                    }`}>
                      {calculateChange(metric.value, metric.previousValue) > 0 ? '+' : ''}
                      {calculateChange(metric.value, metric.previousValue).toFixed(1)}%
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </ShineBorder>
    </MagicCard>
  );
}
