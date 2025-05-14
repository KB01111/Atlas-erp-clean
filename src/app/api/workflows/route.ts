import { NextRequest, NextResponse } from 'next/server';
import * as workflowService from '@/lib/workflow-service';

/**
 * API route for getting all workflows
 */
export async function GET(request: NextRequest) {
  try {
    // Get all workflows
    const workflows = await workflowService.getWorkflows();
    
    return NextResponse.json({
      workflows,
    });
  } catch (error) {
    console.error('Error getting workflows:', error);
    return NextResponse.json(
      { error: 'Failed to get workflows', details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * API route for creating a workflow
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    if (!body.name || !body.description) {
      return NextResponse.json(
        { error: 'Missing required fields: name, description' },
        { status: 400 }
      );
    }
    
    // Create the workflow
    const workflow = await workflowService.createWorkflow(
      body.name,
      body.description,
      body.nodes || [],
      body.edges || [],
      body.config
    );
    
    return NextResponse.json({
      workflow,
    });
  } catch (error) {
    console.error('Error creating workflow:', error);
    return NextResponse.json(
      { error: 'Failed to create workflow', details: (error as Error).message },
      { status: 500 }
    );
  }
}
