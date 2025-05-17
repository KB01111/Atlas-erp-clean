"use client";

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import Cytoscape from 'cytoscape';
import { EnhancedCard } from "@/components/ui/enhanced-card";
import { BorderContainer } from "@/components/ui/shine-border";
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
  Move,
  Download,
  Upload,
  Maximize,
  Minimize,
  Layout,
  Settings
} from 'lucide-react';
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text";
import { EnhancedActionButton } from "@/components/ui/enhanced-action-button";
import { Tooltip } from "@/components/ui/tooltip";

// Import layout extensions
import fcose from 'cytoscape-fcose';
import cola from 'cytoscape-cola';
import dagre from 'cytoscape-dagre';
import klay from 'cytoscape-klay';
import coseBilkent from 'cytoscape-cose-bilkent';
import euler from 'cytoscape-euler';

// Register extensions - do this outside of React component
// to avoid React Hook errors
 
if (typeof window !== 'undefined') {
  // Only register in browser environment
  try {
    // These are not React Hooks, they're Cytoscape extension registrations
    // eslint-disable-next-line react-hooks/rules-of-hooks
    Cytoscape.use(fcose);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    Cytoscape.use(cola);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    Cytoscape.use(dagre);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    Cytoscape.use(klay);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    Cytoscape.use(coseBilkent);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    Cytoscape.use(euler);
  } catch (error) {
    console.warn('Error registering Cytoscape extensions:', error);
  }
}

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

interface EnhancedKnowledgeGraphVisualizationProps {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
  onNodeClick?: (node: KnowledgeNode) => void;
  onNodeGroupCreate?: (group: NodeGroup) => void;
  onNodeGroupDelete?: (groupId: string) => void;
}

// Layout options
type LayoutType = 'fcose' | 'cola' | 'dagre' | 'klay' | 'cose-bilkent' | 'euler' | 'concentric' | 'grid' | 'circle' | 'breadthfirst';

export default function EnhancedKnowledgeGraphVisualization({
  nodes,
  edges,
  onNodeClick,
  onNodeGroupCreate,
  onNodeGroupDelete,
}: EnhancedKnowledgeGraphVisualizationProps) {
  const cyRef = useRef<Cytoscape.Core | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // State for visualization options
  const [selectedLayout, setSelectedLayout] = useState<LayoutType>('fcose');
  const [layoutSettings, setLayoutSettings] = useState<Record<string, any>>({});
  const [showLayoutSettings, setShowLayoutSettings] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

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

  // Selected node state
  const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(null);

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

  // Get node color based on type
  const getNodeColor = (type: NodeType) => {
    switch (type) {
      case NodeType.CONCEPT:
        return '#3b82f6'; // blue
      case NodeType.ENTITY:
        return '#8b5cf6'; // purple
      case NodeType.DOCUMENT:
        return '#ec4899'; // pink
      case NodeType.DOCUMENT_CHUNK:
        return '#ec4899'; // pink (same as document)
      case NodeType.FACT:
        return '#10b981'; // green
      case NodeType.QUESTION:
        return '#f59e0b'; // amber
      case NodeType.ANSWER:
        return '#6366f1'; // indigo
      default:
        return '#9ca3af'; // gray
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

  // Prepare elements for Cytoscape
  const elements = useMemo(() => {
    const cytoscapeElements: Cytoscape.ElementDefinition[] = [];

    // Add nodes
    filteredNodes.forEach(node => {
      cytoscapeElements.push({
        data: {
          id: node.id,
          label: node.name,
          type: node.type,
          content: node.content,
          metadata: node.metadata,
          color: getNodeColor(node.type),
          originalNode: node // Store the original node object for reference
        },
        position: node.position
      });
    });

    // Add edges
    filteredEdges.forEach(edge => {
      cytoscapeElements.push({
        data: {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          label: edge.label || edge.type,
          type: edge.type,
          weight: edge.weight || 1
        }
      });
    });

    return cytoscapeElements;
  }, [filteredNodes, filteredEdges]);

  // Define Cytoscape stylesheet
  const stylesheet: Cytoscape.Stylesheet[] = [
    {
      selector: 'node',
      style: {
        'background-color': 'data(color)',
        'label': 'data(label)',
        'color': '#000000',
        'text-valign': 'bottom',
        'text-halign': 'center',
        'text-margin-y': 10,
        'font-size': 12,
        'width': 30,
        'height': 30,
        'text-background-color': 'white',
        'text-background-opacity': 0.8,
        'text-background-padding': '3px',
        'text-background-shape': 'roundrectangle',
        'text-max-width': '150px',
        'text-wrap': 'ellipsis',
        'text-overflow-wrap': 'anywhere',
        'border-width': 2,
        'border-color': '#ffffff',
        'border-opacity': 0.5
      }
    },
    {
      selector: 'edge',
      style: {
        'width': 'data(weight)',
        'line-color': '#9ca3af',
        'opacity': 0.7,
        'label': 'data(label)',
        'font-size': 10,
        'text-rotation': 'autorotate',
        'text-background-color': 'white',
        'text-background-opacity': 0.8,
        'text-background-padding': '2px',
        'curve-style': 'bezier',
        'target-arrow-shape': 'triangle',
        'target-arrow-color': '#9ca3af',
        'arrow-scale': 0.8,
        'text-max-width': '100px',
        'text-wrap': 'ellipsis'
      }
    },
    {
      selector: ':selected',
      style: {
        'background-color': 'data(color)',
        'border-width': 3,
        'border-color': '#ffffff',
        'border-opacity': 1,
        'line-color': '#6366f1',
        'target-arrow-color': '#6366f1',
        'opacity': 1
      }
    },
    {
      selector: '.highlighted',
      style: {
        'background-color': 'data(color)',
        'border-width': 3,
        'border-color': '#ffffff',
        'border-opacity': 1,
        'line-color': '#6366f1',
        'target-arrow-color': '#6366f1',
        'opacity': 1
      }
    }
  ];

  // Handle node click
  const handleNodeClick = useCallback((event: Cytoscape.EventObject) => {
    const node = event.target.data('originalNode');
    if (node && onNodeClick) {
      setSelectedNode(node);
      onNodeClick(node);
    }
  }, [onNodeClick]);

  // Apply layout
  const applyLayout = useCallback(() => {
    if (!cyRef.current) return;

    // Define layout options based on selected layout
    const layoutOptions: unknown = {
      name: selectedLayout,
      fit: true,
      padding: 30,
      animate: true,
      animationDuration: 500,
      ...layoutSettings
    };

    // Add specific options based on layout type
    switch (selectedLayout) {
      case 'fcose':
        layoutOptions.quality = 'proof';
        layoutOptions.nodeRepulsion = 5000;
        layoutOptions.idealEdgeLength = 100;
        layoutOptions.edgeElasticity = 0.45;
        break;
      case 'cola':
        layoutOptions.maxSimulationTime = 3000;
        layoutOptions.nodeSpacing = 30;
        layoutOptions.edgeLength = 100;
        break;
      case 'dagre':
        layoutOptions.rankDir = 'TB';
        layoutOptions.rankSep = 100;
        layoutOptions.nodeSep = 50;
        layoutOptions.ranker = 'network-simplex';
        break;
      case 'klay':
        layoutOptions.klay = {
          direction: 'DOWN',
          spacing: 40,
          edgeSpacingFactor: 0.5
        };
        break;
      case 'cose-bilkent':
        layoutOptions.quality = 'proof';
        layoutOptions.nodeRepulsion = 5000;
        layoutOptions.idealEdgeLength = 100;
        layoutOptions.edgeElasticity = 0.45;
        break;
      case 'euler':
        layoutOptions.springLength = 100;
        layoutOptions.springCoeff = 0.0008;
        layoutOptions.mass = 4;
        layoutOptions.gravity = -1.2;
        layoutOptions.pull = 0.001;
        break;
      case 'concentric':
        layoutOptions.minNodeSpacing = 50;
        layoutOptions.concentric = (node: unknown) => node.degree();
        layoutOptions.levelWidth = () => 1;
        break;
    }

    // Run the layout
    const layout = cyRef.current.layout(layoutOptions);
    layout.run();
  }, [selectedLayout, layoutSettings]);

  // Initialize Cytoscape
  const initCytoscape = useCallback((cy: Cytoscape.Core) => {
    cyRef.current = cy;

    // Register event handlers
    cy.on('tap', 'node', handleNodeClick);

    // Apply initial layout
    applyLayout();
  }, [handleNodeClick, applyLayout]);

  // Update layout when layout type changes
  useEffect(() => {
    if (cyRef.current) {
      applyLayout();
    }
  }, [selectedLayout, applyLayout]);

  // Toggle fullscreen mode
  const toggleFullScreen = () => {
    if (!containerRef.current) return;

    if (!isFullScreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }

    setIsFullScreen(!isFullScreen);
  };

  // Export graph as PNG
  const exportAsPNG = () => {
    if (!cyRef.current) return;

    const png = cyRef.current.png({
      output: 'blob',
      bg: 'white',
      full: true,
      scale: 2
    });

    // Create download link
    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(png);
    downloadLink.download = 'knowledge-graph.png';
    downloadLink.click();
  };

  // Export graph as JSON
  const exportAsJSON = () => {
    if (!cyRef.current) return;

    const json = {
      nodes: filteredNodes,
      edges: filteredEdges
    };

    const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.download = 'knowledge-graph.json';
    downloadLink.click();
  };

  // Import graph from JSON file
  const importFromJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (json.nodes && json.edges) {
          // TODO: Handle imported data
          console.log('Imported graph data:', json);
          // This would need to be handled by the parent component
        }
      } catch (error) {
        console.error('Error parsing JSON file:', error);
      }
    };
    reader.readAsText(file);
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

  return (
    <div className="flex flex-col h-full" ref={containerRef}>
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

            <Tooltip content="Layout Settings">
              <button
                onClick={() => setShowLayoutSettings(!showLayoutSettings)}
                className={`p-2 rounded-md ${showLayoutSettings ? 'bg-indigo-100 text-indigo-700' : 'bg-white text-slate-700 border border-slate-200'}`}
              >
                <Layout size={16} />
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

        {/* Layout settings panel */}
        {showLayoutSettings && (
          <div className="p-3 bg-slate-50 rounded-md mb-2 animate-in fade-in duration-200">
            <div className="text-sm font-medium mb-2">Layout Settings</div>
            <div className="flex flex-wrap gap-2 items-center mb-2">
              <select
                value={selectedLayout}
                onChange={(e) => setSelectedLayout(e.target.value as LayoutType)}
                className="px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              >
                <option value="fcose">Force-Directed (F-CoSE)</option>
                <option value="cola">Force-Directed (Cola)</option>
                <option value="cose-bilkent">Force-Directed (CoSE-Bilkent)</option>
                <option value="euler">Force-Directed (Euler)</option>
                <option value="dagre">Hierarchical (Dagre)</option>
                <option value="klay">Hierarchical (Klay)</option>
                <option value="concentric">Concentric</option>
                <option value="circle">Circle</option>
                <option value="grid">Grid</option>
                <option value="breadthfirst">Breadth-First</option>
              </select>

              <EnhancedActionButton
                onClick={applyLayout}
                className="px-3 py-2 text-sm bg-indigo-600 text-white rounded-md"
               variant="default" size="sm" hover="lift">
                Apply Layout
              </EnhancedActionButton>
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
              <EnhancedActionButton
                onClick={handleCreateGroup}
                disabled={selectedNodes.size < 2 || !groupNameInput}
                className="px-3 py-2 text-sm bg-indigo-600 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
               variant="default" size="sm" hover="lift">
                Create Group
              </EnhancedActionButton>
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
        <EnhancedCard className="h-full overflow-hidden" interactive hoverEffect="shadow">
          <BorderContainer borderRadius="0.75rem" className="p-0.5 h-full" variant="primary" rounded="xl">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm overflow-hidden h-full relative">
              {filteredNodes.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-slate-500">No nodes match your search criteria</p>
                </div>
              ) : (
                <>
                  <CytoscapeComponent
                    elements={elements}
                    stylesheet={stylesheet}
                    style={{ width: '100%', height: '100%' }}
                    cy={initCytoscape}
                    wheelSensitivity={0.2}
                  />

                  {/* Control panel */}
                  <div className="absolute bottom-4 right-4 flex flex-col gap-2 bg-white/80 backdrop-blur-sm p-1 rounded-md shadow-md">
                    <Tooltip content="Zoom In">
                      <button
                        onClick={() => cyRef.current?.zoom(cyRef.current.zoom() * 1.2)}
                        className="p-2 bg-white rounded-md hover:bg-slate-100 text-slate-700"
                      >
                        <ZoomIn size={16} />
                      </button>
                    </Tooltip>
                    <Tooltip content="Zoom Out">
                      <button
                        onClick={() => cyRef.current?.zoom(cyRef.current.zoom() / 1.2)}
                        className="p-2 bg-white rounded-md hover:bg-slate-100 text-slate-700"
                      >
                        <ZoomOut size={16} />
                      </button>
                    </Tooltip>
                    <Tooltip content="Reset View">
                      <button
                        onClick={() => cyRef.current?.fit()}
                        className="p-2 bg-white rounded-md hover:bg-slate-100 text-slate-700"
                      >
                        <RotateCcw size={16} />
                      </button>
                    </Tooltip>
                    <Tooltip content="Toggle Fullscreen">
                      <button
                        onClick={toggleFullScreen}
                        className="p-2 bg-white rounded-md hover:bg-slate-100 text-slate-700"
                      >
                        {isFullScreen ? <Minimize size={16} /> : <Maximize size={16} />}
                      </button>
                    </Tooltip>
                    <Tooltip content="Export as PNG">
                      <button
                        onClick={exportAsPNG}
                        className="p-2 bg-white rounded-md hover:bg-slate-100 text-slate-700"
                      >
                        <Download size={16} />
                      </button>
                    </Tooltip>
                    <Tooltip content="Export as JSON">
                      <button
                        onClick={exportAsJSON}
                        className="p-2 bg-white rounded-md hover:bg-slate-100 text-slate-700"
                      >
                        <Download size={16} />
                      </button>
                    </Tooltip>
                    <Tooltip content="Import from JSON">
                      <label className="p-2 bg-white rounded-md hover:bg-slate-100 text-slate-700 cursor-pointer">
                        <Upload size={16} />
                        <input
                          type="file"
                          accept=".json"
                          onChange={importFromJSON}
                          className="hidden"
                        />
                      </label>
                    </Tooltip>
                  </div>
                </>
              )}
            </div>
          </BorderContainer>
        </EnhancedCard>
      </div>

      {/* Selected node details panel */}
      {selectedNode && (
        <div className="mt-4">
          <EnhancedCard className="overflow-hidden" interactive hoverEffect="shadow">
            <BorderContainer borderRadius="0.75rem" className="p-0.5" variant="primary" rounded="xl">
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
            </BorderContainer>
          </EnhancedCard>
        </div>
      )}
    </div>
  );
}
