"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCopilotReadable } from "@copilotkit/react-core";
import { ArrowLeft, Save } from "lucide-react";
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text";
import { EnhancedActionButton } from "@/components/ui/enhanced-action-button";
import { WorkflowNode, WorkflowEdge } from "@/lib/workflow-service";
import dynamic from "next/dynamic";
import { ErrorMessage } from "@/components/ui/error-message";
import { LoadingState } from "@/components/ui/loading-state";
import { EnhancedCard } from "@/components/ui/enhanced-card";
import { EnhancedButton } from "@/components/ui/enhanced-button";

// Dynamically import the WorkflowBuilder component with SSR disabled
const WorkflowBuilder = dynamic(
  () => import('@/components/workflow/WorkflowBuilder'),
  { ssr: false, loading: () => <LoadingState message="Loading workflow builder..." /> }
);

export default function CreateWorkflowPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [edges, setEdges] = useState<WorkflowEdge[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Make the page readable by CopilotKit
  useCopilotReadable({
    description: "Create Workflow page for building AI automation workflows",
    content: "This page allows users to create new AI automation workflows by defining nodes and edges.",
  });

  // Function to handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !description.trim()) {
      setError("Name and description are required");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/workflows", {
        method: "POST",
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
        throw new Error("Failed to create workflow");
      }

      const data = await response.json();

      // Navigate back to workflows page
      router.push("/dashboard/workflows");
    } catch (error) {
      console.error("Error creating workflow:", error);
      setError(error instanceof Error ? error.message : "An unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Function to add a node
  const addNode = () => {
    const newNode: WorkflowNode = {
      id: `node-${nodes.length + 1}`,
      type: "agent",
      name: `Node ${nodes.length + 1}`,
      position: { x: 100, y: 100 * (nodes.length + 1) },
    };

    setNodes([...nodes, newNode]);
  };

  // Function to remove a node
  const removeNode = (id: string) => {
    setNodes(nodes.filter(node => node.id !== id));
    setEdges(edges.filter(edge => edge.source !== id && edge.target !== id));
  };

  // Function to add an edge
  const addEdge = () => {
    if (nodes.length < 2) {
      setError("You need at least two nodes to create an edge");
      return;
    }

    const newEdge: WorkflowEdge = {
      id: `edge-${edges.length + 1}`,
      source: nodes[0].id,
      target: nodes[1].id,
    };

    setEdges([...edges, newEdge]);
  };

  // Function to remove an edge
  const removeEdge = (id: string) => {
    setEdges(edges.filter(edge => edge.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center mb-4">
        <EnhancedButton
          variant="ghost"
          size="icon"
          onClick={() => router.push("/dashboard/workflows")}
          className="mr-4 h-10 w-10"
        >
          <ArrowLeft size={20} />
        </EnhancedButton>
        <div>
          <AnimatedGradientText
            text="Create Workflow"
            className="text-3xl font-bold"
            gradient="linear-gradient(to right, #3b82f6, #8b5cf6, #ec4899)"
          />
          <p className="text-muted-foreground mt-1">
            Create a new AI automation workflow
          </p>
        </div>
      </div>

      {error && (
        <ErrorMessage
          title="Error creating workflow"
          message={error}
          variant="error"
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <EnhancedCard className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                  placeholder="Enter workflow name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary h-32 bg-background"
                  placeholder="Enter workflow description"
                ></textarea>
              </div>
            </div>
          </div>
        </EnhancedCard>

        <EnhancedCard className="p-6">
          <h3 className="text-lg font-semibold mb-4">Workflow Builder</h3>
          <div className="h-[600px]">
            <WorkflowBuilder
              workflow={{
                id: "new-workflow",
                name,
                description,
                nodes,
                edges,
              }}
              onChange={(updatedWorkflow) => {
                setNodes(updatedWorkflow.nodes);
                setEdges(updatedWorkflow.edges);
              }}
            />
          </div>
        </EnhancedCard>

        <div className="flex justify-end gap-3">
          <EnhancedButton
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/workflows")}
          >
            Cancel
          </EnhancedButton>
          <EnhancedActionButton
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-md font-medium bg-primary text-primary-foreground"
           variant="default" size="sm" hover="lift">
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                Saving...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Save size={18} />
                Save Workflow
              </span>
            )}
          </EnhancedActionButton>
        </div>
      </form>
    </div>
  );
}
