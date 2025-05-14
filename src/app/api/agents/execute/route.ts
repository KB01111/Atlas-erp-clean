import { NextRequest, NextResponse } from 'next/server';
import { getAgentById, executeAgent } from '@/lib/agent-service';

/**
 * API route for executing an agent
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    
    // Validate request body
    if (!body.agentId) {
      return NextResponse.json(
        { error: 'Missing required field: agentId' },
        { status: 400 }
      );
    }
    
    // Get the agent
    const agent = await getAgentById(body.agentId);
    
    if (!agent) {
      return NextResponse.json(
        { error: `Agent with ID ${body.agentId} not found` },
        { status: 404 }
      );
    }
    
    // Check if the agent is already running
    if (agent.status === 'running') {
      return NextResponse.json(
        { error: `Agent ${agent.name} is already running` },
        { status: 409 }
      );
    }
    
    // Get the input
    const input = body.input || 'Please analyze the current data and provide insights.';
    
    // Execute the agent (in a non-blocking way)
    const executionPromise = executeAgent(
      agent,
      input,
      (message) => {
        // In a real implementation, we would use a WebSocket or SSE to send progress updates
        console.log(`Agent ${agent.name} progress:`, message);
      }
    );
    
    // Don't wait for the execution to complete
    executionPromise.catch((error) => {
      console.error(`Error executing agent ${agent.name}:`, error);
    });
    
    return NextResponse.json({
      success: true,
      message: `Agent ${agent.name} execution started`,
      agent: {
        id: agent.id,
        name: agent.name,
        status: 'running',
      },
    });
  } catch (error) {
    console.error('Error executing agent:', error);
    return NextResponse.json(
      { error: 'Failed to execute agent', details: (error as Error).message },
      { status: 500 }
    );
  }
}
