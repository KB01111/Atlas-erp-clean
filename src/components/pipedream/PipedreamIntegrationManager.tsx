"use client";

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PipedreamWorkflowBuilder, { Workflow, StepType } from './PipedreamWorkflowBuilder';
import PipedreamWorkflowMonitoring from './PipedreamWorkflowMonitoring';
import PipedreamTemplateLibrary from './PipedreamTemplateLibrary';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorMessage } from '@/components/ui/error-message';
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text";
import { ShimmerButton } from "@/components/magicui/shimmer-button";
import { Tooltip } from "@/components/ui/tooltip";
import {
  Plus,
  RefreshCw,
  List,
  Play,
  Settings,
  LayoutGrid,
  FileText,
  Clock,
  Zap,
  Trash,
  Edit,
  Copy
} from 'lucide-react';

// Define workflow execution status
export enum WorkflowExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

// Define workflow execution interface
export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: WorkflowExecutionStatus;
  startTime: string;
  endTime?: string;
  duration?: number;
  steps: {
    id: string;
    name: string;
    status: WorkflowExecutionStatus;
    startTime: string;
    endTime?: string;
    input?: any;
    output?: any;
    error?: string;
  }[];
  error?: string;
}

// Define workflow template interface
export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  workflow: Workflow;
  thumbnail?: string;
}

interface PipedreamIntegrationManagerProps {
  initialWorkflows?: Workflow[];
  initialExecutions?: WorkflowExecution[];
  initialTemplates?: WorkflowTemplate[];
  onSaveWorkflow?: (workflow: Workflow) => Promise<void>;
  onDeleteWorkflow?: (workflowId: string) => Promise<void>;
  onRunWorkflow?: (workflowId: string) => Promise<WorkflowExecution>;
  onLoadWorkflows?: () => Promise<Workflow[]>;
  onLoadExecutions?: () => Promise<WorkflowExecution[]>;
  onLoadTemplates?: () => Promise<WorkflowTemplate[]>;
  readOnly?: boolean;
  knowledgeIntegration?: boolean;
}

export default function PipedreamIntegrationManager({
  initialWorkflows = [],
  initialExecutions = [],
  initialTemplates = [],
  onSaveWorkflow,
  onDeleteWorkflow,
  onRunWorkflow,
  onLoadWorkflows,
  onLoadExecutions,
  onLoadTemplates,
  readOnly = false,
  knowledgeIntegration = true
}: PipedreamIntegrationManagerProps) {
  // State
  const [workflows, setWorkflows] = useState<Workflow[]>(initialWorkflows);
  const [executions, setExecutions] = useState<WorkflowExecution[]>(initialExecutions);
  const [templates, setTemplates] = useState<WorkflowTemplate[]>(initialTemplates);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [activeTab, setActiveTab] = useState<string>("workflows");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingWorkflow, setIsCreatingWorkflow] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Load data
  const loadData = async () => {
    if (!onLoadWorkflows && !onLoadExecutions && !onLoadTemplates) return;

    setIsLoading(true);
    setError(null);

    try {
      // Load workflows
      if (onLoadWorkflows) {
        const loadedWorkflows = await onLoadWorkflows();
        setWorkflows(loadedWorkflows);
      }

      // Load executions
      if (onLoadExecutions) {
        const loadedExecutions = await onLoadExecutions();
        setExecutions(loadedExecutions);
      }

      // Load templates
      if (onLoadTemplates) {
        const loadedTemplates = await onLoadTemplates();
        setTemplates(loadedTemplates);
      }
    } catch (err) {
      setError(`Failed to load data: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  // Create a new workflow
  const createWorkflow = () => {
    const newWorkflow: Workflow = {
      id: `workflow-${Date.now()}`,
      name: 'New Workflow',
      description: 'A new workflow',
      steps: [],
      connections: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setWorkflows([...workflows, newWorkflow]);
    setSelectedWorkflow(newWorkflow);
    setIsCreatingWorkflow(true);
    setActiveTab('builder');
  };

  // Save a workflow
  const saveWorkflow = async (workflow: Workflow) => {
    if (!onSaveWorkflow) return;

    try {
      await onSaveWorkflow(workflow);

      // Update the workflows list
      setWorkflows(prev =>
        prev.map(w => w.id === workflow.id ? workflow : w)
      );

      // If this is a new workflow, exit creation mode
      if (isCreatingWorkflow) {
        setIsCreatingWorkflow(false);
      }
    } catch (err) {
      throw err;
    }
  };

  // Delete a workflow
  const deleteWorkflow = async (workflowId: string) => {
    if (!onDeleteWorkflow) return;

    try {
      await onDeleteWorkflow(workflowId);

      // Remove from the workflows list
      setWorkflows(prev => prev.filter(w => w.id !== workflowId));

      // If the deleted workflow was selected, clear selection
      if (selectedWorkflow?.id === workflowId) {
        setSelectedWorkflow(null);
      }
    } catch (err) {
      setError(`Failed to delete workflow: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Run a workflow
  const runWorkflow = async (workflowId: string) => {
    if (!onRunWorkflow) return;

    try {
      const execution = await onRunWorkflow(workflowId);

      // Add to executions list
      setExecutions(prev => [execution, ...prev]);

      return execution;
    } catch (err) {
      setError(`Failed to run workflow: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Import a workflow from a template
  const importFromTemplate = (template: WorkflowTemplate) => {
    const newWorkflow: Workflow = {
      ...template.workflow,
      id: `workflow-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setWorkflows([...workflows, newWorkflow]);
    setSelectedWorkflow(newWorkflow);
    setActiveTab('builder');
  };

  // Duplicate a workflow
  const duplicateWorkflow = (workflow: Workflow) => {
    const newWorkflow: Workflow = {
      ...workflow,
      id: `workflow-${Date.now()}`,
      name: `${workflow.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setWorkflows([...workflows, newWorkflow]);
    setSelectedWorkflow(newWorkflow);
    setActiveTab('builder');
  };

  // Get workflow executions
  const getWorkflowExecutions = (workflowId: string) => {
    return executions.filter(execution => execution.workflowId === workflowId);
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Get workflow status
  const getWorkflowStatus = (workflowId: string) => {
    const workflowExecutions = getWorkflowExecutions(workflowId);

    if (workflowExecutions.length === 0) {
      return 'Not run';
    }

    const latestExecution = workflowExecutions[0];
    return latestExecution.status;
  };

  // Get status color
  const getStatusColor = (status: WorkflowExecutionStatus | string) => {
    switch (status) {
      case WorkflowExecutionStatus.RUNNING:
        return 'text-blue-500';
      case WorkflowExecutionStatus.COMPLETED:
        return 'text-green-500';
      case WorkflowExecutionStatus.FAILED:
        return 'text-red-500';
      case WorkflowExecutionStatus.PENDING:
        return 'text-amber-500';
      default:
        return 'text-slate-500';
    }
  };

  // Render workflow grid item
  const renderWorkflowGridItem = (workflow: Workflow) => {
    const status = getWorkflowStatus(workflow.id);
    const statusColor = getStatusColor(status);

    return (
      <div
        key={workflow.id}
        className="bg-white dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
      >
        <div className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-medium truncate">{workflow.name}</h3>
            <div className={`text-xs font-medium ${statusColor}`}>
              {status}
            </div>
          </div>

          {workflow.description && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-2 line-clamp-2">
              {workflow.description}
            </p>
          )}

          <div className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            <div>Created: {formatDate(workflow.createdAt || new Date().toISOString())}</div>
            <div>Updated: {formatDate(workflow.updatedAt || workflow.createdAt || new Date().toISOString())}</div>
            <div>Steps: {workflow.steps.length}</div>
          </div>

          <div className="flex gap-2">
            <ShimmerButton
              onClick={() => {
                setSelectedWorkflow(workflow);
                setActiveTab('builder');
              }}
              className="flex-1 px-3 py-1 text-xs bg-indigo-600 text-white rounded-md flex items-center justify-center gap-1"
            >
              <Edit size={12} />
              <span>Edit</span>
            </ShimmerButton>

            {onRunWorkflow && (
              <ShimmerButton
                onClick={() => runWorkflow(workflow.id)}
                className="flex-1 px-3 py-1 text-xs bg-blue-600 text-white rounded-md flex items-center justify-center gap-1"
              >
                <Play size={12} />
                <span>Run</span>
              </ShimmerButton>
            )}

            <div className="flex">
              <Tooltip content="Duplicate Workflow">
                <button
                  onClick={() => duplicateWorkflow(workflow)}
                  className="p-1 bg-white text-slate-700 border border-slate-200 rounded-l-md hover:bg-slate-50"
                >
                  <Copy size={12} />
                </button>
              </Tooltip>

              {!readOnly && onDeleteWorkflow && (
                <Tooltip content="Delete Workflow">
                  <button
                    onClick={() => deleteWorkflow(workflow.id)}
                    className="p-1 bg-white text-slate-700 border border-slate-200 rounded-r-md hover:bg-red-50 hover:text-red-500 border-l-0"
                  >
                    <Trash size={12} />
                  </button>
                </Tooltip>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render workflow list item
  const renderWorkflowListItem = (workflow: Workflow) => {
    const status = getWorkflowStatus(workflow.id);
    const statusColor = getStatusColor(status);

    return (
      <div
        key={workflow.id}
        className="bg-white dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow p-3 flex items-center"
      >
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-medium truncate">{workflow.name}</h3>
            <div className={`text-xs font-medium ${statusColor}`}>
              {status}
            </div>
          </div>

          {workflow.description && (
            <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
              {workflow.description}
            </p>
          )}
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 mx-4">
          <div>Updated: {formatDate(workflow.updatedAt || workflow.createdAt || new Date().toISOString())}</div>
          <div>Steps: {workflow.steps.length}</div>
        </div>

        <div className="flex gap-2">
          <ShimmerButton
            onClick={() => {
              setSelectedWorkflow(workflow);
              setActiveTab('builder');
            }}
            className="px-3 py-1 text-xs bg-indigo-600 text-white rounded-md flex items-center justify-center gap-1"
          >
            <Edit size={12} />
            <span>Edit</span>
          </ShimmerButton>

          {onRunWorkflow && (
            <ShimmerButton
              onClick={() => runWorkflow(workflow.id)}
              className="px-3 py-1 text-xs bg-blue-600 text-white rounded-md flex items-center justify-center gap-1"
            >
              <Play size={12} />
              <span>Run</span>
            </ShimmerButton>
          )}

          <Tooltip content="Duplicate Workflow">
            <button
              onClick={() => duplicateWorkflow(workflow)}
              className="p-1 bg-white text-slate-700 border border-slate-200 rounded-md hover:bg-slate-50"
            >
              <Copy size={12} />
            </button>
          </Tooltip>

          {!readOnly && onDeleteWorkflow && (
            <Tooltip content="Delete Workflow">
              <button
                onClick={() => deleteWorkflow(workflow.id)}
                className="p-1 bg-white text-slate-700 border border-slate-200 rounded-md hover:bg-red-50 hover:text-red-500"
              >
                <Trash size={12} />
              </button>
            </Tooltip>
          )}
        </div>
      </div>
    );
  };

  // Render the component
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

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col"
      >
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="workflows" className="flex items-center gap-1">
              <Zap size={14} />
              <span>Workflows</span>
            </TabsTrigger>
            <TabsTrigger value="monitoring" className="flex items-center gap-1">
              <Clock size={14} />
              <span>Monitoring</span>
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-1">
              <FileText size={14} />
              <span>Templates</span>
            </TabsTrigger>
            {selectedWorkflow && (
              <TabsTrigger value="builder" className="flex items-center gap-1">
                <Settings size={14} />
                <span>Builder</span>
              </TabsTrigger>
            )}
          </TabsList>

          <div className="flex items-center gap-2">
            {activeTab === 'workflows' && (
              <>
                {!readOnly && (
                  <ShimmerButton
                    onClick={createWorkflow}
                    className="px-3 py-2 text-sm bg-indigo-600 text-white rounded-md flex items-center gap-1"
                  >
                    <Plus size={16} />
                    <span>New Workflow</span>
                  </ShimmerButton>
                )}

                <div className="flex border border-slate-200 rounded-md overflow-hidden">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 ${
                      viewMode === 'grid'
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <LayoutGrid size={16} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 ${
                      viewMode === 'list'
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <List size={16} />
                  </button>
                </div>
              </>
            )}

            {onLoadWorkflows && (
              <button
                onClick={loadData}
                className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 px-2 py-1 rounded-md hover:bg-gray-100"
                disabled={isLoading}
              >
                <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
                <span>Refresh</span>
              </button>
            )}
          </div>
        </div>

        <TabsContent value="workflows" className="flex-1 mt-0">
          {isLoading ? (
            <LoadingState message="Loading workflows..." variant="card" size="large" />
          ) : workflows.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <Zap size={48} className="mb-4 opacity-30" />
              <p className="text-lg font-medium">No workflows found</p>
              {!readOnly && (
                <p className="text-sm">
                  Click "New Workflow" to create your first workflow
                </p>
              )}
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
              {workflows.map(workflow =>
                viewMode === 'grid'
                  ? renderWorkflowGridItem(workflow)
                  : renderWorkflowListItem(workflow)
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="monitoring" className="flex-1 mt-0">
          <PipedreamWorkflowMonitoring
            executions={executions}
            workflows={workflows}
          />
        </TabsContent>

        <TabsContent value="templates" className="flex-1 mt-0">
          <PipedreamTemplateLibrary
            templates={templates}
            onImport={importFromTemplate}
            readOnly={readOnly}
          />
        </TabsContent>

        <TabsContent value="builder" className="flex-1 mt-0">
          {selectedWorkflow ? (
            <PipedreamWorkflowBuilder
              initialWorkflow={selectedWorkflow}
              onSave={saveWorkflow}
              onRun={onRunWorkflow ? () => runWorkflow(selectedWorkflow.id) : undefined}
              readOnly={readOnly}
              knowledgeIntegration={knowledgeIntegration}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <p className="text-lg font-medium">No workflow selected</p>
              <p className="text-sm">
                Select a workflow to edit or create a new one
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
