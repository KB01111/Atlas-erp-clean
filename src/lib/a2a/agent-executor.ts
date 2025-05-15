import { Agent, AgentExecutionResult } from '../validation/schemas';
import { getLLMSettings } from '../llm-settings';
import litellm from 'litellm';
import * as surrealDB from '../surreal-client';
import { v4 as uuidv4 } from 'uuid';
import {
  createMessage,
  messageToString,
  A2AMessage,
  A2AMessageRole,
  A2AMessageType
} from './protocol';

/**
 * Agent execution progress callback
 */
export type ProgressCallback = (message: string) => void;

/**
 * Agent execution run
 */
export interface AgentRun {
  id: string;
  agentId: string;
  status: 'running' | 'completed' | 'failed';
  input: string;
  output?: string;
  error?: string;
  messages: A2AMessage[];
  startedAt: string;
  completedAt?: string;
}

/**
 * Execute an agent with A2A protocol
 */
export async function executeAgentWithA2A(
  agent: Agent,
  input: string,
  onProgress: ProgressCallback
): Promise<AgentExecutionResult> {
  try {
    // Create a new run
    const runId = uuidv4();
    const run: AgentRun = {
      id: runId,
      agentId: agent.id,
      status: 'running',
      input,
      messages: [],
      startedAt: new Date().toISOString(),
    };

    // Save the run
    await saveRun(run);

    // Report progress
    onProgress(`Running ${agent.name}...\n\nInitializing...\n`);

    // Get LLM settings
    const llmSettings = await getLLMSettings();

    // Set the API key for LiteLLM
    litellm.apiKey = llmSettings.apiKey;
    const defaultModel = agent.model || llmSettings.model || 'gpt-3.5-turbo';

    // Report progress
    onProgress(`\nConnecting to language model...\n`);

    // Create system message
    const systemMessage = createMessage({
      type: A2AMessageType.SYSTEM,
      role: A2AMessageRole.SYSTEM,
      content: agent.systemPrompt,
    });

    // Create user message
    const userMessage = createMessage({
      type: A2AMessageType.USER_MESSAGE,
      role: A2AMessageRole.USER,
      content: input,
    });

    // Add messages to run
    run.messages.push(systemMessage, userMessage);
    await updateRun(runId, { messages: run.messages });

    // Report progress
    onProgress(`\nProcessing request...\n`);

    // Prepare messages for LLM
    const messages = [
      { role: 'system', content: messageToString(systemMessage) },
      { role: 'user', content: messageToString(userMessage) },
    ];

    // Call the LLM
    const response = await litellm.chatCompletion({
      model: defaultModel,
      messages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    // Get the response content
    const content = response.choices[0]?.message?.content || 'No response from the model.';

    // Create assistant message
    const assistantMessage = createMessage({
      type: A2AMessageType.ASSISTANT_MESSAGE,
      role: A2AMessageRole.ASSISTANT,
      content,
    });

    // Add message to run
    run.messages.push(assistantMessage);

    // Report progress
    onProgress(`\nGenerating response...\n`);

    // Update run with completion
    await updateRun(runId, {
      status: 'completed',
      output: content,
      messages: run.messages,
      completedAt: new Date().toISOString(),
    });

    // Report progress
    onProgress(`\n${content}\n\nTask completed successfully!\n`);

    // Return result
    return {
      success: true,
      output: content,
    };
  } catch (error) {
    console.error(`Error executing agent ${agent.name} with A2A:`, error);

    // Create error message
    const errorMessage = createMessage({
      type: A2AMessageType.ERROR,
      role: A2AMessageRole.SYSTEM,
      content: error instanceof Error ? error.message : 'Unknown error',
    });

    // Update run with error
    try {
      const runId = uuidv4();
      await updateRun(runId, {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        messages: [errorMessage],
        completedAt: new Date().toISOString(),
      });
    } catch (saveError) {
      console.error('Error saving run error:', saveError);
    }

    // Report progress
    onProgress(`\nError: ${error instanceof Error ? error.message : 'Unknown error'}\n`);

    // Return error result
    return {
      success: false,
      output: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Save a new agent run
 */
async function saveRun(run: AgentRun): Promise<void> {
  try {
    await surrealDB.create('agent_runs', run);
  } catch (error) {
    console.error('Error saving agent run:', error);
    throw error;
  }
}

/**
 * Update an agent run
 */
async function updateRun(
  runId: string,
  updates: Partial<AgentRun>
): Promise<void> {
  try {
    await surrealDB.update('agent_runs', runId, updates);
  } catch (error) {
    console.error(`Error updating agent run ${runId}:`, error);
    throw error;
  }
}

/**
 * Get an agent run by ID
 */
export async function getRun(runId: string): Promise<AgentRun | null> {
  try {
    const runs = await surrealDB.select<AgentRun>('agent_runs', runId);
    return runs.length > 0 ? runs[0] : null;
  } catch (error) {
    console.error(`Error getting agent run ${runId}:`, error);
    throw error;
  }
}

/**
 * Get all runs for an agent
 */
export async function getAgentRuns(agentId: string): Promise<AgentRun[]> {
  try {
    const query = `
      SELECT * FROM agent_runs
      WHERE agentId = $agentId
      ORDER BY startedAt DESC;
    `;

    const result = await surrealDB.query(query, { agentId });
    return result[0]?.result || [];
  } catch (error) {
    console.error(`Error getting runs for agent ${agentId}:`, error);
    throw error;
  }
}
