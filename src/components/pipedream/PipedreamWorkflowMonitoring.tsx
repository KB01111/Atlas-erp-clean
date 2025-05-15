"use client";

import React, { useState, useEffect } from 'react';
import { MagicCard } from "@/components/magicui/magic-card";
import { ShineBorder } from "@/components/ui/shine-border";
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text";
import { Tooltip } from "@/components/ui/tooltip";
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorMessage } from '@/components/ui/error-message';
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Search,
  X,
  Filter,
  RefreshCw,
  Calendar,
  BarChart
} from 'lucide-react';
import { Workflow } from './PipedreamWorkflowBuilder';
import { WorkflowExecution, WorkflowExecutionStatus } from './PipedreamIntegrationManager';

interface PipedreamWorkflowMonitoringProps {
  executions: WorkflowExecution[];
  workflows: Workflow[];
  onRefresh?: () => Promise<void>;
}

export default function PipedreamWorkflowMonitoring({
  executions,
  workflows,
  onRefresh
}: PipedreamWorkflowMonitoringProps) {
  // State
  const [filteredExecutions, setFilteredExecutions] = useState<WorkflowExecution[]>(executions);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<WorkflowExecutionStatus | 'all'>('all');
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | 'all'>('all');
  const [dateRange, setDateRange] = useState<{ start: string; end: string } | null>(null);
  const [expandedExecutions, setExpandedExecutions] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [showStats, setShowStats] = useState<boolean>(true);

  // Filter executions
  useEffect(() => {
    let filtered = [...executions];

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(execution => {
        const workflow = workflows.find(w => w.id === execution.workflowId);
        return workflow?.name.toLowerCase().includes(term) || execution.id.toLowerCase().includes(term);
      });
    }

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(execution => execution.status === selectedStatus);
    }

    // Filter by workflow
    if (selectedWorkflowId !== 'all') {
      filtered = filtered.filter(execution => execution.workflowId === selectedWorkflowId);
    }

    // Filter by date range
    if (dateRange) {
      const startDate = new Date(dateRange.start).getTime();
      const endDate = new Date(dateRange.end).getTime();

      filtered = filtered.filter(execution => {
        const executionDate = new Date(execution.startTime).getTime();
        return executionDate >= startDate && executionDate <= endDate;
      });
    }

    setFilteredExecutions(filtered);
  }, [executions, searchTerm, selectedStatus, selectedWorkflowId, dateRange, workflows]);

  // Refresh data
  const refreshData = async () => {
    if (!onRefresh) return;

    setIsLoading(true);
    setError(null);

    try {
      await onRefresh();
    } catch (err) {
      setError(`Failed to refresh data: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle execution expansion
  const toggleExecution = (executionId: string) => {
    const newExpanded = new Set(expandedExecutions);

    if (newExpanded.has(executionId)) {
      newExpanded.delete(executionId);
    } else {
      newExpanded.add(executionId);
    }

    setExpandedExecutions(newExpanded);
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Format duration
  const formatDuration = (durationMs: number) => {
    if (durationMs < 1000) {
      return `${durationMs}ms`;
    } else if (durationMs < 60000) {
      return `${(durationMs / 1000).toFixed(2)}s`;
    } else {
      const minutes = Math.floor(durationMs / 60000);
      const seconds = ((durationMs % 60000) / 1000).toFixed(0);
      return `${minutes}m ${seconds}s`;
    }
  };

  // Get status icon
  const getStatusIcon = (status: WorkflowExecutionStatus) => {
    switch (status) {
      case WorkflowExecutionStatus.COMPLETED:
        return <CheckCircle className="text-green-500" size={18} />;
      case WorkflowExecutionStatus.FAILED:
        return <XCircle className="text-red-500" size={18} />;
      case WorkflowExecutionStatus.RUNNING:
        return <Clock className="text-blue-500 animate-pulse" size={18} />;
      case WorkflowExecutionStatus.PENDING:
        return <Clock className="text-amber-500" size={18} />;
      default:
        return <AlertCircle className="text-slate-500" size={18} />;
    }
  };

  // Get status color
  const getStatusColor = (status: WorkflowExecutionStatus) => {
    switch (status) {
      case WorkflowExecutionStatus.COMPLETED:
        return 'bg-green-100 text-green-800 border-green-300';
      case WorkflowExecutionStatus.FAILED:
        return 'bg-red-100 text-red-800 border-red-300';
      case WorkflowExecutionStatus.RUNNING:
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case WorkflowExecutionStatus.PENDING:
        return 'bg-amber-100 text-amber-800 border-amber-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  // Calculate statistics
  const calculateStats = () => {
    const total = executions.length;
    const completed = executions.filter(e => e.status === WorkflowExecutionStatus.COMPLETED).length;
    const failed = executions.filter(e => e.status === WorkflowExecutionStatus.FAILED).length;
    const running = executions.filter(e => e.status === WorkflowExecutionStatus.RUNNING).length;
    const pending = executions.filter(e => e.status === WorkflowExecutionStatus.PENDING).length;

    // Calculate average duration for completed executions
    const completedExecutions = executions.filter(e => e.status === WorkflowExecutionStatus.COMPLETED && e.duration);
    const avgDuration = completedExecutions.length > 0
      ? completedExecutions.reduce((sum, e) => sum + (e.duration || 0), 0) / completedExecutions.length
      : 0;

    // Calculate success rate
    const successRate = total > 0 ? (completed / total) * 100 : 0;

    return {
      total,
      completed,
      failed,
      running,
      pending,
      avgDuration,
      successRate
    };
  };

  const stats = calculateStats();

  return (
    <div className="flex flex-col h-full">
      {error && (
        <ErrorMessage
          title="Error"
          message={error}
          variant="error"
          className="mb-4"
          onRetry={() => setError(null)}
        />
      )}

      {/* Header with search and filters */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <AnimatedGradientText className="text-xl font-bold">
            Workflow Monitoring
          </AnimatedGradientText>

          <div className="flex gap-2">
            <Tooltip content="Toggle Statistics">
              <button
                onClick={() => setShowStats(!showStats)}
                className={`p-2 rounded-md ${showStats ? 'bg-indigo-100 text-indigo-700' : 'bg-white text-slate-700 border border-slate-200'}`}
              >
                <BarChart size={16} />
              </button>
            </Tooltip>

            <Tooltip content="Toggle Advanced Filters">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-md ${showFilters ? 'bg-indigo-100 text-indigo-700' : 'bg-white text-slate-700 border border-slate-200'}`}
              >
                <Filter size={16} />
              </button>
            </Tooltip>

            {onRefresh && (
              <button
                onClick={refreshData}
                className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 px-2 py-1 rounded-md hover:bg-gray-100"
                disabled={isLoading}
              >
                <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
                <span>Refresh</span>
              </button>
            )}
          </div>
        </div>

        {/* Search and basic filters */}
        <div className="flex flex-wrap gap-2 items-center mb-2">
          <div className="relative flex-1 min-w-[200px]">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Search size={16} />
            </div>
            <input
              type="text"
              placeholder="Search executions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as WorkflowExecutionStatus | 'all')}
            className="px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value={WorkflowExecutionStatus.COMPLETED}>Completed</option>
            <option value={WorkflowExecutionStatus.FAILED}>Failed</option>
            <option value={WorkflowExecutionStatus.RUNNING}>Running</option>
            <option value={WorkflowExecutionStatus.PENDING}>Pending</option>
          </select>

          <div className="text-sm text-slate-500 whitespace-nowrap">
            {filteredExecutions.length} of {executions.length} executions
          </div>
        </div>

        {/* Advanced filters panel */}
        {showFilters && (
          <div className="p-3 bg-slate-50 rounded-md mb-2 animate-in fade-in duration-200">
            <div className="text-sm font-medium mb-2">Advanced Filters</div>
            <div className="flex flex-wrap gap-2 items-center">
              <select
                value={selectedWorkflowId}
                onChange={(e) => setSelectedWorkflowId(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              >
                <option value="all">All Workflows</option>
                {workflows.map(workflow => (
                  <option key={workflow.id} value={workflow.id}>
                    {workflow.name}
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-1">
                <div className="text-sm text-slate-700">Date Range:</div>
                <input
                  type="date"
                  value={dateRange?.start || ''}
                  onChange={(e) => setDateRange(prev => ({ start: e.target.value, end: prev?.end || e.target.value }))}
                  className="px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
                <span className="text-slate-500">to</span>
                <input
                  type="date"
                  value={dateRange?.end || ''}
                  onChange={(e) => setDateRange(prev => ({ start: prev?.start || e.target.value, end: e.target.value }))}
                  className="px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
                {dateRange && (
                  <button
                    onClick={() => setDateRange(null)}
                    className="p-1 text-slate-500 hover:text-slate-700"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Statistics panel */}
      {showStats && (
        <div className="mb-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <MagicCard className="overflow-hidden">
            <ShineBorder borderRadius="0.75rem" className="p-0.5">
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm overflow-hidden p-4">
                <div className="text-sm text-slate-500 mb-1">Total Executions</div>
                <div className="text-2xl font-bold">{stats.total}</div>
              </div>
            </ShineBorder>
          </MagicCard>

          <MagicCard className="overflow-hidden">
            <ShineBorder borderRadius="0.75rem" className="p-0.5">
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm overflow-hidden p-4">
                <div className="text-sm text-slate-500 mb-1">Success Rate</div>
                <div className="text-2xl font-bold text-green-600">{stats.successRate.toFixed(1)}%</div>
              </div>
            </ShineBorder>
          </MagicCard>

          <MagicCard className="overflow-hidden">
            <ShineBorder borderRadius="0.75rem" className="p-0.5">
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm overflow-hidden p-4">
                <div className="text-sm text-slate-500 mb-1">Avg. Duration</div>
                <div className="text-2xl font-bold">{formatDuration(stats.avgDuration)}</div>
              </div>
            </ShineBorder>
          </MagicCard>

          <MagicCard className="overflow-hidden">
            <ShineBorder borderRadius="0.75rem" className="p-0.5">
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm overflow-hidden p-4">
                <div className="text-sm text-slate-500 mb-1">Completed</div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="text-green-500" size={20} />
                  <div className="text-2xl font-bold">{stats.completed}</div>
                </div>
              </div>
            </ShineBorder>
          </MagicCard>

          <MagicCard className="overflow-hidden">
            <ShineBorder borderRadius="0.75rem" className="p-0.5">
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm overflow-hidden p-4">
                <div className="text-sm text-slate-500 mb-1">Failed</div>
                <div className="flex items-center gap-2">
                  <XCircle className="text-red-500" size={20} />
                  <div className="text-2xl font-bold">{stats.failed}</div>
                </div>
              </div>
            </ShineBorder>
          </MagicCard>
        </div>
      )}

      {/* Executions list */}
      <div className="flex-1 overflow-hidden">
        <MagicCard className="h-full overflow-hidden">
          <ShineBorder borderRadius="0.75rem" className="p-0.5 h-full">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm overflow-hidden h-full">
              {isLoading ? (
                <LoadingState message="Loading executions..." variant="card" size="large" />
              ) : filteredExecutions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 p-4">
                  <Calendar size={48} className="mb-4 opacity-30" />
                  <p className="text-lg font-medium">No executions found</p>
                  <p className="text-sm">
                    Try adjusting your filters or run a workflow
                  </p>
                </div>
              ) : (
                <div className="overflow-auto h-full">
                  <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-gray-800 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Workflow</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Started</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Duration</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-gray-700">
                      {filteredExecutions.map(execution => {
                        const workflow = workflows.find(w => w.id === execution.workflowId);
                        const isExpanded = expandedExecutions.has(execution.id);

                        return (
                          <React.Fragment key={execution.id}>
                            <tr className="hover:bg-slate-50 dark:hover:bg-gray-800">
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="flex items-center">
                                  {getStatusIcon(execution.status)}
                                  <span className="ml-2 text-sm font-medium">
                                    {execution.status.charAt(0).toUpperCase() + execution.status.slice(1)}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="text-sm font-medium">{workflow?.name || 'Unknown Workflow'}</div>
                                <div className="text-xs text-slate-500">{execution.workflowId}</div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="text-sm">{formatDate(execution.startTime)}</div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="text-sm">
                                  {execution.duration
                                    ? formatDuration(execution.duration)
                                    : execution.status === WorkflowExecutionStatus.RUNNING
                                      ? 'Running...'
                                      : 'N/A'
                                  }
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <button
                                  onClick={() => toggleExecution(execution.id)}
                                  className="flex items-center text-indigo-600 hover:text-indigo-800"
                                >
                                  <span className="text-sm mr-1">Details</span>
                                  {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                </button>
                              </td>
                            </tr>

                            {isExpanded && (
                              <tr className="bg-slate-50 dark:bg-gray-800">
                                <td colSpan={5} className="px-4 py-3">
                                  <div className="text-sm">
                                    <div className="font-medium mb-2">Execution Steps</div>
                                    <div className="space-y-2">
                                      {execution.steps.map(step => (
                                        <div
                                          key={step.id}
                                          className={`p-2 rounded-md border ${getStatusColor(step.status)}`}
                                        >
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center">
                                              {getStatusIcon(step.status)}
                                              <span className="ml-2 font-medium">{step.name}</span>
                                            </div>
                                            <div className="text-xs">
                                              {step.startTime && (
                                                <span>Started: {formatDate(step.startTime)}</span>
                                              )}
                                              {step.endTime && (
                                                <span className="ml-2">
                                                  Duration: {formatDuration(new Date(step.endTime).getTime() - new Date(step.startTime).getTime())}
                                                </span>
                                              )}
                                            </div>
                                          </div>

                                          {step.error && (
                                            <div className="mt-2 p-2 bg-red-50 text-red-800 rounded-md text-xs">
                                              <div className="font-medium">Error:</div>
                                              <div className="font-mono whitespace-pre-wrap">{step.error}</div>
                                            </div>
                                          )}

                                          <div className="mt-2 grid grid-cols-2 gap-4">
                                            <div>
                                              <div className="text-xs font-medium text-slate-500 mb-1">Input</div>
                                              <pre className="text-xs bg-slate-100 p-2 rounded-md overflow-auto max-h-32">
                                                {JSON.stringify(step.input, null, 2) || 'No input data'}
                                              </pre>
                                            </div>
                                            <div>
                                              <div className="text-xs font-medium text-slate-500 mb-1">Output</div>
                                              <pre className="text-xs bg-slate-100 p-2 rounded-md overflow-auto max-h-32">
                                                {JSON.stringify(step.output, null, 2) || 'No output data'}
                                              </pre>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  {execution.error && (
                                    <div className="mt-4">
                                      <div className="font-medium mb-1">Execution Error</div>
                                      <div className="p-2 bg-red-50 text-red-800 rounded-md text-xs font-mono whitespace-pre-wrap">
                                        {execution.error}
                                      </div>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </ShineBorder>
        </MagicCard>
      </div>
    </div>
  );
}