import { NextRequest, NextResponse } from 'next/server';
import { sendMetricsUpdate } from '@/lib/websocket-server';

/**
 * API route for sending metrics updates
 * This route is used to send metrics updates to connected WebSocket clients
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();

    // Validate request body
    if (!body.id || !body.name || body.value === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: id, name, value' },
        { status: 400 }
      );
    }

    // Create a metrics update
    const update = {
      id: body.id,
      name: body.name,
      value: body.value,
      previousValue: body.previousValue || 0,
      change: body.change || 0,
      trend: body.trend || 'stable',
      timestamp: new Date().toISOString(),
    };

    // Send the metrics update via WebSocket
    sendMetricsUpdate(update);

    return NextResponse.json({
      success: true,
      message: 'Metrics update sent successfully',
    });
  } catch (error) {
    console.error('Error sending metrics update:', error);
    return NextResponse.json(
      { error: 'Failed to send metrics update', details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * API route for getting metrics
 * This route is used to get metrics data
 */
export async function GET(request: NextRequest) {
  try {
    // Generate random metrics data
    const metrics = [
      {
        id: 'cpu',
        name: 'CPU Usage',
        value: Math.floor(Math.random() * 80) + 10,
        previousValue: 0,
        unit: '%',
        trend: 'stable',
        timestamp: new Date().toISOString(),
      },
      {
        id: 'memory',
        name: 'Memory Usage',
        value: Math.floor(Math.random() * 80) + 10,
        previousValue: 0,
        unit: '%',
        trend: 'stable',
        timestamp: new Date().toISOString(),
      },
      {
        id: 'storage',
        name: 'Storage Usage',
        value: Math.floor(Math.random() * 80) + 10,
        previousValue: 0,
        unit: '%',
        trend: 'stable',
        timestamp: new Date().toISOString(),
      },
      {
        id: 'documents',
        name: 'Documents',
        value: Math.floor(Math.random() * 400) + 100,
        previousValue: 0,
        unit: '',
        trend: 'stable',
        timestamp: new Date().toISOString(),
      },
      {
        id: 'users',
        name: 'Active Users',
        value: Math.floor(Math.random() * 19) + 1,
        previousValue: 0,
        unit: '',
        trend: 'stable',
        timestamp: new Date().toISOString(),
      },
      {
        id: 'agents',
        name: 'Agent Executions',
        value: Math.floor(Math.random() * 50),
        previousValue: 0,
        unit: '',
        trend: 'stable',
        timestamp: new Date().toISOString(),
      },
      {
        id: 'workflows',
        name: 'Workflow Runs',
        value: Math.floor(Math.random() * 30),
        previousValue: 0,
        unit: '',
        trend: 'stable',
        timestamp: new Date().toISOString(),
      },
    ];

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Error getting metrics:', error);
    return NextResponse.json(
      { error: 'Failed to get metrics', details: (error as Error).message },
      { status: 500 }
    );
  }
}
