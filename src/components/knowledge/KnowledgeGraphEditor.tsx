"use client";

import React, { useState, useEffect } from 'react';
import { MagicCard } from "@/components/magicui/magic-card";
import { ShineBorder } from "@/components/ui/shine-border";
import { ShimmerButton } from "@/components/magicui/shimmer-button";
import { NodeType } from '@/lib/arango-knowledge-service';
import { Brain, FileText, Lightbulb, Database, HelpCircle, MessageSquare, Plus, Save, Trash, Link as LinkIcon } from 'lucide-react';
import { ErrorMessage } from '@/components/ui/error-message';
import { LoadingState } from '@/components/ui/loading-state';

// Define the node and edge types for the editor
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

interface KnowledgeGraphEditorProps {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
  onSave: (nodes: KnowledgeNode[], edges: KnowledgeEdge[]) => Promise<void>;
  selectedNode?: KnowledgeNode | null;
  onSelectNode?: (node: KnowledgeNode | null) => void;
}

export default function KnowledgeGraphEditor({
  nodes,
  edges,
  onSave,
  selectedNode,
  onSelectNode,
}: KnowledgeGraphEditorProps) {
  const [editedNodes, setEditedNodes] = useState<KnowledgeNode[]>(nodes);
  const [editedEdges, setEditedEdges] = useState<KnowledgeEdge[]>(edges);
  const [currentNode, setCurrentNode] = useState<KnowledgeNode | null>(selectedNode || null);
  const [isCreatingNode, setIsCreatingNode] = useState(false);
  const [isCreatingEdge, setIsCreatingEdge] = useState(false);
  const [edgeSource, setEdgeSource] = useState<string | null>(null);
  const [edgeTarget, setEdgeTarget] = useState<string | null>(null);
  const [edgeLabel, setEdgeLabel] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New node form state
  const [newNodeType, setNewNodeType] = useState<NodeType>(NodeType.CONCEPT);
  const [newNodeName, setNewNodeName] = useState('');
  const [newNodeContent, setNewNodeContent] = useState('');

  // Update current node when selectedNode changes
  useEffect(() => {
    if (selectedNode) {
      setCurrentNode(selectedNode);
      setIsCreatingNode(false);
    }
  }, [selectedNode]);

  // Update edited nodes and edges when props change
  useEffect(() => {
    setEditedNodes(nodes);
    setEditedEdges(edges);
  }, [nodes, edges]);

  // Handle node creation
  const handleCreateNode = () => {
    if (!newNodeName.trim() || !newNodeContent.trim()) {
      setError('Node name and content are required');
      return;
    }

    const newNode: KnowledgeNode = {
      id: `node-${Date.now()}`,
      type: newNodeType,
      name: newNodeName,
      content: newNodeContent,
      position: { x: Math.random() * 400 + 200, y: Math.random() * 300 + 150 },
    };

    setEditedNodes([...editedNodes, newNode]);
    setCurrentNode(newNode);
    setIsCreatingNode(false);
    setNewNodeName('');
    setNewNodeContent('');
    setError(null);

    if (onSelectNode) {
      onSelectNode(newNode);
    }
  };

  // Handle node update
  const handleUpdateNode = () => {
    if (!currentNode) return;

    if (!currentNode.name.trim() || !currentNode.content.trim()) {
      setError('Node name and content are required');
      return;
    }

    const updatedNodes = editedNodes.map(node =>
      node.id === currentNode.id ? currentNode : node
    );

    setEditedNodes(updatedNodes);
    setError(null);
  };

  // Handle node deletion
  const handleDeleteNode = (nodeId: string) => {
    // Remove the node
    const updatedNodes = editedNodes.filter(node => node.id !== nodeId);

    // Remove any edges connected to this node
    const updatedEdges = editedEdges.filter(
      edge => edge.source !== nodeId && edge.target !== nodeId
    );

    setEditedNodes(updatedNodes);
    setEditedEdges(updatedEdges);

    if (currentNode?.id === nodeId) {
      setCurrentNode(null);
      if (onSelectNode) {
        onSelectNode(null);
      }
    }
  };

  // Handle edge creation
  const handleCreateEdge = () => {
    if (!edgeSource || !edgeTarget) {
      setError('Source and target nodes are required');
      return;
    }

    if (edgeSource === edgeTarget) {
      setError('Source and target nodes must be different');
      return;
    }

    // Check if edge already exists
    const edgeExists = editedEdges.some(
      edge => edge.source === edgeSource && edge.target === edgeTarget
    );

    if (edgeExists) {
      setError('An edge between these nodes already exists');
      return;
    }

    const newEdge: KnowledgeEdge = {
      id: `edge-${Date.now()}`,
      source: edgeSource,
      target: edgeTarget,
      label: edgeLabel,
    };

    setEditedEdges([...editedEdges, newEdge]);
    setIsCreatingEdge(false);
    setEdgeSource(null);
    setEdgeTarget(null);
    setEdgeLabel('');
    setError(null);
  };

  // Handle save
  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      await onSave(editedNodes, editedEdges);
    } catch (err) {
      setError(`Failed to save: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
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
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Knowledge Graph Editor</h2>
        <div className="flex gap-2">
          <ShimmerButton
            onClick={() => {
              setIsCreatingNode(true);
              setIsCreatingEdge(false);
              setCurrentNode(null);
              if (onSelectNode) onSelectNode(null);
            }}
            className="px-3 py-1 rounded-md text-sm font-medium bg-blue-500 text-white flex items-center gap-1"
          >
            <Plus size={14} />
            <span>Add Node</span>
          </ShimmerButton>

          <ShimmerButton
            onClick={() => {
              setIsCreatingEdge(true);
              setIsCreatingNode(false);
            }}
            className="px-3 py-1 rounded-md text-sm font-medium bg-purple-500 text-white flex items-center gap-1"
          >
            <LinkIcon size={14} />
            <span>Add Edge</span>
          </ShimmerButton>

          <ShimmerButton
            onClick={handleSave}
            disabled={isSaving}
            className="px-3 py-1 rounded-md text-sm font-medium bg-green-500 text-white flex items-center gap-1"
          >
            {isSaving ? (
              <LoadingState variant="inline" message="Saving..." />
            ) : (
              <>
                <Save size={14} />
                <span>Save Changes</span>
              </>
            )}
          </ShimmerButton>
        </div>
      </div>

      {error && (
        <ErrorMessage
          message={error}
          variant="error"
          size="small"
          className="mb-4"
          onRetry={() => setError(null)}
        />
      )}

      <MagicCard className="overflow-hidden flex-1">
        <ShineBorder borderRadius="0.75rem" className="p-0.5 h-full">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm overflow-hidden h-full p-4">
            {isCreatingNode && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Create New Node</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Node Type</label>
                  <select
                    value={newNodeType}
                    onChange={(e) => setNewNodeType(e.target.value as NodeType)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                  >
                    <option value={NodeType.CONCEPT}>Concept</option>
                    <option value={NodeType.ENTITY}>Entity</option>
                    <option value={NodeType.DOCUMENT}>Document</option>
                    <option value={NodeType.DOCUMENT_CHUNK}>Document Chunk</option>
                    <option value={NodeType.FACT}>Fact</option>
                    <option value={NodeType.QUESTION}>Question</option>
                    <option value={NodeType.ANSWER}>Answer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={newNodeName}
                    onChange={(e) => setNewNodeName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                    placeholder="Enter node name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                  <textarea
                    value={newNodeContent}
                    onChange={(e) => setNewNodeContent(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                    rows={5}
                    placeholder="Enter node content"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setIsCreatingNode(false);
                      setNewNodeName('');
                      setNewNodeContent('');
                    }}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <ShimmerButton
                    onClick={handleCreateNode}
                    className="px-3 py-1 rounded-md text-sm font-medium bg-blue-500 text-white"
                  >
                    Create Node
                  </ShimmerButton>
                </div>
              </div>
            )}

            {isCreatingEdge && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Create New Edge</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Source Node</label>
                  <select
                    value={edgeSource || ''}
                    onChange={(e) => setEdgeSource(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                  >
                    <option value="">Select source node</option>
                    {editedNodes.map((node) => (
                      <option key={`source-${node.id}`} value={node.id}>
                        {node.name} ({node.type})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Node</label>
                  <select
                    value={edgeTarget || ''}
                    onChange={(e) => setEdgeTarget(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                  >
                    <option value="">Select target node</option>
                    {editedNodes.map((node) => (
                      <option key={`target-${node.id}`} value={node.id}>
                        {node.name} ({node.type})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Label (Optional)</label>
                  <input
                    type="text"
                    value={edgeLabel}
                    onChange={(e) => setEdgeLabel(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                    placeholder="Enter edge label"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setIsCreatingEdge(false);
                      setEdgeSource(null);
                      setEdgeTarget(null);
                      setEdgeLabel('');
                    }}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <ShimmerButton
                    onClick={handleCreateEdge}
                    className="px-3 py-1 rounded-md text-sm font-medium bg-purple-500 text-white"
                  >
                    Create Edge
                  </ShimmerButton>
                </div>
              </div>
            )}

            {currentNode && !isCreatingNode && !isCreatingEdge && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getNodeTypeIcon(currentNode.type)}
                    <h3 className="text-lg font-medium">Edit Node</h3>
                  </div>
                  <button
                    onClick={() => handleDeleteNode(currentNode.id)}
                    className="p-1 text-red-500 hover:bg-red-50 rounded-full"
                    title="Delete node"
                  >
                    <Trash size={16} />
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Node Type</label>
                  <select
                    value={currentNode.type}
                    onChange={(e) => setCurrentNode({
                      ...currentNode,
                      type: e.target.value as NodeType
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                  >
                    <option value={NodeType.CONCEPT}>Concept</option>
                    <option value={NodeType.ENTITY}>Entity</option>
                    <option value={NodeType.DOCUMENT}>Document</option>
                    <option value={NodeType.DOCUMENT_CHUNK}>Document Chunk</option>
                    <option value={NodeType.FACT}>Fact</option>
                    <option value={NodeType.QUESTION}>Question</option>
                    <option value={NodeType.ANSWER}>Answer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={currentNode.name}
                    onChange={(e) => setCurrentNode({
                      ...currentNode,
                      name: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                  <textarea
                    value={currentNode.content}
                    onChange={(e) => setCurrentNode({
                      ...currentNode,
                      content: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                    rows={5}
                  />
                </div>

                <div className="flex justify-end">
                  <ShimmerButton
                    onClick={handleUpdateNode}
                    className="px-3 py-1 rounded-md text-sm font-medium bg-blue-500 text-white"
                  >
                    Update Node
                  </ShimmerButton>
                </div>
              </div>
            )}

            {!currentNode && !isCreatingNode && !isCreatingEdge && (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <Database size={48} className="text-slate-300 mb-4" />
                <h3 className="text-lg font-medium text-slate-700">Knowledge Graph Editor</h3>
                <p className="text-slate-500 mt-2 max-w-md">
                  Select a node from the graph to edit it, or use the buttons above to create new nodes and edges.
                </p>
              </div>
            )}
          </div>
        </ShineBorder>
      </MagicCard>
    </div>
  );
}
