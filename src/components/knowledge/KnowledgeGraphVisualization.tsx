"use client";

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { MagicCard } from "@/components/magicui/magic-card";
import { ShineBorder } from "@/components/ui/shine-border";
import { NodeType, EdgeType } from '@/lib/arango-knowledge-service';
import {
  Brain,
  FileText,
  Lightbulb,
  Database,
  HelpCircle,
  MessageSquare,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Search,
  Filter,
  Layers,
  X,
  ChevronDown,
  ChevronUp,
  Move
} from 'lucide-react';
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text";
import { ShimmerButton } from "@/components/magicui/shimmer-button";
import { Tooltip } from "@/components/ui/tooltip";

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
  group?: string; // Added for node grouping
}

interface KnowledgeEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  type?: string;
  weight?: number;
}

// Define node group interface
interface NodeGroup {
  id: string;
  name: string;
  nodes: string[]; // Array of node IDs
  color: string;
  expanded: boolean;
}

interface KnowledgeGraphVisualizationProps {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
  onNodeClick?: (node: KnowledgeNode) => void;
  onNodeGroupCreate?: (group: NodeGroup) => void;
  onNodeGroupDelete?: (groupId: string) => void;
}

export default function KnowledgeGraphVisualization({
  nodes,
  edges,
  onNodeClick,
  onNodeGroupCreate,
  onNodeGroupDelete,
}: KnowledgeGraphVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);

  // Node and edge state
  const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<KnowledgeNode | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<KnowledgeEdge | null>(null);
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>({});

  // View state
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [zoomAnimation, setZoomAnimation] = useState<{ target: number, start: number, startTime: number } | null>(null);

  // Filtering state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNodeType, setSelectedNodeType] = useState<NodeType | 'all'>('all');
  const [selectedEdgeType, setSelectedEdgeType] = useState<EdgeType | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [filteredNodes, setFilteredNodes] = useState<KnowledgeNode[]>(nodes);
  const [filteredEdges, setFilteredEdges] = useState<KnowledgeEdge[]>(edges);

  // Grouping state
  const [nodeGroups, setNodeGroups] = useState<NodeGroup[]>([]);
  const [showGrouping, setShowGrouping] = useState(false);
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set());
  const [groupNameInput, setGroupNameInput] = useState('');

  // Tooltip state
  const [tooltipContent, setTooltipContent] = useState<{ content: React.ReactNode, x: number, y: number } | null>(null);

  // Advanced filtering for nodes and edges
  useEffect(() => {
    let filtered = [...nodes];

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(node => {
        // Search in name, content, and metadata
        const nameMatch = node.name.toLowerCase().includes(term);
        const contentMatch = node.content.toLowerCase().includes(term);

        // Search in metadata if available
        let metadataMatch = false;
        if (node.metadata) {
          metadataMatch = Object.values(node.metadata).some(value =>
            typeof value === 'string' && value.toLowerCase().includes(term)
          );
        }

        return nameMatch || contentMatch || metadataMatch;
      });
    }

    // Filter by node type
    if (selectedNodeType !== 'all') {
      filtered = filtered.filter(node => node.type === selectedNodeType);
    }

    // Apply node grouping filter - only show nodes that are in expanded groups
    const expandedGroupNodeIds = new Set<string>();
    nodeGroups.forEach(group => {
      if (group.expanded) {
        group.nodes.forEach(nodeId => expandedGroupNodeIds.add(nodeId));
      }
    });

    // If we have any groups, filter by them
    if (nodeGroups.length > 0) {
      filtered = filtered.filter(node => {
        // If the node is not in any group, always show it
        if (!node.group) return true;

        // If the node is in a group, only show it if the group is expanded
        return expandedGroupNodeIds.has(node.id);
      });
    }

    setFilteredNodes(filtered);

    // Filter edges based on filtered nodes and edge type
    const filteredNodeIds = new Set(filtered.map(node => node.id));
    let newFilteredEdges = edges.filter(edge =>
      filteredNodeIds.has(edge.source) && filteredNodeIds.has(edge.target)
    );

    // Filter by edge type if selected
    if (selectedEdgeType !== 'all') {
      newFilteredEdges = newFilteredEdges.filter(edge => edge.type === selectedEdgeType);
    }

    setFilteredEdges(newFilteredEdges);
  }, [nodes, edges, searchTerm, selectedNodeType, selectedEdgeType, nodeGroups]);

  // Initialize node positions using an enhanced force-directed layout simulation
  useEffect(() => {
    if (filteredNodes.length === 0) return;

    // Create initial positions in a circle
    const centerX = 400;
    const centerY = 300;
    const radius = Math.min(centerX, centerY) * 0.8;

    // Start with existing positions or create new ones
    const positions: Record<string, { x: number; y: number }> = { ...nodePositions };

    // Create positions for new nodes
    filteredNodes.forEach((node, i) => {
      if (!positions[node.id]) {
        const angle = (i / filteredNodes.length) * 2 * Math.PI;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        positions[node.id] = { x, y };
      }
    });

    // Group nodes by their group
    const nodesByGroup: Record<string, KnowledgeNode[]> = {};

    // First, collect nodes by group
    filteredNodes.forEach(node => {
      if (node.group) {
        if (!nodesByGroup[node.group]) {
          nodesByGroup[node.group] = [];
        }
        nodesByGroup[node.group].push(node);
      }
    });

    // Calculate group centers
    const groupCenters: Record<string, { x: number, y: number }> = {};
    Object.keys(nodesByGroup).forEach((groupId, index) => {
      const angle = (index / Object.keys(nodesByGroup).length) * 2 * Math.PI;
      const x = centerX + (radius * 0.6) * Math.cos(angle);
      const y = centerY + (radius * 0.6) * Math.sin(angle);
      groupCenters[groupId] = { x, y };
    });

    // Enhanced force-directed layout simulation
    const runSimulation = () => {
      // Run a few iterations of the simulation
      for (let i = 0; i < 50; i++) {
        // Apply repulsive forces between nodes
        for (let j = 0; j < filteredNodes.length; j++) {
          for (let k = j + 1; k < filteredNodes.length; k++) {
            const nodeA = filteredNodes[j];
            const nodeB = filteredNodes[k];
            const posA = positions[nodeA.id];
            const posB = positions[nodeB.id];

            if (!posA || !posB) continue;

            // Nodes in the same group have less repulsion
            const sameGroup = nodeA.group && nodeB.group && nodeA.group === nodeB.group;
            const repulsionFactor = sameGroup ? 500 : 1000;

            const dx = posB.x - posA.x;
            const dy = posB.y - posA.y;
            const distance = Math.sqrt(dx * dx + dy * dy) || 1;
            const force = repulsionFactor / (distance * distance);

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
        for (const edge of filteredEdges) {
          const sourcePos = positions[edge.source];
          const targetPos = positions[edge.target];

          if (!sourcePos || !targetPos) continue;

          // Edge weight affects the attraction strength
          const weight = edge.weight || 1;
          const attractionFactor = 30 / weight;

          const dx = targetPos.x - sourcePos.x;
          const dy = targetPos.y - sourcePos.y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = distance / attractionFactor;

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

        // Apply attractive forces towards group centers
        for (const groupId in nodesByGroup) {
          const groupCenter = groupCenters[groupId];
          const groupNodes = nodesByGroup[groupId];

          for (const node of groupNodes) {
            const pos = positions[node.id];
            if (!pos) continue;

            const dx = groupCenter.x - pos.x;
            const dy = groupCenter.y - pos.y;
            const distance = Math.sqrt(dx * dx + dy * dy) || 1;
            const force = distance / 100; // Gentle force towards group center

            const forceX = dx / distance * force;
            const forceY = dy / distance * force;

            positions[node.id] = {
              x: pos.x + forceX,
              y: pos.y + forceY,
            };
          }
        }
      }
    };

    // Run the simulation
    runSimulation();

    // Update node positions
    setNodePositions(positions);
  }, [filteredNodes, filteredEdges]);

  // Smooth animation for zooming
  useEffect(() => {
    if (!zoomAnimation) return;

    const animate = (timestamp: number) => {
      if (!zoomAnimation) return;

      const elapsed = timestamp - zoomAnimation.startTime;
      const duration = 300; // Animation duration in ms

      if (elapsed >= duration) {
        // Animation complete
        setScale(zoomAnimation.target);
        setZoomAnimation(null);
        return;
      }

      // Calculate current scale using easing function
      const progress = elapsed / duration;
      const easedProgress = 1 - Math.pow(1 - progress, 3); // Cubic ease-out
      const currentScale = zoomAnimation.start + (zoomAnimation.target - zoomAnimation.start) * easedProgress;

      setScale(currentScale);
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [zoomAnimation]);

  // Draw the graph on canvas with enhanced visuals
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Adjust canvas size to match container
    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      }
    };

    resizeCanvas();

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply scaling and offset
    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, scale);

    // Draw node groups first (as backgrounds)
    nodeGroups.forEach(group => {
      if (!group.expanded) return;

      // Find all nodes in this group
      const groupNodes = filteredNodes.filter(node => node.group === group.id);
      if (groupNodes.length === 0) return;

      // Calculate the bounding box for the group
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

      groupNodes.forEach(node => {
        const pos = nodePositions[node.id];
        if (!pos) return;

        minX = Math.min(minX, pos.x - 20);
        minY = Math.min(minY, pos.y - 20);
        maxX = Math.max(maxX, pos.x + 20);
        maxY = Math.max(maxY, pos.y + 20);
      });

      // Draw group background
      ctx.beginPath();
      ctx.moveTo(minX, minY);
      ctx.lineTo(maxX, minY);
      ctx.lineTo(maxX, maxY);
      ctx.lineTo(minX, maxY);
      ctx.closePath();

      // Fill with semi-transparent color
      ctx.fillStyle = `${group.color}33`; // 20% opacity
      ctx.fill();

      // Draw border
      ctx.strokeStyle = group.color;
      ctx.lineWidth = 2 / scale;
      ctx.stroke();

      // Draw group label
      ctx.fillStyle = group.color;
      ctx.font = `bold ${14 / scale}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(group.name, (minX + maxX) / 2, minY - 20 / scale);
    });

    // Draw edges
    filteredEdges.forEach(edge => {
      const sourcePos = nodePositions[edge.source];
      const targetPos = nodePositions[edge.target];

      if (!sourcePos || !targetPos) return;

      const isHovered = hoveredEdge?.id === edge.id;
      const isConnectedToSelected = selectedNode &&
        (edge.source === selectedNode.id || edge.target === selectedNode.id);

      ctx.beginPath();
      ctx.moveTo(sourcePos.x, sourcePos.y);

      // Draw curved lines for better visibility
      if (edge.source !== edge.target) {
        // Straight line for now, but could be curved
        ctx.lineTo(targetPos.x, targetPos.y);
      } else {
        // Self-loop
        const radius = 20 / scale;
        ctx.arc(sourcePos.x, sourcePos.y - radius, radius, 0, 2 * Math.PI);
      }

      // Edge styling based on state
      if (isHovered) {
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.9)'; // Indigo, more visible
        ctx.lineWidth = 3 / scale;
      } else if (isConnectedToSelected) {
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.7)'; // Indigo
        ctx.lineWidth = 2 / scale;
      } else {
        // Default edge style
        ctx.strokeStyle = 'rgba(156, 163, 175, 0.6)';
        ctx.lineWidth = 1 / scale;
      }

      ctx.stroke();

      // Draw edge label with background for better readability
      if (edge.label || edge.type) {
        const label = edge.label || edge.type;
        if (!label) return;

        const midX = (sourcePos.x + targetPos.x) / 2;
        const midY = (sourcePos.y + targetPos.y) / 2;

        // Measure text width
        ctx.font = `${12 / scale}px sans-serif`;
        const textWidth = ctx.measureText(label).width;

        // Draw background
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillRect(
          midX - textWidth / 2 - 4 / scale,
          midY - 8 / scale,
          textWidth + 8 / scale,
          16 / scale
        );

        // Draw text
        ctx.fillStyle = isHovered ? 'rgba(79, 70, 229, 1)' : 'rgba(107, 114, 128, 1)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, midX, midY);
      }

      // Draw arrow for directed edges
      const angle = Math.atan2(targetPos.y - sourcePos.y, targetPos.x - sourcePos.x);
      const arrowSize = 8 / scale;

      // Calculate position at the edge of the target node
      const targetNodeRadius = 10 / scale;
      const arrowX = targetPos.x - Math.cos(angle) * targetNodeRadius;
      const arrowY = targetPos.y - Math.sin(angle) * targetNodeRadius;

      ctx.beginPath();
      ctx.moveTo(arrowX, arrowY);
      ctx.lineTo(
        arrowX - arrowSize * Math.cos(angle - Math.PI / 6),
        arrowY - arrowSize * Math.sin(angle - Math.PI / 6)
      );
      ctx.lineTo(
        arrowX - arrowSize * Math.cos(angle + Math.PI / 6),
        arrowY - arrowSize * Math.sin(angle + Math.PI / 6)
      );
      ctx.closePath();

      ctx.fillStyle = isHovered ? 'rgba(99, 102, 241, 0.9)' : 'rgba(156, 163, 175, 0.8)';
      ctx.fill();
    });

    // Draw nodes
    filteredNodes.forEach(node => {
      const pos = nodePositions[node.id];
      if (!pos) return;

      const isSelected = selectedNode?.id === node.id;
      const isHovered = hoveredNode?.id === node.id;
      const isInSelection = selectedNodes.has(node.id);
      const radius = isSelected ? 15 / scale : (isHovered || isInSelection) ? 12 / scale : 10 / scale;

      // Node color based on type or group
      let color;

      // If node is in a group, use the group color
      const nodeGroup = node.group ? nodeGroups.find(g => g.id === node.group) : null;

      if (nodeGroup) {
        color = nodeGroup.color;
      } else {
        // Default colors based on node type
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
          case NodeType.DOCUMENT_CHUNK:
            color = '#ec4899'; // pink (same as document)
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
      }

      // Draw node glow for selected/hovered nodes
      if (isSelected || isHovered || isInSelection) {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius + 5 / scale, 0, 2 * Math.PI);
        const glowColor = isSelected ? 'rgba(255, 255, 255, 0.3)' :
                          isInSelection ? 'rgba(99, 102, 241, 0.2)' :
                          'rgba(255, 255, 255, 0.2)';
        ctx.fillStyle = glowColor;
        ctx.fill();
      }

      // Draw node circle
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();

      if (isSelected || isHovered || isInSelection) {
        ctx.strokeStyle = isSelected ? 'white' : isInSelection ? '#6366f1' : 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 2 / scale;
        ctx.stroke();
      }

      // Draw node icon based on type
      const iconSize = 12 / scale;
      ctx.fillStyle = 'white';

      switch (node.type) {
        case NodeType.CONCEPT:
          // Brain icon (simplified)
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, iconSize / 2, 0, 2 * Math.PI);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
          ctx.fill();
          break;
        case NodeType.DOCUMENT:
        case NodeType.DOCUMENT_CHUNK:
          // Document icon (simplified)
          ctx.fillRect(pos.x - iconSize / 3, pos.y - iconSize / 3, iconSize * 2/3, iconSize * 2/3);
          break;
        // Add more icon types as needed
      }

      // Draw node label with background for better readability
      const label = node.name;
      ctx.font = `${12 / scale}px sans-serif`;
      const textWidth = ctx.measureText(label).width;

      // Draw text background
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fillRect(
        pos.x - textWidth / 2 - 4 / scale,
        pos.y + radius + 2 / scale,
        textWidth + 8 / scale,
        16 / scale
      );

      // Draw text
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(label, pos.x, pos.y + radius + 4 / scale);
    });

    ctx.restore();
  }, [filteredNodes, filteredEdges, nodePositions, selectedNode, hoveredNode, hoveredEdge, scale, offset, nodeGroups, selectedNodes]);

  // Enhanced mouse event handlers with support for tooltips, edge detection, and node selection
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale - offset.x / scale;
    const y = (e.clientY - rect.top) / scale - offset.y / scale;

    // Check if a node was clicked
    let clickedNode = null;
    for (const node of filteredNodes) {
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

    // Check if an edge was clicked
    let clickedEdge = null;
    if (!clickedNode) {
      for (const edge of filteredEdges) {
        const sourcePos = nodePositions[edge.source];
        const targetPos = nodePositions[edge.target];
        if (!sourcePos || !targetPos) continue;

        // Calculate distance from point to line segment
        const lineLength = Math.sqrt(
          Math.pow(targetPos.x - sourcePos.x, 2) +
          Math.pow(targetPos.y - sourcePos.y, 2)
        );

        if (lineLength === 0) continue;

        const t = Math.max(0, Math.min(1, (
          (x - sourcePos.x) * (targetPos.x - sourcePos.x) +
          (y - sourcePos.y) * (targetPos.y - sourcePos.y)
        ) / (lineLength * lineLength)));

        const nearestX = sourcePos.x + t * (targetPos.x - sourcePos.x);
        const nearestY = sourcePos.y + t * (targetPos.y - sourcePos.y);

        const distance = Math.sqrt(
          Math.pow(x - nearestX, 2) +
          Math.pow(y - nearestY, 2)
        );

        if (distance < 5 / scale) {
          clickedEdge = edge;
          break;
        }
      }
    }

    // Handle node selection for grouping
    if (showGrouping && clickedNode) {
      // Toggle node selection
      const newSelectedNodes = new Set(selectedNodes);
      if (newSelectedNodes.has(clickedNode.id)) {
        newSelectedNodes.delete(clickedNode.id);
      } else {
        newSelectedNodes.add(clickedNode.id);
      }
      setSelectedNodes(newSelectedNodes);
      return;
    }

    if (clickedNode) {
      setSelectedNode(clickedNode);
      if (onNodeClick) onNodeClick(clickedNode);

      // Show tooltip with detailed node information
      setTooltipContent({
        content: (
          <div className="p-2">
            <div className="flex items-center gap-2 mb-1">
              {getNodeTypeIcon(clickedNode.type)}
              <span className="text-xs font-semibold uppercase">{clickedNode.type}</span>
            </div>
            <h3 className="font-medium mb-1">{clickedNode.name}</h3>
            <p className="text-sm text-slate-600 mb-1">{clickedNode.content.substring(0, 100)}{clickedNode.content.length > 100 ? '...' : ''}</p>
            {clickedNode.metadata && Object.keys(clickedNode.metadata).length > 0 && (
              <div className="text-xs text-slate-500">
                <div className="font-semibold">Metadata:</div>
                {Object.entries(clickedNode.metadata).map(([key, value]) => (
                  <div key={key}><span className="font-medium">{key}:</span> {String(value).substring(0, 30)}</div>
                ))}
              </div>
            )}
          </div>
        ),
        x: e.clientX,
        y: e.clientY
      });
    } else if (clickedEdge) {
      // Show tooltip with edge information
      setTooltipContent({
        content: (
          <div className="p-2">
            <div className="font-medium mb-1">Edge: {clickedEdge.label || clickedEdge.type || 'Unnamed'}</div>
            <div className="text-xs">
              <div>From: {filteredNodes.find(n => n.id === clickedEdge.source)?.name || clickedEdge.source}</div>
              <div>To: {filteredNodes.find(n => n.id === clickedEdge.target)?.name || clickedEdge.target}</div>
              {clickedEdge.weight && <div>Weight: {clickedEdge.weight}</div>}
            </div>
          </div>
        ),
        x: e.clientX,
        y: e.clientY
      });
    } else {
      // Clicked on empty space
      setSelectedNode(null);
      setTooltipContent(null);
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
    for (const node of filteredNodes) {
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

    // Check if hovering over an edge
    let hoverEdge = null;
    if (!hoverNode) {
      for (const edge of filteredEdges) {
        const sourcePos = nodePositions[edge.source];
        const targetPos = nodePositions[edge.target];
        if (!sourcePos || !targetPos) continue;

        // Calculate distance from point to line segment
        const lineLength = Math.sqrt(
          Math.pow(targetPos.x - sourcePos.x, 2) +
          Math.pow(targetPos.y - sourcePos.y, 2)
        );

        if (lineLength === 0) continue;

        const t = Math.max(0, Math.min(1, (
          (x - sourcePos.x) * (targetPos.x - sourcePos.x) +
          (y - sourcePos.y) * (targetPos.y - sourcePos.y)
        ) / (lineLength * lineLength)));

        const nearestX = sourcePos.x + t * (targetPos.x - sourcePos.x);
        const nearestY = sourcePos.y + t * (targetPos.y - sourcePos.y);

        const distance = Math.sqrt(
          Math.pow(x - nearestX, 2) +
          Math.pow(y - nearestY, 2)
        );

        if (distance < 5 / scale) {
          hoverEdge = edge;
          break;
        }
      }
    }

    setHoveredNode(hoverNode);
    setHoveredEdge(hoverEdge);

    // Update tooltip position if it's visible
    if (tooltipContent) {
      setTooltipContent({
        ...tooltipContent,
        x: e.clientX,
        y: e.clientY
      });
    }

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

  const handleMouseLeave = () => {
    setIsDragging(false);
    setHoveredNode(null);
    setHoveredEdge(null);
    // Don't hide tooltip immediately to allow clicking on it
  };

  // Smooth zooming with animation
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();

    // Calculate new scale with limits
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.1, Math.min(5, scale * delta));

    // Start zoom animation
    setZoomAnimation({
      start: scale,
      target: newScale,
      startTime: performance.now()
    });
  };

  // Create a new node group from selected nodes
  const handleCreateGroup = () => {
    if (selectedNodes.size < 2 || !groupNameInput) return;

    // Generate a random color
    const colors = [
      '#3b82f6', '#8b5cf6', '#ec4899', '#10b981',
      '#f59e0b', '#6366f1', '#ef4444', '#0ea5e9'
    ];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newGroup: NodeGroup = {
      id: `group-${Date.now()}`,
      name: groupNameInput,
      nodes: Array.from(selectedNodes),
      color: randomColor,
      expanded: true
    };

    setNodeGroups([...nodeGroups, newGroup]);
    setGroupNameInput('');
    setSelectedNodes(new Set());

    if (onNodeGroupCreate) {
      onNodeGroupCreate(newGroup);
    }
  };

  // Toggle group expansion
  const toggleGroupExpansion = (groupId: string) => {
    setNodeGroups(nodeGroups.map(group =>
      group.id === groupId
        ? { ...group, expanded: !group.expanded }
        : group
    ));
  };

  // Delete a group
  const handleDeleteGroup = (groupId: string) => {
    setNodeGroups(nodeGroups.filter(group => group.id !== groupId));

    if (onNodeGroupDelete) {
      onNodeGroupDelete(groupId);
    }
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
      case NodeType.DOCUMENT_CHUNK:
        return <FileText size={16} className="text-pink-300" />;
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
      {/* Header with title and controls */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <AnimatedGradientText className="text-xl font-bold">
            Knowledge Graph Visualization
          </AnimatedGradientText>

          <div className="flex gap-2">
            <Tooltip content="Toggle Advanced Filters">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-md ${showFilters ? 'bg-indigo-100 text-indigo-700' : 'bg-white text-slate-700 border border-slate-200'}`}
              >
                <Filter size={16} />
              </button>
            </Tooltip>

            <Tooltip content="Toggle Node Grouping">
              <button
                onClick={() => setShowGrouping(!showGrouping)}
                className={`p-2 rounded-md ${showGrouping ? 'bg-indigo-100 text-indigo-700' : 'bg-white text-slate-700 border border-slate-200'}`}
              >
                <Layers size={16} />
              </button>
            </Tooltip>
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
              placeholder="Search nodes..."
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
            value={selectedNodeType}
            onChange={(e) => setSelectedNodeType(e.target.value as NodeType | 'all')}
            className="px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Node Types</option>
            <option value={NodeType.CONCEPT}>Concepts</option>
            <option value={NodeType.ENTITY}>Entities</option>
            <option value={NodeType.DOCUMENT}>Documents</option>
            <option value={NodeType.DOCUMENT_CHUNK}>Document Chunks</option>
            <option value={NodeType.FACT}>Facts</option>
            <option value={NodeType.QUESTION}>Questions</option>
            <option value={NodeType.ANSWER}>Answers</option>
          </select>

          <div className="text-sm text-slate-500 whitespace-nowrap">
            {filteredNodes.length} of {nodes.length} nodes
          </div>
        </div>

        {/* Advanced filters panel */}
        {showFilters && (
          <div className="p-3 bg-slate-50 rounded-md mb-2 animate-in fade-in duration-200">
            <div className="text-sm font-medium mb-2">Advanced Filters</div>
            <div className="flex flex-wrap gap-2 items-center">
              <select
                value={selectedEdgeType}
                onChange={(e) => setSelectedEdgeType(e.target.value as EdgeType | 'all')}
                className="px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              >
                <option value="all">All Edge Types</option>
                <option value={EdgeType.RELATES_TO}>Relates To</option>
                <option value={EdgeType.CONTAINS}>Contains</option>
                <option value={EdgeType.ANSWERS}>Answers</option>
                <option value={EdgeType.REFERENCES}>References</option>
                <option value={EdgeType.IS_A}>Is A</option>
                <option value={EdgeType.HAS_PROPERTY}>Has Property</option>
                <option value={EdgeType.EXTRACTED_FROM}>Extracted From</option>
                <option value={EdgeType.PART_OF}>Part Of</option>
              </select>

              <div className="text-sm text-slate-500 whitespace-nowrap">
                {filteredEdges.length} of {edges.length} edges
              </div>
            </div>
          </div>
        )}

        {/* Node grouping panel */}
        {showGrouping && (
          <div className="p-3 bg-slate-50 rounded-md mb-2 animate-in fade-in duration-200">
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm font-medium">Node Grouping</div>
              <div className="text-xs text-slate-500">
                {selectedNodes.size} nodes selected
              </div>
            </div>

            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Group name..."
                value={groupNameInput}
                onChange={(e) => setGroupNameInput(e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <ShimmerButton
                onClick={handleCreateGroup}
                disabled={selectedNodes.size < 2 || !groupNameInput}
                className="px-3 py-2 text-sm bg-indigo-600 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Group
              </ShimmerButton>
            </div>

            {nodeGroups.length > 0 && (
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {nodeGroups.map(group => (
                  <div key={group.id} className="flex items-center justify-between p-1 bg-white rounded border border-slate-200">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: group.color }}></div>
                      <span className="text-sm">{group.name}</span>
                      <span className="text-xs text-slate-500">({group.nodes.length})</span>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => toggleGroupExpansion(group.id)}
                        className="p-1 text-slate-500 hover:text-slate-700"
                      >
                        {group.expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                      <button
                        onClick={() => handleDeleteGroup(group.id)}
                        className="p-1 text-slate-500 hover:text-red-500"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main visualization area */}
      <div className="flex-1 relative">
        <MagicCard className="h-full overflow-hidden">
          <ShineBorder borderRadius="0.75rem" className="p-0.5 h-full">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm overflow-hidden h-full relative">
              {filteredNodes.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-slate-500">No nodes match your search criteria</p>
                </div>
              ) : (
                <>
                  <canvas
                    ref={canvasRef}
                    className="w-full h-full"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseLeave}
                    onWheel={handleWheel}
                  />

                  {/* Zoom controls */}
                  <div className="absolute bottom-4 right-4 flex flex-col gap-2 bg-white/80 backdrop-blur-sm p-1 rounded-md shadow-md">
                    <Tooltip content="Zoom In">
                      <button
                        onClick={() => {
                          setZoomAnimation({
                            start: scale,
                            target: Math.min(5, scale * 1.2),
                            startTime: performance.now()
                          });
                        }}
                        className="p-2 bg-white rounded-md hover:bg-slate-100 text-slate-700"
                      >
                        <ZoomIn size={16} />
                      </button>
                    </Tooltip>
                    <Tooltip content="Zoom Out">
                      <button
                        onClick={() => {
                          setZoomAnimation({
                            start: scale,
                            target: Math.max(0.1, scale / 1.2),
                            startTime: performance.now()
                          });
                        }}
                        className="p-2 bg-white rounded-md hover:bg-slate-100 text-slate-700"
                      >
                        <ZoomOut size={16} />
                      </button>
                    </Tooltip>
                    <Tooltip content="Reset View">
                      <button
                        onClick={() => {
                          setScale(1);
                          setOffset({ x: 0, y: 0 });
                        }}
                        className="p-2 bg-white rounded-md hover:bg-slate-100 text-slate-700"
                      >
                        <RotateCcw size={16} />
                      </button>
                    </Tooltip>
                    <Tooltip content="Pan Mode">
                      <button
                        className="p-2 bg-white rounded-md hover:bg-slate-100 text-slate-700"
                      >
                        <Move size={16} />
                      </button>
                    </Tooltip>
                  </div>

                  {/* Tooltip */}
                  {tooltipContent && (
                    <div
                      ref={tooltipRef}
                      className="absolute z-10 bg-white rounded-md shadow-lg border border-slate-200 max-w-xs"
                      style={{
                        left: `${tooltipContent.x + 10}px`,
                        top: `${tooltipContent.y + 10}px`,
                        transform: 'translate(-50%, -100%)'
                      }}
                    >
                      {tooltipContent.content}
                    </div>
                  )}
                </>
              )}
            </div>
          </ShineBorder>
        </MagicCard>
      </div>

      {/* Selected node details panel */}
      {selectedNode && (
        <div className="mt-4">
          <MagicCard className="overflow-hidden">
            <ShineBorder borderRadius="0.75rem" className="p-0.5">
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm overflow-hidden p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getNodeTypeIcon(selectedNode.type)}
                    <span className="text-xs uppercase tracking-wider text-muted-foreground">
                      {selectedNode.type}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    ID: {selectedNode.id}
                  </div>
                </div>
                <h3 className="text-lg font-semibold mb-2">{selectedNode.name}</h3>
                <div className="max-h-32 overflow-y-auto mb-2">
                  <p className="text-sm text-muted-foreground">{selectedNode.content}</p>
                </div>

                {selectedNode.metadata && Object.keys(selectedNode.metadata).length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-200">
                    <div className="text-xs font-medium text-slate-500 mb-1">Metadata</div>
                    <div className="grid grid-cols-2 gap-1">
                      {Object.entries(selectedNode.metadata).map(([key, value]) => (
                        <div key={key} className="text-xs">
                          <span className="font-medium">{key}:</span> {String(value).substring(0, 30)}
                          {String(value).length > 30 && '...'}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ShineBorder>
          </MagicCard>
        </div>
      )}
    </div>
  );
}
