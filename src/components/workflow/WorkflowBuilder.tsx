"use client";

import React, { useState, useEffect, useRef } from 'react';
import { MagicCard } from "@/components/magicui/magic-card";
import { ShineBorder } from "@/components/ui/shine-border";
import { ShimmerButton } from "@/components/magicui/shimmer-button";
import { WorkflowNode, WorkflowEdge } from '@/lib/workflow-service';
import { Plus, Trash, ArrowRight, Settings, Play, Clock } from 'lucide-react';

interface WorkflowBuilderProps {
  workflow: {
    id: string;
    name: string;
    description: string;
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
  };
  onChange: (workflow: any) => void;
  onExecute?: (workflowId: string, options?: { useTemporal?: boolean }) => void;
  readOnly?: boolean;
}

export default function WorkflowBuilder({
  workflow,
  onChange,
  onExecute,
  readOnly = false,
}: WorkflowBuilderProps) {
  const [nodes, setNodes] = useState<WorkflowNode[]>(workflow.nodes || []);
  const [edges, setEdges] = useState<WorkflowEdge[]>(workflow.edges || []);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>({});
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isEditingNodeName, setIsEditingNodeName] = useState<string | null>(null);
  const [editingNodeValue, setEditingNodeValue] = useState('');
  const [isEditingEdgeLabel, setIsEditingEdgeLabel] = useState<string | null>(null);
  const [editingEdgeValue, setEditingEdgeValue] = useState('');

  // Initialize node positions
  useEffect(() => {
    const positions: Record<string, { x: number; y: number }> = {};

    // Use existing positions if available
    workflow.nodes.forEach(node => {
      if (node.position) {
        positions[node.id] = node.position;
      } else {
        // Default position in a grid layout
        const index = workflow.nodes.indexOf(node);
        const row = Math.floor(index / 3);
        const col = index % 3;
        positions[node.id] = {
          x: 150 + col * 250,
          y: 100 + row * 200,
        };
      }
    });

    setNodePositions(positions);
  }, [workflow.nodes]);

  // Update parent component when nodes or edges change
  useEffect(() => {
    if (readOnly) return;

    // Create updated nodes with positions
    const updatedNodes = nodes.map(node => ({
      ...node,
      position: nodePositions[node.id] || { x: 0, y: 0 },
    }));

    onChange({
      ...workflow,
      nodes: updatedNodes,
      edges,
    });
  }, [nodes, edges, nodePositions, readOnly, onChange, workflow]);

  // Update canvas size based on container
  useEffect(() => {
    if (!canvasRef.current) return;

    const updateSize = () => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      setCanvasSize({
        width: rect.width,
        height: rect.height,
      });
    };

    updateSize();
    window.addEventListener('resize', updateSize);

    return () => {
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  // Add a new node
  const addNode = (type: 'agent' | 'condition' | 'transform' | 'input' | 'output') => {
    if (readOnly) return;

    const newNode: WorkflowNode = {
      id: `node-${Date.now()}`,
      type,
      name: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      position: {
        x: canvasSize.width / 2,
        y: canvasSize.height / 2,
      },
    };

    setNodes([...nodes, newNode]);
    setNodePositions({
      ...nodePositions,
      [newNode.id]: newNode.position!,
    });
    setSelectedNode(newNode.id);
  };

  // Remove a node
  const removeNode = (nodeId: string) => {
    if (readOnly) return;

    setNodes(nodes.filter(node => node.id !== nodeId));
    setEdges(edges.filter(edge => edge.source !== nodeId && edge.target !== nodeId));

    if (selectedNode === nodeId) {
      setSelectedNode(null);
    }
  };

  // Add an edge
  const addEdge = (source: string, target: string) => {
    if (readOnly) return;

    // Prevent self-connections
    if (source === target) return;

    // Prevent duplicate connections
    if (edges.some(edge => edge.source === source && edge.target === target)) return;

    const newEdge: WorkflowEdge = {
      id: `edge-${Date.now()}`,
      source,
      target,
      label: '',
    };

    setEdges([...edges, newEdge]);
    setSelectedEdge(newEdge.id);
  };

  // Remove an edge
  const removeEdge = (edgeId: string) => {
    if (readOnly) return;

    setEdges(edges.filter(edge => edge.id !== edgeId));

    if (selectedEdge === edgeId) {
      setSelectedEdge(null);
    }
  };

  // Handle mouse down on a node
  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    if (readOnly) return;

    e.stopPropagation();
    setSelectedNode(nodeId);
    setSelectedEdge(null);

    // Start dragging
    setDraggingNode(nodeId);
    const nodePosition = nodePositions[nodeId] || { x: 0, y: 0 };
    setDragOffset({
      x: e.clientX - nodePosition.x,
      y: e.clientY - nodePosition.y,
    });
  };

  // Handle mouse move
  const handleMouseMove = (e: React.MouseEvent) => {
    if (readOnly) return;

    if (draggingNode) {
      const canvasRect = canvasRef.current?.getBoundingClientRect();
      if (!canvasRect) return;

      const x = e.clientX - canvasRect.left - dragOffset.x;
      const y = e.clientY - canvasRect.top - dragOffset.y;

      setNodePositions({
        ...nodePositions,
        [draggingNode]: { x, y },
      });
    }
  };

  // Handle mouse up
  const handleMouseUp = () => {
    if (readOnly) return;

    setDraggingNode(null);

    if (connectingFrom) {
      setConnectingFrom(null);
    }
  };

  // Handle canvas click
  const handleCanvasClick = () => {
    setSelectedNode(null);
    setSelectedEdge(null);
  };

  // Start connecting nodes
  const handleStartConnecting = (e: React.MouseEvent, nodeId: string) => {
    if (readOnly) return;

    e.stopPropagation();
    setConnectingFrom(nodeId);
  };

  // End connecting nodes
  const handleEndConnecting = (e: React.MouseEvent, nodeId: string) => {
    if (readOnly) return;

    e.stopPropagation();

    if (connectingFrom) {
      addEdge(connectingFrom, nodeId);
      setConnectingFrom(null);
    }
  };

  // Handle node name edit
  const handleNodeNameEdit = (nodeId: string) => {
    if (readOnly) return;

    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    setIsEditingNodeName(nodeId);
    setEditingNodeValue(node.name);
  };

  // Save node name
  const saveNodeName = () => {
    if (!isEditingNodeName) return;

    setNodes(nodes.map(node =>
      node.id === isEditingNodeName
        ? { ...node, name: editingNodeValue }
        : node
    ));

    setIsEditingNodeName(null);
  };

  // Handle edge label edit
  const handleEdgeLabelEdit = (edgeId: string) => {
    if (readOnly) return;

    const edge = edges.find(e => e.id === edgeId);
    if (!edge) return;

    setIsEditingEdgeLabel(edgeId);
    setEditingEdgeValue(edge.label || '');
  };

  // Save edge label
  const saveEdgeLabel = () => {
    if (!isEditingEdgeLabel) return;

    setEdges(edges.map(edge =>
      edge.id === isEditingEdgeLabel
        ? { ...edge, label: editingEdgeValue }
        : edge
    ));

    setIsEditingEdgeLabel(null);
  };

  // Get node color based on type
  const getNodeColor = (type: string) => {
    switch (type) {
      case 'agent':
        return 'bg-blue-500';
      case 'condition':
        return 'bg-amber-500';
      case 'transform':
        return 'bg-purple-500';
      case 'input':
        return 'bg-green-500';
      case 'output':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Get node icon based on type
  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'agent':
        return <div className="w-4 h-4 rounded-full bg-blue-200"></div>;
      case 'condition':
        return <div className="w-4 h-4 transform rotate-45 bg-amber-200"></div>;
      case 'transform':
        return <div className="w-4 h-4 transform rotate-45 bg-purple-200"></div>;
      case 'input':
        return <div className="w-0 h-0 border-t-8 border-t-transparent border-r-8 border-r-green-200 border-b-8 border-b-transparent"></div>;
      case 'output':
        return <div className="w-0 h-0 border-t-8 border-t-transparent border-l-8 border-l-red-200 border-b-8 border-b-transparent"></div>;
      default:
        return <div className="w-4 h-4 rounded-full bg-gray-200"></div>;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {!readOnly && (
        <div className="mb-4 flex gap-2">
          <ShimmerButton
            onClick={() => addNode('input')}
            className="px-2 py-1 text-sm bg-green-500 text-white rounded-md"
          >
            <Plus size={14} className="mr-1" />
            Input
          </ShimmerButton>
          <ShimmerButton
            onClick={() => addNode('agent')}
            className="px-2 py-1 text-sm bg-blue-500 text-white rounded-md"
          >
            <Plus size={14} className="mr-1" />
            Agent
          </ShimmerButton>
          <ShimmerButton
            onClick={() => addNode('condition')}
            className="px-2 py-1 text-sm bg-amber-500 text-white rounded-md"
          >
            <Plus size={14} className="mr-1" />
            Condition
          </ShimmerButton>
          <ShimmerButton
            onClick={() => addNode('transform')}
            className="px-2 py-1 text-sm bg-purple-500 text-white rounded-md"
          >
            <Plus size={14} className="mr-1" />
            Transform
          </ShimmerButton>
          <ShimmerButton
            onClick={() => addNode('output')}
            className="px-2 py-1 text-sm bg-red-500 text-white rounded-md"
          >
            <Plus size={14} className="mr-1" />
            Output
          </ShimmerButton>

          {onExecute && (
            <div className="ml-auto flex gap-2">
              <ShimmerButton
                onClick={() => onExecute(workflow.id)}
                className="px-2 py-1 text-sm bg-green-600 text-white rounded-md"
              >
                <Play size={14} className="mr-1" />
                Execute
              </ShimmerButton>
              <ShimmerButton
                onClick={() => onExecute(workflow.id, { useTemporal: true })}
                className="px-2 py-1 text-sm bg-blue-600 text-white rounded-md"
              >
                <Clock size={14} className="mr-1" />
                Temporal
              </ShimmerButton>
            </div>
          )}
        </div>
      )}

      <div className="flex-1">
        <MagicCard className="h-full overflow-hidden">
          <ShineBorder borderRadius="0.75rem" className="p-0.5 h-full">
            <div
              ref={canvasRef}
              className="bg-white dark:bg-gray-900 rounded-xl shadow-sm overflow-hidden h-full relative"
              onClick={handleCanvasClick}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {/* Edges */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {edges.map(edge => {
                  const sourcePos = nodePositions[edge.source];
                  const targetPos = nodePositions[edge.target];

                  if (!sourcePos || !targetPos) return null;

                  const isSelected = selectedEdge === edge.id;

                  return (
                    <g key={edge.id} className="edge">
                      <line
                        x1={sourcePos.x + 75}
                        y1={sourcePos.y + 30}
                        x2={targetPos.x + 75}
                        y2={targetPos.y + 30}
                        stroke={isSelected ? '#3b82f6' : '#9ca3af'}
                        strokeWidth={isSelected ? 2 : 1}
                        strokeDasharray={isSelected ? '4 2' : 'none'}
                        className="cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEdge(edge.id);
                          setSelectedNode(null);
                        }}
                      />

                      {/* Edge arrow */}
                      <polygon
                        points={`${targetPos.x + 70},${targetPos.y + 25} ${targetPos.x + 80},${targetPos.y + 30} ${targetPos.x + 70},${targetPos.y + 35}`}
                        fill={isSelected ? '#3b82f6' : '#9ca3af'}
                      />

                      {/* Edge label */}
                      {edge.label && (
                        <text
                          x={(sourcePos.x + targetPos.x + 150) / 2}
                          y={(sourcePos.y + targetPos.y + 60) / 2 - 10}
                          textAnchor="middle"
                          fill={isSelected ? '#3b82f6' : '#6b7280'}
                          fontSize="12"
                          className="pointer-events-none"
                        >
                          {edge.label}
                        </text>
                      )}
                    </g>
                  );
                })}

                {/* Connection in progress */}
                {connectingFrom && (
                  <line
                    x1={nodePositions[connectingFrom]?.x + 75 || 0}
                    y1={nodePositions[connectingFrom]?.y + 30 || 0}
                    x2={dragOffset.x}
                    y2={dragOffset.y}
                    stroke="#3b82f6"
                    strokeWidth={2}
                    strokeDasharray="4 2"
                  />
                )}
              </svg>

              {/* Nodes */}
              {nodes.map(node => {
                const position = nodePositions[node.id] || { x: 0, y: 0 };
                const isSelected = selectedNode === node.id;

                return (
                  <div
                    key={node.id}
                    className={`absolute p-3 w-[150px] rounded-md shadow-md transition-shadow ${
                      isSelected ? 'shadow-lg ring-2 ring-primary' : ''
                    } ${getNodeColor(node.type)} text-white cursor-move`}
                    style={{
                      left: `${position.x}px`,
                      top: `${position.y}px`,
                    }}
                    onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1">
                        {getNodeIcon(node.type)}
                        <span className="text-xs uppercase tracking-wider opacity-80">
                          {node.type}
                        </span>
                      </div>

                      {!readOnly && (
                        <button
                          className="text-white/70 hover:text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeNode(node.id);
                          }}
                        >
                          <Trash size={14} />
                        </button>
                      )}
                    </div>

                    {isEditingNodeName === node.id ? (
                      <input
                        type="text"
                        value={editingNodeValue}
                        onChange={(e) => setEditingNodeValue(e.target.value)}
                        onBlur={saveNodeName}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveNodeName();
                          if (e.key === 'Escape') setIsEditingNodeName(null);
                        }}
                        className="w-full px-1 py-0.5 text-sm bg-white/20 rounded border border-white/30 text-white"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <div
                        className="font-medium text-sm truncate"
                        onDoubleClick={() => handleNodeNameEdit(node.id)}
                      >
                        {node.name}
                      </div>
                    )}

                    {/* Connection points */}
                    {!readOnly && (
                      <>
                        <div
                          className="absolute w-4 h-4 bg-white rounded-full border-2 border-gray-400 cursor-pointer right-[-8px] top-[28px]"
                          onMouseDown={(e) => handleStartConnecting(e, node.id)}
                        />

                        <div
                          className="absolute w-4 h-4 bg-white rounded-full border-2 border-gray-400 cursor-pointer left-[-8px] top-[28px]"
                          onMouseDown={(e) => handleEndConnecting(e, node.id)}
                        />
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </ShineBorder>
        </MagicCard>
      </div>

      {/* Selected edge controls */}
      {selectedEdge && !readOnly && (
        <div className="mt-4">
          <MagicCard className="overflow-hidden">
            <ShineBorder borderRadius="0.75rem" className="p-0.5">
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm overflow-hidden p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold">Edge Properties</h3>
                  <button
                    className="text-red-500 hover:text-red-700"
                    onClick={() => removeEdge(selectedEdge)}
                  >
                    <Trash size={14} />
                  </button>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-muted-foreground">Label</label>
                    {isEditingEdgeLabel === selectedEdge ? (
                      <input
                        type="text"
                        value={editingEdgeValue}
                        onChange={(e) => setEditingEdgeValue(e.target.value)}
                        onBlur={saveEdgeLabel}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEdgeLabel();
                          if (e.key === 'Escape') setIsEditingEdgeLabel(null);
                        }}
                        className="w-full px-2 py-1 text-sm bg-muted rounded border border-input"
                        autoFocus
                      />
                    ) : (
                      <div
                        className="px-2 py-1 text-sm bg-muted rounded cursor-pointer"
                        onClick={() => handleEdgeLabelEdit(selectedEdge)}
                      >
                        {edges.find(e => e.id === selectedEdge)?.label || 'Click to add label'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </ShineBorder>
          </MagicCard>
        </div>
      )}
    </div>
  );
}
