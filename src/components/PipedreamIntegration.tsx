"use client";

import React, { useState, useEffect } from 'react';
import { EnhancedCard } from "@/components/ui/enhanced-card";
import { BorderContainer } from "@/components/ui/shine-border";
import { EnhancedActionButton } from "@/components/ui/enhanced-action-button";
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text";
import { Tooltip } from "@/components/ui/tooltip";
import { 
  Plus, 
  RefreshCw, 
  Trash2, 
  Edit, 
  Play, 
  Pause, 
  ExternalLink, 
  Info, 
  AlertCircle, 
  CheckCircle, 
  Loader2 
} from 'lucide-react';

interface PipedreamWorkflow {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

interface PipedreamSource {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  type: string;
  metadata?: Record<string, any>;
}

interface PipedreamIntegrationProps {
  className?: string;
}

export default function PipedreamIntegration({ className = '' }: PipedreamIntegrationProps) {
  const [workflows, setWorkflows] = useState<PipedreamWorkflow[]>([]);
  const [sources, setSources] = useState<PipedreamSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useMockService, setUseMockService] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<PipedreamWorkflow | null>(null);
  const [selectedSource, setSelectedSource] = useState<PipedreamSource | null>(null);
  const [showWorkflowModal, setShowWorkflowModal] = useState(false);
  const [showSourceModal, setShowSourceModal] = useState(false);
  const [triggerData, setTriggerData] = useState('{\n  "key": "value"\n}');
  const [showTriggerModal, setShowTriggerModal] = useState(false);
  const [triggerLoading, setTriggerLoading] = useState(false);
  const [triggerResult, setTriggerResult] = useState<any>(null);

  // Fetch Pipedream integrations
  const fetchIntegrations = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/integrations/pipedream');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch Pipedream integrations: ${response.statusText}`);
      }

      const data = await response.json();
      
      setWorkflows(data.workflows || []);
      setSources(data.sources || []);
      setUseMockService(data.useMockService || false);
    } catch (error) {
      console.error('Error fetching Pipedream integrations:', error);
      setError('Failed to fetch Pipedream integrations. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Trigger a workflow
  const triggerWorkflow = async (workflowId: string) => {
    try {
      setTriggerLoading(true);
      setTriggerResult(null);

      let data;
      try {
        data = JSON.parse(triggerData);
      } catch (e) {
        throw new Error('Invalid JSON data. Please check your input.');
      }

      const response = await fetch('/api/integrations/pipedream/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workflowId,
          data,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to trigger workflow: ${response.statusText}`);
      }

      const result = await response.json();
      setTriggerResult(result);
    } catch (error) {
      console.error('Error triggering workflow:', error);
      setTriggerResult({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setTriggerLoading(false);
    }
  };

  // Load integrations on component mount
  useEffect(() => {
    fetchIntegrations();
  }, []);

  // Format date string
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <AnimatedGradientText className="text-2xl font-bold">
            Pipedream Integration
          </AnimatedGradientText>
          <p className="text-muted-foreground mt-1">
            Connect Atlas-ERP to external services and automate workflows with Pipedream
          </p>
        </div>
        <div className="flex gap-2">
          <Tooltip content="Refresh Integrations">
            <button
              onClick={fetchIntegrations}
              className="p-2 rounded-md bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
              disabled={loading}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            </button>
          </Tooltip>
          <EnhancedActionButton
            onClick={() = variant="default" size="sm" hover="lift"> setShowWorkflowModal(true)}
            className="px-3 py-2 bg-indigo-600 text-white rounded-md"
          >
            <Plus size={16} className="mr-1" />
            New Workflow
          </EnhancedActionButton>
        </div>
      </div>

      {/* Mock service notice */}
      {useMockService && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-3 flex items-center gap-2 text-amber-800">
          <Info size={16} />
          <p className="text-sm">
            Using mock Pipedream service. Connect to a real Pipedream account for production use.
          </p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-center gap-2 text-red-800">
          <AlertCircle size={16} />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Workflows section */}
      <div>
        <h2 className="text-lg font-medium mb-3">Workflows</h2>
        
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 size={24} className="animate-spin text-indigo-600" />
          </div>
        ) : workflows.length === 0 ? (
          <div className="bg-slate-50 rounded-md p-6 text-center">
            <p className="text-slate-500">No workflows found</p>
            <EnhancedActionButton
              onClick={() = variant="default" size="sm" hover="lift"> setShowWorkflowModal(true)}
              className="mt-3 px-3 py-2 bg-indigo-600 text-white rounded-md"
            >
              <Plus size={16} className="mr-1" />
              Create Workflow
            </EnhancedActionButton>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workflows.map((workflow) => (
              <EnhancedCard key={workflow.id} className="overflow-hidden" interactive hoverEffect="shadow">
                <BorderContainer borderRadius="0.75rem" className="p-0.5" variant="primary" rounded="xl">
                  <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm overflow-hidden p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-base truncate" title={workflow.name}>
                        {workflow.name}
                      </h3>
                      <div className="flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${workflow.active ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                        <span className="text-xs text-muted-foreground">
                          {workflow.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    
                    {workflow.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2" title={workflow.description}>
                        {workflow.description}
                      </p>
                    )}
                    
                    <div className="text-xs text-muted-foreground mb-3">
                      <div>Created: {formatDate(workflow.created_at)}</div>
                      <div>Updated: {formatDate(workflow.updated_at)}</div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex gap-1">
                        <Tooltip content="Edit Workflow">
                          <button
                            onClick={() => {
                              setSelectedWorkflow(workflow);
                              setShowWorkflowModal(true);
                            }}
                            className="p-1.5 rounded-md bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                          >
                            <Edit size={14} />
                          </button>
                        </Tooltip>
                        <Tooltip content="Delete Workflow">
                          <button
                            onClick={() => {
                              // Implement delete workflow
                              if (confirm(`Are you sure you want to delete the workflow "${workflow.name}"?`)) {
                                // Delete workflow
                              }
                            }}
                            className="p-1.5 rounded-md bg-white text-red-600 border border-slate-200 hover:bg-red-50"
                          >
                            <Trash2 size={14} />
                          </button>
                        </Tooltip>
                      </div>
                      <div>
                        <Tooltip content="Trigger Workflow">
                          <button
                            onClick={() => {
                              setSelectedWorkflow(workflow);
                              setShowTriggerModal(true);
                            }}
                            className="p-1.5 rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
                          >
                            <Play size={14} />
                          </button>
                        </Tooltip>
                      </div>
                    </div>
                  </div>
                </BorderContainer>
              </EnhancedCard>
            ))}
          </div>
        )}
      </div>

      {/* Sources section */}
      <div>
        <h2 className="text-lg font-medium mb-3">Sources</h2>
        
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 size={24} className="animate-spin text-indigo-600" />
          </div>
        ) : sources.length === 0 ? (
          <div className="bg-slate-50 rounded-md p-6 text-center">
            <p className="text-slate-500">No sources found</p>
            <EnhancedActionButton
              onClick={() = variant="default" size="sm" hover="lift"> setShowSourceModal(true)}
              className="mt-3 px-3 py-2 bg-indigo-600 text-white rounded-md"
            >
              <Plus size={16} className="mr-1" />
              Create Source
            </EnhancedActionButton>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sources.map((source) => (
              <EnhancedCard key={source.id} className="overflow-hidden" interactive hoverEffect="shadow">
                <BorderContainer borderRadius="0.75rem" className="p-0.5" variant="primary" rounded="xl">
                  <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm overflow-hidden p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-base truncate" title={source.name}>
                        {source.name}
                      </h3>
                      <div className="flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${source.active ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                        <span className="text-xs text-muted-foreground">
                          {source.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    
                    {source.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2" title={source.description}>
                        {source.description}
                      </p>
                    )}
                    
                    <div className="text-xs text-muted-foreground mb-3">
                      <div>Type: {source.type}</div>
                      <div>Created: {formatDate(source.created_at)}</div>
                      <div>Updated: {formatDate(source.updated_at)}</div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex gap-1">
                        <Tooltip content="Edit Source">
                          <button
                            onClick={() => {
                              setSelectedSource(source);
                              setShowSourceModal(true);
                            }}
                            className="p-1.5 rounded-md bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                          >
                            <Edit size={14} />
                          </button>
                        </Tooltip>
                        <Tooltip content="Delete Source">
                          <button
                            onClick={() => {
                              // Implement delete source
                              if (confirm(`Are you sure you want to delete the source "${source.name}"?`)) {
                                // Delete source
                              }
                            }}
                            className="p-1.5 rounded-md bg-white text-red-600 border border-slate-200 hover:bg-red-50"
                          >
                            <Trash2 size={14} />
                          </button>
                        </Tooltip>
                      </div>
                    </div>
                  </div>
                </BorderContainer>
              </EnhancedCard>
            ))}
          </div>
        )}
      </div>

      {/* Trigger Workflow Modal */}
      {showTriggerModal && selectedWorkflow && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-lg p-6">
            <h2 className="text-xl font-medium mb-4">Trigger Workflow: {selectedWorkflow.name}</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trigger Data (JSON)
              </label>
              <textarea
                value={triggerData}
                onChange={(e) => setTriggerData(e.target.value)}
                className="w-full h-32 p-2 border border-gray-300 rounded-md font-mono text-sm"
                placeholder="Enter JSON data to send to the workflow"
              />
            </div>

            {triggerResult && (
              <div className="mb-4 p-3 bg-gray-50 rounded-md">
                <h3 className="text-sm font-medium mb-1">Result:</h3>
                <pre className="text-xs overflow-auto max-h-32">
                  {JSON.stringify(triggerResult, null, 2)}
                </pre>
              </div>
            )}
            
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowTriggerModal(false);
                  setSelectedWorkflow(null);
                  setTriggerData('{\n  "key": "value"\n}');
                  setTriggerResult(null);
                }}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                Cancel
              </button>
              <EnhancedActionButton
                onClick={() = variant="default" size="sm" hover="lift"> triggerWorkflow(selectedWorkflow.id)}
                className="px-3 py-2 bg-indigo-600 text-white rounded-md text-sm"
                disabled={triggerLoading}
              >
                {triggerLoading ? (
                  <>
                    <Loader2 size={14} className="animate-spin mr-1" />
                    Triggering...
                  </>
                ) : (
                  <>
                    <Play size={14} className="mr-1" />
                    Trigger Workflow
                  </>
                )}
              </EnhancedActionButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
