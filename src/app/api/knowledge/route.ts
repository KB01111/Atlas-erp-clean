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
 * API route for creating a knowledge node
 */
export async function POST(request: NextRequest) {
  try {
    await ensureInitialized();

    const body = await request.json();

    // Validate request body
    if (!body.type || !body.name || !body.content) {
      return NextResponse.json(
        { error: 'Missing required fields: type, name, content' },
        { status: 400 }
      );
    }

    // Create the node
    const node = await arangoKnowledgeService.createNode(
      body.type,
      body.name,
      body.content,
      body.metadata
    );

    return NextResponse.json({
      node,
    });
  } catch (error) {
    console.error('Error creating knowledge node:', error);
    return NextResponse.json(
      { error: 'Failed to create knowledge node', details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * API route for getting knowledge nodes
 */
export async function GET(request: NextRequest) {
  try {
    await ensureInitialized();

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');
    const query = searchParams.get('query');
    const limit = parseInt(searchParams.get('limit') || '10');

    let nodes;

    if (query) {
      // Search nodes by content
      nodes = await arangoKnowledgeService.searchNodes(query, limit);
    } else if (type) {
      // Get nodes by type
      nodes = await arangoKnowledgeService.getNodesByType(type as arangoKnowledgeService.NodeType);
    } else {
      // Default to returning concepts if no type or query is specified
      nodes = await arangoKnowledgeService.getNodesByType(arangoKnowledgeService.NodeType.CONCEPT);
    }

    return NextResponse.json({
      nodes,
    });
  } catch (error) {
    console.error('Error getting knowledge nodes:', error);
    return NextResponse.json(
      { error: 'Failed to get knowledge nodes', details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * API route for deleting a knowledge node
 */
export async function DELETE(request: NextRequest) {
  try {
    await ensureInitialized();

    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const nodeKey = pathParts[pathParts.length - 1];

    if (!nodeKey) {
      return NextResponse.json(
        { error: 'Missing node key' },
        { status: 400 }
      );
    }

    // Get the node to delete
    const node = await arangoKnowledgeService.getNodeByKey(nodeKey);

    if (!node) {
      return NextResponse.json(
        { error: 'Node not found' },
        { status: 404 }
      );
    }

    // Delete the node and its connections
    const deleted = await arangoKnowledgeService.deleteNode(nodeKey);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Failed to delete node' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Node ${nodeKey} deleted successfully`,
    });
  } catch (error) {
    console.error('Error deleting knowledge node:', error);
    return NextResponse.json(
      { error: 'Failed to delete knowledge node', details: (error as Error).message },
      { status: 500 }
    );
  }
}
