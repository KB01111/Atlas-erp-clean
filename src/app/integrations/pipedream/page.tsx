"use client";

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PipedreamIntegrationManager, { WorkflowExecution, WorkflowExecutionStatus, WorkflowTemplate } from '@/components/pipedream/PipedreamIntegrationManager';
import { Workflow } from '@/components/pipedream/PipedreamWorkflowBuilder';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorMessage } from '@/components/ui/error-message';
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text";
import { EnhancedActionButton } from "@/components/ui/enhanced-action-button";
import { Tooltip } from "@/components/ui/tooltip";
import {
  Settings,
  RefreshCw,
  Info,
  ExternalLink
} from 'lucide-react';

// Import mock data from separate files
import { mockWorkflows, mockExecutions } from '@/lib/mock-pipedream-data';
import { mockTemplates } from '@/lib/mock-pipedream-templates';

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
                  <EnhancedActionButton
                    onClick={saveApiSettings}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md"
                   variant="default" size="sm" hover="lift">
                    Save Settings
                  </EnhancedActionButton>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}