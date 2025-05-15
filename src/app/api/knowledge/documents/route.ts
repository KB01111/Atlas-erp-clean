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
 * API route for processing a document and adding it to the knowledge graph
 */
export async function POST(request: NextRequest) {
  try {
    await ensureInitialized();

    // Parse the request body
    const body = await request.json();

    // Validate request body
    if (!body.content || !body.name) {
      return NextResponse.json(
        { error: 'Missing required fields: content, name' },
        { status: 400 }
      );
    }

    // Process the document
    const { documentNode, chunkNodes } = await arangoKnowledgeService.processDocument(
      body.content,
      body.name,
      body.metadata || {},
      {
        chunkSize: body.chunkSize || 1000,
        chunkOverlap: body.chunkOverlap || 200,
        maxChunks: body.maxChunks || 20,
        extractEntities: body.extractEntities || false,
        extractConcepts: body.extractConcepts || false,
      }
    );

    // Transform the document node to a format compatible with the visualization
    const transformedDocumentNode = {
      id: documentNode._key || documentNode._id?.replace('knowledge_nodes/', '') || `node-${Date.now()}-${Math.random()}`,
      _id: documentNode._id,
      _key: documentNode._key,
      type: documentNode.type,
      name: documentNode.name,
      content: documentNode.content,
      metadata: documentNode.metadata,
    };

    // Transform the chunk nodes to a format compatible with the visualization
    const transformedChunkNodes = chunkNodes.map(node => ({
      id: node._key || node._id?.replace('knowledge_nodes/', '') || `node-${Date.now()}-${Math.random()}`,
      _id: node._id,
      _key: node._key,
      type: node.type,
      name: node.name,
      content: node.content,
      metadata: node.metadata,
    }));

    return NextResponse.json({
      document: transformedDocumentNode,
      chunks: transformedChunkNodes,
      chunkCount: chunkNodes.length,
    });
  } catch (error) {
    console.error('Error processing document:', error);
    return NextResponse.json(
      { error: 'Failed to process document', details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * API route for searching documents
 */
export async function GET(request: NextRequest) {
  try {
    await ensureInitialized();

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query');
    const limit = parseInt(searchParams.get('limit') || '5');
    const documentKey = searchParams.get('documentKey');

    if (documentKey) {
      // Get document chunks for a specific document
      const chunks = await arangoKnowledgeService.getDocumentChunks(documentKey);

      // Transform the chunks to a format compatible with the visualization
      const transformedChunks = chunks.map(node => ({
        id: node._key || node._id?.replace('knowledge_nodes/', '') || `node-${Date.now()}-${Math.random()}`,
        _id: node._id,
        _key: node._key,
        type: node.type,
        name: node.name,
        content: node.content,
        metadata: node.metadata,
      }));

      return NextResponse.json({
        chunks: transformedChunks,
        chunkCount: chunks.length,
      });
    } else if (query) {
      // Search for documents by content similarity
      const documents = await arangoKnowledgeService.searchDocuments(query, limit);

      // Transform the documents to a format compatible with the visualization
      const transformedDocuments = documents.map(node => ({
        id: node._key || node._id?.replace('knowledge_nodes/', '') || `node-${Date.now()}-${Math.random()}`,
        _id: node._id,
        _key: node._key,
        type: node.type,
        name: node.name,
        content: node.content,
        metadata: node.metadata,
      }));

      return NextResponse.json({
        documents: transformedDocuments,
        count: documents.length,
      });
    } else {
      // Get all document nodes
      const documents = await arangoKnowledgeService.getNodes({
        nodeType: arangoKnowledgeService.NodeType.DOCUMENT,
        limit: limit,
      });

      // Transform the documents to a format compatible with the visualization
      const transformedDocuments = documents.map(node => ({
        id: node._key || node._id?.replace('knowledge_nodes/', '') || `node-${Date.now()}-${Math.random()}`,
        _id: node._id,
        _key: node._key,
        type: node.type,
        name: node.name,
        content: node.content,
        metadata: node.metadata,
      }));

      return NextResponse.json({
        documents: transformedDocuments,
        count: documents.length,
      });
    }
  } catch (error) {
    console.error('Error searching documents:', error);
    return NextResponse.json(
      { error: 'Failed to search documents', details: (error as Error).message },
      { status: 500 }
    );
  }
}
