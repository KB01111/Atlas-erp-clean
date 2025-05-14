"use client";

import { useCopilotReadable, useCopilotAction } from "@copilotkit/react-core";
import NangoConnections from "@/components/NangoConnections";

export default function IntegrationsPage() {
  // Make the page readable by CopilotKit
  useCopilotReadable({
    description: "Integrations page for connecting external services",
    content: "This page allows users to connect external services like Google Calendar, Google Drive, Microsoft 365, and Slack to Atlas-ERP using Nango.",
  });

  // Add actions for CopilotKit
  const connectService = useCopilotAction({
    name: "connectService",
    description: "Connect an external service",
    parameters: [
      {
        name: "serviceName",
        type: "string",
        description: "The name of the service to connect (e.g., 'Google Calendar', 'Google Drive', 'Microsoft 365', 'Slack')",
      },
    ],
    handler: async ({ serviceName }) => {
      alert(`Please use the Connect button to connect ${serviceName}`);
      return `To connect ${serviceName}, please use the Connect button on the Integrations page.`;
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Integrations</h1>
      <p className="text-slate-600">
        Connect Atlas-ERP to your favorite services to enhance your workflow.
      </p>
      
      <NangoConnections />
    </div>
  );
}
