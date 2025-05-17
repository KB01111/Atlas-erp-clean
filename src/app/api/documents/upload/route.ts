import { NextRequest, NextResponse } from 'next/server';
import { uploadFile } from '@/lib/minio-client';
import * as surrealDB from '@/lib/surreal-client';
import { createVectorEmbedding } from '@/lib/vector-service';
import { processDocument } from '@/lib/document-processor';
import { isServiceAvailable as isUnstructuredAvailable } from '@/lib/unstructured-service';
import * as arangoKnowledgeService from '@/lib/arango-knowledge-service';

/**
 * API route for uploading documents
 * Handles multipart/form-data uploads and stores file metadata in SurrealDB
 * Optionally creates vector embeddings for AI search
 */
export async function POST(request: NextRequest) {
  try {
    // Check if the request is multipart/form-data
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Content type must be multipart/form-data' },
        { status: 400 }
      );
    }

    // Parse the form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Get file details
    const fileName = file.name;
    const fileType = file.type;
    const fileSize = file.size;

    // Get optional category
    const category = formData.get('category') as string || categorizeByFileType(fileName);

    // Check if we should create vector embeddings
    const vectorize = formData.get('vectorize') === 'true';

    // Check if we should use unstructured.io
    const useUnstructured = formData.get('useUnstructured') !== 'false';

    // Check if we should extract entities
    const extractEntities = formData.get('extractEntities') === 'true';

    // Check if we should add to knowledge graph
    const addToKnowledgeGraph = formData.get('addToKnowledgeGraph') === 'true';

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB in bytes
    if (fileSize > maxSize) {
      return NextResponse.json(
        { error: `File size exceeds the maximum limit of 50MB` },
        { status: 400 }
      );
    }

    // Convert File to Buffer for MinIO
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload file to MinIO
    const uploadResult = await uploadFile(buffer, fileName, fileType);

    // Generate a unique document ID
    const documentId = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    // Prepare document record
    const documentData: unknown = {
      name: fileName,
      type: fileType,
      size: fileSize,
      category,
      objectName: uploadResult.objectName,
      url: uploadResult.url,
      uploadedAt: new Date().toISOString(),
      vectorEmbedding: false,
      processed: false,
      knowledgeGraph: false,
    };

    // Process document with unstructured.io if available and requested
    let processedDocument = null;
    let knowledgeNode = null;
    let structuredElements = null;

    if (useUnstructured) {
      try {
        // Check if unstructured.io is available
        const unstructuredAvailable = await isUnstructuredAvailable();

        if (unstructuredAvailable) {
          // Process the document
          processedDocument = await processDocument(documentId, file, {
            useUnstructured: true,
            extractEntities: extractEntities,
            extractTables: true,
            chunkingStrategy: 'by_title',
          });

          // Update document data
          documentData.processed = true;
          documentData.processedAt = new Date().toISOString();
          documentData.textContent = processedDocument.text.substring(0, 1000) + '...'; // Store a preview
          documentData.pageCount = processedDocument.pages?.length || 1;

          // Store structured elements for knowledge graph
          if (processedDocument.elements) {
            structuredElements = processedDocument.elements;
          }
        }
      } catch (processError) {
        console.error('Error processing document with unstructured.io:', processError);
        // Continue without processing - we'll still upload the file
      }
    }

    // Add to knowledge graph if requested
    if (addToKnowledgeGraph && processedDocument && processedDocument.text) {
      try {
        // Initialize knowledge graph
        await arangoKnowledgeService.initializeKnowledgeGraph();

        // Process document with knowledge graph
        const result = await arangoKnowledgeService.processDocument(
          processedDocument.text,
          fileName,
          {
            fileType,
            fileSize,
            url: uploadResult.url,
            objectName: uploadResult.objectName,
            category,
          },
          {
            chunkSize: 1000,
            chunkOverlap: 200,
            maxChunks: 20,
            extractEntities: extractEntities,
            structuredElements: structuredElements,
          }
        );

        // Update document data
        documentData.knowledgeGraph = true;
        documentData.knowledgeGraphNodeId = result.documentNode._key;
        documentData.knowledgeGraphChunks = result.chunkNodes.length;

        // Store knowledge node
        knowledgeNode = result.documentNode;
      } catch (knowledgeError) {
        console.error('Error adding document to knowledge graph:', knowledgeError);
        // Continue without knowledge graph - we'll still upload the file
      }
    }

    // Create vector embeddings for supported file types if requested
    if (vectorize && isEmbeddingSupported(fileType, fileName)) {
      try {
        // Create vector embedding
        const embeddingResult = await createVectorEmbedding(buffer, fileName, fileType);

        if (embeddingResult && embeddingResult.id) {
          // Update document data with embedding information
          documentData.vectorEmbedding = true;
          documentData.embeddingId = embeddingResult.id;
        }
      } catch (embeddingError) {
        console.error('Error creating vector embedding:', embeddingError);
        // Continue without embedding - we'll still upload the file
      }
    }

    // Store file metadata in SurrealDB
    const documentRecord = await surrealDB.create('documents', documentData);

    return NextResponse.json({
      success: true,
      document: documentRecord,
      vectorized: documentData.vectorEmbedding,
      processed: documentData.processed,
      knowledgeGraph: documentData.knowledgeGraph,
      knowledgeNode: knowledgeNode ? {
        id: knowledgeNode._key,
        type: knowledgeNode.type,
        name: knowledgeNode.name,
      } : null,
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json(
      { error: 'Failed to upload document', details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * Helper function to categorize documents by file type
 */
function categorizeByFileType(fileName: string): string {
  const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';

  const typeMap: Record<string, string> = {
    'pdf': 'Documents',
    'doc': 'Documents',
    'docx': 'Documents',
    'xls': 'Financial',
    'xlsx': 'Financial',
    'csv': 'Financial',
    'jpg': 'Media',
    'jpeg': 'Media',
    'png': 'Media',
    'gif': 'Media',
    'mp4': 'Media',
    'zip': 'Archives',
    'rar': 'Archives',
  };

  return typeMap[fileExtension] || 'Other';
}

/**
 * Check if file type is supported for vector embeddings
 */
function isEmbeddingSupported(fileType: string, fileName: string): boolean {
  const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';

  // Supported MIME types for embeddings
  const supportedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'application/json',
    'text/markdown',
    'text/html',
    'message/rfc822',
  ];

  // Supported file extensions
  const supportedExtensions = [
    'pdf', 'doc', 'docx', 'txt', 'csv', 'json', 'md', 'markdown',
    'xls', 'xlsx', 'ppt', 'pptx', 'html', 'htm', 'eml', 'msg'
  ];

  return supportedMimeTypes.includes(fileType) || supportedExtensions.includes(fileExtension);
}
