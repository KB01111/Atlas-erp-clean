import { NextRequest, NextResponse } from 'next/server';
import * as surrealDB from '@/lib/surreal-client';
import { getFileUrl } from '@/lib/minio-client';

/**
 * API route for listing documents
 * Retrieves document metadata from SurrealDB and generates fresh URLs
 */
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Query to get documents with pagination
    const query = `
      SELECT * FROM documents
      ORDER BY uploadedAt DESC
      LIMIT $limit
      START $offset
    `;
    
    // Execute the query
    const result = await surrealDB.query<{ result: any[] }>(query, { limit, offset });
    
    if (!result || !result.result || !Array.isArray(result.result)) {
      return NextResponse.json({ documents: [] });
    }
    
    // Generate fresh URLs for each document
    const documents = await Promise.all(
      result.result.map(async (doc) => {
        // Generate a fresh URL that's valid for 24 hours
        const freshUrl = await getFileUrl(doc.objectName);
        return {
          ...doc,
          url: freshUrl,
        };
      })
    );
    
    return NextResponse.json({ documents });
  } catch (error) {
    console.error('Error listing documents:', error);
    return NextResponse.json(
      { error: 'Failed to list documents', details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * API route for deleting a document
 */
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }
    
    // Get the document to retrieve the objectName
    const document = await surrealDB.select('documents', id);
    
    if (!document || document.length === 0) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }
    
    // Delete from MinIO
    const { objectName } = document[0];
    if (objectName) {
      const minioClient = (await import('@/lib/minio-client')).default;
      await minioClient.deleteFile(objectName);
    }
    
    // Delete from SurrealDB
    await surrealDB.remove('documents', id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { error: 'Failed to delete document', details: (error as Error).message },
      { status: 500 }
    );
  }
}
