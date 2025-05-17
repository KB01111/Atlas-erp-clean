"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { BorderContainer } from "@/components/ui/shine-border";
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text";
import { EnhancedActionButton } from "@/components/ui/enhanced-action-button";
import { EnhancedCard } from "@/components/ui/enhanced-card";
import { ErrorMessage } from "@/components/ui/error-message";
import { LoadingState } from "@/components/ui/loading-state";
import { 
  Plus, 
  Trash, 
  Link as LinkIcon, 
  Save, 
  Play, 
  Settings, 
  Bot, 
  Database, 
  FileText, 
  MessageSquare, 
  ArrowRight, 
  X
} from "lucide-react";
import { Workflow } from "@/lib/workflow-service";

interface WorkflowNode {
  id: string;
  type: "agent" | "input" | "output" | "condition" | "transformation";
  label: string;
  position: { x: number; y: number };
  data?: unknown;
}

interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

interface WorkflowBuilderProps {
  workflow: Workflow;
  onChange?: (workflow: Workflow) => void;
  readOnly?: boolean;
}

export default function WorkflowBuilder({
  workflow,
  onChange,
  readOnly = false
}: WorkflowBuilderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<WorkflowNode[]>(workflow.nodes || []);
  const [edges, setEdges] = useState<WorkflowEdge[]>(workflow.edges || []);
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<WorkflowEdge | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [isCreatingEdge, setIsCreatingEdge] = useState(false);
  const [edgeSource, setEdgeSource] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [availableAgents, setAvailableAgents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch available agents
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/agents");
        if (!response.ok) {
          throw new Error("Failed to fetch agents");
        }
        const data = await response.json();
        setAvailableAgents(data.agents || []);
        setError(null);
      } catch (error) {
        console.error("Error fetching agents:", error);
        setError("Failed to fetch agents");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAgents();
  }, []);

  // Update parent component when nodes or edges change
  useEffect(() => {
    if (onChange) {
      onChange({
        ...workflow,
        nodes,
        edges
      });
    }
  }, [nodes, edges, workflow, onChange]);

  // Add a new node
  const addNode = (type: WorkflowNode["type"], label: string, position: { x: number; y: number }, data?: unknown) => {
    if (readOnly) return;
    
    const newNode: WorkflowNode = {
      id: `node-${Date.now()}`,
      type,
      label,
      position,
      data
    };
    
    setNodes([...nodes, newNode]);
    setSelectedNode(newNode);
  };

  // Remove a node and its connected edges
  const removeNode = (nodeId: string) => {
    if (readOnly) return;
    
    setNodes(nodes.filter(node => node.id !== nodeId));
    setEdges(edges.filter(edge => edge.source !== nodeId && edge.target !== nodeId));
    
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null);
    }
  };

  // Add a new edge
  const addEdge = (source: string, target: string, label?: string) => {
    if (readOnly) return;
    
    // Prevent self-connections
    if (source === target) return;
    
    // Prevent duplicate connections
    if (edges.some(edge => edge.source === source && edge.target === target)) return;
    
    const newEdge: WorkflowEdge = {
      id: `edge-${Date.now()}`,
      source,
      target,
      label
    };
    
    setEdges([...edges, newEdge]);
    setSelectedEdge(newEdge);
  };

  // Remove an edge
  const removeEdge = (edgeId: string) => {
    if (readOnly) return;
    
    setEdges(edges.filter(edge => edge.id !== edgeId));
    
    if (selectedEdge?.id === edgeId) {
      setSelectedEdge(null);
    }
  };

  // Handle mouse down on the canvas
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - pan.x) / zoom;
    const y = (e.clientY - rect.top - pan.y) / zoom;
    
    // Check if clicked on a node
    const clickedNode = nodes.find(node => {
      const nodeX = node.position.x;
      const nodeY = node.position.y;
      return x >= nodeX - 50 && x <= nodeX + 50 && y >= nodeY - 25 && y <= nodeY + 25;
    });
    
    if (clickedNode) {
      if (isCreatingEdge) {
        // Complete edge creation
        if (edgeSource && edgeSource !== clickedNode.id) {
          addEdge(edgeSource, clickedNode.id);
        }
        setIsCreatingEdge(false);
        setEdgeSource(null);
      } else {
        // Start dragging node
        setIsDragging(true);
        setDraggedNode(clickedNode.id);
        setDragStartPos({ x, y });
        setSelectedNode(clickedNode);
        setSelectedEdge(null);
      }
    } else {
      // Check if clicked on an edge
      const clickedEdge = edges.find(edge => {
        const sourceNode = nodes.find(n => n.id === edge.source);
        const targetNode = nodes.find(n => n.id === edge.target);
        if (!sourceNode || !targetNode) return false;
        
        // Simple line-point distance calculation
        const x1 = sourceNode.position.x;
        const y1 = sourceNode.position.y;
        const x2 = targetNode.position.x;
        const y2 = targetNode.position.y;
        
        const A = x - x1;
        const B = y - y1;
        const C = x2 - x1;
        const D = y2 - y1;
        
        const dot = A * C + B * D;
        const len_sq = C * C + D * D;
        let param = -1;
        
        if (len_sq !== 0) param = dot / len_sq;
        
        let xx, yy;
        
        if (param < 0) {
          xx = x1;
          yy = y1;
        } else if (param > 1) {
          xx = x2;
          yy = y2;
        } else {
          xx = x1 + param * C;
          yy = y1 + param * D;
        }
        
        const dx = x - xx;
        const dy = y - yy;
        
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < 10;
      });
      
      if (clickedEdge) {
        setSelectedEdge(clickedEdge);
        setSelectedNode(null);
      } else {
        setSelectedNode(null);
        setSelectedEdge(null);
        
        // Start panning
        setIsDragging(true);
        setDraggedNode(null);
        setDragStartPos({ x: e.clientX, y: e.clientY });
      }
    }
  };

  // Handle mouse move on the canvas
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - pan.x) / zoom;
    const y = (e.clientY - rect.top - pan.y) / zoom;
    
    setMousePos({ x, y });
    
    if (isDragging) {
      if (draggedNode) {
        // Move the dragged node
        setNodes(nodes.map(node => {
          if (node.id === draggedNode) {
            return {
              ...node,
              position: {
                x: node.position.x + (x - dragStartPos.x),
                y: node.position.y + (y - dragStartPos.y)
              }
            };
          }
          return node;
        }));
        setDragStartPos({ x, y });
      } else {
        // Pan the canvas
        setPan({
          x: pan.x + (e.clientX - dragStartPos.x),
          y: pan.y + (e.clientY - dragStartPos.y)
        });
        setDragStartPos({ x: e.clientX, y: e.clientY });
      }
    }
  };

  // Handle mouse up on the canvas
  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggedNode(null);
  };

  // Handle node double click to start creating an edge
  const handleNodeDoubleClick = (nodeId: string) => {
    if (readOnly) return;
    
    setIsCreatingEdge(true);
    setEdgeSource(nodeId);
  };

  // Get node color based on type
  const getNodeColor = (type: WorkflowNode["type"]) => {
    switch (type) {
      case "agent":
        return "bg-blue-100 border-blue-300 text-blue-800";
      case "input":
        return "bg-green-100 border-green-300 text-green-800";
      case "output":
        return "bg-purple-100 border-purple-300 text-purple-800";
      case "condition":
        return "bg-amber-100 border-amber-300 text-amber-800";
      case "transformation":
        return "bg-indigo-100 border-indigo-300 text-indigo-800";
      default:
        return "bg-slate-100 border-slate-300 text-slate-800";
    }
  };

  // Get node icon based on type
  const getNodeIcon = (type: WorkflowNode["type"]) => {
    switch (type) {
      case "agent":
        return <Bot size={16} />;
      case "input":
        return <FileText size={16} />;
      case "output":
        return <MessageSquare size={16} />;
      case "condition":
        return <Settings size={16} />;
      case "transformation":
        return <Database size={16} />;
      default:
        return <Bot size={16} />;
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading workflow builder..." variant="card" size="large" />;
  }

  if (error) {
    return <ErrorMessage title="Error loading workflow builder" message={error} variant="error" />;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <AnimatedGradientText
          text="Workflow Builder"
          className="text-xl font-bold"
          gradient="linear-gradient(to right, #3b82f6, #8b5cf6)"
        />
        <div className="flex items-center gap-2">
          {!readOnly && (
            <EnhancedActionButton
              onClick={() = variant="default" size="sm" hover="lift"> {
                if (!containerRef.current) return;
                const rect = containerRef.current.getBoundingClientRect();
                const x = rect.width / 2 / zoom;
                const y = rect.height / 2 / zoom;
                addNode("agent", "New Agent", { x, y });
              }}
              className="px-3 py-1 rounded-md text-sm font-medium bg-primary text-primary-foreground flex items-center gap-1"
            >
              <Plus size={14} />
              <span>Add Node</span>
            </EnhancedActionButton>
          )}
        </div>
      </div>

      <BorderContainer
        borderColor="rgba(59, 130, 246, 0.2)"
        shineBorderColor="rgba(59, 130, 246, 0.6)"
        borderRadius="0.75rem"
        className="flex-1"
       variant="primary" rounded="xl">
        <div 
          ref={containerRef}
          className="bg-white rounded-lg shadow-md h-full overflow-hidden relative"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div 
            className="absolute inset-0"
            style={{ 
              transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
              transformOrigin: '0 0'
            }}
          >
            {/* Render edges */}
            <svg className="absolute inset-0 pointer-events-none">
              {edges.map(edge => {
                const sourceNode = nodes.find(n => n.id === edge.source);
                const targetNode = nodes.find(n => n.id === edge.target);
                if (!sourceNode || !targetNode) return null;
                
                const x1 = sourceNode.position.x;
                const y1 = sourceNode.position.y;
                const x2 = targetNode.position.x;
                const y2 = targetNode.position.y;
                
                const isSelected = selectedEdge?.id === edge.id;
                
                return (
                  <g key={edge.id}>
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={isSelected ? "#3b82f6" : "#94a3b8"}
                      strokeWidth={isSelected ? 2 : 1}
                      strokeDasharray={isSelected ? "none" : "none"}
                      markerEnd="url(#arrowhead)"
                    />
                    {edge.label && (
                      <text
                        x={(x1 + x2) / 2}
                        y={(y1 + y2) / 2 - 10}
                        textAnchor="middle"
                        fill="#64748b"
                        fontSize="12"
                      >
                        {edge.label}
                      </text>
                    )}
                  </g>
                );
              })}
              
              {/* Render edge being created */}
              {isCreatingEdge && edgeSource && (
                <line
                  x1={nodes.find(n => n.id === edgeSource)?.position.x || 0}
                  y1={nodes.find(n => n.id === edgeSource)?.position.y || 0}
                  x2={mousePos.x}
                  y2={mousePos.y}
                  stroke="#3b82f6"
                  strokeWidth={1}
                  strokeDasharray="5,5"
                />
              )}
              
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
                  <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
                </marker>
              </defs>
            </svg>
            
            {/* Render nodes */}
            {nodes.map(node => {
              const isSelected = selectedNode?.id === node.id;
              const nodeColor = getNodeColor(node.type);
              const nodeIcon = getNodeIcon(node.type);
              
              return (
                <div
                  key={node.id}
                  className={`absolute cursor-move flex items-center justify-center px-4 py-2 rounded-md border ${nodeColor} ${
                    isSelected ? "ring-2 ring-primary" : ""
                  }`}
                  style={{
                    left: node.position.x - 60,
                    top: node.position.y - 20,
                    width: 120,
                    height: 40,
                    zIndex: isSelected ? 10 : 1
                  }}
                  onDoubleClick={() => handleNodeDoubleClick(node.id)}
                >
                  <div className="flex items-center gap-2">
                    {nodeIcon}
                    <span className="text-sm font-medium truncate max-w-[80px]">{node.label}</span>
                  </div>
                  
                  {!readOnly && isSelected && (
                    <button
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeNode(node.id);
                      }}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </BorderContainer>
    </div>
  );
}
