"use client";

import { useState, useEffect } from "react";
import { useCopilotReadable, useCopilotAction } from "@copilotkit/react-core";
import {
  Bot, Play, Pause, RotateCcw, Settings, ChevronDown, ChevronUp,
  AlertCircle, RefreshCw, Loader2, MessageSquare, Send
} from "lucide-react";
import { Agent } from "@/lib/agent-service";
import { ShineBorder } from "@/components/ui/shine-border";
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text";

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [expandedAgentId, setExpandedAgentId] = useState<string | null>(null);
  const [runningAgentId, setRunningAgentId] = useState<string | null>(null);
  const [agentOutput, setAgentOutput] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userInput, setUserInput] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch agents on component mount
  useEffect(() => {
    fetchAgents();
  }, []);

  // Function to fetch agents from the API
  const fetchAgents = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/agents');

      if (!response.ok) {
        throw new Error(`Failed to fetch agents: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setAgents(data.agents || []);
    } catch (error) {
      console.error('Error fetching agents:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch agents');
    } finally {
      setIsLoading(false);
    }
  };

  // Define Copilot hooks using useEffect to ensure they're only called once after component mounts
  useEffect(() => {
    // Make agents readable by the AI
    useCopilotReadable({
      description: "List of all AI agents in the system",
      value: agents,
    });

    // Run agent action for the AI
    useCopilotAction({
      name: "run_agent",
      description: "Run a specific agent by ID or name",
      parameters: [
        {
          name: "agentId",
          type: "string",
          description: "ID of the agent to run",
          required: false,
        },
        {
          name: "agentName",
          type: "string",
          description: "Name of the agent to run",
          required: false,
        },
      ],
      handler: async ({ agentId, agentName }) => {
        let targetAgent;

        if (agentId) {
          targetAgent = agents.find(agent => agent.id === agentId);
        } else if (agentName) {
          targetAgent = agents.find(agent =>
            agent.name.toLowerCase() === agentName.toLowerCase()
          );
        }

        if (!targetAgent) {
          return { success: false, message: "Agent not found" };
        }

        // Update agent status
        const updatedAgents = agents.map(agent => {
          if (agent.id === targetAgent!.id) {
            return { ...agent, status: "running" as const };
          }
          return agent;
        });

        setAgents(updatedAgents);
        setRunningAgentId(targetAgent.id);
        setAgentOutput(`Running ${targetAgent.name}...\n\nInitializing...\n`);

        // Simulate agent execution
        await new Promise(resolve => setTimeout(resolve, 1000));
        setAgentOutput(prev => prev + `\nAnalyzing data...\n`);

        await new Promise(resolve => setTimeout(resolve, 1500));
        setAgentOutput(prev => prev + `\nGenerating insights...\n`);

        await new Promise(resolve => setTimeout(resolve, 2000));
        setAgentOutput(prev => prev + `\nTask completed successfully!\n`);

        // Update agent status to idle
        const finalAgents = updatedAgents.map(agent => {
          if (agent.id === targetAgent!.id) {
            return {
              ...agent,
              status: "idle" as const,
              lastRun: new Date().toLocaleString(),
            };
          }
          return agent;
        });

        setAgents(finalAgents);
        setRunningAgentId(null);

        return {
          success: true,
          message: `${targetAgent.name} completed successfully`,
          agent: targetAgent,
        };
      },
    });

    // Get agent capabilities action for the AI
    useCopilotAction({
      name: "get_agent_capabilities",
      description: "Get the capabilities of a specific agent",
      parameters: [
        {
          name: "agentId",
          type: "string",
          description: "ID of the agent",
          required: false,
        },
        {
          name: "agentName",
          type: "string",
          description: "Name of the agent",
          required: false,
        },
      ],
      handler: async ({ agentId, agentName }) => {
        let targetAgent;

        if (agentId) {
          targetAgent = agents.find(agent => agent.id === agentId);
        } else if (agentName) {
          targetAgent = agents.find(agent =>
            agent.name.toLowerCase() === agentName.toLowerCase()
          );
        }

        if (!targetAgent) {
          return { success: false, message: "Agent not found" };
        }

        return {
          success: true,
          capabilities: targetAgent.capabilities,
          agent: targetAgent,
        };
      },
    });

    // No cleanup needed as we're not storing the disposers
  }, [agents]); // Re-run when agents change

  const toggleAgentExpansion = (id: string) => {
    if (expandedAgentId === id) {
      setExpandedAgentId(null);
    } else {
      setExpandedAgentId(id);
    }
  };

  const runAgent = async (id: string) => {
    try {
      setIsSubmitting(true);

      // Find the agent
      const agent = agents.find(a => a.id === id);

      if (!agent) {
        throw new Error(`Agent with ID ${id} not found`);
      }

      // Check if the agent is already running
      if (agent.status === 'running') {
        throw new Error(`Agent ${agent.name} is already running`);
      }

      // Update local state
      const updatedAgents = agents.map(a => {
        if (a.id === id) {
          return { ...a, status: "running" as const };
        }
        return a;
      });

      setAgents(updatedAgents);
      setRunningAgentId(id);
      setAgentOutput(`Running ${agent.name}...\n\nInitializing...\n`);

      // Call the API to execute the agent
      const response = await fetch('/api/agents/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentId: id,
          input: userInput || 'Please analyze the current data and provide insights.',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to execute agent: ${response.status} ${response.statusText}`);
      }

      // In a real implementation, we would use WebSockets or SSE to get real-time updates
      // For now, we'll simulate progress updates
      setAgentOutput(prev => prev + `\nConnecting to language model...\n`);

      // Simulate some progress for better UX
      setTimeout(() => {
        setAgentOutput(prev => prev + `\nProcessing request...\n`);

        setTimeout(() => {
          setAgentOutput(prev => prev + `\nGenerating response...\n`);

          setTimeout(() => {
            // Update agent status to idle
            const finalAgents = agents.map(a => {
              if (a.id === id) {
                return {
                  ...a,
                  status: "idle" as const,
                  lastRun: new Date().toLocaleString(),
                };
              }
              return a;
            });

            setAgents(finalAgents);
            setRunningAgentId(null);
            setAgentOutput(prev => prev + `\nTask completed!\n`);
            setIsSubmitting(false);
          }, 2000);
        }, 3000);
      }, 2000);

    } catch (error) {
      console.error('Error running agent:', error);
      setAgentOutput(prev => prev + `\nError: ${error instanceof Error ? error.message : 'Unknown error'}\n`);

      // Update agent status to idle
      const finalAgents = agents.map(a => {
        if (a.id === id) {
          return {
            ...a,
            status: "error" as const,
          };
        }
        return a;
      });

      setAgents(finalAgents);
      setRunningAgentId(null);
      setIsSubmitting(false);
    }
  };

  const stopAgent = (id: string) => {
    // Update agent status
    const updatedAgents = agents.map(agent => {
      if (agent.id === id) {
        return { ...agent, status: "idle" as const };
      }
      return agent;
    });

    setAgents(updatedAgents);
    setRunningAgentId(null);
    setAgentOutput(prev => prev + `\nAgent execution stopped by user.\n`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">AI Agents</h1>
        <button
          onClick={fetchAgents}
          disabled={isLoading}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-md hover:bg-slate-50"
        >
          <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-md">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 size={32} className="animate-spin text-indigo-600" />
          <span className="ml-2 text-slate-600">Loading agents...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {agents.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <Bot size={48} className="mx-auto text-slate-400 mb-4" />
              <h3 className="text-xl font-medium text-slate-700 mb-2">No Agents Found</h3>
              <p className="text-slate-500 mb-4">There are no AI agents configured in the system.</p>
            </div>
          ) : (
            agents.map((agent) => (
              <div key={agent.id} className="relative group transition-all duration-300 hover:scale-[1.01]">
                <ShineBorder
                  borderColor={
                    agent.status === "running" ? "rgba(34, 197, 94, 0.2)" :
                    agent.status === "error" ? "rgba(239, 68, 68, 0.2)" :
                    "rgba(79, 70, 229, 0.2)"
                  }
                  shineBorderColor={
                    agent.status === "running" ? "rgba(34, 197, 94, 0.6)" :
                    agent.status === "error" ? "rgba(239, 68, 68, 0.6)" :
                    "rgba(79, 70, 229, 0.6)"
                  }
                  borderRadius="0.75rem"
                  className="p-0.5"
                >
                  <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${
                            agent.status === "running" ? "bg-green-100" :
                            agent.status === "error" ? "bg-red-100" : "bg-indigo-100"
                          }`}>
                            <Bot className={`${
                              agent.status === "running" ? "text-green-600" :
                              agent.status === "error" ? "text-red-600" : "text-indigo-600"
                            }`} size={24} />
                          </div>
                          <div>
                            <AnimatedGradientText
                              text={agent.name}
                              className="text-xl font-semibold"
                              gradient={
                                agent.status === "running" ? "linear-gradient(to right, #22c55e, #16a34a)" :
                                agent.status === "error" ? "linear-gradient(to right, #ef4444, #dc2626)" :
                                "linear-gradient(to right, #4f46e5, #6366f1)"
                              }
                            />
                            <p className="text-slate-600">{agent.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {agent.status === "running" ? (
                            <button
                              onClick={() => stopAgent(agent.id)}
                              className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-all duration-200 hover:scale-110"
                              title="Stop Agent"
                            >
                              <Pause size={18} />
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setExpandedAgentId(agent.id);
                                setAgentOutput(`Ready to run ${agent.name}...\n\nPlease enter your instructions or click Run to use the default prompt.\n`);
                              }}
                              className="p-2 rounded-full bg-green-100 text-green-600 hover:bg-green-200 transition-all duration-200 hover:scale-110"
                              title="Run Agent"
                            >
                              <Play size={18} />
                            </button>
                          )}
                          <button
                            onClick={() => toggleAgentExpansion(agent.id)}
                            className="p-2 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all duration-200 hover:scale-110"
                            title={expandedAgentId === agent.id ? "Collapse" : "Expand"}
                          >
                            {expandedAgentId === agent.id ? (
                              <ChevronUp size={18} />
                            ) : (
                              <ChevronDown size={18} />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mt-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-500">Status:</span>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              agent.status === "running" ? "bg-green-100 text-green-800" :
                              agent.status === "error" ? "bg-red-100 text-red-800" :
                              "bg-slate-100 text-slate-800"
                            }`}
                          >
                            {agent.status === "running" ? "Running" :
                             agent.status === "error" ? "Error" : "Idle"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-500">Last Run:</span>
                          <span className="text-sm text-slate-600">{agent.lastRun}</span>
                        </div>
                      </div>
                    </div>

                {expandedAgentId === agent.id && (
                  <div className="px-6 pb-6">
                    <div className="mt-4 border-t border-slate-200 pt-4">
                      <h4 className="text-md font-medium mb-2">Capabilities</h4>
                      <ul className="list-disc list-inside space-y-1 text-slate-600">
                        {agent.capabilities.map((capability: string, index: number) => (
                          <li key={index}>{capability}</li>
                        ))}
                      </ul>

                      {/* Agent Input Form */}
                      <div className="mt-4 pt-4 border-t border-slate-200">
                        <h4 className="text-md font-medium mb-2">Run Agent</h4>
                        <div className="space-y-3">
                          <textarea
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            placeholder="Enter instructions for the agent..."
                            className="w-full p-3 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px]"
                          />
                          <div className="flex justify-end">
                            <button
                              onClick={() => runAgent(agent.id)}
                              disabled={agent.status === "running" || isSubmitting}
                              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-300"
                            >
                              {agent.status === "running" || isSubmitting ? (
                                <>
                                  <Loader2 size={18} className="animate-spin" />
                                  <span>Running...</span>
                                </>
                              ) : (
                                <>
                                  <Play size={18} />
                                  <span>Run Agent</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                  </div>
                </ShineBorder>
              </div>
            ))
          )}
        </div>
      )}

      {/* Agent Output Console */}
      {agentOutput && (
        <div className="bg-slate-900 text-slate-100 rounded-lg shadow-md overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-slate-700">
            <div className="flex items-center gap-2">
              <MessageSquare size={18} />
              <h3 className="font-medium">Agent Console</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAgentOutput(null)}
                className="p-1.5 text-slate-400 hover:text-slate-200 rounded-md hover:bg-slate-800"
                title="Clear Console"
              >
                <RotateCcw size={16} />
              </button>
            </div>
          </div>
          <div className="p-4 max-h-[400px] overflow-y-auto">
            <pre className="font-mono text-sm whitespace-pre-wrap">{agentOutput}</pre>
          </div>

          {/* Console Input */}
          {runningAgentId && (
            <div className="p-4 border-t border-slate-700">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Send additional instructions..."
                  className="flex-1 p-2 bg-slate-800 border border-slate-700 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (userInput.trim() && runningAgentId) {
                        setAgentOutput(prev => prev + `\n\nYou: ${userInput}\n`);
                        setUserInput("");
                      }
                    }
                  }}
                />
                <button
                  onClick={() => {
                    if (userInput.trim() && runningAgentId) {
                      setAgentOutput(prev => prev + `\n\nYou: ${userInput}\n`);
                      setUserInput("");
                    }
                  }}
                  className="p-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  title="Send"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
