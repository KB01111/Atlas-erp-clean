import { NextRequest, NextResponse } from 'next/server';
import * as workflowService from '@/lib/workflow-service';
import { executeTemporalWorkflow } from '@/lib/temporal-workflow-service';

/**
 * API route for executing a workflow
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    // Check if we should use Temporal
    const useTemporal = body.useTemporal === true;

    // Execute the workflow with the appropriate service
    const executionState = useTemporal
      ? await executeTemporalWorkflow(id, body.input || {})
      : await workflowService.executeWorkflow(id, body.input || {});

    return NextResponse.json({
      execution: executionState,
      engine: useTemporal ? 'temporal' : 'langgraph',
    });
  } catch (error) {
    console.error('Error executing workflow:', error);
    return NextResponse.json(
      { error: 'Failed to execute workflow', details: (error as Error).message },
      { status: 500 }
    );
  }
}
