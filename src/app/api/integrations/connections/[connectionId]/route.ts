import { NextRequest, NextResponse } from 'next/server';
import * as surrealDB from '@/lib/surreal-client';

/**
 * API route for deleting a Nango connection
 * In a real implementation, this would call the Nango API
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
    
    // In a real implementation, we would call the Nango API
    // For now, we'll delete from our local database
    const result = await surrealDB.query(`
      DELETE FROM connections 
      WHERE connection_id = $connectionId;
    `, {
      connectionId,
    });
    
    return NextResponse.json({
      success: true,
      message: `Connection ${connectionId} deleted successfully`,
    });
  } catch (error) {
    console.error('Error deleting connection:', error);
    return NextResponse.json(
      { error: 'Failed to delete connection', details: (error as Error).message },
      { status: 500 }
    );
  }
}
