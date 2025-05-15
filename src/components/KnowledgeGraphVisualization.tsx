"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ShineBorder } from "@/components/ui/shine-border";
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text";
import { ShimmerButton } from "@/components/magicui/shimmer-button";
import { MagicCard } from "@/components/magicui/magic-card";
import { KnowledgeNode, NodeType, getKnowledgeEdges } from "@/lib/arango-knowledge-service";
import { ErrorMessage } from "@/components/ui/error-message";
import { LoadingState } from "@/components/ui/loading-state";
import { 
  Search, 
  ZoomIn, 
  ZoomOut, 
  RefreshCw, 
  FileText, 
  Database, 
  Brain, 
  Lightbulb, 
  Link as LinkIcon
} from "lucide-react";

interface KnowledgeGraphVisualizationProps {
  nodes?: KnowledgeNode[];
  edges?: any[];
  isLoading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
}

export default function KnowledgeGraphVisualization({
  nodes = [],
  edges = [],
  isLoading = false,
  error = null,
  onRefresh
}: KnowledgeGraphVisualizationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredNodes, setFilteredNodes] = useState<KnowledgeNode[]>(nodes);
  const [filteredEdges, setFilteredEdges] = useState<any[]>(edges);
  const [zoom, setZoom] = useState(1);
  const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter nodes and edges based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredNodes(nodes);
      setFilteredEdges(edges);
      return;
    }

    const term = searchTerm.toLowerCase();
    const matchedNodes = nodes.filter(
      (node) => 
        node.title.toLowerCase().includes(term) || 
        node.content?.toLowerCase().includes(term) ||
        node.source?.toLowerCase().includes(term)
    );

    // Get node IDs for filtering edges
    const nodeIds = new Set(matchedNodes.map(node => node.id));
    
    // Only keep edges where both source and target are in the filtered nodes
    const matchedEdges = edges.filter(
      edge => nodeIds.has(edge.source) && nodeIds.has(edge.target)
    );

    setFilteredNodes(matchedNodes);
    setFilteredEdges(matchedEdges);
  }, [searchTerm, nodes, edges]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    if (onRefresh) {
      setIsRefreshing(true);
      onRefresh();
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  }, [onRefresh]);

  // Get node icon based on type
  const getNodeIcon = (type: NodeType) => {
    switch (type) {
      case "document":
        return <FileText size={16} />;
      case "database":
        return <Database size={16} />;
      case "concept":
        return <Brain size={16} />;
      case "insight":
        return <Lightbulb size={16} />;
      default:
        return <FileText size={16} />;
    }
  };

  // Get node color based on type
  const getNodeColor = (type: NodeType) => {
    switch (type) {
      case "document":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "database":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "concept":
        return "bg-green-100 text-green-800 border-green-200";
      case "insight":
        return "bg-amber-100 text-amber-800 border-amber-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  if (isLoading) {
    return (
      <LoadingState 
        message="Loading knowledge graph..." 
        variant="card" 
        size="large" 
      />
    );
  }

  if (error) {
    return (
      <ErrorMessage
        title="Error loading knowledge graph"
        message={error}
        variant="error"
        size="large"
        onRetry={onRefresh}
      />
    );
  }

  return (
    <ShineBorder
      borderColor="rgba(59, 130, 246, 0.2)"
      shineBorderColor="rgba(59, 130, 246, 0.6)"
      borderRadius="0.75rem"
      className="w-full"
    >
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <AnimatedGradientText
            text="Knowledge Graph"
            className="text-2xl font-bold"
            gradient="linear-gradient(to right, #3b82f6, #8b5cf6)"
          />
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search knowledge..."
                className="pl-10 pr-4 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary w-64"
              />
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                className="p-2 rounded-md hover:bg-slate-100"
                title="Zoom out"
              >
                <ZoomOut size={16} />
              </button>
              <span className="text-sm font-medium">{Math.round(zoom * 100)}%</span>
              <button
                onClick={() => setZoom(Math.min(2, zoom + 0.1))}
                className="p-2 rounded-md hover:bg-slate-100"
                title="Zoom in"
              >
                <ZoomIn size={16} />
              </button>
            </div>
            <ShimmerButton
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="px-3 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground flex items-center gap-2"
            >
              {isRefreshing ? <RefreshCw className="animate-spin" size={14} /> : <RefreshCw size={14} />}
              <span>Refresh</span>
            </ShimmerButton>
          </div>
        </div>

        <div className="relative h-[600px] border border-slate-200 rounded-lg overflow-hidden" ref={containerRef}>
          <div 
            className="absolute inset-0 p-4 overflow-auto"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
          >
            {filteredNodes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-500">
                <Brain size={48} className="mb-4 opacity-30" />
                <p className="text-lg font-medium">No knowledge nodes found</p>
                <p className="text-sm">
                  {searchTerm ? "Try a different search term" : "Add some knowledge to get started"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredNodes.map((node) => (
                  <MagicCard
                    key={node.id}
                    className={`p-4 rounded-lg border ${getNodeColor(node.type)}`}
                    focus={selectedNode?.id === node.id}
                    onClick={() => setSelectedNode(node.id === selectedNode?.id ? null : node)}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {getNodeIcon(node.type)}
                      <h3 className="font-medium">{node.title}</h3>
                    </div>
                    {node.content && (
                      <p className="text-sm mb-2 line-clamp-3">{node.content}</p>
                    )}
                    {node.source && (
                      <div className="text-xs text-slate-500 flex items-center gap-1">
                        <LinkIcon size={12} />
                        <span>{node.source}</span>
                      </div>
                    )}
                  </MagicCard>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </ShineBorder>
  );
}
