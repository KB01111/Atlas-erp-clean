import { NextRequest, NextResponse } from 'next/server';
import { getAgentById } from '@/lib/agent-service';

/**
 * API route for getting a specific agent
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get the agent
    const agent = await getAgentById(id);

    if (!agent) {
      return NextResponse.json(
        { error: `Agent with ID ${id} not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      agent,
    });
  } catch (error) {
    console.error('Error getting agent:', error);
    return NextResponse.json(
      { error: 'Failed to get agent', details: (error as Error).message },
      { status: 500 }
    );
  }
}
