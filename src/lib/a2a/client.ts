import { 
  Message, 
  MessagePart,
  AgentExecutionResult 
} from '../validation/schemas';
import { 
  RunMode, 
  RunStatus, 
  RunRequest, 
  RunResponse, 
  RunEvent,
  createMessage, 
  createRunRequest, 
  createRunResponse, 
  createRunEvent,
  messageToString
} from './protocol';
import { getAgentById, executeAgent } from '../agent-service';

/**
 * Agent client for inter-agent communication
 */
export class AgentClient {
  /**
   * Run an agent synchronously
   * @param agentName The agent name or ID
   * @param input The input message
   * @returns The agent execution result
   */
  public static async runSync(
    agentName: string,
    input: Message | string
  ): Promise<RunResponse> {
    try {
      // Convert string input to message if needed
      const inputMessage = typeof input === 'string' 
        ? createMessage(input) 
        : input;
      
      // Create run request
      const request = createRunRequest(
        agentName,
        [inputMessage],
        RunMode.SYNC
      );
      
      // Get the agent
      const agent = await getAgentById(agentName);
      if (!agent) {
        return createRunResponse(
          agentName,
          RunStatus.FAILED,
          undefined,
          `Agent ${agentName} not found`
        );
      }
      
      // Execute the agent
      const result = await executeAgent(
        agent,
        messageToString(inputMessage),
        (message) => console.log(`[${agent.name}] ${message}`)
      );
      
      // Create output message
      const outputMessage = createMessage(result.output);
      
      // Create run response
      return createRunResponse(
        agentName,
        result.success ? RunStatus.COMPLETED : RunStatus.FAILED,
        [outputMessage],
        result.error
      );
    } catch (error) {
      console.error(`Error running agent ${agentName}:`, error);
      
      return createRunResponse(
        agentName,
        RunStatus.FAILED,
        undefined,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }
  
  /**
   * Run an agent asynchronously
   * @param agentName The agent name or ID
   * @param input The input message
   * @returns The run ID
   */
  public static async runAsync(
    agentName: string,
    input: Message | string
  ): Promise<RunResponse> {
    try {
      // Convert string input to message if needed
      const inputMessage = typeof input === 'string' 
        ? createMessage(input) 
        : input;
      
      // Create run request
      const request = createRunRequest(
        agentName,
        [inputMessage],
        RunMode.ASYNC
      );
      
      // Get the agent
      const agent = await getAgentById(agentName);
      if (!agent) {
        return createRunResponse(
          agentName,
          RunStatus.FAILED,
          undefined,
          `Agent ${agentName} not found`
        );
      }
      
      // Create initial response
      const response = createRunResponse(
        agentName,
        RunStatus.RUNNING
      );
      
      // Execute the agent in the background
      executeAgent(
        agent,
        messageToString(inputMessage),
        (message) => console.log(`[${agent.name}] ${message}`)
      )
        .then((result) => {
          // Update the response status
          response.status = result.success ? RunStatus.COMPLETED : RunStatus.FAILED;
          response.output = [createMessage(result.output)];
          response.error = result.error;
        })
        .catch((error) => {
          // Update the response status
          response.status = RunStatus.FAILED;
          response.error = error instanceof Error ? error.message : 'Unknown error';
        });
      
      return response;
    } catch (error) {
      console.error(`Error running agent ${agentName}:`, error);
      
      return createRunResponse(
        agentName,
        RunStatus.FAILED,
        undefined,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }
  
  /**
   * Get the status of a run
   * @param runId The run ID
   * @returns The run response
   */
  public static async getRunStatus(runId: string): Promise<RunResponse | null> {
    // This is a placeholder - in a real implementation, you would store run status
    // in a database and retrieve it here
    console.warn('getRunStatus is not implemented yet');
    return null;
  }
}
