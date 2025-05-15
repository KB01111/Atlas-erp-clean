"use client";

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PipedreamIntegrationManager, { WorkflowExecution, WorkflowExecutionStatus, WorkflowTemplate } from '@/components/pipedream/PipedreamIntegrationManager';
import { Workflow, StepType } from '@/components/pipedream/PipedreamWorkflowBuilder';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorMessage } from '@/components/ui/error-message';
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text";
import { ShimmerButton } from "@/components/magicui/shimmer-button";
import { Tooltip } from "@/components/ui/tooltip";
import {
  Settings,
  RefreshCw,
  Info,
  ExternalLink
} from 'lucide-react';

// Mock data for demonstration - exported for reuse
export const mockWorkflows: Workflow[] = [
  {
    id: 'workflow-1',
    name: 'Data Collection Workflow',
    description: 'Collects data from various sources and processes it',
    steps: [
      {
        id: 'step-1',
        type: StepType.TRIGGER,
        name: 'Webhook Trigger',
        description: 'Triggers on HTTP request',
        config: {
          method: 'POST',
          path: '/webhook/data-collection',
          requireAuth: true
        },
        position: { x: 100, y: 100 }
      },
      {
        id: 'step-2',
        type: StepType.ACTION,
        name: 'HTTP Request',
        description: 'Fetches data from API',
        config: {
          method: 'GET',
          url: 'https://api.example.com/data',
          headers: { 'Authorization': 'Bearer ${env.API_KEY}' }
        },
        position: { x: 450, y: 100 }
      },
      {
        id: 'step-3',
        type: StepType.TRANSFORMATION,
        name: 'Transform Data',
        description: 'Transforms the API response',
        config: {
          language: 'javascript',
          code: '// Transform data\nreturn { ...data, processed: true };'
        },
        position: { x: 800, y: 100 }
      },
      {
        id: 'step-4',
        type: StepType.KNOWLEDGE_NODE,
        name: 'Store in Knowledge Graph',
        description: 'Stores processed data in knowledge graph',
        config: {
          nodeType: 'entity',
          name: 'Processed Data',
          content: 'Data processed from API'
        },
        position: { x: 1150, y: 100 }
      }
    ],
    connections: [
      { source: 'step-1', target: 'step-2' },
      { source: 'step-2', target: 'step-3' },
      { source: 'step-3', target: 'step-4' }
    ],
    createdAt: '2023-06-15T10:00:00Z',
    updatedAt: '2023-06-16T14:30:00Z'
  },
  {
    id: 'workflow-2',
    name: 'Notification Workflow',
    description: 'Sends notifications based on events',
    steps: [
      {
        id: 'step-1',
        type: StepType.TRIGGER,
        name: 'Schedule Trigger',
        description: 'Triggers on schedule',
        config: {
          schedule: '0 9 * * *',
          timezone: 'UTC'
        },
        position: { x: 100, y: 100 }
      },
      {
        id: 'step-2',
        type: StepType.ACTION,
        name: 'Send Email',
        description: 'Sends email notification',
        config: {
          to: 'team@example.com',
          subject: 'Daily Report',
          body: 'Here is your daily report.'
        },
        position: { x: 450, y: 100 }
      }
    ],
    connections: [
      { source: 'step-1', target: 'step-2' }
    ],
    createdAt: '2023-06-20T09:00:00Z',
    updatedAt: '2023-06-20T09:00:00Z'
  }
];

export const mockExecutions: WorkflowExecution[] = [
  {
    id: 'exec-1',
    workflowId: 'workflow-1',
    status: WorkflowExecutionStatus.COMPLETED,
    startTime: '2023-06-16T15:00:00Z',
    endTime: '2023-06-16T15:01:30Z',
    duration: 90000,
    steps: [
      {
        id: 'exec-step-1',
        name: 'Webhook Trigger',
        status: WorkflowExecutionStatus.COMPLETED,
        startTime: '2023-06-16T15:00:00Z',
        endTime: '2023-06-16T15:00:05Z',
        input: { headers: { 'content-type': 'application/json' }, body: { data: 'example' } },
        output: { success: true, data: { data: 'example' } }
      },
      {
        id: 'exec-step-2',
        name: 'HTTP Request',
        status: WorkflowExecutionStatus.COMPLETED,
        startTime: '2023-06-16T15:00:05Z',
        endTime: '2023-06-16T15:00:35Z',
        input: { url: 'https://api.example.com/data' },
        output: { status: 200, data: { id: 123, name: 'Example Data' } }
      },
      {
        id: 'exec-step-3',
        name: 'Transform Data',
        status: WorkflowExecutionStatus.COMPLETED,
        startTime: '2023-06-16T15:00:35Z',
        endTime: '2023-06-16T15:00:40Z',
        input: { status: 200, data: { id: 123, name: 'Example Data' } },
        output: { id: 123, name: 'Example Data', processed: true }
      },
      {
        id: 'exec-step-4',
        name: 'Store in Knowledge Graph',
        status: WorkflowExecutionStatus.COMPLETED,
        startTime: '2023-06-16T15:00:40Z',
        endTime: '2023-06-16T15:01:30Z',
        input: { id: 123, name: 'Example Data', processed: true },
        output: { success: true, nodeId: 'node-123' }
      }
    ]
  },
  {
    id: 'exec-2',
    workflowId: 'workflow-1',
    status: WorkflowExecutionStatus.FAILED,
    startTime: '2023-06-17T10:00:00Z',
    endTime: '2023-06-17T10:00:45Z',
    duration: 45000,
    steps: [
      {
        id: 'exec-step-1',
        name: 'Webhook Trigger',
        status: WorkflowExecutionStatus.COMPLETED,
        startTime: '2023-06-17T10:00:00Z',
        endTime: '2023-06-17T10:00:05Z',
        input: { headers: { 'content-type': 'application/json' }, body: { data: 'example' } },
        output: { success: true, data: { data: 'example' } }
      },
      {
        id: 'exec-step-2',
        name: 'HTTP Request',
        status: WorkflowExecutionStatus.FAILED,
        startTime: '2023-06-17T10:00:05Z',
        endTime: '2023-06-17T10:00:45Z',
        input: { url: 'https://api.example.com/data' },
        error: 'API request failed with status 500: Internal Server Error'
      }
    ],
    error: 'Workflow execution failed at step "HTTP Request"'
  },
  {
    id: 'exec-3',
    workflowId: 'workflow-2',
    status: WorkflowExecutionStatus.COMPLETED,
    startTime: '2023-06-20T09:00:00Z',
    endTime: '2023-06-20T09:00:30Z',
    duration: 30000,
    steps: [
      {
        id: 'exec-step-1',
        name: 'Schedule Trigger',
        status: WorkflowExecutionStatus.COMPLETED,
        startTime: '2023-06-20T09:00:00Z',
        endTime: '2023-06-20T09:00:01Z',
        input: { timestamp: '2023-06-20T09:00:00Z' },
        output: { triggered: true }
      },
      {
        id: 'exec-step-2',
        name: 'Send Email',
        status: WorkflowExecutionStatus.COMPLETED,
        startTime: '2023-06-20T09:00:01Z',
        endTime: '2023-06-20T09:00:30Z',
        input: { to: 'team@example.com', subject: 'Daily Report', body: 'Here is your daily report.' },
        output: { sent: true, messageId: 'msg-123' }
      }
    ]
  }
];

export const mockTemplates: WorkflowTemplate[] = [
  {
    id: 'template-1',
    name: 'Data Collection Template',
    description: 'A template for collecting and processing data from external APIs',
    category: 'Data Collection',
    workflow: {
      id: 'template-workflow-1',
      name: 'Data Collection Workflow',
      description: 'Collects data from various sources and processes it',
      steps: [
        {
          id: 'step-1',
          type: StepType.TRIGGER,
          name: 'Webhook Trigger',
          description: 'Triggers on HTTP request',
          config: {
            method: 'POST',
            path: '/webhook/data-collection',
            requireAuth: true
          },
          position: { x: 100, y: 100 }
        },
        {
          id: 'step-2',
          type: StepType.ACTION,
          name: 'HTTP Request',
          description: 'Fetches data from API',
          config: {
            method: 'GET',
            url: 'https://api.example.com/data',
            headers: { 'Authorization': 'Bearer ${env.API_KEY}' }
          },
          position: { x: 450, y: 100 }
        },
        {
          id: 'step-3',
          type: StepType.TRANSFORMATION,
          name: 'Transform Data',
          description: 'Transforms the API response',
          config: {
            language: 'javascript',
            code: '// Transform data\nreturn { ...data, processed: true };'
          },
          position: { x: 800, y: 100 }
        }
      ],
      connections: [
        { source: 'step-1', target: 'step-2' },
        { source: 'step-2', target: 'step-3' }
      ]
    }
  },
  {
    id: 'template-2',
    name: 'Notification Template',
    description: 'A template for sending notifications based on events',
    category: 'Notifications',
    workflow: {
      id: 'template-workflow-2',
      name: 'Notification Workflow',
      description: 'Sends notifications based on events',
      steps: [
        {
          id: 'step-1',
          type: StepType.TRIGGER,
          name: 'Schedule Trigger',
          description: 'Triggers on schedule',
          config: {
            schedule: '0 9 * * *',
            timezone: 'UTC'
          },
          position: { x: 100, y: 100 }
        },
        {
          id: 'step-2',
          type: StepType.ACTION,
          name: 'Send Email',
          description: 'Sends email notification',
          config: {
            to: '',
            subject: 'Notification',
            body: 'This is a notification.'
          },
          position: { x: 450, y: 100 }
        }
      ],
      connections: [
        { source: 'step-1', target: 'step-2' }
      ]
    }
  },
  {
    id: 'template-3',
    name: 'Knowledge Graph Integration',
    description: 'A template for integrating with the knowledge graph',
    category: 'Knowledge Integration',
    workflow: {
      id: 'template-workflow-3',
      name: 'Knowledge Graph Integration',
      description: 'Integrates with the knowledge graph',
      steps: [
        {
          id: 'step-1',
          type: StepType.TRIGGER,
          name: 'Webhook Trigger',
          description: 'Triggers on HTTP request',
          config: {
            method: 'POST',
            path: '/webhook/knowledge',
            requireAuth: true
          },
          position: { x: 100, y: 100 }
        },
        {
          id: 'step-2',
          type: StepType.KNOWLEDGE_NODE,
          name: 'Query Knowledge Graph',
          description: 'Queries the knowledge graph',
          config: {
            query: '',
            nodeType: 'all',
            limit: 10
          },
          position: { x: 450, y: 100 }
        },
        {
          id: 'step-3',
          type: StepType.TRANSFORMATION,
          name: 'Process Results',
          description: 'Processes the query results',
          config: {
            language: 'javascript',
            code: '// Process results\nreturn { processed: true, results: data };'
          },
          position: { x: 800, y: 100 }
        }
      ],
      connections: [
        { source: 'step-1', target: 'step-2' },
        { source: 'step-2', target: 'step-3' }
      ]
    }
  }
];

export default function PipedreamPage() {
  // State
  const [workflows, setWorkflows] = useState<Workflow[]>(mockWorkflows);
  const [executions, setExecutions] = useState<WorkflowExecution[]>(mockExecutions);
  const [templates, setTemplates] = useState<WorkflowTemplate[]>(mockTemplates);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("integration");
  const [apiKey, setApiKey] = useState<string>("");
  const [apiUrl, setApiUrl] = useState<string>("https://api.pipedream.com/v1");

  // Load data
  const loadData = async () => {
    // In a real implementation, this would fetch data from the Pipedream API
    setIsLoading(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Use mock data for demonstration
      setWorkflows(mockWorkflows);
      setExecutions(mockExecutions);
      setTemplates(mockTemplates);
    } catch (err) {
      setError(`Failed to load data: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Save workflow
  const saveWorkflow = async (workflow: Workflow) => {
    // In a real implementation, this would save the workflow to the Pipedream API
    setIsLoading(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update workflows list
      setWorkflows(prev => {
        const index = prev.findIndex(w => w.id === workflow.id);
        if (index >= 0) {
          // Update existing workflow
          const updated = [...prev];
          updated[index] = workflow;
          return updated;
        } else {
          // Add new workflow
          return [...prev, workflow];
        }
      });
    } catch (err) {
      setError(`Failed to save workflow: ${err instanceof Error ? err.message : 'Unknown error'}`);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Delete workflow
  const deleteWorkflow = async (workflowId: string) => {
    // In a real implementation, this would delete the workflow from the Pipedream API
    setIsLoading(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Remove from workflows list
      setWorkflows(prev => prev.filter(w => w.id !== workflowId));

      // Remove associated executions
      setExecutions(prev => prev.filter(e => e.workflowId !== workflowId));
    } catch (err) {
      setError(`Failed to delete workflow: ${err instanceof Error ? err.message : 'Unknown error'}`);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Run workflow
  const runWorkflow = async (workflowId: string) => {
    // In a real implementation, this would run the workflow via the Pipedream API
    setIsLoading(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Create a new execution
      const workflow = workflows.find(w => w.id === workflowId);
      if (!workflow) throw new Error(`Workflow not found: ${workflowId}`);

      const newExecution: WorkflowExecution = {
        id: `exec-${Date.now()}`,
        workflowId,
        status: WorkflowExecutionStatus.COMPLETED,
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 30000).toISOString(),
        duration: 30000,
        steps: workflow.steps.map(step => ({
          id: `exec-${step.id}-${Date.now()}`,
          name: step.name,
          status: WorkflowExecutionStatus.COMPLETED,
          startTime: new Date().toISOString(),
          endTime: new Date(Date.now() + 5000).toISOString(),
          input: { step: step.id },
          output: { success: true }
        }))
      };

      // Add to executions list
      setExecutions(prev => [newExecution, ...prev]);

      return newExecution;
    } catch (err) {
      setError(`Failed to run workflow: ${err instanceof Error ? err.message : 'Unknown error'}`);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Save API settings
  const saveApiSettings = () => {
    // In a real implementation, this would save the API settings
    // For now, just show a success message
    alert('API settings saved successfully');
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <AnimatedGradientText className="text-3xl font-bold">
          Pipedream Integration
        </AnimatedGradientText>

        <div className="flex gap-2">
          <Tooltip content="View Pipedream Documentation">
            <a
              href="https://pipedream.com/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-white text-slate-700 border border-slate-200 rounded-md hover:bg-slate-50"
            >
              <Info size={16} />
            </a>
          </Tooltip>

          <Tooltip content="Open Pipedream Dashboard">
            <a
              href="https://pipedream.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-white text-slate-700 border border-slate-200 rounded-md hover:bg-slate-50"
            >
              <ExternalLink size={16} />
            </a>
          </Tooltip>

          <button
            onClick={() => setActiveTab(activeTab === "settings" ? "integration" : "settings")}
            className={`p-2 rounded-md ${
              activeTab === "settings"
                ? 'bg-indigo-100 text-indigo-700'
                : 'bg-white text-slate-700 border border-slate-200'
            }`}
          >
            <Settings size={16} />
          </button>

          <button
            onClick={loadData}
            className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 px-2 py-1 rounded-md hover:bg-gray-100"
            disabled={isLoading}
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <ErrorMessage
          title="Error"
          message={error}
          variant="error"
          onRetry={() => setError(null)}
        />
      )}

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1"
      >
        <TabsList>
          <TabsTrigger value="integration">Integration</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="integration" className="mt-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6">
              <PipedreamIntegrationManager
                initialWorkflows={workflows}
                initialExecutions={executions}
                initialTemplates={templates}
                onSaveWorkflow={saveWorkflow}
                onDeleteWorkflow={deleteWorkflow}
                onRunWorkflow={runWorkflow}
                onLoadWorkflows={loadData}
                knowledgeIntegration={true}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="mt-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Pipedream API Settings</h2>

              <div className="space-y-4 max-w-2xl">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">API Key</label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your Pipedream API key"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-xs text-slate-500">
                    You can find your API key in the Pipedream dashboard under Account Settings.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">API URL</label>
                  <input
                    type="text"
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                    placeholder="Enter the Pipedream API URL"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="pt-4">
                  <ShimmerButton
                    onClick={saveApiSettings}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md"
                  >
                    Save Settings
                  </ShimmerButton>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}