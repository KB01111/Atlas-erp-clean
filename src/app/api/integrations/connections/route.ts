import { NextRequest, NextResponse } from 'next/server';
import nangoClient from '@/lib/nango-client';
import { mockNango } from '@/lib/mock-service-provider';

/**
 * API route for fetching all Nango connections
 */
export async function GET(_request: NextRequest) {
  try {
    // Check if Nango API is available
    const isNangoAvailable = await nangoClient.checkAvailability();

    if (isNangoAvailable) {
      // Call the real Nango API
      const connectionsResponse = await nangoClient.listConnections();

      return NextResponse.json({
        connections: connectionsResponse.connections || [],
        useMockService: false
      });
    } else {
      // Use mock service
      console.log('Nango API is not available, using mock service');
      const mockConnections = await mockNango.listConnections();

      return NextResponse.json({
        connections: mockConnections.connections || [],
        useMockService: true
      });
    }
  } catch (error) {
    console.error('Error fetching connections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch connections', details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * API route for creating a new Nango connection
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    if (!body.provider_name || !body.connection_id) {
      return NextResponse.json(
        { error: 'Missing required fields: provider_name, connection_id' },
        { status: 400 }
      );
    }

    // Check if Nango API is available
    const isNangoAvailable = await nangoClient.checkAvailability();

    if (isNangoAvailable) {
      // Call the real Nango API
      const connectionData = {
        connection_id: body.connection_id,
        provider_config_key: body.connection_config_id || body.provider_name,
        metadata: body.metadata || {},
        // Add other fields as needed for the specific authentication type
        access_token: body.access_token,
        refresh_token: body.refresh_token,
        expires_at: body.expires_at,
        api_key: body.api_key,
        username: body.username,
        password: body.password
      };

      const connection = await nangoClient.createConnection(connectionData);

      return NextResponse.json({
        connection,
        useMockService: false
      });
    } else {
      // Use mock service
      console.log('Nango API is not available, using mock service');
      const connectionData = {
        connection_id: body.connection_id,
        provider_config_key: body.connection_config_id || body.provider_name,
        metadata: body.metadata || {},
        access_token: body.access_token,
        refresh_token: body.refresh_token,
        expires_at: body.expires_at
      };

      const connection = await mockNango.createConnection(connectionData);

      return NextResponse.json({
        connection,
        useMockService: true
      });
    }
  } catch (error) {
    console.error('Error creating connection:', error);
    return NextResponse.json(
      { error: 'Failed to create connection', details: (error as Error).message },
      { status: 500 }
    );
  }
}
