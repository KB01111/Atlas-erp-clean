import { NextRequest, NextResponse } from 'next/server';
import * as surrealDB from '@/lib/surreal-client';
import { getMockServiceStatus } from '@/lib/mock-service-provider';
import { sendStatusUpdate } from '@/lib/websocket-server';

/**
 * API route for checking SurrealDB health
 * Tests the connection to SurrealDB and returns the status
 */
export async function GET(request: NextRequest) {
  try {
    // Get the SurrealDB client
    const db = await surrealDB.getSurrealDB();

    // Try to execute a simple query to test the connection
    const result = await surrealDB.query('SELECT count() FROM information_schema.tables');

    // If we get here, the connection is working
    const statusData = {
      status: 'operational',
      message: 'Successfully connected to SurrealDB',
      timestamp: new Date().toISOString(),
      responseTime: 10, // Mock response time
    };

    // Send status update via WebSocket
    sendStatusUpdate({
      service: 'SurrealDB',
      status: 'operational',
      message: statusData.message,
      timestamp: statusData.timestamp,
      responseTime: statusData.responseTime,
    });

    return NextResponse.json({
      status: 'connected',
      ...statusData
    });
  } catch (error) {
    console.error('Error connecting to SurrealDB:', error);

    // Use mock service status when real service is not available
    const mockStatus = getMockServiceStatus().surrealdb;
    const timestamp = new Date().toISOString();

    // Send status update via WebSocket
    sendStatusUpdate({
      service: 'SurrealDB',
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
