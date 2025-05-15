import { NextRequest, NextResponse } from 'next/server';
import nangoClient from '@/lib/nango-client';
import { mockNango } from '@/lib/mock-service-provider';

/**
 * API route for getting a specific Nango connection
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { connectionId: string } }
) {
  try {
    const { connectionId } = params;

    if (!connectionId) {
      return NextResponse.json(
        { error: 'Missing connection ID' },
        { status: 400 }
      );
    }

    // Get the provider_config_key from query parameters
    const searchParams = request.nextUrl.searchParams;
    const providerConfigKey = searchParams.get('provider_config_key');

    if (!providerConfigKey) {
      return NextResponse.json(
        { error: 'Missing provider_config_key parameter' },
        { status: 400 }
      );
    }

    // Check if Nango API is available
    const isNangoAvailable = await nangoClient.checkAvailability();

    if (isNangoAvailable) {
      // Call the real Nango API
      const connection = await nangoClient.getConnection(providerConfigKey, connectionId);

      if (connection) {
        return NextResponse.json({
          connection,
          useMockService: false
        });
      } else {
        return NextResponse.json(
          { error: `Connection ${connectionId} not found` },
          { status: 404 }
        );
      }
    } else {
      // Use mock service
      console.log('Nango API is not available, using mock service');
      const connection = await mockNango.getConnection(providerConfigKey, connectionId);

      if (connection) {
        return NextResponse.json({
          connection,
          useMockService: true
        });
      } else {
        return NextResponse.json(
          { error: `Connection ${connectionId} not found` },
          { status: 404 }
        );
      }
    }
  } catch (error) {
    console.error('Error getting connection:', error);
    return NextResponse.json(
      { error: 'Failed to get connection', details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * API route for deleting a Nango connection
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { connectionId: string } }
) {
  try {
    const { connectionId } = params;

    if (!connectionId) {
      return NextResponse.json(
        { error: 'Missing connection ID' },
        { status: 400 }
      );
    }

    // Get the provider_config_key from query parameters
    const searchParams = request.nextUrl.searchParams;
    const providerConfigKey = searchParams.get('provider_config_key');

    if (!providerConfigKey) {
      return NextResponse.json(
        { error: 'Missing provider_config_key parameter' },
        { status: 400 }
      );
    }

    // Check if Nango API is available
    const isNangoAvailable = await nangoClient.checkAvailability();

    if (isNangoAvailable) {
      // Call the real Nango API
      const success = await nangoClient.deleteConnection(providerConfigKey, connectionId);

      if (success) {
        return NextResponse.json({
          success: true,
          message: `Connection ${connectionId} deleted successfully`,
          useMockService: false
        });
      } else {
        return NextResponse.json(
          { error: `Connection ${connectionId} not found or could not be deleted` },
          { status: 404 }
        );
      }
    } else {
      // Use mock service
      console.log('Nango API is not available, using mock service');
      const success = await mockNango.deleteConnection(providerConfigKey, connectionId);

      if (success) {
        return NextResponse.json({
          success: true,
          message: `Connection ${connectionId} deleted successfully`,
          useMockService: true
        });
      } else {
        return NextResponse.json(
          { error: `Connection ${connectionId} not found or could not be deleted` },
          { status: 404 }
        );
      }
    }
  } catch (error) {
    console.error('Error deleting connection:', error);
    return NextResponse.json(
      { error: 'Failed to delete connection', details: (error as Error).message },
      { status: 500 }
    );
  }
}
