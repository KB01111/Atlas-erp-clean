import * as surrealDB from './surreal-client';
import { getLLMSettings } from './llm-settings';
import litellm from 'litellm';

/**
 * Interface for vector embedding results
 */
interface EmbeddingResult {
  id: string;
  text: string;
  embedding: number[];
}

/**
 * Creates a vector embedding for a document
 * @param buffer The document buffer
 * @param fileName The document file name
 * @param fileType The document MIME type
 * @returns The embedding result
 */
export async function createVectorEmbedding(
  buffer: Buffer,
  fileName: string,
  fileType: string
): Promise<EmbeddingResult | null> {
  try {
    // Extract text from the document
    const text = await extractTextFromDocument(buffer, fileName, fileType);

    if (!text || text.trim().length === 0) {
      console.warn(`No text extracted from document: ${fileName}`);
      return null;
    }

    // Get LLM settings
    const llmSettings = await getLLMSettings();

    // Set the API key for LiteLLM
    litellm.apiKey = llmSettings.apiKey;
    const embeddingModel = 'text-embedding-ada-002'; // Use a default embedding model

    // Generate embeddings
    const embeddingResponse = await litellm.embedding({
      model: embeddingModel,
      input: text,
    });

    if (!embeddingResponse.data || embeddingResponse.data.length === 0) {
      throw new Error('Failed to generate embeddings');
    }

    // Store the embedding in SurrealDB
    const embedding = embeddingResponse.data[0].embedding;

    // Create embedding record
    const embeddingRecord = await surrealDB.create('embeddings', {
      text,
      embedding,
      fileName,
      fileType,
      createdAt: new Date().toISOString(),
    });

    return {
      id: embeddingRecord.id,
      text,
      embedding,
    };
  } catch (error) {
    console.error('Error creating vector embedding:', error);
    throw error;
  }
}

/**
 * Searches for documents using vector similarity
 * @param query The search query
 * @param limit The maximum number of results to return
 * @returns The search results
 */
export async function searchDocumentsByVector(
  query: string,
  limit: number = 5
): Promise<any[]> {
  try {
    // Get LLM settings
    const llmSettings = await getLLMSettings();

    // Set the API key for LiteLLM
    litellm.apiKey = llmSettings.apiKey;
    const embeddingModel = 'text-embedding-ada-002'; // Use a default embedding model

    // Generate embeddings for the query
    const embeddingResponse = await litellm.embedding({
      model: embeddingModel,
      input: query,
    });

    if (!embeddingResponse.data || embeddingResponse.data.length === 0) {
      throw new Error('Failed to generate embeddings for query');
    }

    const queryEmbedding = embeddingResponse.data[0].embedding;

    // Search for similar documents using vector similarity in SurrealDB
    const results = await surrealDB.query(`
      SELECT
        documents.id,
        documents.name,
        documents.category,
        documents.url,
        documents.objectName,
        documents.size,
        documents.uploadedAt,
        documents.vectorEmbedding,
        vector::similarity(embedding, $embedding) as similarity
      FROM documents
      INNER JOIN embeddings ON documents.embeddingId = embeddings.id
      WHERE documents.vectorEmbedding = true
      ORDER BY similarity DESC
      LIMIT ${limit};
    `, {
      embedding: queryEmbedding,
    });

    return results[0].result || [];
  } catch (error) {
    console.error('Error searching documents by vector:', error);
    throw error;
  }
}

/**
 * Extracts text from a document
 * @param buffer The document buffer
 * @param fileName The document file name
 * @param fileType The document MIME type
 * @returns The extracted text
 */
async function extractTextFromDocument(
  buffer: Buffer,
  fileName: string,
  fileType: string
): Promise<string> {
  // In a real implementation, we would use libraries like pdf-parse, mammoth, etc.
  // For now, we'll just return a placeholder text
  return `This is the extracted text from ${fileName}. In a real implementation, we would use libraries like pdf-parse for PDFs, mammoth for Word documents, etc.`;
}
