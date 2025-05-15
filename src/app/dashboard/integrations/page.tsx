"use client";

import { useCopilotReadable, useCopilotAction } from "@copilotkit/react-core";
import Link from "next/link";
import NangoConnections from "@/components/NangoConnections";
import { MagicCard } from "@/components/magicui/magic-card";
import { ShineBorder } from "@/components/ui/shine-border";
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text";
import { ScrollProgress } from "@/components/ui/scroll-progress";
import { ArrowRight, Database, Workflow, Bot, ExternalLink } from 'lucide-react';

export default function IntegrationsPage() {
  // Make the page readable by CopilotKit
  useCopilotReadable({
    description: "Integrations page for connecting external services",
    content: "This page allows users to connect external services like Google Calendar, Google Drive, Microsoft 365, Slack, and Pipedream to Atlas-ERP.",
  });

  // Add actions for CopilotKit
  const connectService = useCopilotAction({
    name: "connectService",
    description: "Connect an external service",
    parameters: [
      {
        name: "serviceName",
        type: "string",
        description: "The name of the service to connect (e.g., 'Google Calendar', 'Google Drive', 'Microsoft 365', 'Slack', 'Pipedream')",
      },
    ],
    handler: async ({ serviceName }) => {
      if (serviceName.toLowerCase() === 'pipedream') {
        return `To set up Pipedream integration, please visit the Pipedream page under Integrations.`;
      }

      alert(`Please use the Connect button to connect ${serviceName}`);
      return `To connect ${serviceName}, please use the Connect button on the Integrations page.`;
    },
  });

  return (
    <div className="space-y-8">
      <ScrollProgress />

      <div>
        <AnimatedGradientText className="text-3xl font-bold">
          Integrations
        </AnimatedGradientText>
        <p className="text-slate-600 mt-2">
          Connect Atlas-ERP to your favorite services to enhance your workflow.
        </p>
      </div>

      {/* Integration Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {/* Pipedream Integration Card */}
        <Link href="/dashboard/integrations/pipedream">
          <MagicCard className="h-full">
            <ShineBorder borderRadius="0.75rem" className="p-0.5 h-full">
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm overflow-hidden p-6 h-full flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-indigo-100 p-3 rounded-full">
                    <Workflow className="h-6 w-6 text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-medium">Pipedream</h3>
                </div>

                <p className="text-slate-600 text-sm flex-grow">
                  Connect to external services and automate workflows with Pipedream. Collect data for dashboard metrics and AI agents.
                </p>

                <div className="mt-4 flex items-center text-indigo-600 text-sm font-medium">
                  Manage Pipedream Integration
                  <ArrowRight className="ml-1 h-4 w-4" />
                </div>
              </div>
            </ShineBorder>
          </MagicCard>
        </Link>

        {/* Data Sources Card */}
        <MagicCard className="h-full">
          <ShineBorder borderRadius="0.75rem" className="p-0.5 h-full">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm overflow-hidden p-6 h-full flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-emerald-100 p-3 rounded-full">
                  <Database className="h-6 w-6 text-emerald-600" />
                </div>
                <h3 className="text-lg font-medium">Data Sources</h3>
              </div>

              <p className="text-slate-600 text-sm flex-grow">
                Connect to databases, APIs, and other data sources to import and export data.
              </p>

              <div className="mt-4 flex items-center text-emerald-600 text-sm font-medium">
                Coming Soon
              </div>
            </div>
          </ShineBorder>
        </MagicCard>

        {/* AI Services Card */}
        <MagicCard className="h-full">
          <ShineBorder borderRadius="0.75rem" className="p-0.5 h-full">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm overflow-hidden p-6 h-full flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-purple-100 p-3 rounded-full">
                  <Bot className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-medium">AI Services</h3>
              </div>

              <p className="text-slate-600 text-sm flex-grow">
                Connect to AI services like OpenAI, Anthropic, and others to enhance your AI agents.
              </p>

              <div className="mt-4 flex items-center text-purple-600 text-sm font-medium">
                Coming Soon
              </div>
            </div>
          </ShineBorder>
        </MagicCard>
      </div>

      {/* Nango Connections */}
      <div>
        <h2 className="text-xl font-medium mb-4">Service Connections</h2>
        <NangoConnections />
      </div>
    </div>
  );
}
