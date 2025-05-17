"use client";

import Link from "next/link";
import { EnhancedCard } from "@/components/ui/enhanced-card";
import { BorderContainer } from "@/components/ui/shine-border";
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text";
import {
  FileText,
  Database,
  Workflow,
  Calendar,
  Mail,
  MessageSquare,
  FileArchive,
  ExternalLink
} from "lucide-react";

interface IntegrationCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  status: "available" | "coming-soon";
}

function IntegrationCard({ title, description, icon, href, status }: IntegrationCardProps) {
  return (
    <EnhancedCard className="h-full" interactive hoverEffect="shadow">
      <BorderContainer borderRadius="0.75rem" className="p-0.5 h-full" variant="primary" rounded="xl">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm overflow-hidden p-6 h-full flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-indigo-100 p-3 rounded-full">
              {icon}
            </div>
            <h3 className="text-lg font-medium">{title}</h3>
          </div>

          <p className="text-slate-600 text-sm flex-grow">
            {description}
          </p>

          <div className="mt-4">
            {status === "available" ? (
              <Link
                href={href}
                className="flex items-center text-indigo-600 text-sm font-medium hover:text-indigo-700"
              >
                Configure
                <ExternalLink className="ml-1 h-4 w-4" />
              </Link>
            ) : (
              <div className="text-emerald-600 text-sm font-medium">
                Coming Soon
              </div>
            )}
          </div>
        </div>
      </BorderContainer>
    </EnhancedCard>
  );
}

export default function IntegrationsSettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">
          <AnimatedGradientText>Integrations</AnimatedGradientText>
        </h1>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Available Integrations</h2>
        <p className="text-slate-600 mb-6">
          Connect Atlas-ERP with external services to enhance functionality and automate workflows.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <IntegrationCard
            title="unstructured.io"
            description="Enhanced document processing for PDFs, Word documents, PowerPoint, images, and more."
            icon={<FileText className="h-6 w-6 text-indigo-600" />}
            href="/dashboard/settings/integrations/unstructured"
            status="available"
          />

          <IntegrationCard
            title="Pipedream"
            description="Create and manage workflows that connect Atlas-ERP with thousands of APIs."
            icon={<Workflow className="h-6 w-6 text-indigo-600" />}
            href="/dashboard/integrations/pipedream"
            status="available"
          />

          <IntegrationCard
            title="Google Calendar"
            description="Sync events and appointments between Atlas-ERP and Google Calendar."
            icon={<Calendar className="h-6 w-6 text-indigo-600" />}
            href="/dashboard/settings/integrations/google-calendar"
            status="coming-soon"
          />

          <IntegrationCard
            title="Microsoft 365"
            description="Integrate with Microsoft 365 services including Outlook, OneDrive, and Teams."
            icon={<Mail className="h-6 w-6 text-indigo-600" />}
            href="/dashboard/settings/integrations/microsoft-365"
            status="coming-soon"
          />

          <IntegrationCard
            title="Slack"
            description="Send notifications and updates from Atlas-ERP to Slack channels."
            icon={<MessageSquare className="h-6 w-6 text-indigo-600" />}
            href="/dashboard/settings/integrations/slack"
            status="coming-soon"
          />

          <IntegrationCard
            title="Data Sources"
            description="Connect to databases, APIs, and other data sources to import and export data."
            icon={<Database className="h-6 w-6 text-indigo-600" />}
            href="/dashboard/settings/integrations/data-sources"
            status="coming-soon"
          />
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Document Processing</h2>
        <p className="text-slate-600 mb-6">
          Enhance document processing capabilities with specialized integrations.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <IntegrationCard
            title="unstructured.io"
            description="Extract structured content from unstructured documents with AI-powered processing."
            icon={<FileText className="h-6 w-6 text-indigo-600" />}
            href="/dashboard/settings/integrations/unstructured"
            status="available"
          />

          <IntegrationCard
            title="OCR Services"
            description="Advanced optical character recognition for scanned documents and images."
            icon={<FileArchive className="h-6 w-6 text-indigo-600" />}
            href="/dashboard/settings/integrations/ocr"
            status="coming-soon"
          />
        </div>
      </div>
    </div>
  );
}
