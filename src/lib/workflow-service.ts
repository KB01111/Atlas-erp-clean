import { v4 as uuidv4 } from 'uuid';
import * as surrealDB from './surreal-client';
import { getAgentById, executeAgent, Agent } from './agent-service';
import { StateGraph, END } from '@langchain/langgraph';
// Use in-memory storage instead of checkpoint
import { RunnableConfig } from '@langchain/core/runnables';

/**
 * Workflow interface
 */
export interface Workflow {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'draft';
  createdAt: string;
  updatedAt: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  config?: Record<string, any>;
}

/**
 * Workflow node interface
 */
export interface WorkflowNode {
  id: string;
  type: 'agent' | 'condition' | 'input' | 'output' | 'transform';
  name: string;
  agentId?: string;
  config?: Record<string, any>;
  position?: { x: number; y: number };
}

/**
 * Workflow edge interface
 */
export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  condition?: string;
  label?: string;
}

/**
 * Workflow execution state
 */
export interface WorkflowState {
  workflowId: string;
  executionId: string;
  status: 'running' | 'completed' | 'failed';
  currentNodeId?: string;
  input: Record<string, any>;
  output?: Record<string, any>;
  logs: WorkflowLog[];
  startedAt: string;
  completedAt?: string;
}

/**
 * Workflow log entry
 */
export interface WorkflowLog {
  timestamp: string;
  nodeId: string;
  nodeName: string;
  message: string;
  data?: Record<string, any>;
}

/**
 * Create a new workflow
 * @param name The workflow name
 * @param description The workflow description
 * @param nodes The workflow nodes
 * @param edges The workflow edges
 * @param config Optional workflow configuration
 * @returns The created workflow
 */
export async function createWorkflow(
  name: string,
  description: string,
  nodes: WorkflowNode[] = [],
  edges: WorkflowEdge[] = [],
  config?: Record<string, any>
): Promise<Workflow> {
  try {
    const workflow: Workflow = {
      id: uuidv4(),
      name,
      description,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      nodes,
      edges,
      config,
    };

    const result = await surrealDB.create<Workflow>('workflows', workflow);
    return result;
  } catch (error) {
    console.error('Error creating workflow:', error);
    throw error;
  }
}

/**
 * Get a workflow by ID
 * @param id The workflow ID
 * @returns The workflow or null if not found
 */
export async function getWorkflowById(id: string): Promise<Workflow | null> {
  try {
    const workflows = await surrealDB.select<Workflow>('workflows', id);
    return workflows.length > 0 ? workflows[0] : null;
  } catch (error) {
    console.error(`Error getting workflow ${id}:`, error);
    throw error;
  }
}

/**
 * Get all workflows
 * @returns The workflows
 */
export async function getWorkflows(): Promise<Workflow[]> {
  try {
    const workflows = await surrealDB.select<Workflow>('workflows');
    return workflows;
  } catch (error) {
    console.error('Error getting workflows:', error);
    throw error;
  }
}

/**
 * Update a workflow
 * @param id The workflow ID
 * @param updates The updates to apply
 * @returns The updated workflow
 */
export async function updateWorkflow(
  id: string,
  updates: Partial<Workflow>
): Promise<Workflow> {
  try {
    // Ensure we don't update the ID
    const { id: _, ...validUpdates } = updates;

    // Update the updatedAt timestamp
    const updatedWorkflow = {
      ...validUpdates,
      updatedAt: new Date().toISOString(),
    };

    const result = await surrealDB.update<Workflow>('workflows', id, updatedWorkflow);
    return result;
  } catch (error) {
    console.error(`Error updating workflow ${id}:`, error);
    throw error;
  }
}

/**
 * Delete a workflow
 * @param id The workflow ID
 * @returns The deleted workflow
 */
export async function deleteWorkflow(id: string): Promise<Workflow> {
  try {
    const result = await surrealDB.remove<Workflow>('workflows', id);
    return result;
  } catch (error) {
    console.error(`Error deleting workflow ${id}:`, error);
    throw error;
  }
}

/**
 * Execute a workflow
 * @param workflowId The workflow ID
 * @param input The workflow input
 * @param onLog Callback for log events
 * @returns The workflow execution state
 */
export async function executeWorkflow(
  workflowId: string,
  input: Record<string, any>,
  onLog?: (log: WorkflowLog) => void
): Promise<WorkflowState> {
  try {
    // Get the workflow
    const workflow = await getWorkflowById(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    // Create execution state
    const executionId = uuidv4();
    const state: WorkflowState = {
      workflowId,
      executionId,
      status: 'running',
      input,
      logs: [],
      startedAt: new Date().toISOString(),
    };

    // Save initial state
    await surrealDB.create('workflow_executions', state);

    // Build the workflow graph
    const graph = await buildWorkflowGraph(workflow);

    // Execute the workflow
    try {
      // Add a log function to the config
      const config: RunnableConfig = {
        configurable: {
          thread_id: executionId,
        },
        callbacks: [
          {
            handleChainStart: async (chain, inputs) => {
              const nodeId = chain.id || 'unknown';
              const nodeName = workflow.nodes.find(n => n.id === nodeId)?.name || nodeId;

              const log: WorkflowLog = {
                timestamp: new Date().toISOString(),
                nodeId,
                nodeName,
                message: `Starting node execution: ${nodeName}`,
                data: { inputs },
              };

              // Update state with current node
              await updateExecutionState(executionId, {
                currentNodeId: nodeId,
                logs: [...state.logs, log],
              });

              // Call the log callback if provided
              if (onLog) onLog(log);
            },
            handleChainEnd: async (chain, outputs) => {
              const nodeId = chain.id || 'unknown';
              const nodeName = workflow.nodes.find(n => n.id === nodeId)?.name || nodeId;

              const log: WorkflowLog = {
                timestamp: new Date().toISOString(),
                nodeId,
                nodeName,
                message: `Completed node execution: ${nodeName}`,
                data: { outputs },
              };

              // Update state with logs
              await updateExecutionState(executionId, {
                logs: [...state.logs, log],
              });

              // Call the log callback if provided
              if (onLog) onLog(log);
            },
          },
        ],
      };

      // Execute the graph
      const result = await graph.invoke(input, config);

      // Update state with success
      await updateExecutionState(executionId, {
        status: 'completed',
        output: result,
        completedAt: new Date().toISOString(),
      });

      // Get the updated state
      const executions = await surrealDB.select<WorkflowState>('workflow_executions', executionId);
      return executions[0];
    } catch (error) {
      console.error(`Error executing workflow ${workflowId}:`, error);

      // Log the error
      const log: WorkflowLog = {
        timestamp: new Date().toISOString(),
        nodeId: state.currentNodeId || 'unknown',
        nodeName: state.currentNodeId || 'unknown',
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        data: { error: error instanceof Error ? error.message : 'Unknown error' },
      };

      // Update state with failure
      await updateExecutionState(executionId, {
        status: 'failed',
        logs: [...state.logs, log],
        completedAt: new Date().toISOString(),
      });

      // Call the log callback if provided
      if (onLog) onLog(log);

      // Get the updated state
      const executions = await surrealDB.select<WorkflowState>('workflow_executions', executionId);
      return executions[0];
    }
  } catch (error) {
    console.error(`Error executing workflow ${workflowId}:`, error);
    throw error;
  }
}

/**
 * Update workflow execution state
 * @param executionId The execution ID
 * @param updates The updates to apply
 */
async function updateExecutionState(
  executionId: string,
  updates: Partial<WorkflowState>
): Promise<void> {
  try {
    await surrealDB.update('workflow_executions', executionId, updates);
  } catch (error) {
    console.error(`Error updating execution state ${executionId}:`, error);
    throw error;
  }
}

/**
 * Build a workflow graph using LangGraph
 * @param workflow The workflow to build
 * @returns The compiled graph
 */
async function buildWorkflowGraph(workflow: Workflow) {
  // Define the state type
  type WorkflowGraphState = Record<string, any>;

  // Create a new state graph
  const graph = new StateGraph<WorkflowGraphState>({});

  // Add nodes to the graph
  for (const node of workflow.nodes) {
    // Skip input and output nodes as they're handled differently
    if (node.type === 'input' || node.type === 'output') {
      continue;
    }

    // Add the node to the graph
    if (node.type === 'agent' && node.agentId) {
      // Get the agent
      const agent = await getAgentById(node.agentId);
      if (!agent) {
        throw new Error(`Agent ${node.agentId} not found for node ${node.id}`);
      }

      // Create a node function that executes the agent
      const nodeFunction = async (state: WorkflowGraphState) => {
        // Get the input for this agent
        const agentInput = typeof state.input === 'string'
          ? state.input
          : JSON.stringify(state.input);

        // Execute the agent
        const result = await executeAgent(
          agent,
          agentInput,
          (message) => console.log(`[${node.name}] ${message}`)
        );

        // Return the result
        return { output: result.output };
      };

      // Add the node to the graph
      graph.addNode(node.id, nodeFunction);
    } else if (node.type === 'condition') {
      // Create a condition function
      const conditionFunction = async (state: WorkflowGraphState) => {
        // Get the condition expression from the node config
        const conditionExpression = node.config?.condition || 'true';

        // Evaluate the condition
        try {
          // Create a safe evaluation context with the state
          const context = { ...state };
          const result = new Function('context', `with(context) { return ${conditionExpression}; }`)(context);

          // Return the result as a string
          return result ? 'true' : 'false';
        } catch (error) {
          console.error(`Error evaluating condition for node ${node.id}:`, error);
          return 'false';
        }
      };

      // Add the node to the graph
      graph.addNode(node.id, conditionFunction);
    } else if (node.type === 'transform') {
      // Create a transform function
      const transformFunction = async (state: WorkflowGraphState) => {
        // Get the transform expression from the node config
        const transformExpression = node.config?.transform || 'input';

        // Evaluate the transform
        try {
          // Create a safe evaluation context with the state
          const context = { ...state };
          const result = new Function('context', `with(context) { return ${transformExpression}; }`)(context);

          // Return the result
          return { output: result };
        } catch (error) {
          console.error(`Error evaluating transform for node ${node.id}:`, error);
          return { output: state.input };
        }
      };

      // Add the node to the graph
      graph.addNode(node.id, transformFunction);
    }
  }

  // Add edges to the graph
  for (const edge of workflow.edges) {
    // Get the source and target nodes
    const sourceNode = workflow.nodes.find(n => n.id === edge.source);
    const targetNode = workflow.nodes.find(n => n.id === edge.target);

    if (!sourceNode || !targetNode) {
      console.warn(`Invalid edge: ${edge.source} -> ${edge.target}`);
      continue;
    }

    // Handle special cases for input and output nodes
    if (sourceNode.type === 'input') {
      // Input nodes are connected to the graph entry point
      graph.addEdge('__start__', edge.target);
    } else if (targetNode.type === 'output') {
      // Output nodes are connected to the graph end point
      graph.addEdge(edge.source, END);
    } else if (sourceNode.type === 'condition') {
      // Condition nodes have conditional edges
      // Find all edges from this condition node
      const conditionEdges = workflow.edges.filter(e => e.source === sourceNode.id);

      // Create a map of condition values to target nodes
      const conditionMap: Record<string, string> = {};

      for (const condEdge of conditionEdges) {
        if (condEdge.condition) {
          conditionMap[condEdge.condition] = condEdge.target;
        }
      }

      // Add conditional edges
      graph.addConditionalEdges(sourceNode.id, (state) => state, conditionMap);
    } else {
      // Regular edge
      graph.addEdge(edge.source, edge.target);
    }
  }

  // Compile the graph
  return graph.compile();
}
