import { NextRequest, NextResponse } from 'next/server';
import * as workflowService from '@/lib/workflow-service';

/**
 * API route for getting a specific workflow
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Get the workflow
    const workflow = await workflowService.getWorkflowById(id);
    
    if (!workflow) {
      return NextResponse.json(
        { error: `Workflow with ID ${id} not found` },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      workflow,
    });
  } catch (error) {
    console.error('Error getting workflow:', error);
    return NextResponse.json(
      { error: 'Failed to get workflow', details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * API route for updating a workflow
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    
    // Update the workflow
    const workflow = await workflowService.updateWorkflow(id, body);
    
    return NextResponse.json({
      workflow,
    });
  } catch (error) {
    console.error('Error updating workflow:', error);
    return NextResponse.json(
      { error: 'Failed to update workflow', details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * API route for deleting a workflow
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Delete the workflow
    const workflow = await workflowService.deleteWorkflow(id);
    
    return NextResponse.json({
      workflow,
    });
  } catch (error) {
    console.error('Error deleting workflow:', error);
    return NextResponse.json(
      { error: 'Failed to delete workflow', details: (error as Error).message },
      { status: 500 }
    );
  }
}
