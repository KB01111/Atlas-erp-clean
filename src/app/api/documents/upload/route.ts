import { NextRequest, NextResponse } from 'next/server';
import { uploadFile } from '@/lib/minio-client';
import * as surrealDB from '@/lib/surreal-client';
import { createVectorEmbedding } from '@/lib/vector-service';

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

    // Prepare document record
    const documentData: any = {
      name: fileName,
      type: fileType,
      size: fileSize,
      category,
      objectName: uploadResult.objectName,
      url: uploadResult.url,
      uploadedAt: new Date().toISOString(),
      vectorEmbedding: false,
    };

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
    'text/plain',
    'text/csv',
    'application/json',
    'text/markdown',
  ];

  // Supported file extensions
  const supportedExtensions = [
    'pdf', 'doc', 'docx', 'txt', 'csv', 'json', 'md', 'markdown'
  ];

  return supportedMimeTypes.includes(fileType) || supportedExtensions.includes(fileExtension);
}
