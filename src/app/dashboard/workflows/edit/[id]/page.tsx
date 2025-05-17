"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCopilotReadable, useCopilotAction } from "@copilotkit/react-core";
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text";
import { BorderContainer } from "@/components/ui/shine-border";
import { EnhancedActionButton } from "@/components/ui/enhanced-action-button";
import { EnhancedCard } from "@/components/ui/enhanced-card";
import { WorkflowNode, WorkflowEdge } from "@/lib/workflow-service";
import KnowledgeNodeSelector from "@/components/workflow/KnowledgeNodeSelector";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorMessage } from "@/components/ui/error-message";
import { ArrowLeft, Save, Play, Brain } from "lucide-react";
import dynamic from "next/dynamic";
import { EnhancedCard } from "@/components/ui/enhanced-card";
import { EnhancedButton } from "@/components/ui/enhanced-button";

// Dynamically import the WorkflowBuilder component with SSR disabled
const WorkflowBuilder = dynamic(
  () => import('@/components/workflow/WorkflowBuilder'),
  { ssr: false, loading: () => <LoadingState message="Loading workflow builder..." /> }
);

export default function EditWorkflowPage() {
  const params = useParams();
  const router = useRouter();
  const workflowId = params.id as string;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [edges, setEdges] = useState<WorkflowEdge[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showKnowledgeSelector, setShowKnowledgeSelector] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Make the page readable by CopilotKit
  useCopilotReadable({
    description: "Edit Workflow page for modifying AI automation workflows",
    content: "This page allows users to edit existing AI automation workflows by modifying nodes and edges.",
  });

  // Fetch workflow data on component mount
  useEffect(() => {
    fetchWorkflow();
  }, [workflowId]);

  // Function to fetch workflow data
  const fetchWorkflow = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/workflows/${workflowId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch workflow");
      }

      const data = await response.json();
      const workflow = data.workflow;

      setName(workflow.name);
      setDescription(workflow.description);
      setNodes(workflow.nodes || []);
      setEdges(workflow.edges || []);
      setError(null);
    } catch (error) {
      console.error("Error fetching workflow:", error);
      setError("Failed to fetch workflow");
    } finally {
      setLoading(false);
    }
  };

  // Function to save workflow
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!name) {
      setError("Workflow name is required");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const response = await fetch(`/api/workflows/${workflowId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description,
          nodes,
          edges,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update workflow");
      }

      // Show success message
      alert("Workflow updated successfully");
    } catch (error) {
      console.error("Error updating workflow:", error);
      setError(error instanceof Error ? error.message : "An unknown error occurred");
    } finally {
      setSaving(false);
    }
  };

  // Function to execute workflow
  const handleExecuteWorkflow = async (useTemporal: boolean = false) => {
    try {
      const response = await fetch(`/api/workflows/${workflowId}/execute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: {
            // Default input
            message: "Execute workflow",
          },
          useTemporal,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to execute workflow");
      }

      const data = await response.json();
      console.log("Workflow execution:", data);

      // Show success message with engine information
      const engineType = data.engine || 'default';
      alert(`Workflow execution started: ${data.execution.executionId} (${engineType})`);
    } catch (error) {
      console.error("Error executing workflow:", error);
      alert("Failed to execute workflow");
    }
  };

  // Function to handle knowledge node selection
  const handleKnowledgeNodeSelected = (nodeId: string, nodeName: string) => {
    // Create a new knowledge node in the workflow
    if (selectedNodeId) {
      // Update existing node
      setNodes(nodes.map(node =>
        node.id === selectedNodeId
          ? { ...node, knowledgeNodeId: nodeId, name: nodeName }
          : node
      ));
    } else {
      // Create new node
      const newNode: WorkflowNode = {
        id: `node-${Date.now()}`,
        type: 'knowledge',
        name: nodeName,
        knowledgeNodeId: nodeId,
        position: { x: 100, y: 100 * (nodes.length + 1) },
        config: {
          useAsQuery: false,
        },
      };

      setNodes([...nodes, newNode]);
    }

    setShowKnowledgeSelector(false);
    setSelectedNodeId(null);
  };

  if (loading) {
    return <LoadingState message="Loading workflow..." variant="card" size="large" />;
  }

  return (
    <div className="space-y-6">
      <h1>Edit Workflow</h1>
      {loading ? (
        <LoadingState message="Loading workflow..." variant="card" size="large" />
      ) : (
        <div>
          <p>Workflow ID: {workflowId}</p>
          <p>Name: {name}</p>
          <p>Description: {description}</p>
        </div>
      )}
    </div>
  );
}
