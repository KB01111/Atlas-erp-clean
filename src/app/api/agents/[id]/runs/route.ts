import { NextRequest, NextResponse } from 'next/server';
import * as agentService from '@/lib/agent-service';

/**
 * API route for getting agent runs
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get the agent
    const agent = await agentService.getAgentById(id);

    if (!agent) {
      return NextResponse.json(
        { error: `Agent with ID ${id} not found` },
        { status: 404 }
      );
    }

    // Get runs for the agent
    const runs = await agentService.getRunsForAgent(id);

    return NextResponse.json({
      runs,
    });
  } catch (error) {
    console.error('Error getting agent runs:', error);
    return NextResponse.json(
      { error: 'Failed to get agent runs', details: (error as Error).message },
      { status: 500 }
    );
  }
}
