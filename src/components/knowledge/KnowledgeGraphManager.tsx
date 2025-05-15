"use client";

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import KnowledgeGraphVisualization from './KnowledgeGraphVisualization';
import EnhancedKnowledgeGraphVisualization from './EnhancedKnowledgeGraphVisualization';
import KnowledgeGraphEditor from './KnowledgeGraphEditor';
import DocumentUploader from './DocumentUploader';
import DocumentSearch from './DocumentSearch';
import { NodeType } from '@/lib/arango-knowledge-service';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorMessage } from '@/components/ui/error-message';
import { Eye, Edit, RefreshCw, FileText, Search, LayoutGrid } from 'lucide-react';

// Define the node and edge types
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

interface KnowledgeGraphManagerProps {
  initialNodes?: KnowledgeNode[];
  initialEdges?: KnowledgeEdge[];
  onSave?: (nodes: KnowledgeNode[], edges: KnowledgeEdge[]) => Promise<void>;
  onLoad?: () => Promise<{ nodes: KnowledgeNode[], edges: KnowledgeEdge[] }>;
  readOnly?: boolean;
}

export default function KnowledgeGraphManager({
  initialNodes = [],
  initialEdges = [],
  onSave,
  onLoad,
  readOnly = false,
}: KnowledgeGraphManagerProps) {
  const [nodes, setNodes] = useState<KnowledgeNode[]>(initialNodes);
  const [edges, setEdges] = useState<KnowledgeEdge[]>(initialEdges);
  const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(null);
  const [activeTab, setActiveTab] = useState<string>("view");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showDocumentUploader, setShowDocumentUploader] = useState<boolean>(false);
  const [showDocumentSearch, setShowDocumentSearch] = useState<boolean>(false);
  const [useEnhancedVisualization, setUseEnhancedVisualization] = useState<boolean>(true);

  // Load data if onLoad is provided
  useEffect(() => {
    if (initialNodes.length === 0 && initialEdges.length === 0 && onLoad) {
      loadData();
    }
  }, []);

  // Load data from the server
  const loadData = async () => {
    if (!onLoad) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await onLoad();
      setNodes(data.nodes);
      setEdges(data.edges);
    } catch (err) {
      setError(`Failed to load knowledge graph: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle node selection
  const handleNodeClick = (node: KnowledgeNode) => {
    setSelectedNode(node);
    if (activeTab === "view") {
      setActiveTab("edit");
    }
  };

  // Handle save
  const handleSave = async (updatedNodes: KnowledgeNode[], updatedEdges: KnowledgeEdge[]) => {
    if (!onSave) return;

    setIsLoading(true);
    setError(null);

    try {
      await onSave(updatedNodes, updatedEdges);
      setNodes(updatedNodes);
      setEdges(updatedEdges);
    } catch (err) {
      setError(`Failed to save knowledge graph: ${err instanceof Error ? err.message : 'Unknown error'}`);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Handle document processed
  const handleDocumentProcessed = (document: any, chunks: any[]) => {
    // Add the document node to the graph
    const newNodes = [...nodes, document, ...chunks];

    // Create edges between document and chunks
    const newEdges = [...edges];

    // Add the document node to the graph
    setNodes(newNodes);
    setEdges(newEdges);

    // Hide the document uploader
    setShowDocumentUploader(false);

    // Save the updated graph
    handleSave(newNodes, newEdges);
  };

  // Handle document selected from search
  const handleDocumentSelected = (document: any) => {
    // Find if the document is already in the graph
    const existingNode = nodes.find(node => node.id === document.id);

    if (existingNode) {
      // Select the existing node
      setSelectedNode(existingNode);
    } else {
      // Add the document to the graph
      const newNodes = [...nodes, document];
      setNodes(newNodes);
      setSelectedNode(document);

      // Save the updated graph
      handleSave(newNodes, edges);
    }

    // Hide the document search
    setShowDocumentSearch(false);
  };

  if (isLoading && nodes.length === 0) {
    return <LoadingState message="Loading knowledge graph..." variant="card" size="large" />;
  }

  return (
    <div className="flex flex-col h-full">
      {error && (
        <ErrorMessage
          title="Error"
          message={error}
          variant="error"
          className="mb-4"
          onRetry={() => {
            setError(null);
            if (nodes.length === 0 && onLoad) {
              loadData();
            }
          }}
        />
      )}

      {showDocumentUploader && (
        <div className="mb-4">
          <DocumentUploader
            onDocumentProcessed={handleDocumentProcessed}
          />
        </div>
      )}

      {showDocumentSearch && (
        <div className="mb-4">
          <DocumentSearch
            onDocumentSelected={handleDocumentSelected}
          />
        </div>
      )}

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col"
      >
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="view" className="flex items-center gap-1">
              <Eye size={14} />
              <span>View</span>
            </TabsTrigger>
            {!readOnly && (
              <TabsTrigger value="edit" className="flex items-center gap-1">
                <Edit size={14} />
                <span>Edit</span>
              </TabsTrigger>
            )}
          </TabsList>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setUseEnhancedVisualization(!useEnhancedVisualization)}
              className={`flex items-center gap-1 text-sm px-2 py-1 rounded-md ${
                useEnhancedVisualization
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-primary hover:text-primary/80 hover:bg-gray-100'
              }`}
            >
              <LayoutGrid size={14} />
              <span>{useEnhancedVisualization ? 'Advanced View' : 'Basic View'}</span>
            </button>

            {!readOnly && (
              <>
                <button
                  onClick={() => setShowDocumentUploader(!showDocumentUploader)}
                  className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 px-2 py-1 rounded-md hover:bg-gray-100"
                >
                  <FileText size={14} />
                  <span>{showDocumentUploader ? 'Hide Upload' : 'Upload Document'}</span>
                </button>

                <button
                  onClick={() => setShowDocumentSearch(!showDocumentSearch)}
                  className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 px-2 py-1 rounded-md hover:bg-gray-100"
                >
                  <Search size={14} />
                  <span>{showDocumentSearch ? 'Hide Search' : 'Search Documents'}</span>
                </button>
              </>
            )}

            {onLoad && (
              <button
                onClick={loadData}
                className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 px-2 py-1 rounded-md hover:bg-gray-100"
                disabled={isLoading}
              >
                <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
                <span>Refresh</span>
              </button>
            )}
          </div>
        </div>

        <TabsContent value="view" className="flex-1 mt-0">
          {useEnhancedVisualization ? (
            <EnhancedKnowledgeGraphVisualization
              nodes={nodes}
              edges={edges}
              onNodeClick={handleNodeClick}
            />
          ) : (
            <KnowledgeGraphVisualization
              nodes={nodes}
              edges={edges}
              onNodeClick={handleNodeClick}
            />
          )}
        </TabsContent>

        {!readOnly && (
          <TabsContent value="edit" className="flex-1 mt-0">
            <KnowledgeGraphEditor
              nodes={nodes}
              edges={edges}
              onSave={handleSave}
              selectedNode={selectedNode}
              onSelectNode={setSelectedNode}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
