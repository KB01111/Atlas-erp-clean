import { Connection, Client } from '@temporalio/client';
import { v4 as uuidv4 } from 'uuid';
import * as surrealDB from './surreal-client';
import { Workflow, WorkflowNode, WorkflowEdge, WorkflowState, WorkflowLog } from './workflow-service';

/**
 * Initialize Temporal client
 * @returns Temporal client
 */
async function getTemporalClient(): Promise<Client> {
  try {
    // Connect to Temporal server
    const connection = await Connection.connect({
      address: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
    });

    // Create a client
    return new Client({
      connection,
      namespace: process.env.TEMPORAL_NAMESPACE || 'default',
    });
  } catch (error) {
    console.error('Error connecting to Temporal:', error);
    throw error;
  }
}

/**
 * Execute a workflow using Temporal
 * @param workflowId The workflow ID
 * @param input The workflow input
 * @param onLog Callback for log events
 * @returns The workflow execution state
 */
export async function executeTemporalWorkflow(
  workflowId: string,
  input: Record<string, any>,
  onLog?: (log: WorkflowLog) => void
): Promise<WorkflowState> {
  try {
    // Get the workflow
    const workflows = await surrealDB.select<Workflow>('workflows', workflowId);
    if (workflows.length === 0) {
      throw new Error(`Workflow ${workflowId} not found`);
    }
    const workflow = workflows[0];

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

    // Log the start of the workflow
    const startLog: WorkflowLog = {
      timestamp: new Date().toISOString(),
      nodeId: 'workflow',
      nodeName: workflow.name,
      message: `Starting workflow execution: ${workflow.name}`,
      data: { input },
    };

    // Update state with logs
    await updateExecutionState(executionId, {
      logs: [...state.logs, startLog],
    });

    // Call the log callback if provided
    if (onLog) onLog(startLog);

    try {
      // Get Temporal client
      const client = await getTemporalClient();

      // Start the workflow execution
      const handle = await client.workflow.start('executeWorkflow', {
        taskQueue: 'atlas-erp-workflows',
        workflowId: executionId,
        args: [workflow, input],
      });

      // Wait for the workflow to complete
      const result = await handle.result();

      // Log the completion of the workflow
      const completionLog: WorkflowLog = {
        timestamp: new Date().toISOString(),
        nodeId: 'workflow',
        nodeName: workflow.name,
        message: `Completed workflow execution: ${workflow.name}`,
        data: { result },
      };

      // Update state with success
      await updateExecutionState(executionId, {
        status: 'completed',
        output: result,
        logs: [...state.logs, startLog, completionLog],
        completedAt: new Date().toISOString(),
      });

      // Get the updated state
      const executions = await surrealDB.select<WorkflowState>('workflow_executions', executionId);
      return executions[0];
    } catch (error) {
      console.error(`Error executing workflow ${workflowId}:`, error);

      // Log the error
      const errorLog: WorkflowLog = {
        timestamp: new Date().toISOString(),
        nodeId: 'workflow',
        nodeName: workflow.name,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        data: { error: error instanceof Error ? error.message : 'Unknown error' },
      };

      // Update state with failure
      await updateExecutionState(executionId, {
        status: 'failed',
        logs: [...state.logs, startLog, errorLog],
        completedAt: new Date().toISOString(),
      });

      // Call the log callback if provided
      if (onLog) onLog(errorLog);

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
 * Get workflow execution state
 * @param executionId The execution ID
 * @returns The workflow execution state
 */
export async function getWorkflowExecutionState(
  executionId: string
): Promise<WorkflowState | null> {
  try {
    const executions = await surrealDB.select<WorkflowState>('workflow_executions', executionId);
    return executions.length > 0 ? executions[0] : null;
  } catch (error) {
    console.error(`Error getting execution state ${executionId}:`, error);
    throw error;
  }
}

/**
 * Get all workflow executions for a workflow
 * @param workflowId The workflow ID
 * @returns The workflow executions
 */
export async function getWorkflowExecutions(
  workflowId: string
): Promise<WorkflowState[]> {
  try {
    const query = `
      SELECT * FROM workflow_executions
      WHERE workflowId = $workflowId
      ORDER BY startedAt DESC;
    `;
    
    const result = await surrealDB.query(query, { workflowId });
    return result[0]?.result || [];
  } catch (error) {
    console.error(`Error getting executions for workflow ${workflowId}:`, error);
    throw error;
  }
}
