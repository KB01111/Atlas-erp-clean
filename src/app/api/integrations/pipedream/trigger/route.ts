import { NextRequest, NextResponse } from "next/server";
import { createPipedreamClient } from "@/lib/pipedream-client";
import { isServiceAvailable, mockPipedream } from "@/lib/mock-service-provider";

/**
 * POST /api/integrations/pipedream/trigger
 * 
 * Triggers a Pipedream workflow with the provided data
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { workflowId, data } = body;

    if (!workflowId || !data) {
      return NextResponse.json(
        { error: "Missing required fields: workflowId, data" },
        { status: 400 }
      );
    }

    let client;
    let useMockService = false;

    try {
      // Check if Pipedream API is available
      const isPipedreamAvailable = await isServiceAvailable(
        process.env.PIPEDREAM_API_URL || "https://api.pipedream.com/v1"
      );

      if (!isPipedreamAvailable) {
        console.log("Pipedream API is not available, using mock service");
        useMockService = true;
      } else {
        // Create a real Pipedream client
        client = await createPipedreamClient();
      }
    } catch (error) {
      console.log("Error checking Pipedream availability:", error);
      useMockService = true;
    }

    // Use mock service if needed
    if (useMockService) {
      const result = await mockPipedream.triggerWorkflow(workflowId, data);

      return NextResponse.json({
        result,
        useMockService: true,
      });
    }

    // Trigger workflow using Pipedream API
    const result = await client.triggerWorkflow(workflowId, data);

    return NextResponse.json({
      result,
      useMockService: false,
    });
  } catch (error) {
    console.error("Error triggering Pipedream workflow:", error);
    return NextResponse.json(
      { error: "Failed to trigger Pipedream workflow" },
      { status: 500 }
    );
  }
}
