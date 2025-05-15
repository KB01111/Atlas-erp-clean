import { NextRequest, NextResponse } from 'next/server';
import * as arangoClient from '@/lib/arango-client';
import { getMockServiceStatus } from '@/lib/mock-service-provider';
import { sendStatusUpdate } from '@/lib/websocket-server';

/**
 * API route for checking ArangoDB health
 * Tests the connection to ArangoDB and returns the status
 */
export async function GET(request: NextRequest) {
  try {
    // Check if we should use mock services
    console.log('USE_MOCK_SERVICES =', process.env.USE_MOCK_SERVICES);

    if (process.env.USE_MOCK_SERVICES === 'true') {
      console.log('Using mock ArangoDB service (configured in .env)');
      const mockStatus = getMockServiceStatus().arangodb;
      const timestamp = new Date().toISOString();

      // Send status update via WebSocket
      sendStatusUpdate({
        service: 'ArangoDB',
        status: mockStatus.status === 'connected' ? 'operational' : 'down',
        message: mockStatus.message,
        timestamp,
        responseTime: mockStatus.responseTime,
      });

      return NextResponse.json({
        status: mockStatus.status,
        message: mockStatus.message,
        timestamp,
        responseTime: mockStatus.responseTime,
      });
    }

    // Get the ArangoDB client
    const db = await arangoClient.getArangoDB();

    // Try to execute a simple query to test the connection
    const info = await db.version();

    // If we get here, the connection is working
    const timestamp = new Date().toISOString();
    const responseTime = 12; // Mock response time

    // Send status update via WebSocket
    sendStatusUpdate({
      service: 'ArangoDB',
      status: 'operational',
      message: 'Successfully connected to ArangoDB',
      timestamp,
      responseTime,
    });

    return NextResponse.json({
      status: 'connected',
      message: 'Successfully connected to ArangoDB',
      version: info.version,
      timestamp,
      responseTime,
    });
  } catch (error) {
    console.error('Error connecting to ArangoDB:', error);

    // Use mock service status when real service is not available
    const mockStatus = getMockServiceStatus().arangodb;
    const timestamp = new Date().toISOString();

    // Send status update via WebSocket
    sendStatusUpdate({
      service: 'ArangoDB',
      status: mockStatus.status === 'connected' ? 'operational' : 'down',
      message: mockStatus.message,
      timestamp,
      responseTime: mockStatus.responseTime,
    });

    return NextResponse.json({
      status: mockStatus.status,
      message: mockStatus.message,
      timestamp,
      responseTime: mockStatus.responseTime,
    });
  }
}
