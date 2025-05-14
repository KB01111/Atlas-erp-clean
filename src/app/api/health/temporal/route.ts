import { NextRequest, NextResponse } from 'next/server';

/**
 * API route for checking Temporal health
 * Tests the connection to Temporal and returns the status
 */
export async function GET(request: NextRequest) {
  try {
    // Check if the Temporal address is configured
    const temporalAddress = process.env.TEMPORAL_ADDRESS;
    if (!temporalAddress) {
      return NextResponse.json({
        status: 'degraded',
        message: 'Temporal address is not configured',
        timestamp: new Date().toISOString(),
      }, { status: 200 });
    }

    // Perform a simple HTTP request to check if Temporal is running
    // This is a basic check that doesn't require the full SDK
    const [host, port] = temporalAddress.split(':');
    const url = `http://${host}:${port}/health`;

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      // Set a timeout to avoid hanging if the service is down
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) {
      throw new Error(`Temporal health check failed with status: ${response.status}`);
    }

    // If we get here, the connection is working
    return NextResponse.json({
      status: 'connected',
      message: 'Successfully connected to Temporal',
      address: temporalAddress,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error connecting to Temporal:', error);

    // Determine if it's a connection issue or another type of error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isConnectionError = errorMessage.toLowerCase().includes('connect') ||
                             errorMessage.toLowerCase().includes('network') ||
                             errorMessage.toLowerCase().includes('timeout') ||
                             errorMessage.toLowerCase().includes('abort');

    return NextResponse.json(
      {
        status: isConnectionError ? 'down' : 'degraded',
        message: `Failed to connect to Temporal: ${errorMessage}`,
        timestamp: new Date().toISOString(),
      },
      { status: isConnectionError ? 503 : 500 }
    );
  }
}
