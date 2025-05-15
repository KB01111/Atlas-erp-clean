"use client";

import React, { useState, useEffect } from 'react';
import { MagicCard } from "@/components/magicui/magic-card";
import { ShineBorder } from "@/components/ui/shine-border";
import { ShimmerButton } from "@/components/magicui/shimmer-button";
import { NodeType } from '@/lib/arango-knowledge-service';
import { Brain, FileText, Lightbulb, Database, HelpCircle, MessageSquare, Search, Loader2, AlertCircle, Check } from 'lucide-react';

interface KnowledgeNodeSelectorProps {
  onNodeSelected: (nodeId: string, nodeName: string) => void;
  onCancel: () => void;
  className?: string;
}

export default function KnowledgeNodeSelector({
  onNodeSelected,
  onCancel,
  className = '',
}: KnowledgeNodeSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nodes, setNodes] = useState<any[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Load nodes on mount
  useEffect(() => {
    loadNodes();
  }, []);

  // Load all knowledge nodes
  const loadNodes = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/knowledge/graph');
      
      if (!response.ok) {
        throw new Error('Failed to load knowledge nodes');
      }

      const data = await response.json();
      setNodes(data.nodes || []);
    } catch (err) {
      setError((err as Error).message || 'Failed to load knowledge nodes');
      console.error('Error loading knowledge nodes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Search nodes
  const searchNodes = async () => {
    if (!searchQuery.trim()) {
      loadNodes();
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/knowledge/graph?query=${encodeURIComponent(searchQuery)}`);
      
      if (!response.ok) {
        throw new Error('Failed to search knowledge nodes');
      }

      const data = await response.json();
      setNodes(data.nodes || []);
    } catch (err) {
      setError((err as Error).message || 'Failed to search knowledge nodes');
      console.error('Error searching knowledge nodes:', err);
    } finally {
      setIsLoading(false);
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

  // Handle node selection
  const handleNodeSelect = (nodeId: string, nodeName: string) => {
    setSelectedNodeId(nodeId);
    onNodeSelected(nodeId, nodeName);
  };

  return (
    <MagicCard className={`rounded-xl overflow-hidden ${className}`}>
      <ShineBorder borderRadius="0.75rem" className="p-0.5">
        <div className="bg-card rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Brain className="mr-2 text-primary" size={20} />
            Select Knowledge Node
          </h3>
          
          <div className="space-y-4">
            {/* Search input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchNodes()}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="Search knowledge nodes..."
              />
              <ShimmerButton
                onClick={searchNodes}
                disabled={isLoading}
                className="px-4 py-2 rounded-md font-medium bg-primary text-primary-foreground disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Search size={16} />
                )}
              </ShimmerButton>
            </div>
            
            {/* Error message */}
            {error && (
              <div className="mt-2 text-sm text-red-600 flex items-center">
                <AlertCircle size={16} className="mr-1" />
                {error}
              </div>
            )}
            
            {/* Node list */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {isLoading && nodes.length === 0 ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 size={24} className="animate-spin text-primary" />
                </div>
              ) : nodes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Brain size={32} className="mx-auto mb-2 opacity-50" />
                  <p>No knowledge nodes found</p>
                </div>
              ) : (
                nodes.map((node) => (
                  <div
                    key={node.id}
                    className={`border rounded-md p-3 hover:bg-gray-50 transition-colors cursor-pointer ${
                      selectedNodeId === node.id ? 'border-primary bg-primary/5' : 'border-gray-200'
                    }`}
                    onClick={() => handleNodeSelect(node.id, node.name)}
                  >
                    <div className="flex items-start gap-2">
                      <div className="mt-1">{getNodeTypeIcon(node.type)}</div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{node.name}</h4>
                        <p className="text-xs text-gray-500 uppercase">{node.type}</p>
                        <p className="text-sm text-gray-700 line-clamp-2 mt-1">{node.content}</p>
                      </div>
                      {selectedNodeId === node.id && (
                        <Check size={18} className="text-primary mt-1" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* Action buttons */}
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <ShimmerButton
                onClick={() => selectedNodeId && onNodeSelected(selectedNodeId, nodes.find(n => n.id === selectedNodeId)?.name || '')}
                disabled={!selectedNodeId}
                className="px-4 py-2 rounded-md font-medium bg-primary text-primary-foreground disabled:opacity-50"
              >
                Select Node
              </ShimmerButton>
            </div>
          </div>
        </div>
      </ShineBorder>
    </MagicCard>
  );
}
