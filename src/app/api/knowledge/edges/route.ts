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
 * API route for creating a knowledge edge
 */
export async function POST(request: NextRequest) {
  try {
    await ensureInitialized();

    const body = await request.json();

    // Validate request body
    if (!body.type || !body.sourceKey || !body.targetKey) {
      return NextResponse.json(
        { error: 'Missing required fields: type, sourceKey, targetKey' },
        { status: 400 }
      );
    }

    // Create the edge
    const edge = await arangoKnowledgeService.createEdge(
      body.type,
      body.sourceKey,
      body.targetKey,
      body.weight,
      body.metadata
    );

    return NextResponse.json({
      edge,
    });
  } catch (error) {
    console.error('Error creating knowledge edge:', error);
    return NextResponse.json(
      { error: 'Failed to create knowledge edge', details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * API route for getting knowledge edges
 */
export async function GET(request: NextRequest) {
  try {
    await ensureInitialized();

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');

    let edges;

    if (type) {
      // Get edges by type
      edges = await arangoKnowledgeService.getKnowledgeEdges(type as arangoKnowledgeService.EdgeType);
    } else {
      // Get all edges
      edges = await arangoKnowledgeService.getKnowledgeEdges();
    }

    return NextResponse.json({
      edges,
    });
  } catch (error) {
    console.error('Error getting knowledge edges:', error);
    return NextResponse.json(
      { error: 'Failed to get knowledge edges', details: (error as Error).message },
      { status: 500 }
    );
  }
}
