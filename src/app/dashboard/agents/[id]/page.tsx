"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCopilotReadable } from "@copilotkit/react-core";
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text";
import { BorderContainer } from "@/components/ui/shine-border";
import { EnhancedActionButton } from "@/components/ui/enhanced-action-button";
import { EnhancedCard } from "@/components/ui/enhanced-card";
import AgentConfigForm from "@/components/agents/AgentConfigForm";
import AgentExecutionMonitor from "@/components/agents/AgentExecutionMonitor";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorMessage } from "@/components/ui/error-message";
import { Agent } from "@/lib/validation/schemas";
import { ArrowLeft, Save, Play, Bot, History, Settings, Activity } from "lucide-react";

export default function AgentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const agentId = params.id as string;

  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'config' | 'execution' | 'history'>('config');
  const [executionHistory, setExecutionHistory] = useState<any[]>([]);

  // Make the page readable by CopilotKit
  useCopilotReadable({
    value: "Agent detail page for configuring and executing AI agents",
    description: "This page allows users to configure, execute, and monitor AI agents"
  });

  // Fetch agent data on component mount
  useEffect(() => {
    fetchAgent();
  }, [agentId]);

  // Function to fetch agent data
  const fetchAgent = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/agents/${agentId}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch agent: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setAgent(data.agent);

      // Fetch execution history
      fetchExecutionHistory();
    } catch (error) {
      console.error('Error fetching agent:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch agent');
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch execution history
  const fetchExecutionHistory = async () => {
    try {
      const response = await fetch(`/api/agents/${agentId}/runs`);

      if (!response.ok) {
        throw new Error(`Failed to fetch execution history: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setExecutionHistory(data.runs || []);
    } catch (error) {
      console.error('Error fetching execution history:', error);
      // Don't set error state here to avoid blocking the main agent data display
    }
  };

  // Function to save agent
  const handleSaveAgent = async (updatedAgent: Agent) => {
    try {
      const response = await fetch(`/api/agents/${agentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedAgent),
      });

      if (!response.ok) {
        throw new Error(`Failed to update agent: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setAgent(data.agent);

      return Promise.resolve();
    } catch (error) {
      console.error('Error updating agent:', error);
      return Promise.reject(error);
    }
  };

  if (loading) {
    return <LoadingState message="Loading agent..." variant="card" size="large" />;
  }

  if (error || !agent) {
    return (
      <ErrorMessage
        title="Error loading agent"
        message={error || "Agent not found"}
        variant="error"
      />
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center mb-8">
        <button
          onClick={() => router.push("/dashboard/agents")}
          className="mr-4 p-2 rounded-full hover:bg-muted"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <AnimatedGradientText
            text={agent.name}
            className="text-3xl font-bold"
            gradient="linear-gradient(to right, #3b82f6, #8b5cf6, #ec4899)"
          />
          <p className="text-muted-foreground mt-2">
            {agent.description}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          type="button"
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'config'
              ? 'text-primary border-b-2 border-primary'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('config')}
        >
          <div className="flex items-center gap-2">
            <Settings size={16} />
            <span>Configuration</span>
          </div>
        </button>
        <button
          type="button"
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'execution'
              ? 'text-primary border-b-2 border-primary'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('execution')}
        >
          <div className="flex items-center gap-2">
            <Play size={16} />
            <span>Execution</span>
          </div>
        </button>
        <button
          type="button"
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'history'
              ? 'text-primary border-b-2 border-primary'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('history')}
        >
          <div className="flex items-center gap-2">
            <History size={16} />
            <span>History</span>
          </div>
        </button>
      </div>

      {/* Tab content */}
      {activeTab === 'config' && (
        <AgentConfigForm
          agent={agent}
          onSave={handleSaveAgent}
        />
      )}

      {activeTab === 'execution' && (
        <AgentExecutionMonitor
          agent={agent}
        />
      )}

      {activeTab === 'history' && (
        <EnhancedCard className="rounded-xl overflow-hidden" interactive hoverEffect="shadow">
          <BorderContainer variant="primary" rounded="xl" className="p-0.5">
            <div className="bg-card rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Activity className="mr-2 text-primary" size={20} />
                Execution History
              </h3>

              {executionHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <History size={48} className="text-gray-300 mb-2" />
                  <p className="text-gray-500">No execution history</p>
                  <p className="text-sm text-gray-400">
                    Execute the agent to see its history
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {executionHistory.map((run) => (
                    <div
                      key={run.id}
                      className="border border-gray-200 rounded-md p-4 hover:bg-gray-50"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{run.id}</h4>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          run.status === 'completed' ? 'bg-green-100 text-green-800' :
                          run.status === 'failed' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {run.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        <p>Started: {new Date(run.startedAt).toLocaleString()}</p>
                        {run.completedAt && (
                          <p>Completed: {new Date(run.completedAt).toLocaleString()}</p>
                        )}
                      </div>
                      <div className="mt-2">
                        <EnhancedActionButton
                          onClick={() => {
                            setActiveTab('execution');
                            // In a real implementation, you would load this specific run
                          }}
                          className="px-3 py-1 text-xs rounded-md font-medium bg-primary text-primary-foreground"
                          variant="default"
                          size="sm"
                          hover="lift"
                        >
                          View Details
                        </EnhancedActionButton>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </BorderContainer>
        </EnhancedCard>
      )}
    </div>
  );
}
