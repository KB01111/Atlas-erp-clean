import { NextRequest, NextResponse } from 'next/server';
import { 
  updateServiceConfig, 
  getServiceConfig, 
  isServiceAvailable 
} from '@/lib/unstructured-service';

/**
 * API route for getting unstructured.io configuration
 */
export async function GET() {
  try {
    // Get current configuration
    const config = getServiceConfig();
    
    // Check if service is available
    const available = await isServiceAvailable();
    
    return NextResponse.json({
      config,
      available,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error getting unstructured.io configuration:', error);
    return NextResponse.json(
      { error: 'Failed to get unstructured.io configuration', details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * API route for updating unstructured.io configuration
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    
    // Validate request body
    if (!body.config) {
      return NextResponse.json(
        { error: 'Missing required field: config' },
        { status: 400 }
      );
    }
    
    // Update configuration
    updateServiceConfig(body.config);
    
    // Check if service is available with new configuration
    const available = await isServiceAvailable();
    
    return NextResponse.json({
      success: true,
      config: getServiceConfig(),
      available,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating unstructured.io configuration:', error);
    return NextResponse.json(
      { error: 'Failed to update unstructured.io configuration', details: (error as Error).message },
      { status: 500 }
    );
  }
}
