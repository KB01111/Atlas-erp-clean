import { NextRequest, NextResponse } from 'next/server';
import * as surrealDB from '@/lib/surreal-client';

/**
 * API route for fetching all Nango connections
 * In a real implementation, this would call the Nango API
 */
export async function GET(request: NextRequest) {
  try {
    // In a real implementation, we would call the Nango API
    // For now, we'll fetch from our local database
    const connections = await surrealDB.query(`
      SELECT * FROM connections
      ORDER BY created_at DESC;
    `);
    
    return NextResponse.json({
      connections: connections[0].result || [],
    });
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
 * In a real implementation, this would call the Nango API
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
    
    // In a real implementation, we would call the Nango API
    // For now, we'll store in our local database
    const connection = await surrealDB.create('connections', {
      provider_name: body.provider_name,
      connection_id: body.connection_id,
      connection_config_id: body.connection_config_id || body.provider_name,
      status: 'active',
      created_at: new Date().toISOString(),
    });
    
    return NextResponse.json({
      connection,
    });
  } catch (error) {
    console.error('Error creating connection:', error);
    return NextResponse.json(
      { error: 'Failed to create connection', details: (error as Error).message },
      { status: 500 }
    );
  }
}
