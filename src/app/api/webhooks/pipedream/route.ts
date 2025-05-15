import { NextRequest, NextResponse } from "next/server";
import { getSurrealDB } from "@/lib/surreal-client";
import { sendWebSocketMessage } from "@/lib/websocket-server";

/**
 * POST /api/webhooks/pipedream
 * 
 * Receives webhook events from Pipedream workflows
 */
export async function POST(req: NextRequest) {
  try {
    // Get the webhook payload
    const payload = await req.json();
    
    // Validate the webhook payload
    if (!payload || !payload.workflowId) {
      return NextResponse.json(
        { error: "Invalid webhook payload" },
        { status: 400 }
      );
    }

    // Get the webhook signature from the request headers
    const signature = req.headers.get("x-pd-signature");
    
    // In a production environment, you would validate the signature
    // using the webhook secret to ensure the request is from Pipedream
    
    // Store the webhook event in the database
    const surrealDB = await getSurrealDB();
    
    const event = {
      workflowId: payload.workflowId,
      sourceId: payload.sourceId,
      timestamp: new Date().toISOString(),
      data: payload.data || payload,
      signature,
    };
    
    const result = await surrealDB.create("pipedream_events", event);
    
    // Send a WebSocket message to notify clients of the new event
    sendWebSocketMessage({
      type: "pipedream_event",
      data: {
        event: result,
      },
    });
    
    // Return a success response
    return NextResponse.json({
      success: true,
      message: "Webhook received successfully",
      eventId: result.id,
    });
  } catch (error) {
    console.error("Error processing Pipedream webhook:", error);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/webhooks/pipedream
 * 
 * Retrieves recent webhook events from Pipedream workflows
 */
export async function GET(req: NextRequest) {
  try {
    // Get query parameters
    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "10", 10);
    const workflowId = req.nextUrl.searchParams.get("workflowId");
    
    // Get events from the database
    const surrealDB = await getSurrealDB();
    
    let query = "SELECT * FROM pipedream_events";
    
    // Add filters if provided
    if (workflowId) {
      query += ` WHERE workflowId = '${workflowId}'`;
    }
    
    // Add sorting and limit
    query += " ORDER BY timestamp DESC LIMIT $limit";
    
    const events = await surrealDB.query(query, { limit });
    
    // Return the events
    return NextResponse.json({
      events: events[0]?.result || [],
    });
  } catch (error) {
    console.error("Error fetching Pipedream webhook events:", error);
    return NextResponse.json(
      { error: "Failed to fetch webhook events" },
      { status: 500 }
    );
  }
}
