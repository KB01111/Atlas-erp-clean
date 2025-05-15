import { NextRequest, NextResponse } from 'next/server';
import * as agentService from '@/lib/agent-service';

/**
 * API route for executing an agent
 */
export async function POST(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const { params } = context;
  try {
    const { id } = params;
    const body = await request.json();

    // Get the agent
    const agent = await agentService.getAgentById(id);

    if (!agent) {
      return NextResponse.json(
        { error: `Agent with ID ${id} not found` },
        { status: 404 }
      );
    }

    // Check if we should use A2A protocol
    const useA2A = body.useA2A !== false; // Default to true

    // For streaming responses, we would use a different approach
    // For now, we'll use a simple callback to collect progress
    const progressMessages: string[] = [];
    const onProgress = (message: string) => {
      progressMessages.push(message);
    };

    // Execute the agent
    const result = await agentService.executeAgent(
      agent,
      body.input || 'Hello',
      onProgress,
      useA2A
    );

    return NextResponse.json({
      success: result.success,
      output: result.output,
      error: result.error,
      progress: progressMessages.join(''),
      protocol: useA2A ? 'a2a' : 'legacy',
    });
  } catch (error) {
    console.error('Error executing agent:', error);
    return NextResponse.json(
      { error: 'Failed to execute agent', details: (error as Error).message },
      { status: 500 }
    );
  }
}
