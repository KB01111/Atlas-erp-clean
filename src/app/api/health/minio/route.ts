import { NextRequest, NextResponse } from 'next/server';
import * as Minio from 'minio';

// MinIO client configuration
const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
});

// Default bucket name
const DEFAULT_BUCKET = process.env.MINIO_BUCKET || 'atlas-erp';

/**
 * API route for checking MinIO health
 * Tests the connection to MinIO and returns the status
 */
export async function GET(request: NextRequest) {
  try {
    // Check if the bucket exists
    const bucketExists = await minioClient.bucketExists(DEFAULT_BUCKET);
    
    if (!bucketExists) {
      return NextResponse.json({
        status: 'degraded',
        message: `MinIO is connected but the bucket '${DEFAULT_BUCKET}' does not exist`,
        timestamp: new Date().toISOString(),
      }, { status: 200 });
    }
    
    // If we get here, the connection is working and the bucket exists
    return NextResponse.json({
      status: 'connected',
      message: 'Successfully connected to MinIO',
      bucket: DEFAULT_BUCKET,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error connecting to MinIO:', error);
    
    // Determine if it's a connection issue or another type of error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isConnectionError = errorMessage.toLowerCase().includes('connect') || 
                             errorMessage.toLowerCase().includes('network') ||
                             errorMessage.toLowerCase().includes('timeout');
    
    return NextResponse.json(
      {
        status: isConnectionError ? 'down' : 'degraded',
        message: `Failed to connect to MinIO: ${errorMessage}`,
        timestamp: new Date().toISOString(),
      },
      { status: isConnectionError ? 503 : 500 }
    );
  }
}
