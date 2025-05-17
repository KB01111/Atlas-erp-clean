import { NextRequest, NextResponse } from 'next/server';
import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { initWebSocketServer } from '@/lib/websocket-server';

// Global variable to store the Socket.IO server instance
const io: SocketIOServer | null = null;

/**
 * API route for WebSocket connections
 * This route is used to establish WebSocket connections using Socket.IO
 */
export async function GET(request: NextRequest) {
  try {
    // Check if the request is a WebSocket upgrade request
    const upgrade = request.headers.get('upgrade');
    if (upgrade !== 'websocket') {
      return new NextResponse('Expected Upgrade: websocket', { status: 426 });
    }

    // Initialize the WebSocket server if it's not already initialized
    if (!io) {
      // Note: In Next.js App Router, we can't directly access the HTTP server
      // In a production environment, you should initialize the WebSocket server
      // in a custom server.js file

      // This approach won't work in App Router, so we'll return an informative message
      return new NextResponse(
        JSON.stringify({
          message: 'WebSocket server should be initialized in a custom server.js file',
          info: 'See server.js in the project root for the WebSocket implementation'
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      // Note: The code below is unreachable but kept for reference
      // io = initWebSocketServer(server);
    }

    // Return a response to acknowledge the WebSocket connection
    return new NextResponse('WebSocket connection established');
  } catch (error) {
    console.error('Error handling WebSocket connection:', error);
    return new NextResponse(
      JSON.stringify({
        error: 'Failed to establish WebSocket connection',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

/**
 * API route for sending WebSocket messages
 * This route is used to send messages to connected WebSocket clients
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();

    // Validate request body
    if (!body.event || !body.data) {
      return NextResponse.json(
        { error: 'Missing required fields: event, data' },
        { status: 400 }
      );
    }

    // Check if the WebSocket server is initialized
    if (!io) {
      return NextResponse.json(
        { error: 'WebSocket server not initialized' },
        { status: 500 }
      );
    }

    // Send the message to all connected clients
    io.emit(body.event, body.data);

    // If a room is specified, also send the message to that room
    if (body.room) {
      io.to(body.room).emit(body.event, body.data);
    }

    return NextResponse.json({
      success: true,
      message: 'Message sent successfully',
    });
  } catch (error) {
    console.error('Error sending WebSocket message:', error);
    return NextResponse.json(
      { error: 'Failed to send message', details: (error as Error).message },
      { status: 500 }
    );
  }
}
