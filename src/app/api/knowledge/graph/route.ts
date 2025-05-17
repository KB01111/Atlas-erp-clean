import { NextRequest, NextResponse } from 'next/server';
import * as arangoKnowledgeService from '@/lib/arango-knowledge-service';

/**
 * GET handler to retrieve the knowledge graph
 */
export async function GET(req: NextRequest) {
  try {
    // Check if we're using mock services
    if (process.env.USE_MOCK_SERVICES === 'true') {
      console.log('Using mock ArangoDB service for knowledge graph (configured in .env)');
      return NextResponse.json({
        nodes: [],
        edges: [],
        message: 'Using mock ArangoDB service'
      });
    }

    // Ensure the knowledge graph is initialized
    await arangoKnowledgeService.initializeKnowledgeGraph();

    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '100');
    const nodeType = searchParams.get('nodeType') || undefined;
    const query = searchParams.get('query') || undefined;

    // Get nodes and edges
    const nodes = await arangoKnowledgeService.getNodes({
      limit,
      nodeType: nodeType as arangoKnowledgeService.NodeType | undefined,
      query,
    });

    // Get edges between these nodes
    const nodeIds = nodes.map(node => node._id || `knowledge_nodes/${node._key}`);
    const edges = await arangoKnowledgeService.getEdgesBetweenNodes(nodeIds);

    // Transform edges to a format compatible with the visualization
    const transformedEdges = edges.map(edge => ({
      id: edge._key || edge._id || `edge-${Date.now()}-${Math.random()}`,
      source: edge._from.replace('knowledge_nodes/', ''),
      target: edge._to.replace('knowledge_nodes/', ''),
      label: edge.type,
      type: edge.type,
      weight: edge.weight,
    }));

    // Transform nodes to a format compatible with the visualization
    const transformedNodes = nodes.map(node => ({
      id: node._key || node._id?.replace('knowledge_nodes/', '') || `node-${Date.now()}-${Math.random()}`,
      _id: node._id,
      _key: node._key,
      type: node.type,
      name: node.name,
      content: node.content,
      metadata: node.metadata,
    }));

    return NextResponse.json({
      nodes: transformedNodes,
      edges: transformedEdges,
    });
  } catch (error) {
    console.error('Error retrieving knowledge graph:', error);

    // Return empty data instead of error to prevent UI issues
    return NextResponse.json({
      nodes: [],
      edges: [],
      error: 'Failed to retrieve knowledge graph',
      details: (error as Error).message,
      message: 'Using fallback empty graph due to connection error'
    }, { status: 200 });
  }
}

/**
 * POST handler to save the knowledge graph
 */
export async function POST(req: NextRequest) {
  try {
    // Ensure the knowledge graph is initialized
    await arangoKnowledgeService.initializeKnowledgeGraph();

    const body = await req.json();

    // Validate request body
    if (!body.nodes || !Array.isArray(body.nodes)) {
      return NextResponse.json(
        { error: 'Missing or invalid nodes array' },
        { status: 400 }
      );
    }

    if (!body.edges || !Array.isArray(body.edges)) {
      return NextResponse.json(
        { error: 'Missing or invalid edges array' },
        { status: 400 }
      );
    }

    // Save nodes and edges
    const savedNodes = await arangoKnowledgeService.saveNodes(body.nodes);

    // Transform saved nodes to get their IDs
    const nodeMap = new Map();
    savedNodes.forEach(node => {
      const id = node._key || node._id?.replace('knowledge_nodes/', '');
      if (id) {
        nodeMap.set(node.name, id);
      }
    });

    // Update edge references with saved node IDs
    const edgesToSave = body.edges.map((edge: unknown) => {
      // If the source/target is a name (not an ID), look up the ID
      const source = edge.source;
      const target = edge.target;

      // If the edge already has proper IDs, use them
      if (edge._from && edge._to) {
        return edge;
      }

      return {
        ...edge,
        source,
        target,
        type: edge.type || arangoKnowledgeService.EdgeType.RELATES_TO,
      };
    });

    const savedEdges = await arangoKnowledgeService.saveEdges(edgesToSave);

    // Transform edges to a format compatible with the visualization
    const transformedEdges = savedEdges.map(edge => ({
      id: edge._key || edge._id || `edge-${Date.now()}-${Math.random()}`,
      source: edge._from.replace('knowledge_nodes/', ''),
      target: edge._to.replace('knowledge_nodes/', ''),
      label: edge.type,
      type: edge.type,
      weight: edge.weight,
    }));

    // Transform nodes to a format compatible with the visualization
    const transformedNodes = savedNodes.map(node => ({
      id: node._key || node._id?.replace('knowledge_nodes/', '') || `node-${Date.now()}-${Math.random()}`,
      _id: node._id,
      _key: node._key,
      type: node.type,
      name: node.name,
      content: node.content,
      metadata: node.metadata,
    }));

    return NextResponse.json({
      nodes: transformedNodes,
      edges: transformedEdges,
    });
  } catch (error) {
    console.error('Error saving knowledge graph:', error);
    return NextResponse.json(
      { error: 'Failed to save knowledge graph', details: (error as Error).message },
      { status: 500 }
    );
  }
}
