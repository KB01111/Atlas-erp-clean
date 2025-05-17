"use client";

import { useState, useEffect } from "react";
import { useCopilotReadable, useCopilotAction } from "@copilotkit/react-core";
import {
  Play,
  Plus,
  Edit,
  Trash,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  Workflow,
} from "lucide-react";
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text";
import { BorderContainer } from "@/components/ui/shine-border";
import { EnhancedActionButton } from "@/components/ui/enhanced-action-button";
import { EnhancedCard } from "@/components/ui/enhanced-card";
import { Workflow as WorkflowType } from "@/lib/workflow-service";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorMessage } from "@/components/ui/error-message";
import { EmptyState } from "@/components/ui/empty-state";
import { EnhancedCard } from "@/components/ui/enhanced-card";
import { EnhancedButton } from "@/components/ui/enhanced-button";

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<WorkflowType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Make the page readable by CopilotKit
  useCopilotReadable({
    description: "Workflows page for managing AI automation workflows",
    content: "This page allows users to create, edit, and execute AI automation workflows that chain together different AI agents.",
  });

  // Register the create workflow action with CopilotKit
  const createWorkflow = useCopilotAction({
    name: "create_workflow",
    description: "Create a new AI automation workflow",
    parameters: [
      {
        name: "name",
        type: "string",
        description: "The name of the workflow",
      },
      {
        name: "description",
        type: "string",
        description: "The description of the workflow",
      },
    ],
    handler: async ({ name, description }) => {
      try {
        const response = await fetch("/api/workflows", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            description,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to create workflow");
        }

        const data = await response.json();

        // Refresh the workflows list
        fetchWorkflows();

        return `Created workflow: ${data.workflow.name}`;
      } catch (error) {
        console.error("Error creating workflow:", error);
        return "Failed to create workflow";
      }
    },
  });

  // Fetch workflows on component mount
  useEffect(() => {
    fetchWorkflows();
  }, []);

  // Function to fetch workflows
  const fetchWorkflows = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/workflows");

      if (!response.ok) {
        throw new Error("Failed to fetch workflows");
      }

      const data = await response.json();
      setWorkflows(data.workflows);
      setError(null);
    } catch (error) {
      console.error("Error fetching workflows:", error);
      setError("Failed to fetch workflows");
    } finally {
      setLoading(false);
    }
  };

  // Function to handle workflow execution
  const handleExecuteWorkflow = async (id: string, options?: { useTemporal?: boolean }) => {
    try {
      const response = await fetch(`/api/workflows/${id}/execute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: {
            // Default input
            message: "Execute workflow",
          },
          useTemporal: options?.useTemporal || false,
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

  // Function to handle workflow deletion
  const handleDeleteWorkflow = async (id: string) => {
    if (!confirm("Are you sure you want to delete this workflow?")) {
      return;
    }

    try {
      const response = await fetch(`/api/workflows/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete workflow");
      }

      // Refresh the workflows list
      fetchWorkflows();
    } catch (error) {
      console.error("Error deleting workflow:", error);
      alert("Failed to delete workflow");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <AnimatedGradientText
            text="AI Workflows"
            className="text-3xl font-bold"
            gradient="linear-gradient(to right, #3b82f6, #8b5cf6, #ec4899)"
          />
          <p className="text-muted-foreground mt-1">
            Create and manage AI automation workflows by chaining together different agents
          </p>
        </div>

        <EnhancedActionButton
          onClick={() = variant="default" size="sm" hover="lift"> {
            // Navigate to workflow creation page
            window.location.href = "/dashboard/workflows/create";
          }}
          className="px-4 py-2 rounded-md font-medium bg-primary text-primary-foreground"
        >
          <Plus size={18} className="mr-2" />
          Create Workflow
        </EnhancedActionButton>
      </div>

      {loading ? (
        <LoadingState
          message="Loading workflows..."
          size="large"
          variant="card"
          showSpinner={true}
        />
      ) : error ? (
        <ErrorMessage
          title="Failed to load workflows"
          message={error}
          variant="error"
          onRetry={fetchWorkflows}
        />
      ) : workflows.length === 0 ? (
        <EmptyState
          title="No workflows found"
          description="Create your first AI automation workflow to get started"
          icon={<Workflow className="h-12 w-12 text-muted-foreground" />}
          action={{
            label: "Create Workflow",
            onClick: () => {
              window.location.href = "/dashboard/workflows/create";
            },
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workflows.map((workflow) => (
            <EnhancedCard
              key={workflow.id}
              className="overflow-hidden"
              interactive
              hoverEffect="lift"
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{workflow.name}</h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      {workflow.description}
                    </p>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                        workflow.status === 'active' ? 'bg-green-500' :
                        workflow.status === 'draft' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}></span>
                      <span className="capitalize">{workflow.status}</span>
                      <span className="mx-2">•</span>
                      <span>
                        {new Date(workflow.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <EnhancedButton
                      variant="ghost"
                      size="icon"
                      onClick={() => handleExecuteWorkflow(workflow.id)}
                      className="h-8 w-8 text-muted-foreground hover:text-primary"
                      title="Execute workflow"
                    >
                      <Play size={16} />
                    </EnhancedButton>
                    <EnhancedButton
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        window.location.href = `/dashboard/workflows/edit/${workflow.id}`;
                      }}
                      className="h-8 w-8 text-muted-foreground hover:text-primary"
                      title="Edit workflow"
                    >
                      <Edit size={16} />
                    </EnhancedButton>
                    <EnhancedButton
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteWorkflow(workflow.id)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      title="Delete workflow"
                    >
                      <Trash size={16} />
                    </EnhancedButton>
                  </div>
                </div>
              </div>
            </EnhancedCard>
          ))}
        </div>
      )}
    </div>
  );
}
