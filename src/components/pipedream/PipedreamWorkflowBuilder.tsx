"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { EnhancedCard } from "@/components/ui/enhanced-card";
import { BorderContainer } from "@/components/ui/shine-border";
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text";
import { EnhancedActionButton } from "@/components/ui/enhanced-action-button";
import { Tooltip } from "@/components/ui/tooltip";
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorMessage } from '@/components/ui/error-message';
import {
  Plus,
  Save,
  Play,
  Settings,
  X,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Database,
  FileText,
  MessageSquare,
  Code,
  Webhook,
  Clock,
  Mail,
  Zap,
  Trash,
  Copy,
  Edit,
  Download,
  Upload,
  Brain
} from 'lucide-react';

// Define workflow step types
export enum StepType {
  TRIGGER = 'trigger',
  ACTION = 'action',
  CONDITION = 'condition',
  TRANSFORMATION = 'transformation',
  KNOWLEDGE_NODE = 'knowledge_node'
}

// Define workflow step interface
export interface WorkflowStep {
  id: string;
  type: StepType;
  name: string;
  description?: string;
  config: Record<string, any>;
  position?: { x: number; y: number };
  nextSteps?: string[];
}

// Define workflow interface
export interface Workflow {
  id: string;
  name: string;
  description?: string;
  steps: WorkflowStep[];
  connections: { source: string; target: string }[];
  createdAt?: string;
  updatedAt?: string;
}

interface PipedreamWorkflowBuilderProps {
  initialWorkflow?: Workflow;
  onSave?: (workflow: Workflow) => Promise<void>;
  onRun?: (workflow: Workflow) => Promise<any>;
  onImport?: (workflow: Workflow) => void;
  readOnly?: boolean;
  knowledgeIntegration?: boolean;
}

export default function PipedreamWorkflowBuilder({
  initialWorkflow,
  onSave,
  onRun,
  onImport,
  readOnly = false,
  knowledgeIntegration = true
}: PipedreamWorkflowBuilderProps) {
  // Create a default workflow if none is provided
  const defaultWorkflow: Workflow = {
    id: `workflow-${Date.now()}`,
    name: 'New Workflow',
    description: 'A new workflow',
    steps: [],
    connections: []
  };

  // State
  const [workflow, setWorkflow] = useState<Workflow>(initialWorkflow || defaultWorkflow);
  const [selectedStep, setSelectedStep] = useState<WorkflowStep | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [draggedStep, setDraggedStep] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isCreatingConnection, setIsCreatingConnection] = useState<boolean>(false);
  const [connectionSource, setConnectionSource] = useState<string | null>(null);
  const [showStepLibrary, setShowStepLibrary] = useState<boolean>(false);
  const [workflowNameInput, setWorkflowNameInput] = useState<string>(workflow.name);
  const [workflowDescriptionInput, setWorkflowDescriptionInput] = useState<string>(workflow.description || '');
  const [isEditingWorkflowDetails, setIsEditingWorkflowDetails] = useState<boolean>(false);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);

  // Step templates
  const stepTemplates: Record<StepType, WorkflowStep[]> = {
    [StepType.TRIGGER]: [
      {
        id: `trigger-webhook-${Date.now()}`,
        type: StepType.TRIGGER,
        name: 'Webhook',
        description: 'Trigger workflow on HTTP request',
        config: {
          method: 'POST',
          path: '/webhook',
          requireAuth: false
        },
        nextSteps: []
      },
      {
        id: `trigger-schedule-${Date.now()}`,
        type: StepType.TRIGGER,
        name: 'Schedule',
        description: 'Trigger workflow on a schedule',
        config: {
          schedule: '0 0 * * *', // Daily at midnight
          timezone: 'UTC'
        },
        nextSteps: []
      }
    ],
    [StepType.ACTION]: [
      {
        id: `action-http-${Date.now()}`,
        type: StepType.ACTION,
        name: 'HTTP Request',
        description: 'Make an HTTP request',
        config: {
          method: 'GET',
          url: 'https://api.example.com',
          headers: {},
          body: {}
        },
        nextSteps: []
      },
      {
        id: `action-email-${Date.now()}`,
        type: StepType.ACTION,
        name: 'Send Email',
        description: 'Send an email notification',
        config: {
          to: '',
          subject: '',
          body: ''
        },
        nextSteps: []
      }
    ],
    [StepType.CONDITION]: [
      {
        id: `condition-if-${Date.now()}`,
        type: StepType.CONDITION,
        name: 'If Condition',
        description: 'Branch based on a condition',
        config: {
          condition: '',
          trueStep: null,
          falseStep: null
        },
        nextSteps: []
      }
    ],
    [StepType.TRANSFORMATION]: [
      {
        id: `transform-code-${Date.now()}`,
        type: StepType.TRANSFORMATION,
        name: 'Code',
        description: 'Transform data with custom code',
        config: {
          language: 'javascript',
          code: '// Transform data here\nreturn data;'
        },
        nextSteps: []
      }
    ],
    [StepType.KNOWLEDGE_NODE]: [
      {
        id: `knowledge-query-${Date.now()}`,
        type: StepType.KNOWLEDGE_NODE,
        name: 'Query Knowledge Graph',
        description: 'Search the knowledge graph',
        config: {
          query: '',
          nodeType: 'all',
          limit: 10
        },
        nextSteps: []
      },
      {
        id: `knowledge-create-${Date.now()}`,
        type: StepType.KNOWLEDGE_NODE,
        name: 'Create Knowledge Node',
        description: 'Add a node to the knowledge graph',
        config: {
          nodeType: 'concept',
          name: '',
          content: '',
          metadata: {}
        },
        nextSteps: []
      }
    ]
  };

  // Get step icon based on type and name
  const getStepIcon = (step: WorkflowStep) => {
    if (step.type === StepType.TRIGGER) {
      if (step.name.toLowerCase().includes('webhook')) return <Webhook size={20} />;
      if (step.name.toLowerCase().includes('schedule')) return <Clock size={20} />;
      return <Zap size={20} />;
    } else if (step.type === StepType.ACTION) {
      if (step.name.toLowerCase().includes('http')) return <ArrowRight size={20} />;
      if (step.name.toLowerCase().includes('email')) return <Mail size={20} />;
      return <Play size={20} />;
    } else if (step.type === StepType.CONDITION) {
      return <ChevronDown size={20} />;
    } else if (step.type === StepType.TRANSFORMATION) {
      return <Code size={20} />;
    } else if (step.type === StepType.KNOWLEDGE_NODE) {
      if (step.name.toLowerCase().includes('query')) return <Database size={20} />;
      if (step.name.toLowerCase().includes('create')) return <FileText size={20} />;
      return <Brain size={20} />;
    }
    return <Settings size={20} />;
  };

  // Get step color based on type
  const getStepColor = (type: StepType) => {
    switch (type) {
      case StepType.TRIGGER:
        return 'bg-blue-100 border-blue-300 text-blue-800';
      case StepType.ACTION:
        return 'bg-green-100 border-green-300 text-green-800';
      case StepType.CONDITION:
        return 'bg-amber-100 border-amber-300 text-amber-800';
      case StepType.TRANSFORMATION:
        return 'bg-purple-100 border-purple-300 text-purple-800';
      case StepType.KNOWLEDGE_NODE:
        return 'bg-indigo-100 border-indigo-300 text-indigo-800';
      default:
        return 'bg-slate-100 border-slate-300 text-slate-800';
    }
  };

  // Add a new step to the workflow
  const addStep = (template: WorkflowStep) => {
    const newStep = {
      ...template,
      id: `${template.type}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      position: { x: 100, y: 100 } // Default position
    };

    setWorkflow(prev => ({
      ...prev,
      steps: [...prev.steps, newStep]
    }));

    setSelectedStep(newStep);
    setShowStepLibrary(false);
  };

  // Remove a step from the workflow
  const removeStep = (stepId: string) => {
    // Remove the step
    const updatedSteps = workflow.steps.filter(step => step.id !== stepId);

    // Remove any connections involving this step
    const updatedConnections = workflow.connections.filter(
      conn => conn.source !== stepId && conn.target !== stepId
    );

    setWorkflow(prev => ({
      ...prev,
      steps: updatedSteps,
      connections: updatedConnections
    }));

    if (selectedStep?.id === stepId) {
      setSelectedStep(null);
    }
  };

  // Update a step's configuration
  const updateStepConfig = (stepId: string, config: Record<string, any>) => {
    const updatedSteps = workflow.steps.map(step =>
      step.id === stepId ? { ...step, config: { ...step.config, ...config } } : step
    );

    setWorkflow(prev => ({
      ...prev,
      steps: updatedSteps
    }));

    if (selectedStep?.id === stepId) {
      const updatedStep = updatedSteps.find(step => step.id === stepId);
      if (updatedStep) {
        setSelectedStep(updatedStep);
      }
    }
  };

  // Create a connection between steps
  const createConnection = (sourceId: string, targetId: string) => {
    // Check if connection already exists
    const connectionExists = workflow.connections.some(
      conn => conn.source === sourceId && conn.target === targetId
    );

    if (connectionExists) return;

    // Add the new connection
    setWorkflow(prev => ({
      ...prev,
      connections: [...prev.connections, { source: sourceId, target: targetId }]
    }));
  };

  // Remove a connection
  const removeConnection = (sourceId: string, targetId: string) => {
    const updatedConnections = workflow.connections.filter(
      conn => !(conn.source === sourceId && conn.target === targetId)
    );

    setWorkflow(prev => ({
      ...prev,
      connections: updatedConnections
    }));
  };

  // Handle mouse down on a step (start dragging)
  const handleStepMouseDown = (e: React.MouseEvent, stepId: string) => {
    if (readOnly) return;

    // Prevent default to avoid text selection
    e.preventDefault();

    // Get the step element
    const stepElement = e.currentTarget as HTMLElement;
    const rect = stepElement.getBoundingClientRect();

    // Calculate offset from mouse position to step top-left corner
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    setIsDragging(true);
    setDraggedStep(stepId);
    setDragOffset({ x: offsetX, y: offsetY });
  };

  // Handle mouse move (dragging a step)
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !draggedStep || readOnly) return;

    // Get container position
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return;

    // Calculate new position relative to container
    const x = e.clientX - containerRect.left - dragOffset.x;
    const y = e.clientY - containerRect.top - dragOffset.y;

    // Update step position
    const updatedSteps = workflow.steps.map(step =>
      step.id === draggedStep
        ? { ...step, position: { x, y } }
        : step
    );

    setWorkflow(prev => ({
      ...prev,
      steps: updatedSteps
    }));
  };

  // Handle mouse up (stop dragging)
  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggedStep(null);

    if (isCreatingConnection && connectionSource) {
      setIsCreatingConnection(false);
      setConnectionSource(null);
    }
  };

  // Start creating a connection
  const startConnection = (stepId: string) => {
    if (readOnly) return;

    setIsCreatingConnection(true);
    setConnectionSource(stepId);
  };

  // Complete a connection
  const completeConnection = (targetId: string) => {
    if (!connectionSource || connectionSource === targetId || readOnly) return;

    createConnection(connectionSource, targetId);
    setIsCreatingConnection(false);
    setConnectionSource(null);
  };

  // Save the workflow
  const saveWorkflow = async () => {
    if (!onSave || readOnly) return;

    setIsLoading(true);
    setError(null);

    try {
      await onSave(workflow);
    } catch (err) {
      setError(`Failed to save workflow: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Run the workflow
  const runWorkflow = async () => {
    if (!onRun) return;

    setIsLoading(true);
    setError(null);

    try {
      await onRun(workflow);
    } catch (err) {
      setError(`Failed to run workflow: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Export workflow as JSON
  const exportWorkflow = () => {
    const json = JSON.stringify(workflow, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${workflow.name.replace(/\s+/g, '-').toLowerCase()}.json`;
    a.click();

    URL.revokeObjectURL(url);
  };

  // Import workflow from JSON file
  const importWorkflow = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);

        // Validate the imported workflow
        if (!json.id || !json.name || !Array.isArray(json.steps) || !Array.isArray(json.connections)) {
          throw new Error('Invalid workflow format');
        }

        // Update the workflow
        setWorkflow(json);
        setWorkflowNameInput(json.name);
        setWorkflowDescriptionInput(json.description || '');

        // Notify parent component
        if (onImport) {
          onImport(json);
        }
      } catch (err) {
        setError(`Failed to import workflow: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    };

    reader.readAsText(file);
  };

  // Update workflow details
  const updateWorkflowDetails = () => {
    setWorkflow(prev => ({
      ...prev,
      name: workflowNameInput,
      description: workflowDescriptionInput,
      updatedAt: new Date().toISOString()
    }));

    setIsEditingWorkflowDetails(false);
  };

  // Render the workflow canvas
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

      {/* Workflow header */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          {isEditingWorkflowDetails ? (
            <div className="flex-1 flex flex-col gap-2">
              <input
                type="text"
                value={workflowNameInput}
                onChange={(e) => setWorkflowNameInput(e.target.value)}
                className="text-xl font-bold px-2 py-1 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Workflow Name"
              />
              <input
                type="text"
                value={workflowDescriptionInput}
                onChange={(e) => setWorkflowDescriptionInput(e.target.value)}
                className="text-sm px-2 py-1 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Workflow Description"
              />
              <div className="flex gap-2">
                <EnhancedActionButton
                  onClick={updateWorkflowDetails}
                  className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-md"
                 variant="default" size="sm" hover="lift">
                  Save Details
                </EnhancedActionButton>
                <button
                  onClick={() => setIsEditingWorkflowDetails(false)}
                  className="px-3 py-1 text-sm text-slate-600 bg-slate-100 rounded-md"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1">
              <AnimatedGradientText className="text-xl font-bold">
                {workflow.name}
              </AnimatedGradientText>
              {workflow.description && (
                <p className="text-sm text-slate-500">{workflow.description}</p>
              )}
              {!readOnly && (
                <button
                  onClick={() => setIsEditingWorkflowDetails(true)}
                  className="text-xs text-indigo-600 hover:text-indigo-800 mt-1"
                >
                  Edit Details
                </button>
              )}
            </div>
          )}

          <div className="flex gap-2">
            {!readOnly && (
              <>
                <EnhancedActionButton
                  onClick={() = variant="default" size="sm" hover="lift"> setShowStepLibrary(!showStepLibrary)}
                  className={`px-3 py-2 text-sm ${
                    showStepLibrary
                      ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                      : 'bg-indigo-600 text-white'
                  } rounded-md flex items-center gap-1`}
                >
                  <Plus size={16} />
                  <span>Add Step</span>
                </EnhancedActionButton>

                <EnhancedActionButton
                  onClick={saveWorkflow}
                  disabled={isLoading}
                  className="px-3 py-2 text-sm bg-green-600 text-white rounded-md flex items-center gap-1"
                 variant="default" size="sm" hover="lift">
                  <Save size={16} />
                  <span>Save</span>
                </EnhancedActionButton>
              </>
            )}

            {onRun && (
              <EnhancedActionButton
                onClick={runWorkflow}
                disabled={isLoading || workflow.steps.length === 0}
                className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md flex items-center gap-1"
               variant="default" size="sm" hover="lift">
                <Play size={16} />
                <span>Run</span>
              </EnhancedActionButton>
            )}

            <Tooltip content="Export Workflow">
              <button
                onClick={exportWorkflow}
                className="p-2 bg-white text-slate-700 border border-slate-200 rounded-md hover:bg-slate-50"
              >
                <Download size={16} />
              </button>
            </Tooltip>

            {!readOnly && (
              <Tooltip content="Import Workflow">
                <label className="p-2 bg-white text-slate-700 border border-slate-200 rounded-md hover:bg-slate-50 cursor-pointer">
                  <Upload size={16} />
                  <input
                    type="file"
                    accept=".json"
                    onChange={importWorkflow}
                    className="hidden"
                  />
                </label>
              </Tooltip>
            )}
          </div>
        </div>
      </div>

      {/* Step library panel */}
      {showStepLibrary && !readOnly && (
        <div className="mb-4 p-4 bg-slate-50 rounded-lg border border-slate-200 animate-in fade-in duration-200">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-medium">Step Library</h3>
            <button
              onClick={() => setShowStepLibrary(false)}
              className="text-slate-500 hover:text-slate-700"
            >
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(stepTemplates).map(([type, templates]) => (
              <div key={type} className="space-y-2">
                <h4 className="text-sm font-medium text-slate-700 capitalize">{type} Steps</h4>
                {templates.map(template => (
                  <div
                    key={template.id}
                    className={`p-3 rounded-md border cursor-pointer hover:shadow-md transition-shadow ${getStepColor(template.type)}`}
                    onClick={() => addStep(template)}
                  >
                    <div className="flex items-center gap-2">
                      {getStepIcon(template)}
                      <span className="font-medium">{template.name}</span>
                    </div>
                    {template.description && (
                      <p className="text-xs mt-1 text-slate-600">{template.description}</p>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main workflow canvas */}
      <div className="flex-1 relative">
        <EnhancedCard className="h-full overflow-hidden" interactive hoverEffect="shadow">
          <BorderContainer borderRadius="0.75rem" className="p-0.5 h-full" variant="primary" rounded="xl">
            <div
              ref={containerRef}
              className="bg-white dark:bg-gray-900 rounded-xl shadow-sm overflow-hidden h-full relative p-4"
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {isLoading ? (
                <LoadingState message="Processing workflow..." variant="card" size="large" />
              ) : workflow.steps.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-500">
                  <Zap size={48} className="mb-4 opacity-30" />
                  <p className="text-lg font-medium">No steps in this workflow</p>
                  {!readOnly && (
                    <p className="text-sm">
                      Click "Add Step" to start building your workflow
                    </p>
                  )}
                </div>
              ) : (
                <>
                  {/* Render connections */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    {workflow.connections.map(conn => {
                      const sourceStep = workflow.steps.find(step => step.id === conn.source);
                      const targetStep = workflow.steps.find(step => step.id === conn.target);

                      if (!sourceStep?.position || !targetStep?.position) return null;

                      // Calculate connection points
                      const sourceX = sourceStep.position.x + 150; // Right center of source
                      const sourceY = sourceStep.position.y + 50; // Middle of source
                      const targetX = targetStep.position.x; // Left center of target
                      const targetY = targetStep.position.y + 50; // Middle of target

                      // Calculate control points for curved line
                      const controlPointX1 = sourceX + 50;
                      const controlPointX2 = targetX - 50;

                      return (
                        <g key={`${conn.source}-${conn.target}`}>
                          <path
                            d={`M ${sourceX} ${sourceY} C ${controlPointX1} ${sourceY}, ${controlPointX2} ${targetY}, ${targetX} ${targetY}`}
                            stroke="#6366f1"
                            strokeWidth="2"
                            fill="none"
                            markerEnd="url(#arrowhead)"
                          />
                          {!readOnly && (
                            <circle
                              cx={(sourceX + targetX) / 2}
                              cy={(sourceY + targetY) / 2}
                              r="6"
                              fill="#ef4444"
                              className="cursor-pointer pointer-events-auto"
                              onClick={() => removeConnection(conn.source, conn.target)}
                            />
                          )}
                        </g>
                      );
                    })}

                    {/* Arrow marker definition */}
                    <defs>
                      <marker
                        id="arrowhead"
                        markerWidth="10"
                        markerHeight="7"
                        refX="9"
                        refY="3.5"
                        orient="auto"
                      >
                        <polygon points="0 0, 10 3.5, 0 7" fill="#6366f1" />
                      </marker>
                    </defs>
                  </svg>

                  {/* Render steps */}
                  {workflow.steps.map(step => (
                    <div
                      key={step.id}
                      className={`absolute w-[300px] rounded-md border shadow-sm p-4 ${getStepColor(step.type)} ${
                        selectedStep?.id === step.id ? 'ring-2 ring-indigo-500' : ''
                      }`}
                      style={{
                        left: `${step.position?.x || 0}px`,
                        top: `${step.position?.y || 0}px`,
                        cursor: readOnly ? 'default' : 'move'
                      }}
                      onMouseDown={e => handleStepMouseDown(e, step.id)}
                      onClick={() => setSelectedStep(step)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          {getStepIcon(step)}
                          <span className="font-medium">{step.name}</span>
                        </div>
                        {!readOnly && (
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              removeStep(step.id);
                            }}
                            className="text-slate-500 hover:text-red-500"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>

                      {/* Step configuration summary */}
                      <div className="text-xs text-slate-600 mb-2">
                        {Object.entries(step.config).slice(0, 3).map(([key, value]) => (
                          <div key={key} className="truncate">
                            <span className="font-medium">{key}:</span>{' '}
                            {typeof value === 'string' ? value : JSON.stringify(value)}
                          </div>
                        ))}
                        {Object.keys(step.config).length > 3 && (
                          <div className="text-slate-500">+ {Object.keys(step.config).length - 3} more</div>
                        )}
                      </div>

                      {/* Connection points */}
                      {!readOnly && (
                        <div className="flex justify-between mt-2">
                          <div className="flex gap-2">
                            <Tooltip content="Edit Configuration">
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  setSelectedStep(step);
                                }}
                                className="p-1 bg-white rounded-md text-slate-600 hover:text-indigo-600"
                              >
                                <Settings size={14} />
                              </button>
                            </Tooltip>
                            <Tooltip content="Duplicate Step">
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  const newStep = {
                                    ...step,
                                    id: `${step.type}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                                    position: {
                                      x: (step.position?.x || 0) + 20,
                                      y: (step.position?.y || 0) + 20
                                    }
                                  };
                                  setWorkflow(prev => ({
                                    ...prev,
                                    steps: [...prev.steps, newStep]
                                  }));
                                }}
                                className="p-1 bg-white rounded-md text-slate-600 hover:text-indigo-600"
                              >
                                <Copy size={14} />
                              </button>
                            </Tooltip>
                          </div>
                          <Tooltip content="Connect to Another Step">
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                startConnection(step.id);
                              }}
                              className={`p-1 rounded-full ${
                                connectionSource === step.id
                                  ? 'bg-indigo-500 text-white'
                                  : 'bg-white text-slate-600 hover:text-indigo-600'
                              }`}
                            >
                              <ArrowRight size={14} />
                            </button>
                          </Tooltip>
                        </div>
                      )}

                      {/* Connection target indicator */}
                      {isCreatingConnection && connectionSource !== step.id && !readOnly && (
                        <div
                          className="absolute inset-0 bg-indigo-100 bg-opacity-50 flex items-center justify-center rounded-md cursor-pointer"
                          onClick={e => {
                            e.stopPropagation();
                            completeConnection(step.id);
                          }}
                        >
                          <div className="bg-indigo-500 text-white px-3 py-1 rounded-md text-sm">
                            Connect Here
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>
          </BorderContainer>
        </EnhancedCard>
      </div>

      {/* Step configuration panel */}
      {selectedStep && !readOnly && (
        <div className="mt-4">
          <EnhancedCard className="overflow-hidden" interactive hoverEffect="shadow">
            <BorderContainer borderRadius="0.75rem" className="p-0.5" variant="primary" rounded="xl">
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm overflow-hidden p-4">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    {getStepIcon(selectedStep)}
                    <h3 className="text-lg font-medium">{selectedStep.name} Configuration</h3>
                  </div>
                  <button
                    onClick={() => setSelectedStep(null)}
                    className="text-slate-500 hover:text-slate-700"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-4">
                  {Object.entries(selectedStep.config).map(([key, value]) => (
                    <div key={key} className="space-y-1">
                      <label className="text-sm font-medium text-slate-700">
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                      </label>
                      {typeof value === 'string' ? (
                        <input
                          type="text"
                          value={value}
                          onChange={e => updateStepConfig(selectedStep.id, { [key]: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      ) : typeof value === 'number' ? (
                        <input
                          type="number"
                          value={value}
                          onChange={e => updateStepConfig(selectedStep.id, { [key]: Number(e.target.value) })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      ) : typeof value === 'boolean' ? (
                        <select
                          value={value.toString()}
                          onChange={e => updateStepConfig(selectedStep.id, { [key]: e.target.value === 'true' })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="true">True</option>
                          <option value="false">False</option>
                        </select>
                      ) : (
                        <textarea
                          value={JSON.stringify(value, null, 2)}
                          onChange={e => {
                            try {
                              const parsed = JSON.parse(e.target.value);
                              updateStepConfig(selectedStep.id, { [key]: parsed });
                            } catch (err) {
                              // Ignore parsing errors while typing
                            }
                          }}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                          rows={5}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </BorderContainer>
          </EnhancedCard>
        </div>
      )}
    </div>
  );
}
