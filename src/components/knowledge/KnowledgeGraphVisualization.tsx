"use client";

import React, { useEffect, useRef, useState } from 'react';
import { MagicCard } from "@/components/magicui/magic-card";
import { ShineBorder } from "@/components/ui/shine-border";
import { NodeType } from '@/lib/arango-knowledge-service';
import { Brain, FileText, Lightbulb, Database, HelpCircle, MessageSquare } from 'lucide-react';

// Define the node and edge types for the visualization
interface KnowledgeNode {
  id: string;
  _id?: string;
  _key?: string;
  type: NodeType;
  name: string;
  content: string;
  metadata?: Record<string, any>;
  position?: { x: number; y: number };
}

interface KnowledgeEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  type?: string;
}

interface KnowledgeGraphVisualizationProps {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
  onNodeClick?: (node: KnowledgeNode) => void;
}

export default function KnowledgeGraphVisualization({
  nodes,
  edges,
  onNodeClick,
}: KnowledgeGraphVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<KnowledgeNode | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>({});

  // Initialize node positions using a force-directed layout simulation
  useEffect(() => {
    if (nodes.length === 0) return;

    // Create initial positions in a circle
    const centerX = 400;
    const centerY = 300;
    const radius = Math.min(centerX, centerY) * 0.8;
    
    const positions: Record<string, { x: number; y: number }> = {};
    
    nodes.forEach((node, i) => {
      const angle = (i / nodes.length) * 2 * Math.PI;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      
      positions[node.id] = { x, y };
    });
    
    // Simple force-directed layout simulation
    const simulation = {
      alpha: 1,
      nodes: [...nodes],
      links: edges.map(edge => ({
        source: nodes.find(n => n.id === edge.source) || { id: edge.source },
        target: nodes.find(n => n.id === edge.target) || { id: edge.target },
      })),
    };
    
    // Run a few iterations of the simulation
    for (let i = 0; i < 100; i++) {
      // Apply repulsive forces between nodes
      for (let j = 0; j < nodes.length; j++) {
        for (let k = j + 1; k < nodes.length; k++) {
          const nodeA = nodes[j];
          const nodeB = nodes[k];
          const posA = positions[nodeA.id];
          const posB = positions[nodeB.id];
          
          const dx = posB.x - posA.x;
          const dy = posB.y - posA.y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = 1000 / (distance * distance);
          
          const forceX = dx / distance * force;
          const forceY = dy / distance * force;
          
          positions[nodeA.id] = {
            x: posA.x - forceX,
            y: posA.y - forceY,
          };
          
          positions[nodeB.id] = {
            x: posB.x + forceX,
            y: posB.y + forceY,
          };
        }
      }
      
      // Apply attractive forces along edges
      for (const edge of edges) {
        const sourcePos = positions[edge.source];
        const targetPos = positions[edge.target];
        
        if (!sourcePos || !targetPos) continue;
        
        const dx = targetPos.x - sourcePos.x;
        const dy = targetPos.y - sourcePos.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = distance / 30;
        
        const forceX = dx / distance * force;
        const forceY = dy / distance * force;
        
        positions[edge.source] = {
          x: sourcePos.x + forceX,
          y: sourcePos.y + forceY,
        };
        
        positions[edge.target] = {
          x: targetPos.x - forceX,
          y: targetPos.y - forceY,
        };
      }
    }
    
    setNodePositions(positions);
  }, [nodes, edges]);

  // Draw the graph on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Apply scaling and offset
    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, scale);
    
    // Draw edges
    ctx.lineWidth = 1 / scale;
    edges.forEach(edge => {
      const sourcePos = nodePositions[edge.source];
      const targetPos = nodePositions[edge.target];
      
      if (!sourcePos || !targetPos) return;
      
      ctx.beginPath();
      ctx.moveTo(sourcePos.x, sourcePos.y);
      ctx.lineTo(targetPos.x, targetPos.y);
      ctx.strokeStyle = 'rgba(156, 163, 175, 0.6)';
      ctx.stroke();
      
      // Draw edge label
      if (edge.label) {
        const midX = (sourcePos.x + targetPos.x) / 2;
        const midY = (sourcePos.y + targetPos.y) / 2;
        
        ctx.fillStyle = 'rgba(156, 163, 175, 0.8)';
        ctx.font = `${12 / scale}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(edge.label, midX, midY);
      }
    });
    
    // Draw nodes
    nodes.forEach(node => {
      const pos = nodePositions[node.id];
      if (!pos) return;
      
      const isSelected = selectedNode?.id === node.id;
      const isHovered = hoveredNode?.id === node.id;
      const radius = isSelected ? 15 / scale : isHovered ? 12 / scale : 10 / scale;
      
      // Node color based on type
      let color;
      switch (node.type) {
        case NodeType.CONCEPT:
          color = '#3b82f6'; // blue
          break;
        case NodeType.ENTITY:
          color = '#8b5cf6'; // purple
          break;
        case NodeType.DOCUMENT:
          color = '#ec4899'; // pink
          break;
        case NodeType.FACT:
          color = '#10b981'; // green
          break;
        case NodeType.QUESTION:
          color = '#f59e0b'; // amber
          break;
        case NodeType.ANSWER:
          color = '#6366f1'; // indigo
          break;
        default:
          color = '#9ca3af'; // gray
      }
      
      // Draw node circle
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
      
      if (isSelected || isHovered) {
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2 / scale;
        ctx.stroke();
      }
      
      // Draw node label
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.font = `${12 / scale}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.name, pos.x, pos.y + radius + 10 / scale);
    });
    
    ctx.restore();
  }, [nodes, edges, nodePositions, selectedNode, hoveredNode, scale, offset]);

  // Handle mouse events
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale - offset.x / scale;
    const y = (e.clientY - rect.top) / scale - offset.y / scale;
    
    // Check if a node was clicked
    let clickedNode = null;
    for (const node of nodes) {
      const pos = nodePositions[node.id];
      if (!pos) continue;
      
      const dx = pos.x - x;
      const dy = pos.y - y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 10 / scale) {
        clickedNode = node;
        break;
      }
    }
    
    if (clickedNode) {
      setSelectedNode(clickedNode);
      if (onNodeClick) onNodeClick(clickedNode);
    } else {
      setSelectedNode(null);
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale - offset.x / scale;
    const y = (e.clientY - rect.top) / scale - offset.y / scale;
    
    // Check if hovering over a node
    let hoverNode = null;
    for (const node of nodes) {
      const pos = nodePositions[node.id];
      if (!pos) continue;
      
      const dx = pos.x - x;
      const dy = pos.y - y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 10 / scale) {
        hoverNode = node;
        break;
      }
    }
    
    setHoveredNode(hoverNode);
    
    // Handle dragging
    if (isDragging) {
      setOffset({
        x: offset.x + (e.clientX - dragStart.x),
        y: offset.y + (e.clientY - dragStart.y),
      });
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(scale * delta);
  };

  // Get icon for node type
  const getNodeTypeIcon = (type: NodeType) => {
    switch (type) {
      case NodeType.CONCEPT:
        return <Brain size={16} className="text-blue-500" />;
      case NodeType.ENTITY:
        return <Database size={16} className="text-purple-500" />;
      case NodeType.DOCUMENT:
        return <FileText size={16} className="text-pink-500" />;
      case NodeType.FACT:
        return <Lightbulb size={16} className="text-green-500" />;
      case NodeType.QUESTION:
        return <HelpCircle size={16} className="text-amber-500" />;
      case NodeType.ANSWER:
        return <MessageSquare size={16} className="text-indigo-500" />;
      default:
        return <Brain size={16} className="text-gray-500" />;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 relative">
        <MagicCard className="h-full overflow-hidden">
          <ShineBorder borderRadius="0.75rem" className="p-0.5 h-full">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm overflow-hidden h-full">
              <canvas
                ref={canvasRef}
                width={800}
                height={600}
                className="w-full h-full"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
              />
            </div>
          </ShineBorder>
        </MagicCard>
      </div>
      
      {selectedNode && (
        <div className="mt-4">
          <MagicCard className="overflow-hidden">
            <ShineBorder borderRadius="0.75rem" className="p-0.5">
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm overflow-hidden p-4">
                <div className="flex items-center gap-2 mb-2">
                  {getNodeTypeIcon(selectedNode.type)}
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">
                    {selectedNode.type}
                  </span>
                </div>
                <h3 className="text-lg font-semibold mb-2">{selectedNode.name}</h3>
                <p className="text-sm text-muted-foreground">{selectedNode.content}</p>
              </div>
            </ShineBorder>
          </MagicCard>
        </div>
      )}
      
      <div className="mt-4 flex justify-center gap-2">
        <button
          onClick={() => setScale(scale * 1.2)}
          className="px-2 py-1 bg-primary text-primary-foreground rounded-md text-sm"
        >
          Zoom In
        </button>
        <button
          onClick={() => setScale(scale / 1.2)}
          className="px-2 py-1 bg-primary text-primary-foreground rounded-md text-sm"
        >
          Zoom Out
        </button>
        <button
          onClick={() => {
            setScale(1);
            setOffset({ x: 0, y: 0 });
          }}
          className="px-2 py-1 bg-primary text-primary-foreground rounded-md text-sm"
        >
          Reset View
        </button>
      </div>
    </div>
  );
}
