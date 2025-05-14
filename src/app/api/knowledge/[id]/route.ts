import { NextRequest, NextResponse } from 'next/server';
import * as arangoKnowledgeService from '@/lib/arango-knowledge-service';

// Initialize the knowledge graph on first request
let initialized = false;

async function ensureInitialized() {
  if (!initialized) {
    await arangoKnowledgeService.initializeKnowledgeGraph();
    initialized = true;
  }
}

/**
 * API route for getting a specific knowledge node
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureInitialized();

    const { id } = params;

    // Get the node
    const node = await arangoKnowledgeService.getNodeByKey(id);

    if (!node) {
      return NextResponse.json(
        { error: `Knowledge node with ID ${id} not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      node,
    });
  } catch (error) {
    console.error('Error getting knowledge node:', error);
    return NextResponse.json(
      { error: 'Failed to get knowledge node', details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * API route for getting connected nodes
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureInitialized();

    const { id } = params;
    const body = await request.json();

    // Get connected nodes
    const connectedNodes = await arangoKnowledgeService.getConnectedNodes(
      id,
      body.edgeType,
      body.direction || 'both'
    );

    return NextResponse.json({
      connections: connectedNodes,
    });
  } catch (error) {
    console.error('Error getting connected nodes:', error);
    return NextResponse.json(
      { error: 'Failed to get connected nodes', details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * API route for updating a knowledge node
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureInitialized();

    const { id } = params;
    const body = await request.json();

    // Validate request body
    if (!body.name && !body.content && !body.type && !body.metadata) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Check if node exists
    const existingNode = await arangoKnowledgeService.getNodeByKey(id);
    if (!existingNode) {
      return NextResponse.json(
        { error: `Knowledge node with ID ${id} not found` },
        { status: 404 }
      );
    }

    // Create update object
    const updates: any = {};
    if (body.name) updates.name = body.name;
    if (body.content) updates.content = body.content;
    if (body.type) updates.type = body.type;
    if (body.metadata) updates.metadata = body.metadata;

    // Update the node
    const updatedNode = await arangoKnowledgeService.updateNode(id, updates);

    return NextResponse.json({
      node: updatedNode,
    });
  } catch (error) {
    console.error('Error updating knowledge node:', error);
    return NextResponse.json(
      { error: 'Failed to update knowledge node', details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * API route for deleting a knowledge node
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureInitialized();

    const { id } = params;

    // Check if node exists
    const existingNode = await arangoKnowledgeService.getNodeByKey(id);
    if (!existingNode) {
      return NextResponse.json(
        { error: `Knowledge node with ID ${id} not found` },
        { status: 404 }
      );
    }

    // Delete the node
    const deleted = await arangoKnowledgeService.deleteNode(id);

    return NextResponse.json({
      success: deleted,
      message: deleted ? `Node ${id} deleted successfully` : `Failed to delete node ${id}`,
    });
  } catch (error) {
    console.error('Error deleting knowledge node:', error);
    return NextResponse.json(
      { error: 'Failed to delete knowledge node', details: (error as Error).message },
      { status: 500 }
    );
  }
}
