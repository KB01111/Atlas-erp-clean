"use client";

import { useState } from "react";
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text";
import { EnhancedCard, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/enhanced-card";
import { EnhancedButton } from "@/components/ui/enhanced-button";
import EnhancedWelcomeSection from "@/components/EnhancedWelcomeSection";
import EnhancedAgentAction from "@/components/EnhancedAgentAction";
import RealTimeMetrics from "@/components/dashboard/RealTimeMetrics";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorMessage } from "@/components/ui/error-message";
import { EmptyState } from "@/components/ui/empty-state";
import { BorderContainer } from "@/components/ui/shine-border";
import { EnhancedActionButton } from "@/components/ui/enhanced-action-button";
import { NumberDisplay } from "@/components/ui/number-display";
import { TextRotate } from "@/components/ui/text-rotate";
import {
  Bot,
  Package,
  Layers,
  FileText,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Search,
  Plus,
  Download,
  RefreshCw,
  Settings,
  ChevronDown
} from "lucide-react";

export default function ComponentsPage() {
  const [activeTab, setActiveTab] = useState<'ui' | 'layout' | 'data' | 'feedback'>('ui');

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <AnimatedGradientText
            text="Component Library"
            className="text-3xl font-bold"
            gradient="linear-gradient(to right, #3b82f6, #8b5cf6, #ec4899)"
          />
          <p className="text-muted-foreground mt-1">
            Showcase of all enhanced components available in Atlas-ERP
          </p>
        </div>
      </div>

      {/* Component Categories */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-4">
        <EnhancedButton
          variant={activeTab === 'ui' ? 'default' : 'outline'}
          onClick={() => setActiveTab('ui')}
        >
          UI Components
        </EnhancedButton>
        <EnhancedButton
          variant={activeTab === 'layout' ? 'default' : 'outline'}
          onClick={() => setActiveTab('layout')}
        >
          Layout Components
        </EnhancedButton>
        <EnhancedButton
          variant={activeTab === 'data' ? 'default' : 'outline'}
          onClick={() => setActiveTab('data')}
        >
          Data Components
        </EnhancedButton>
        <EnhancedButton
          variant={activeTab === 'feedback' ? 'default' : 'outline'}
          onClick={() => setActiveTab('feedback')}
        >
          Feedback Components
        </EnhancedButton>
      </div>

      {/* UI Components */}
      {activeTab === 'ui' && (
        <div className="space-y-8">
          <ComponentSection title="Buttons" description="Enhanced button components with various effects">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <ComponentCard title="EnhancedButton" description="Standard button with effects">
                <div className="flex flex-wrap gap-2">
                  <EnhancedButton>Default</EnhancedButton>
                  <EnhancedButton variant="outline">Outline</EnhancedButton>
                  <EnhancedButton variant="destructive">Destructive</EnhancedButton>
                  <EnhancedButton effect="shimmer">Shimmer</EnhancedButton>
                  <EnhancedButton effect="glow">Glow</EnhancedButton>
                  <EnhancedButton effect="gradient">Gradient</EnhancedButton>
                </div>
              </ComponentCard>

              <ComponentCard title="EnhancedActionButton" description="Button with enhanced effects">
                <div className="flex flex-wrap gap-2">
                  <EnhancedActionButton variant="default" hover="lift">Action Button</EnhancedActionButton>
                  <EnhancedActionButton variant="primary" shadow="md">Custom Style</EnhancedActionButton>
                </div>
              </ComponentCard>
            </div>
          </ComponentSection>

          <ComponentSection title="Cards" description="Enhanced card components with various effects">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <ComponentCard title="EnhancedCard" description="Card with hover effects">
                <EnhancedCard interactive hoverEffect="lift" className="p-4">
                  <p>Card with lift effect</p>
                </EnhancedCard>
                <div className="h-4"></div>
                <EnhancedCard interactive hoverEffect="glow" className="p-4">
                  <p>Card with glow effect</p>
                </EnhancedCard>
                <div className="h-4"></div>
                <EnhancedCard gradient className="p-4">
                  <p>Card with gradient border</p>
                </EnhancedCard>
                <div className="h-4"></div>
                <EnhancedCard shineBorder className="p-4">
                  <p>Card with shine border effect</p>
                </EnhancedCard>
              </ComponentCard>

              <ComponentCard title="EnhancedCard Variants" description="Additional card variants">
                <EnhancedCard className="p-4" interactive hoverEffect="shadow">
                  <p>Card with shadow effect</p>
                </EnhancedCard>
                <div className="h-4"></div>
                <EnhancedCard className="p-4" interactive hoverEffect="border">
                  <p>Card with border highlight</p>
                </EnhancedCard>
              </ComponentCard>
            </div>
          </ComponentSection>

          <ComponentSection title="Text Effects" description="Enhanced text components with various effects">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <ComponentCard title="AnimatedGradientText" description="Text with gradient animation">
                <AnimatedGradientText
                  text="Animated Gradient"
                  className="text-xl font-bold"
                  gradient="linear-gradient(to right, #3b82f6, #8b5cf6, #ec4899)"
                />
              </ComponentCard>

              <ComponentCard title="TextRotate" description="Text with word rotation">
                <div className="flex items-center gap-2">
                  <span>I am a</span>
                  <TextRotate
                    words={["Developer", "Designer", "Creator", "Builder"]}
                    className="text-primary font-bold"
                    variant="primary"
                    weight="bold"
                    size="lg"
                    interval={3000}
                  />
                </div>
              </ComponentCard>

              <ComponentCard title="NumberDisplay" description="Animated number counter">
                <div className="text-2xl font-bold">
                  <NumberDisplay
                    value={1234}
                    variant="primary"
                    weight="bold"
                    size="2xl"
                    duration={1500}
                  />
                </div>
              </ComponentCard>
            </div>
          </ComponentSection>
        </div>
      )}

      {/* Layout Components */}
      {activeTab === 'layout' && (
        <div className="space-y-8">
          <ComponentSection title="Sections" description="Enhanced section components">
            <div className="grid grid-cols-1 gap-4">
              <ComponentCard title="EnhancedWelcomeSection" description="Welcome section with user information">
                <div className="h-64 overflow-hidden">
                  <EnhancedWelcomeSection />
                </div>
              </ComponentCard>
            </div>
          </ComponentSection>

          <ComponentSection title="Borders & Effects" description="Border and effect components">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ComponentCard title="BorderContainer" description="Border container component">
                <BorderContainer variant="primary" rounded="lg" borderWidth="medium" className="p-0.5">
                  <div className="bg-card p-4 rounded-lg">
                    Content with clean border
                  </div>
                </BorderContainer>
              </ComponentCard>
            </div>
          </ComponentSection>
        </div>
      )}

      {/* Data Components */}
      {activeTab === 'data' && (
        <div className="space-y-8">
          <ComponentSection title="Metrics" description="Data visualization components">
            <div className="grid grid-cols-1 gap-4">
              <ComponentCard title="RealTimeMetrics" description="Real-time metrics display">
                <div className="h-64 overflow-hidden">
                  <RealTimeMetrics showFilters showExport maxItems={4} />
                </div>
              </ComponentCard>
            </div>
          </ComponentSection>

          <ComponentSection title="Agent Components" description="AI agent components">
            <div className="grid grid-cols-1 gap-4">
              <ComponentCard title="EnhancedAgentAction" description="AI agent action card">
                <EnhancedAgentAction />
              </ComponentCard>
            </div>
          </ComponentSection>
        </div>
      )}

      {/* Feedback Components */}
      {activeTab === 'feedback' && (
        <div className="space-y-8">
          <ComponentSection title="Loading States" description="Loading state components">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ComponentCard title="LoadingState" description="Loading state indicators">
                <div className="space-y-4">
                  <LoadingState message="Loading..." size="small" />
                  <LoadingState message="Processing data..." variant="inline" />
                  <LoadingState message="Loading dashboard..." variant="card" size="small" />
                </div>
              </ComponentCard>
            </div>
          </ComponentSection>

          <ComponentSection title="Error Messages" description="Error message components">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ComponentCard title="ErrorMessage" description="Error message displays">
                <div className="space-y-4">
                  <ErrorMessage
                    message="Something went wrong"
                    variant="error"
                    size="sm"
                  />
                  <ErrorMessage
                    message="Warning: This action cannot be undone"
                    variant="warning"
                    size="sm"
                  />
                </div>
              </ComponentCard>
            </div>
          </ComponentSection>

          <ComponentSection title="Empty States" description="Empty state components">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ComponentCard title="EmptyState" description="Empty state displays">
                <EmptyState
                  title="No results found"
                  description="Try adjusting your search or filter to find what you're looking for."
                  icon={<Search className="h-10 w-10 text-muted-foreground" />}
                  action={{
                    label: "Clear filters",
                    onClick: () => {},
                  }}
                  size="sm"
                />
              </ComponentCard>
            </div>
          </ComponentSection>
        </div>
      )}
    </div>
  );
}

// Component Section
function ComponentSection({ title, description, children }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}

// Component Card
function ComponentCard({ title, description, children }) {
  return (
    <EnhancedCard className="overflow-hidden">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </EnhancedCard>
  );
}
