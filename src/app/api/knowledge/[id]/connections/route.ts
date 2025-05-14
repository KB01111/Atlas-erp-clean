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
 * API route for getting connected nodes
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureInitialized();
    
    const { id } = params;
    const searchParams = request.nextUrl.searchParams;
    const edgeType = searchParams.get('edgeType') as arangoKnowledgeService.EdgeType | null;
    const direction = searchParams.get('direction') as 'outgoing' | 'incoming' | 'both' | null;
    
    // Get connected nodes
    const connectedNodes = await arangoKnowledgeService.getConnectedNodes(
      id,
      edgeType || undefined,
      direction || 'both'
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
 * API route for creating a connection between nodes
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureInitialized();
    
    const { id } = params;
    const body = await request.json();
    
    // Validate request body
    if (!body.type || !body.targetKey) {
      return NextResponse.json(
        { error: 'Missing required fields: type, targetKey' },
        { status: 400 }
      );
    }
    
    // Create the edge
    const edge = await arangoKnowledgeService.createEdge(
      body.type,
      id, // Source key from URL
      body.targetKey,
      body.weight,
      body.metadata
    );
    
    return NextResponse.json({
      edge,
    });
  } catch (error) {
    console.error('Error creating connection:', error);
    return NextResponse.json(
      { error: 'Failed to create connection', details: (error as Error).message },
      { status: 500 }
    );
  }
}
