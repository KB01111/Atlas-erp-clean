import { NextRequest, NextResponse } from "next/server";
import { createPipedreamClient } from "@/lib/pipedream-client";
import { isServiceAvailable, mockPipedream } from "@/lib/mock-service-provider";

/**
 * GET /api/integrations/pipedream
 *
 * Retrieves all Pipedream workflows and sources
 */
export async function GET(req: NextRequest) {
  try {
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
      const workflows = await mockPipedream.getWorkflows();
      const sources = await mockPipedream.getSources();

      return NextResponse.json({
        workflows,
        sources,
        useMockService: true,
      });
    }

    // Get workflows and sources from Pipedream API
    // Ensure client is defined
    if (!client) {
      return NextResponse.json(
        { error: "Pipedream client is not available" },
        { status: 500 }
      );
    }

    const workflows = await client.getWorkflows();
    const sources = await client.getSources();

    return NextResponse.json({
      workflows,
      sources,
      useMockService: false,
    });
  } catch (error) {
    console.error("Error fetching Pipedream integrations:", error);
    return NextResponse.json(
      { error: "Failed to fetch Pipedream integrations" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/integrations/pipedream
 *
 * Creates a new Pipedream workflow
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, data } = body;

    if (!type || !data) {
      return NextResponse.json(
        { error: "Missing required fields: type, data" },
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
      let result;

      if (type === "workflow") {
        result = await mockPipedream.createWorkflow(data);
      } else if (type === "source") {
        result = await mockPipedream.createSource(data);
      } else {
        return NextResponse.json(
          { error: "Invalid type. Must be 'workflow' or 'source'" },
          { status: 400 }
        );
      }

      return NextResponse.json({
        result,
        useMockService: true,
      });
    }

    // Create workflow or source using Pipedream API
    let result;

    // Ensure client is defined
    if (!client) {
      return NextResponse.json(
        { error: "Pipedream client is not available" },
        { status: 500 }
      );
    }

    if (type === "workflow") {
      result = await client.createWorkflow(data);
    } else if (type === "source") {
      result = await client.createSource(data);
    } else {
      return NextResponse.json(
        { error: "Invalid type. Must be 'workflow' or 'source'" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      result,
      useMockService: false,
    });
  } catch (error) {
    console.error("Error creating Pipedream integration:", error);
    return NextResponse.json(
      { error: "Failed to create Pipedream integration" },
      { status: 500 }
    );
  }
}
