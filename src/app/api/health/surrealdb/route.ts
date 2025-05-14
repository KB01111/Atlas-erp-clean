import { NextRequest, NextResponse } from 'next/server';
import * as surrealDB from '@/lib/surreal-client';

/**
 * API route for checking SurrealDB health
 * Tests the connection to SurrealDB and returns the status
 */
export async function GET(request: NextRequest) {
  try {
    // Get the SurrealDB client
    const db = await surrealDB.getSurrealDB();
    
    // Try to execute a simple query to test the connection
    const result = await db.query('SELECT count() FROM information_schema.tables');
    
    // If we get here, the connection is working
    return NextResponse.json({
      status: 'connected',
      message: 'Successfully connected to SurrealDB',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error connecting to SurrealDB:', error);
    
    // Determine if it's a connection issue or another type of error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isConnectionError = errorMessage.toLowerCase().includes('connect') || 
                             errorMessage.toLowerCase().includes('network') ||
                             errorMessage.toLowerCase().includes('timeout');
    
    return NextResponse.json(
      {
        status: isConnectionError ? 'down' : 'degraded',
        message: `Failed to connect to SurrealDB: ${errorMessage}`,
        timestamp: new Date().toISOString(),
      },
      { status: isConnectionError ? 503 : 500 }
    );
  }
}
