import { NextRequest, NextResponse } from "next/server";
import { createPipedreamClient } from "@/lib/pipedream-client";
import { isServiceAvailable, mockPipedream } from "@/lib/mock-service-provider";

/**
 * GET /api/integrations/pipedream/[id]
 *
 * Retrieves a specific Pipedream workflow or source by ID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const type = req.nextUrl.searchParams.get("type") || "workflow";

    if (!id) {
      return NextResponse.json(
        { error: "Missing required parameter: id" },
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
        result = await mockPipedream.getWorkflow(id);
      } else if (type === "source") {
        result = await mockPipedream.getSource(id);
      } else {
        return NextResponse.json(
          { error: "Invalid type. Must be 'workflow' or 'source'" },
          { status: 400 }
        );
      }

      if (!result) {
        return NextResponse.json(
          { error: `${type} not found` },
          { status: 404 }
        );
      }

      return NextResponse.json({
        result,
        useMockService: true,
      });
    }

    // Get workflow or source from Pipedream API
    let result;

    // Ensure client is defined
    if (!client) {
      return NextResponse.json(
        { error: "Pipedream client is not available" },
        { status: 500 }
      );
    }

    if (type === "workflow") {
      result = await client.getWorkflow(id);
    } else if (type === "source") {
      result = await client.getSource(id);
    } else {
      return NextResponse.json(
        { error: "Invalid type. Must be 'workflow' or 'source'" },
        { status: 400 }
      );
    }

    if (!result) {
      return NextResponse.json(
        { error: `${type} not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      result,
      useMockService: false,
    });
  } catch (error) {
    console.error("Error fetching Pipedream integration:", error);
    return NextResponse.json(
      { error: "Failed to fetch Pipedream integration" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/integrations/pipedream/[id]
 *
 * Updates a specific Pipedream workflow or source
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { type, data } = body;

    if (!id || !type || !data) {
      return NextResponse.json(
        { error: "Missing required fields: id, type, data" },
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
        result = await mockPipedream.updateWorkflow(id, data);
      } else if (type === "source") {
        result = await mockPipedream.updateSource(id, data);
      } else {
        return NextResponse.json(
          { error: "Invalid type. Must be 'workflow' or 'source'" },
          { status: 400 }
        );
      }

      if (!result) {
        return NextResponse.json(
          { error: `${type} not found` },
          { status: 404 }
        );
      }

      return NextResponse.json({
        result,
        useMockService: true,
      });
    }

    // Update workflow or source using Pipedream API
    let result;

    // Ensure client is defined
    if (!client) {
      return NextResponse.json(
        { error: "Pipedream client is not available" },
        { status: 500 }
      );
    }

    if (type === "workflow") {
      result = await client.updateWorkflow(id, data);
    } else if (type === "source") {
      result = await client.updateSource(id, data);
    } else {
      return NextResponse.json(
        { error: "Invalid type. Must be 'workflow' or 'source'" },
        { status: 400 }
      );
    }

    if (!result) {
      return NextResponse.json(
        { error: `${type} not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      result,
      useMockService: false,
    });
  } catch (error) {
    console.error("Error updating Pipedream integration:", error);
    return NextResponse.json(
      { error: "Failed to update Pipedream integration" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/integrations/pipedream/[id]
 *
 * Deletes a specific Pipedream workflow or source
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const type = req.nextUrl.searchParams.get("type") || "workflow";

    if (!id) {
      return NextResponse.json(
        { error: "Missing required parameter: id" },
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
        result = await mockPipedream.deleteWorkflow();
      } else if (type === "source") {
        result = await mockPipedream.deleteSource();
      } else {
        return NextResponse.json(
          { error: "Invalid type. Must be 'workflow' or 'source'" },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        useMockService: true,
      });
    }

    // Delete workflow or source using Pipedream API

    // Ensure client is defined
    if (!client) {
      return NextResponse.json(
        { error: "Pipedream client is not available" },
        { status: 500 }
      );
    }

    if (type === "workflow") {
      await client.deleteWorkflow(id);
    } else if (type === "source") {
      await client.deleteSource(id);
    } else {
      return NextResponse.json(
        { error: "Invalid type. Must be 'workflow' or 'source'" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      useMockService: false,
    });
  } catch (error) {
    console.error("Error deleting Pipedream integration:", error);
    return NextResponse.json(
      { error: "Failed to delete Pipedream integration" },
      { status: 500 }
    );
  }
}
