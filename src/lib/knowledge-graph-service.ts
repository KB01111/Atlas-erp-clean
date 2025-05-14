import * as surrealDB from './surreal-client';
import { getLLMSettings } from './llm-settings';
import { LiteLLM } from 'litellm';
import { v4 as uuidv4 } from 'uuid';

/**
 * Knowledge node types
 */
export enum NodeType {
  CONCEPT = 'concept',
  ENTITY = 'entity',
  DOCUMENT = 'document',
  FACT = 'fact',
  QUESTION = 'question',
  ANSWER = 'answer',
}

/**
 * Knowledge node interface
 */
export interface KnowledgeNode {
  id: string;
  type: NodeType;
  name: string;
  content: string;
  metadata?: Record<string, any>;
  embedding?: number[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Knowledge edge types
 */
export enum EdgeType {
  RELATES_TO = 'relates_to',
  CONTAINS = 'contains',
  ANSWERS = 'answers',
  REFERENCES = 'references',
  IS_A = 'is_a',
  HAS_PROPERTY = 'has_property',
}

/**
 * Knowledge edge interface
 */
export interface KnowledgeEdge {
  id: string;
  type: EdgeType;
  source: string;
  target: string;
  weight?: number;
  metadata?: Record<string, any>;
  createdAt: string;
}

/**
 * Create a knowledge node
 * @param type The node type
 * @param name The node name
 * @param content The node content
 * @param metadata Optional metadata
 * @returns The created node
 */
export async function createNode(
  type: NodeType,
  name: string,
  content: string,
  metadata?: Record<string, any>
): Promise<KnowledgeNode> {
  try {
    // Generate embedding for the content
    const embedding = await generateEmbedding(content);
    
    // Create the node
    const node: KnowledgeNode = {
      id: uuidv4(),
      type,
      name,
      content,
      metadata,
      embedding,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    // Store in SurrealDB
    const result = await surrealDB.create('knowledge_nodes', node);
    
    return result;
  } catch (error) {
    console.error('Error creating knowledge node:', error);
    throw error;
  }
}

/**
 * Create a knowledge edge
 * @param type The edge type
 * @param sourceId The source node ID
 * @param targetId The target node ID
 * @param weight Optional edge weight
 * @param metadata Optional metadata
 * @returns The created edge
 */
export async function createEdge(
  type: EdgeType,
  sourceId: string,
  targetId: string,
  weight: number = 1.0,
  metadata?: Record<string, any>
): Promise<KnowledgeEdge> {
  try {
    // Create the edge
    const edge: KnowledgeEdge = {
      id: uuidv4(),
      type,
      source: sourceId,
      target: targetId,
      weight,
      metadata,
      createdAt: new Date().toISOString(),
    };
    
    // Store in SurrealDB
    const result = await surrealDB.create('knowledge_edges', edge);
    
    return result;
  } catch (error) {
    console.error('Error creating knowledge edge:', error);
    throw error;
  }
}

/**
 * Get a knowledge node by ID
 * @param id The node ID
 * @returns The node or null if not found
 */
export async function getNodeById(id: string): Promise<KnowledgeNode | null> {
  try {
    const nodes = await surrealDB.select<KnowledgeNode>('knowledge_nodes', id);
    return nodes.length > 0 ? nodes[0] : null;
  } catch (error) {
    console.error(`Error getting knowledge node ${id}:`, error);
    throw error;
  }
}

/**
 * Get knowledge nodes by type
 * @param type The node type
 * @returns The nodes
 */
export async function getNodesByType(type: NodeType): Promise<KnowledgeNode[]> {
  try {
    const result = await surrealDB.query<any>(`
      SELECT * FROM knowledge_nodes
      WHERE type = $type
      ORDER BY createdAt DESC;
    `, { type });
    
    return result[0].result || [];
  } catch (error) {
    console.error(`Error getting knowledge nodes of type ${type}:`, error);
    throw error;
  }
}

/**
 * Search for knowledge nodes by content similarity
 * @param query The search query
 * @param limit The maximum number of results
 * @returns The matching nodes
 */
export async function searchNodes(query: string, limit: number = 5): Promise<KnowledgeNode[]> {
  try {
    // Generate embedding for the query
    const embedding = await generateEmbedding(query);
    
    // Search for similar nodes using vector similarity in SurrealDB
    const result = await surrealDB.query<any>(`
      SELECT *,
        vector::similarity(embedding, $embedding) as similarity
      FROM knowledge_nodes
      WHERE embedding IS NOT NULL
      ORDER BY similarity DESC
      LIMIT ${limit};
    `, {
      embedding,
    });
    
    return result[0].result || [];
  } catch (error) {
    console.error('Error searching knowledge nodes:', error);
    throw error;
  }
}

/**
 * Get connected nodes
 * @param nodeId The node ID
 * @param edgeType Optional edge type filter
 * @param direction The direction ('outgoing', 'incoming', or 'both')
 * @returns The connected nodes with their connecting edges
 */
export async function getConnectedNodes(
  nodeId: string,
  edgeType?: EdgeType,
  direction: 'outgoing' | 'incoming' | 'both' = 'both'
): Promise<{ node: KnowledgeNode, edge: KnowledgeEdge }[]> {
  try {
    let query = '';
    
    if (direction === 'outgoing' || direction === 'both') {
      query += `
        SELECT target AS nodeId, id AS edgeId, type AS edgeType, 'outgoing' AS direction
        FROM knowledge_edges
        WHERE source = $nodeId
        ${edgeType ? 'AND type = $edgeType' : ''};
      `;
    }
    
    if (direction === 'incoming' || direction === 'both') {
      if (query) query += ' UNION ';
      query += `
        SELECT source AS nodeId, id AS edgeId, type AS edgeType, 'incoming' AS direction
        FROM knowledge_edges
        WHERE target = $nodeId
        ${edgeType ? 'AND type = $edgeType' : ''};
      `;
    }
    
    const connections = await surrealDB.query<any>(query, { 
      nodeId, 
      edgeType 
    });
    
    const result = [];
    
    for (const connection of connections[0].result || []) {
      const node = await getNodeById(connection.nodeId);
      const edge = await surrealDB.select<KnowledgeEdge>('knowledge_edges', connection.edgeId);
      
      if (node && edge.length > 0) {
        result.push({
          node,
          edge: edge[0],
        });
      }
    }
    
    return result;
  } catch (error) {
    console.error(`Error getting connected nodes for ${nodeId}:`, error);
    throw error;
  }
}

/**
 * Generate embedding for text
 * @param text The text to embed
 * @returns The embedding vector
 */
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    // Get LLM settings
    const llmSettings = await getLLMSettings();
    
    // Initialize LiteLLM with the API key
    const liteLLM = new LiteLLM({
      apiKey: llmSettings.apiKey,
      defaultModel: 'text-embedding-ada-002', // Use a default embedding model
    });
    
    // Generate embeddings
    const embeddingResponse = await liteLLM.embedding({
      model: 'text-embedding-ada-002',
      input: text,
    });
    
    if (!embeddingResponse.data || embeddingResponse.data.length === 0) {
      throw new Error('Failed to generate embeddings');
    }
    
    return embeddingResponse.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}
