import { getLLMSettings } from './llm-settings';
import * as litellm from 'litellm';
import * as surrealDB from './surreal-client';
import { v4 as uuidv4 } from 'uuid';
import {
  Agent,
  AgentSchema,
  AgentExecutionResult,
  AgentExecutionResultSchema
} from './validation/schemas';
import {
  createMessage,
  messageToString
} from './a2a/protocol';
import { executeAgentWithA2A, AgentRun, getRun, getAgentRuns } from './a2a/agent-executor';

/**
 * Agent execution progress callback
 */
export type ProgressCallback = (message: string) => void;

/**
 * Get all agents
 */
export async function getAgents(): Promise<Agent[]> {
  try {
    // Get agents from SurrealDB
    const result = await surrealDB.query(`
      SELECT * FROM agents
      ORDER BY name ASC;
    `);

    // Validate agents using Zod schema
    const agents = result[0].result || [];
    return agents.map(agent => {
      try {
        return AgentSchema.parse(agent);
      } catch (validationError) {
        console.warn(`Validation error for agent ${agent.id}:`, validationError);
        // Return the agent anyway, but log the validation error
        return agent;
      }
    });
  } catch (error) {
    console.error('Error fetching agents:', error);

    // Return default agents if database query fails
    const defaultAgents = [
      {
        id: "1",
        name: "CFO-Bot",
        description: "Financial forecasting and analysis agent",
        status: "idle" as const,
        lastRun: "2025-05-10 14:30",
        capabilities: [
          "Generate financial forecasts",
          "Analyze revenue trends",
          "Identify cost-saving opportunities",
          "Create budget reports",
        ],
        systemPrompt: `You are CFO-Bot, a financial forecasting and analysis agent for Atlas-ERP.
Your goal is to analyze financial data and provide insights and forecasts.
Be concise, accurate, and focus on actionable insights.`,
      },
      {
        id: "2",
        name: "Ops-Bot",
        description: "Operations management and optimization agent",
        status: "idle" as const,
        lastRun: "2025-05-12 09:15",
        capabilities: [
          "Optimize resource allocation",
          "Identify process bottlenecks",
          "Schedule maintenance tasks",
          "Monitor system performance",
        ],
        systemPrompt: `You are Ops-Bot, an operations management and optimization agent for Atlas-ERP.
Your goal is to analyze operational data and provide insights and recommendations.
Focus on efficiency, optimization, and process improvements.`,
      },
      {
        id: "3",
        name: "Soshie-Bot",
        description: "Social media content enhancement agent",
        status: "idle" as const,
        lastRun: "2025-05-11 16:45",
        capabilities: [
          "Generate social media content",
          "Analyze engagement metrics",
          "Identify trending topics",
          "Schedule posts for optimal reach",
        ],
        systemPrompt: `You are Soshie-Bot, a social media content enhancement agent for Atlas-ERP.
Your goal is to analyze social media data and provide content recommendations.
Focus on engagement, trends, and content optimization.`,
      },
    ];

    // Validate default agents
    return defaultAgents.map(agent => AgentSchema.parse(agent));
  }
}

/**
 * Get agent by ID
 */
export async function getAgentById(id: string): Promise<Agent | null> {
  try {
    // Get agent from SurrealDB
    const result = await surrealDB.query(`
      SELECT * FROM agents
      WHERE id = $id;
    `, { id });

    const agent = result[0].result?.[0] || null;

    // Validate agent using Zod schema
    if (agent) {
      try {
        return AgentSchema.parse(agent);
      } catch (validationError) {
        console.warn(`Validation error for agent ${id}:`, validationError);
        // Return the agent anyway, but log the validation error
        return agent;
      }
    }

    return null;
  } catch (error) {
    console.error(`Error fetching agent with ID ${id}:`, error);

    // Get from default agents if database query fails
    const defaultAgents = await getAgents();
    return defaultAgents.find(agent => agent.id === id) || null;
  }
}

/**
 * Update agent status
 */
export async function updateAgentStatus(
  id: string,
  status: 'idle' | 'running' | 'error'
): Promise<Agent | null> {
  try {
    // Validate status using Zod schema
    const validStatus = AgentSchema.shape.status.parse(status);

    // Update agent in SurrealDB
    const result = await surrealDB.query(`
      UPDATE agents
      SET status = $status, lastRun = $lastRun
      WHERE id = $id;
    `, {
      id,
      status: validStatus,
      lastRun: new Date().toLocaleString(),
    });

    const agent = result[0].result?.[0] || null;

    // Validate agent using Zod schema
    if (agent) {
      try {
        return AgentSchema.parse(agent);
      } catch (validationError) {
        console.warn(`Validation error for updated agent ${id}:`, validationError);
        // Return the agent anyway, but log the validation error
        return agent;
      }
    }

    return null;
  } catch (error) {
    console.error(`Error updating agent status for ID ${id}:`, error);
    return null;
  }
}

/**
 * Execute an agent
 */
export async function executeAgent(
  agent: Agent,
  input: string,
  onProgress: ProgressCallback,
  useA2A: boolean = true
): Promise<AgentExecutionResult> {
  try {
    // Validate agent using Zod schema
    const validAgent = AgentSchema.parse(agent);

    // Update agent status to running
    await updateAgentStatus(validAgent.id, 'running');

    let result: AgentExecutionResult;

    if (useA2A) {
      // Execute agent with A2A protocol
      result = await executeAgentWithA2A(validAgent, input, onProgress);
    } else {
      // Legacy execution without A2A
      result = await executeAgentLegacy(validAgent, input, onProgress);
    }

    // Update agent status based on result
    await updateAgentStatus(validAgent.id, result.success ? 'idle' : 'error');

    return AgentExecutionResultSchema.parse(result);
  } catch (error) {
    console.error(`Error executing agent ${agent.name}:`, error);

    // Update agent status to error
    await updateAgentStatus(agent.id, 'error');

    // Report progress
    onProgress(`\nError: ${error instanceof Error ? error.message : 'Unknown error'}\n`);

    // Create and validate error result
    const errorResult: AgentExecutionResult = {
      success: false,
      output: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    return AgentExecutionResultSchema.parse(errorResult);
  }
}

/**
 * Legacy agent execution without A2A protocol
 */
async function executeAgentLegacy(
  agent: Agent,
  input: string,
  onProgress: ProgressCallback
): Promise<AgentExecutionResult> {
  try {
    // Report progress
    onProgress(`Running ${agent.name}...\n\nInitializing...\n`);

    // Get LLM settings
    const llmSettings = await getLLMSettings();

    // Set the API key for LiteLLM
    litellm.apiKey = llmSettings.apiKey;
    const defaultModel = agent.model || llmSettings.model || 'gpt-3.5-turbo';

    // Report progress
    onProgress(`\nConnecting to language model...\n`);

    // Prepare messages
    const messages = [
      { role: 'system', content: agent.systemPrompt },
      { role: 'user', content: input },
    ];

    // Report progress
    onProgress(`\nProcessing request...\n`);

    // Call the LLM
    const response = await litellm.chatCompletion({
      model: defaultModel,
      messages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    // Get the response content
    const content = response.choices[0]?.message?.content || 'No response from the model.';

    // Report progress
    onProgress(`\nGenerating response...\n`);

    // Report progress
    onProgress(`\n${content}\n\nTask completed successfully!\n`);

    // Create result
    return {
      success: true,
      output: content,
    };
  } catch (error) {
    console.error(`Error executing agent ${agent.name} with legacy method:`, error);

    // Report progress
    onProgress(`\nError: ${error instanceof Error ? error.message : 'Unknown error'}\n`);

    // Create error result
    return {
      success: false,
      output: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get agent run by ID
 */
export async function getAgentRunById(runId: string): Promise<AgentRun | null> {
  return getRun(runId);
}

/**
 * Get all runs for an agent
 */
export async function getRunsForAgent(agentId: string): Promise<AgentRun[]> {
  return getAgentRuns(agentId);
}
