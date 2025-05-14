import arango, { aql } from './arango-client';
import { getLLMSettings } from './llm-settings';
import { LiteLLM } from './litellm';
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
  _key?: string;
  _id?: string;
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
  _key?: string;
  _id?: string;
  _from: string;
  _to: string;
  type: EdgeType;
  weight?: number;
  metadata?: Record<string, any>;
  createdAt: string;
}

/**
 * Initialize the knowledge graph collections and indexes
 */
export async function initializeKnowledgeGraph() {
  try {
    // Ensure collections exist
    await arango.ensureCollection('knowledge_nodes', 'document');
    await arango.ensureCollection('knowledge_edges', 'edge');

    // Ensure graph exists
    await arango.ensureGraph('knowledge_graph', [
      {
        collection: 'knowledge_edges',
        from: ['knowledge_nodes'],
        to: ['knowledge_nodes'],
      },
    ]);

    // Create a database instance
    const db = await arango.getArangoDB();

    // Create vector index for embeddings if it doesn't exist
    const nodesCollection = db.collection('knowledge_nodes');

    // Check if the index exists
    const indexes = await nodesCollection.indexes();
    const hasVectorIndex = indexes.some(index =>
      index.type === 'inverted' &&
      index.fields &&
      index.fields.includes('embedding')
    );

    if (!hasVectorIndex) {
      console.log('Creating vector index for embeddings...');
      await nodesCollection.ensureIndex({
        type: 'inverted',
        fields: ['embedding'],
        name: 'embedding_vector_index',
      });
    }

    console.log('Knowledge graph initialized successfully');
  } catch (error) {
    console.error('Error initializing knowledge graph:', error);
    throw error;
  }
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
      type,
      name,
      content,
      metadata,
      embedding,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Store in ArangoDB
    const result = await arango.query(aql`
      INSERT ${node} INTO knowledge_nodes
      RETURN NEW
    `);

    return result[0];
  } catch (error) {
    console.error('Error creating knowledge node:', error);
    throw error;
  }
}

/**
 * Create a knowledge edge
 * @param type The edge type
 * @param sourceKey The source node key
 * @param targetKey The target node key
 * @param weight Optional edge weight
 * @param metadata Optional metadata
 * @returns The created edge
 */
export async function createEdge(
  type: EdgeType,
  sourceKey: string,
  targetKey: string,
  weight: number = 1.0,
  metadata?: Record<string, any>
): Promise<KnowledgeEdge> {
  try {
    // Create the edge
    const edge: KnowledgeEdge = {
      _from: `knowledge_nodes/${sourceKey}`,
      _to: `knowledge_nodes/${targetKey}`,
      type,
      weight,
      metadata,
      createdAt: new Date().toISOString(),
    };

    // Store in ArangoDB
    const result = await arango.query(aql`
      INSERT ${edge} INTO knowledge_edges
      RETURN NEW
    `);

    return result[0];
  } catch (error) {
    console.error('Error creating knowledge edge:', error);
    throw error;
  }
}

/**
 * Get a knowledge node by key
 * @param key The node key
 * @returns The node or null if not found
 */
export async function getNodeByKey(key: string): Promise<KnowledgeNode | null> {
  try {
    const result = await arango.query(aql`
      FOR node IN knowledge_nodes
      FILTER node._key == ${key}
      RETURN node
    `);

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error(`Error getting knowledge node ${key}:`, error);
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
    const result = await arango.query(aql`
      FOR node IN knowledge_nodes
      FILTER node.type == ${type}
      SORT node.createdAt DESC
      RETURN node
    `);

    return result;
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

    // First try to search using vector similarity if available
    try {
      const result = await arango.query(aql`
        FOR node IN knowledge_nodes
        FILTER node.embedding != null
        SORT DISTANCE(node.embedding, ${embedding})
        LIMIT ${limit}
        RETURN node
      `);

      if (result.length > 0) {
        return result;
      }
    } catch (e) {
      console.warn('Vector search failed, falling back to text search:', e);
    }

    // Fall back to text search
    const result = await arango.query(aql`
      FOR node IN knowledge_nodes
      FILTER CONTAINS(LOWER(node.content), LOWER(${query}))
         OR CONTAINS(LOWER(node.name), LOWER(${query}))
      SORT node.createdAt DESC
      LIMIT ${limit}
      RETURN node
    `);

    return result;
  } catch (error) {
    console.error('Error searching knowledge nodes:', error);
    throw error;
  }
}

/**
 * Get connected nodes
 * @param nodeKey The node key
 * @param edgeType Optional edge type filter
 * @param direction The direction ('outgoing', 'incoming', or 'both')
 * @returns The connected nodes with their connecting edges
 */
export async function getConnectedNodes(
  nodeKey: string,
  edgeType?: EdgeType,
  direction: 'outgoing' | 'incoming' | 'both' = 'both'
): Promise<{ node: KnowledgeNode, edge: KnowledgeEdge }[]> {
  try {
    const nodeId = `knowledge_nodes/${nodeKey}`;
    let result = [];

    if (direction === 'outgoing' || direction === 'both') {
      const outgoing = await arango.query(aql`
        FOR edge IN knowledge_edges
        FILTER edge._from == ${nodeId}
        ${edgeType ? aql`FILTER edge.type == ${edgeType}` : aql``}
        FOR target IN knowledge_nodes
        FILTER edge._to == target._id
        RETURN { node: target, edge: edge }
      `);

      result = [...result, ...outgoing];
    }

    if (direction === 'incoming' || direction === 'both') {
      const incoming = await arango.query(aql`
        FOR edge IN knowledge_edges
        FILTER edge._to == ${nodeId}
        ${edgeType ? aql`FILTER edge.type == ${edgeType}` : aql``}
        FOR source IN knowledge_nodes
        FILTER edge._from == source._id
        RETURN { node: source, edge: edge }
      `);

      result = [...result, ...incoming];
    }

    return result;
  } catch (error) {
    console.error(`Error getting connected nodes for ${nodeKey}:`, error);
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

/**
 * Get all knowledge edges
 * @param edgeType Optional edge type filter
 * @returns The edges
 */
export async function getKnowledgeEdges(edgeType?: EdgeType): Promise<KnowledgeEdge[]> {
  try {
    const result = await arango.query(aql`
      FOR edge IN knowledge_edges
      ${edgeType ? aql`FILTER edge.type == ${edgeType}` : aql``}
      SORT edge.createdAt DESC
      RETURN edge
    `);

    return result;
  } catch (error) {
    console.error('Error getting knowledge edges:', error);
    throw error;
  }
}

/**
 * Delete a knowledge node and all its connected edges
 * @param key The node key
 * @returns True if the node was deleted, false otherwise
 */
export async function deleteNode(key: string): Promise<boolean> {
  try {
    const nodeId = `knowledge_nodes/${key}`;

    // First, delete all edges connected to this node
    await arango.query(aql`
      FOR edge IN knowledge_edges
      FILTER edge._from == ${nodeId} OR edge._to == ${nodeId}
      REMOVE edge IN knowledge_edges
    `);

    // Then delete the node itself
    const result = await arango.query(aql`
      REMOVE { _key: ${key} } IN knowledge_nodes
      RETURN OLD
    `);

    return result.length > 0;
  } catch (error) {
    console.error(`Error deleting knowledge node ${key}:`, error);
    throw error;
  }
}

/**
 * Update a knowledge node
 * @param key The node key
 * @param updates The updates to apply
 * @returns The updated node
 */
export async function updateNode(
  key: string,
  updates: Partial<Omit<KnowledgeNode, '_key' | '_id' | 'createdAt'>>
): Promise<KnowledgeNode | null> {
  try {
    // If content is updated, regenerate the embedding
    if (updates.content) {
      updates.embedding = await generateEmbedding(updates.content);
    }

    // Add updated timestamp
    const updatedNode = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // Update in ArangoDB
    const result = await arango.query(aql`
      UPDATE { _key: ${key} }
      WITH ${updatedNode}
      IN knowledge_nodes
      RETURN NEW
    `);

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error(`Error updating knowledge node ${key}:`, error);
    throw error;
  }
}
