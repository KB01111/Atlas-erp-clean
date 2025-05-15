"use client";

import { useState, useEffect } from "react";
import { useCopilotReadable, useCopilotAction } from "@copilotkit/react-core";
import {
  Plus,
  Search,
  Database,
  FileText,
  Brain,
  Lightbulb,
  HelpCircle,
  Link as LinkIcon,
  Trash,
} from "lucide-react";
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text";
import { ShineBorder } from "@/components/ui/shine-border";
import { ShimmerButton } from "@/components/magicui/shimmer-button";
import { MagicCard } from "@/components/magicui/magic-card";
import { KnowledgeNode, NodeType, getKnowledgeEdges } from "@/lib/arango-knowledge-service";
import dynamic from "next/dynamic";
import { ErrorMessage } from "@/components/ui/error-message";
import { LoadingState } from "@/components/ui/loading-state";
import KnowledgeGraphManager from "@/components/knowledge/KnowledgeGraphManager";

// Dynamically import the KnowledgeGraphVisualization component with SSR disabled
const KnowledgeGraphVisualization = dynamic(
  () => import('@/components/knowledge/KnowledgeGraphVisualization'),
  { ssr: false, loading: () => <LoadingState message="Loading knowledge graph visualization..." /> }
);

export default function KnowledgePage() {
  const [nodes, setNodes] = useState<KnowledgeNode[]>([]);
  const [edges, setEdges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<NodeType | "all">("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newNode, setNewNode] = useState({
    type: NodeType.CONCEPT,
    name: "",
    content: "",
  });

  // Make the page readable by CopilotKit
  useCopilotReadable({
    description: "Knowledge Graph page for managing AI knowledge",
    content: "This page allows users to create, search, and manage knowledge nodes in the AI knowledge graph.",
  });

  // Register the create knowledge node action with CopilotKit
  const createKnowledgeNode = useCopilotAction({
    name: "create_knowledge_node",
    description: "Create a new knowledge node in the AI knowledge graph",
    parameters: [
      {
        name: "type",
        type: "string",
        description: "The type of the knowledge node (concept, entity, document, fact, question, answer)",
      },
      {
        name: "name",
        type: "string",
        description: "The name of the knowledge node",
      },
      {
        name: "content",
        type: "string",
        description: "The content of the knowledge node",
      },
    ],
    handler: async ({ type, name, content }) => {
      try {
        // Validate the node type
        if (!Object.values(NodeType).includes(type as NodeType)) {
          return `Invalid node type: ${type}. Valid types are: ${Object.values(NodeType).join(", ")}`;
        }

        const response = await fetch("/api/knowledge", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type,
            name,
            content,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to create knowledge node");
        }

        const data = await response.json();

        // Refresh the nodes list
        fetchNodes();

        return `Created knowledge node: ${data.node.name}`;
      } catch (error) {
        console.error("Error creating knowledge node:", error);
        return "Failed to create knowledge node";
      }
    },
  });

  // Fetch nodes on component mount
  useEffect(() => {
    fetchNodes();
  }, [selectedType]);

  // Function to fetch nodes and edges
  const fetchNodes = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build the query URL based on filters
      let url = "/api/knowledge/graph";
      const params = new URLSearchParams();

      if (searchQuery) {
        params.append("query", searchQuery);
      } else if (selectedType !== "all") {
        params.append("nodeType", selectedType);
      }

      // Set a reasonable limit
      params.append("limit", "100");

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      // Fetch knowledge graph (nodes and edges)
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Failed to fetch knowledge graph");
      }

      const data = await response.json();
      setNodes(data.nodes);
      setEdges(data.edges);

      setError(null);
    } catch (error) {
      console.error("Error fetching knowledge graph:", error);
      setError("Failed to fetch knowledge graph");
    } finally {
      setLoading(false);
    }
  };

  // Function to search nodes
  const searchNodes = async () => {
    if (!searchQuery.trim()) {
      fetchNodes();
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/knowledge/graph?query=${encodeURIComponent(searchQuery)}`);

      if (!response.ok) {
        throw new Error("Failed to search knowledge graph");
      }

      const data = await response.json();
      setNodes(data.nodes);
      setEdges(data.edges);
      setError(null);
    } catch (error) {
      console.error("Error searching knowledge graph:", error);
      setError("Failed to search knowledge graph");
    } finally {
      setLoading(false);
    }
  };

  // Function to handle node creation
  const handleCreateNode = async () => {
    try {
      if (!newNode.name.trim() || !newNode.content.trim()) {
        alert("Name and content are required");
        return;
      }

      const response = await fetch("/api/knowledge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newNode),
      });

      if (!response.ok) {
        throw new Error("Failed to create knowledge node");
      }

      // Reset form and close modal
      setNewNode({
        type: NodeType.CONCEPT,
        name: "",
        content: "",
      });
      setShowAddModal(false);

      // Refresh the knowledge graph
      fetchNodes();
    } catch (error) {
      console.error("Error creating knowledge node:", error);
      alert("Failed to create knowledge node");
    }
  };

  // Function to handle node deletion
  const handleDeleteNode = async (key: string) => {
    if (!key || !confirm("Are you sure you want to delete this knowledge node?")) {
      return;
    }

    try {
      const response = await fetch(`/api/knowledge/${key}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete knowledge node");
      }

      // Refresh the knowledge graph
      fetchNodes();
    } catch (error) {
      console.error("Error deleting knowledge node:", error);
      alert("Failed to delete knowledge node");
    }
  };

  // Function to get icon for node type
  const getNodeTypeIcon = (type: NodeType) => {
    switch (type) {
      case NodeType.CONCEPT:
        return <Brain className="text-purple-500" size={20} />;
      case NodeType.ENTITY:
        return <Database className="text-blue-500" size={20} />;
      case NodeType.DOCUMENT:
        return <FileText className="text-green-500" size={20} />;
      case NodeType.DOCUMENT_CHUNK:
        return <FileText className="text-green-300" size={20} />;
      case NodeType.FACT:
        return <Lightbulb className="text-yellow-500" size={20} />;
      case NodeType.QUESTION:
        return <HelpCircle className="text-red-500" size={20} />;
      case NodeType.ANSWER:
        return <LinkIcon className="text-orange-500" size={20} />;
      default:
        return <Database className="text-gray-500" size={20} />;
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <AnimatedGradientText
            text="Knowledge Graph"
            className="text-3xl font-bold"
            gradient="linear-gradient(to right, #3b82f6, #8b5cf6, #ec4899)"
          />
          <p className="text-muted-foreground mt-2">
            Manage the AI knowledge graph for your organization
          </p>
        </div>

        <ShimmerButton
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded-md font-medium bg-primary text-primary-foreground"
        >
          <Plus size={18} className="mr-2" />
          Add Knowledge
        </ShimmerButton>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
            <input
              type="text"
              placeholder="Search knowledge..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && searchNodes()}
              className="w-full pl-10 pr-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as NodeType | "all")}
            className="px-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Types</option>
            {Object.values(NodeType).map((type) => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>

          <button
            onClick={searchNodes}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
          >
            Search
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingState
          message="Loading knowledge nodes..."
          size="large"
          variant="card"
          showSpinner={true}
        />
      ) : error ? (
        <ErrorMessage
          title="Failed to load knowledge nodes"
          message={error}
          variant="error"
          onRetry={fetchNodes}
        />
      ) : nodes.length === 0 ? (
        <div className="bg-muted rounded-lg p-8 text-center">
          <Brain className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No knowledge nodes found</h3>
          <p className="text-muted-foreground mb-4">
            Add your first knowledge node to get started
          </p>
          <ShimmerButton
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-md font-medium bg-primary text-primary-foreground"
          >
            <Plus size={18} className="mr-2" />
            Add Knowledge
          </ShimmerButton>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="h-[600px] mb-6">
            <KnowledgeGraphManager
              initialNodes={nodes}
              initialEdges={edges.map(edge => ({
                id: edge._key || edge._id || `edge-${Date.now()}-${Math.random()}`,
                source: edge._from?.replace('knowledge_nodes/', '') || '',
                target: edge._to?.replace('knowledge_nodes/', '') || '',
                label: edge.type,
                type: edge.type,
              }))}
              onSave={async (updatedNodes, updatedEdges) => {
                try {
                  const response = await fetch('/api/knowledge/graph', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      nodes: updatedNodes,
                      edges: updatedEdges,
                    }),
                  });

                  if (!response.ok) {
                    throw new Error('Failed to save knowledge graph');
                  }

                  const data = await response.json();
                  setNodes(data.nodes);
                  setEdges(data.edges);

                  return data;
                } catch (error) {
                  console.error('Error saving knowledge graph:', error);
                  throw error;
                }
              }}
              onLoad={async () => {
                try {
                  const response = await fetch('/api/knowledge/graph');

                  if (!response.ok) {
                    throw new Error('Failed to load knowledge graph');
                  }

                  const data = await response.json();
                  setNodes(data.nodes);
                  setEdges(data.edges);

                  return data;
                } catch (error) {
                  console.error('Error loading knowledge graph:', error);
                  throw error;
                }
              }}
            />
          </div>

          <h3 className="text-xl font-semibold mb-4">Knowledge Nodes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {nodes.map((node) => (
              <MagicCard key={node._key || node._id} className="overflow-hidden">
                <ShineBorder
                  borderRadius="0.75rem"
                  className="p-0.5"
                >
                  <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm overflow-hidden">
                    <div className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2 mb-2">
                          {getNodeTypeIcon(node.type)}
                          <span className="text-xs uppercase tracking-wider text-muted-foreground">
                            {node.type}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteNode(node._key || '')}
                          className="p-1 rounded-md hover:bg-muted text-red-500"
                          title="Delete node"
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                      <h3 className="text-xl font-semibold mb-2">{node.name}</h3>
                      <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                        {node.content}
                      </p>
                      <div className="text-xs text-muted-foreground">
                        Created: {new Date(node.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </ShineBorder>
              </MagicCard>
            ))}
          </div>
        </div>
      )}

      {/* Add Knowledge Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Add Knowledge Node</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Type</label>
              <select
                value={newNode.type}
                onChange={(e) => setNewNode({ ...newNode, type: e.target.value as NodeType })}
                className="w-full px-3 py-2 border border-input rounded-md"
              >
                {Object.values(NodeType).map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                value={newNode.name}
                onChange={(e) => setNewNode({ ...newNode, name: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-md"
                placeholder="Enter node name"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-1">Content</label>
              <textarea
                value={newNode.content}
                onChange={(e) => setNewNode({ ...newNode, content: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-md h-32"
                placeholder="Enter node content"
              ></textarea>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border border-input rounded-md"
              >
                Cancel
              </button>
              <ShimmerButton
                onClick={handleCreateNode}
                className="px-4 py-2 rounded-md font-medium bg-primary text-primary-foreground"
              >
                Create
              </ShimmerButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
