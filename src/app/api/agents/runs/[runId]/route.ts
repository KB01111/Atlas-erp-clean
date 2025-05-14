import { NextRequest, NextResponse } from 'next/server';
import * as agentService from '@/lib/agent-service';

/**
 * API route for getting a specific agent run
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { runId: string } }
) {
  try {
    const { runId } = params;
    
    // Get the run
    const run = await agentService.getAgentRunById(runId);
    
    if (!run) {
      return NextResponse.json(
        { error: `Run with ID ${runId} not found` },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      run,
    });
  } catch (error) {
    console.error('Error getting agent run:', error);
    return NextResponse.json(
      { error: 'Failed to get agent run', details: (error as Error).message },
      { status: 500 }
    );
  }
}
