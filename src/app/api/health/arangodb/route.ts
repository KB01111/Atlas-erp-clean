import { NextRequest, NextResponse } from 'next/server';
import * as arangoClient from '@/lib/arango-client';

/**
 * API route for checking ArangoDB health
 * Tests the connection to ArangoDB and returns the status
 */
export async function GET(request: NextRequest) {
  try {
    // Get the ArangoDB client
    const db = await arangoClient.getArangoDB();
    
    // Try to execute a simple query to test the connection
    const info = await db.version();
    
    // If we get here, the connection is working
    return NextResponse.json({
      status: 'connected',
      message: 'Successfully connected to ArangoDB',
      version: info.version,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error connecting to ArangoDB:', error);
    
    return NextResponse.json({
      status: 'error',
      message: 'Failed to connect to ArangoDB',
      error: (error as Error).message,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
