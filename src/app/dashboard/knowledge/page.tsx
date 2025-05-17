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
import { BorderContainer } from "@/components/ui/shine-border";
import { EnhancedActionButton } from "@/components/ui/enhanced-action-button";
import { EnhancedCard } from "@/components/ui/enhanced-card";
import { KnowledgeNode, NodeType, getKnowledgeEdges } from "@/lib/arango-knowledge-service";
import dynamic from "next/dynamic";
import { ErrorMessage } from "@/components/ui/error-message";
import { LoadingState } from "@/components/ui/loading-state";
import { EnhancedButton } from "@/components/ui/enhanced-button";
import { EnhancedCard } from "@/components/ui/enhanced-card";
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
    <div className="space-y-6">
      <h1>Knowledge Graph</h1>
      {loading ? (
        <LoadingState message="Loading knowledge nodes..." size="large" variant="card" showSpinner={true} />
      ) : error ? (
        <ErrorMessage title="Failed to load knowledge nodes" message={error} variant="error" onRetry={fetchNodes} />
      ) : (
        <div>
          <p>Total nodes: {nodes.length}</p>
        </div>
      )}
    </div>
  );
}
