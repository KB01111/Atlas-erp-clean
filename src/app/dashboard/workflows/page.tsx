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
import { ShineBorder } from "@/components/ui/shine-border";
import { ShimmerButton } from "@/components/magicui/shimmer-button";
import { MagicCard } from "@/components/magicui/magic-card";
import { Workflow as WorkflowType } from "@/lib/workflow-service";

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
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <AnimatedGradientText
            text="AI Workflows"
            className="text-3xl font-bold"
            gradient="linear-gradient(to right, #3b82f6, #8b5cf6, #ec4899)"
          />
          <p className="text-muted-foreground mt-2">
            Create and manage AI automation workflows by chaining together different agents
          </p>
        </div>

        <ShimmerButton
          onClick={() => {
            // Navigate to workflow creation page
            window.location.href = "/dashboard/workflows/create";
          }}
          className="px-4 py-2 rounded-md font-medium bg-primary text-primary-foreground"
        >
          <Plus size={18} className="mr-2" />
          Create Workflow
        </ShimmerButton>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 text-red-800 dark:text-red-200">
          {error}
        </div>
      ) : workflows.length === 0 ? (
        <div className="bg-muted rounded-lg p-8 text-center">
          <Workflow className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No workflows found</h3>
          <p className="text-muted-foreground mb-4">
            Create your first AI automation workflow to get started
          </p>
          <ShimmerButton
            onClick={() => {
              window.location.href = "/dashboard/workflows/create";
            }}
            className="px-4 py-2 rounded-md font-medium bg-primary text-primary-foreground"
          >
            <Plus size={18} className="mr-2" />
            Create Workflow
          </ShimmerButton>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workflows.map((workflow) => (
            <MagicCard key={workflow.id} className="overflow-hidden">
              <ShineBorder
                borderRadius="0.75rem"
                className="p-0.5"
              >
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm overflow-hidden">
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
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleExecuteWorkflow(workflow.id)}
                          className="p-2 rounded-md hover:bg-muted"
                          title="Execute workflow"
                        >
                          <Play size={16} />
                        </button>
                        <button
                          onClick={() => {
                            window.location.href = `/dashboard/workflows/edit/${workflow.id}`;
                          }}
                          className="p-2 rounded-md hover:bg-muted"
                          title="Edit workflow"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteWorkflow(workflow.id)}
                          className="p-2 rounded-md hover:bg-muted text-red-500"
                          title="Delete workflow"
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </ShineBorder>
            </MagicCard>
          ))}
        </div>
      )}
    </div>
  );
}
