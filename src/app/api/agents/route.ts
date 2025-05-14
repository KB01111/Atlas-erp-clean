import { NextRequest, NextResponse } from 'next/server';
import { getAgents } from '@/lib/agent-service';

/**
 * API route for getting all agents
 */
export async function GET(request: NextRequest) {
  try {
    // Get all agents
    const agents = await getAgents();
    
    return NextResponse.json({
      agents,
    });
  } catch (error) {
    console.error('Error getting agents:', error);
    return NextResponse.json(
      { error: 'Failed to get agents', details: (error as Error).message },
      { status: 500 }
    );
  }
}
