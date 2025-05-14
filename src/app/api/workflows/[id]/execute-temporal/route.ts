import { NextRequest, NextResponse } from 'next/server';
import { executeTemporalWorkflow } from '@/lib/temporal-workflow-service';

/**
 * API route for executing a workflow with Temporal
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    
    // Execute the workflow
    const executionState = await executeTemporalWorkflow(
      id,
      body.input || {}
    );
    
    return NextResponse.json({
      execution: executionState,
    });
  } catch (error) {
    console.error('Error executing workflow:', error);
    return NextResponse.json(
      { error: 'Failed to execute workflow', details: (error as Error).message },
      { status: 500 }
    );
  }
}
