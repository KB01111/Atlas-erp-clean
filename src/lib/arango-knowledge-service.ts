import arango, { aql } from './arango-client';
import { getLLMSettings } from './llm-settings';
import { LiteLLM } from './litellm';
import { v4 as uuidv4 } from 'uuid';
import { ElementType } from './unstructured-service';

/**
 * Knowledge node types
 */
export enum NodeType {
  CONCEPT = 'concept',
  ENTITY = 'entity',
  DOCUMENT = 'document',
  DOCUMENT_CHUNK = 'document_chunk',
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
  url?: string;
  fileId?: string;
  mimeType?: string;
  size?: number;
  parentId?: string;
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
  EXTRACTED_FROM = 'extracted_from',
  PART_OF = 'part_of',
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
    console.log('Initializing knowledge graph...');

    // Check if we're using mock services
    if (process.env.USE_MOCK_SERVICES === 'true') {
      console.log('Using mock ArangoDB service for knowledge graph (configured in .env)');
      return;
    }

    // Ensure collections exist
    await arango.ensureCollection('knowledge_nodes', 'document');
    await arango.ensureCollection('knowledge_edges', 'edge');

    // Ensure graph exists
    try {
      await arango.ensureGraph('knowledge_graph', [
        {
          collection: 'knowledge_edges',
          from: ['knowledge_nodes'],
          to: ['knowledge_nodes'],
        },
      ]);
    } catch (error) {
      console.error('Error ensuring graph:', error);
      // Continue anyway, as we can still use the collections
    }

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
    console.log('Will continue with limited functionality');
    // Don't throw the error, just log it and continue
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
 * @param options Optional configuration for embedding generation
 * @returns The embedding vector
 */
async function generateEmbedding(
  text: string,
  options: {
    model?: string;
    chunkSize?: number;
    truncate?: boolean;
  } = {}
): Promise<number[]> {
  try {
    // Get LLM settings
    const llmSettings = await getLLMSettings();

    // Initialize LiteLLM with the API key
    const liteLLM = new LiteLLM({
      apiKey: llmSettings.apiKey,
      defaultModel: options.model || 'text-embedding-ada-002', // Use a default embedding model
    });

    // Truncate or chunk text if needed
    let processedText = text;
    if (options.truncate && text.length > 8000) {
      // Truncate to 8000 characters if requested
      processedText = text.substring(0, 8000);
    } else if (options.chunkSize && text.length > options.chunkSize) {
      // For now, just truncate to the chunk size
      // In a more advanced implementation, we would split into chunks and process each
      processedText = text.substring(0, options.chunkSize);
    }

    // Generate embeddings
    const embeddingResponse = await liteLLM.embedding({
      model: options.model || 'text-embedding-ada-002',
      input: processedText,
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

/**
 * Get nodes with optional filtering
 * @param options Filter options
 * @returns The nodes
 */
export async function getNodes(options: {
  limit?: number;
  nodeType?: NodeType;
  query?: string;
} = {}): Promise<KnowledgeNode[]> {
  try {
    const { limit = 100, nodeType, query } = options;

    if (query) {
      // If query is provided, use search function
      return searchNodes(query, limit);
    }

    // Build the query
    let result;
    if (nodeType) {
      result = await arango.query(aql`
        FOR node IN knowledge_nodes
        FILTER node.type == ${nodeType}
        SORT node.createdAt DESC
        LIMIT ${limit}
        RETURN node
      `);
    } else {
      result = await arango.query(aql`
        FOR node IN knowledge_nodes
        SORT node.createdAt DESC
        LIMIT ${limit}
        RETURN node
      `);
    }

    return result;
  } catch (error) {
    console.error('Error getting knowledge nodes:', error);
    throw error;
  }
}

/**
 * Get edges between nodes
 * @param nodeIds The node IDs
 * @returns The edges
 */
export async function getEdgesBetweenNodes(nodeIds: string[]): Promise<KnowledgeEdge[]> {
  try {
    // Convert node IDs to full IDs if they don't already have the collection prefix
    const fullNodeIds = nodeIds.map(id =>
      id.includes('/') ? id : `knowledge_nodes/${id}`
    );

    const result = await arango.query(aql`
      FOR edge IN knowledge_edges
      FILTER edge._from IN ${fullNodeIds} AND edge._to IN ${fullNodeIds}
      RETURN edge
    `);

    return result;
  } catch (error) {
    console.error('Error getting edges between nodes:', error);
    throw error;
  }
}

/**
 * Save multiple nodes
 * @param nodes The nodes to save
 * @returns The saved nodes
 */
export async function saveNodes(nodes: KnowledgeNode[]): Promise<KnowledgeNode[]> {
  try {
    const savedNodes: KnowledgeNode[] = [];

    // Process nodes one by one to handle embeddings
    for (const node of nodes) {
      if (node._key) {
        // Update existing node
        const updatedNode = await updateNode(node._key, {
          type: node.type,
          name: node.name,
          content: node.content,
          metadata: node.metadata,
        });

        if (updatedNode) {
          savedNodes.push(updatedNode);
        }
      } else {
        // Create new node
        const newNode = await createNode(
          node.type,
          node.name,
          node.content,
          node.metadata
        );

        savedNodes.push(newNode);
      }
    }

    return savedNodes;
  } catch (error) {
    console.error('Error saving nodes:', error);
    throw error;
  }
}

/**
 * Save multiple edges
 * @param edges The edges to save
 * @returns The saved edges
 */
export async function saveEdges(edges: unknown[]): Promise<KnowledgeEdge[]> {
  try {
    const savedEdges: KnowledgeEdge[] = [];

    // Process edges
    for (const edge of edges) {
      // Extract source and target IDs
      let sourceKey = edge.source;
      let targetKey = edge.target;

      // If the IDs include the collection prefix, extract the key
      if (sourceKey.includes('/')) {
        sourceKey = sourceKey.split('/')[1];
      }

      if (targetKey.includes('/')) {
        targetKey = targetKey.split('/')[1];
      }

      // Determine edge type
      const edgeType = edge.type || EdgeType.RELATES_TO;

      // Create or update edge
      if (edge._key) {
        // Update existing edge (not implemented yet)
        // For now, we'll just skip existing edges
        continue;
      } else {
        // Create new edge
        const newEdge = await createEdge(
          edgeType,
          sourceKey,
          targetKey,
          edge.weight || 1.0,
          edge.metadata
        );

        savedEdges.push(newEdge);
      }
    }

    return savedEdges;
  } catch (error) {
    console.error('Error saving edges:', error);
    throw error;
  }
}

/**
 * Process a document and create knowledge nodes
 * @param documentContent The document content
 * @param documentName The document name
 * @param documentMetadata Optional document metadata
 * @param options Optional processing options
 * @returns The created document node and chunk nodes
 */
export async function processDocument(
  documentContent: string,
  documentName: string,
  documentMetadata: Record<string, any> = {},
  options: {
    chunkSize?: number;
    chunkOverlap?: number;
    maxChunks?: number;
    extractEntities?: boolean;
    extractConcepts?: boolean;
    structuredElements?: Array<{
      type: string;
      text: string;
      metadata?: Record<string, any>;
    }>;
  } = {}
): Promise<{
  documentNode: KnowledgeNode;
  chunkNodes: KnowledgeNode[];
  entityNodes?: KnowledgeNode[];
}> {
  try {
    // Set default options
    const chunkSize = options.chunkSize || 1000;
    const chunkOverlap = options.chunkOverlap || 200;
    const maxChunks = options.maxChunks || 20;

    // Create the document node
    const documentNode = await createNode(
      NodeType.DOCUMENT,
      documentName,
      documentContent.length > 1000 ? documentContent.substring(0, 1000) + '...' : documentContent,
      {
        ...documentMetadata,
        fullContent: false, // Indicate this doesn't contain the full content
        contentLength: documentContent.length,
      }
    );

    // If we have structured elements from unstructured.io, use them for better chunking
    let chunks: string[] = [];

    if (options.structuredElements && options.structuredElements.length > 0) {
      // Group elements by type for better organization
      const titles: string[] = [];
      const paragraphs: string[] = [];
      const lists: string[] = [];
      const tables: string[] = [];

      // Process each element based on its type
      options.structuredElements.forEach(element => {
        switch (element.type) {
          case ElementType.TITLE:
          case ElementType.HEADER:
            titles.push(element.text);
            break;
          case ElementType.NARRATIVE_TEXT:
            paragraphs.push(element.text);
            break;
          case ElementType.LIST:
          case ElementType.LIST_ITEM:
            lists.push(element.text);
            break;
          case ElementType.TABLE:
            tables.push(element.text);
            break;
          // Add other element types as needed
        }
      });

      // Create semantic chunks based on titles and their content
      if (titles.length > 0) {
        let currentChunk = '';
        let currentTitle = '';

        // Iterate through titles and create chunks
        for (let i = 0; i < titles.length; i++) {
          currentTitle = titles[i];
          currentChunk = currentTitle + '\n\n';

          // Find paragraphs, lists, and tables that belong to this section
          // In a real implementation, we would use metadata like page numbers
          // For now, we'll just use a simple heuristic

          // Add paragraphs until the next title
          const nextTitleIndex = (i < titles.length - 1) ?
            paragraphs.findIndex(p => p.includes(titles[i + 1])) :
            paragraphs.length;

          const sectionParagraphs = paragraphs.slice(0, nextTitleIndex !== -1 ? nextTitleIndex : paragraphs.length);
          currentChunk += sectionParagraphs.join('\n\n');

          // Remove used paragraphs
          paragraphs.splice(0, sectionParagraphs.length);

          // Add the chunk if it's not empty
          if (currentChunk.trim().length > 0) {
            chunks.push(currentChunk);
          }
        }

        // Add any remaining paragraphs, lists, and tables
        if (paragraphs.length > 0 || lists.length > 0 || tables.length > 0) {
          const remainingContent = [
            ...paragraphs,
            ...lists,
            ...tables
          ].join('\n\n');

          if (remainingContent.trim().length > 0) {
            chunks.push(remainingContent);
          }
        }
      } else {
        // If no titles, create chunks from paragraphs
        chunks = splitTextIntoChunks(
          [...paragraphs, ...lists, ...tables].join('\n\n'),
          chunkSize,
          chunkOverlap,
          maxChunks
        );
      }
    } else {
      // Fall back to standard text chunking
      chunks = splitTextIntoChunks(documentContent, chunkSize, chunkOverlap, maxChunks);
    }

    // Create nodes for each chunk
    const chunkNodes: KnowledgeNode[] = [];
    const entityNodes: KnowledgeNode[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];

      // Create a node for the chunk
      const chunkNode = await createNode(
        NodeType.DOCUMENT_CHUNK,
        `${documentName} - Chunk ${i + 1}`,
        chunk,
        {
          chunkIndex: i,
          documentId: documentNode._key,
          isChunk: true,
        }
      );

      // Create an edge from the document to the chunk
      await createEdge(
        EdgeType.CONTAINS,
        documentNode._key!,
        chunkNode._key!,
        1.0,
        { chunkIndex: i }
      );

      // Create an edge from the chunk to the document
      await createEdge(
        EdgeType.PART_OF,
        chunkNode._key!,
        documentNode._key!,
        1.0,
        { chunkIndex: i }
      );

      chunkNodes.push(chunkNode);
    }

    // Extract entities if requested and we have structured elements
    if (options.extractEntities && options.structuredElements) {
      // Find entities in the structured elements
      const entities = options.structuredElements
        .filter(element => element.type === ElementType.ENTITY)
        .map(entity => ({
          text: entity.text,
          category: entity.metadata?.category || 'Unknown',
          metadata: entity.metadata || {},
        }));

      // Create entity nodes
      for (const entity of entities) {
        // Check if entity already exists
        const existingEntities = await getNodes({
          nodeType: NodeType.ENTITY,
          query: entity.text,
          limit: 1,
        });

        let entityNode: KnowledgeNode;

        if (existingEntities.length > 0) {
          // Use existing entity
          entityNode = existingEntities[0];
        } else {
          // Create new entity
          entityNode = await createNode(
            NodeType.ENTITY,
            entity.text,
            entity.text,
            {
              category: entity.category,
              ...entity.metadata,
            }
          );
        }

        // Create edge from document to entity
        await createEdge(
          EdgeType.EXTRACTED_FROM,
          entityNode._key!,
          documentNode._key!
        );

        entityNodes.push(entityNode);
      }
    }

    return {
      documentNode,
      chunkNodes,
      entityNodes: entityNodes.length > 0 ? entityNodes : undefined,
    };
  } catch (error) {
    console.error('Error processing document:', error);
    throw error;
  }
}

/**
 * Split text into chunks with overlap
 * @param text The text to split
 * @param chunkSize The size of each chunk
 * @param overlap The overlap between chunks
 * @param maxChunks The maximum number of chunks to create
 * @returns The chunks
 */
function splitTextIntoChunks(
  text: string,
  chunkSize: number = 1000,
  overlap: number = 200,
  maxChunks: number = 20
): string[] {
  const chunks: string[] = [];

  // Simple chunking by character count
  let startIndex = 0;

  while (startIndex < text.length && chunks.length < maxChunks) {
    // Calculate end index
    let endIndex = startIndex + chunkSize;

    // Adjust end index to not cut words
    if (endIndex < text.length) {
      // Find the next space after the chunk size
      const nextSpace = text.indexOf(' ', endIndex);
      if (nextSpace !== -1 && nextSpace - endIndex < 100) {
        endIndex = nextSpace;
      }
    }

    // Extract the chunk
    const chunk = text.substring(startIndex, Math.min(endIndex, text.length));
    chunks.push(chunk);

    // Move to the next chunk with overlap
    startIndex = endIndex - overlap;

    // Ensure we don't get stuck
    if (startIndex <= 0 || startIndex >= text.length - 1) {
      break;
    }
  }

  return chunks;
}

/**
 * Search for documents by content similarity
 * @param query The search query
 * @param limit The maximum number of results
 * @returns The matching document nodes
 */
export async function searchDocuments(query: string, limit: number = 5): Promise<KnowledgeNode[]> {
  try {
    // Generate embedding for the query
    const embedding = await generateEmbedding(query);

    // Search for similar document chunks using vector similarity
    const result = await arango.query(aql`
      FOR node IN knowledge_nodes
      FILTER node.type == ${NodeType.DOCUMENT_CHUNK} OR node.type == ${NodeType.DOCUMENT}
      FILTER node.embedding != null
      SORT DISTANCE(node.embedding, ${embedding})
      LIMIT ${limit}
      RETURN node
    `);

    return result;
  } catch (error) {
    console.error('Error searching documents:', error);
    throw error;
  }
}

/**
 * Get document chunks for a document
 * @param documentKey The document key
 * @returns The document chunks
 */
export async function getDocumentChunks(documentKey: string): Promise<KnowledgeNode[]> {
  try {
    // Get chunks connected to the document
    const result = await arango.query(aql`
      FOR v, e IN 1..1 OUTBOUND ${"knowledge_nodes/" + documentKey} knowledge_edges
      FILTER e.type == ${EdgeType.CONTAINS}
      SORT e.metadata.chunkIndex ASC
      RETURN v
    `);

    return result;
  } catch (error) {
    console.error(`Error getting document chunks for ${documentKey}:`, error);
    throw error;
  }
}

// Export default object with all functions
const defaultExport = {
  initializeKnowledgeGraph,
  createNode,
  getNodeByKey,
  updateNode,
  deleteNode,
  createEdge,
  getKnowledgeEdges,
  getEdgesBetweenNodes,
  getNodes,
  searchNodes,
  saveNodes,
  saveEdges,
  processDocument,
  searchDocuments,
  getDocumentChunks,
};
export default defaultExport;;