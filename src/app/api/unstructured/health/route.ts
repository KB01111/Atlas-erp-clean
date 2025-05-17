import { NextRequest, NextResponse } from 'next/server';
import { isServiceAvailable } from '@/lib/unstructured-service';

/**
 * API route for checking unstructured.io health
 * Tests the connection to unstructured.io and returns the status
 */
export async function GET(request: NextRequest) {
  try {
    // Check if unstructured.io is available
    const startTime = Date.now();
    const available = await isServiceAvailable();
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json({
      status: available ? 'healthy' : 'unhealthy',
      message: available ? 'unstructured.io service is available' : 'unstructured.io service is not available',
      timestamp: new Date().toISOString(),
      responseTime,
    });
  } catch (error) {
    console.error('Error checking unstructured.io health:', error);
    return NextResponse.json({
      status: 'error',
      message: `Error checking unstructured.io health: ${(error as Error).message}`,
      timestamp: new Date().toISOString(),
      responseTime: 0,
    }, { status: 500 });
  }
}
