"use client";

import { useState, useEffect, useCallback } from "react";
import { Bot, Play, Loader2 } from "lucide-react";
import { useCopilotAction } from "@copilotkit/react-core";
import { ShineBorder } from "@/components/ui/shine-border";
import { ShimmerButton } from "@/components/magicui/shimmer-button";
import { MagicCard } from "@/components/magicui/magic-card";

interface AgentActionProps {
  name?: string;
  description?: string;
  icon?: React.ReactNode;
}

export default function EnhancedAgentAction({
  name = "CFO-Bot",
  description = "Generate financial reports and analysis",
  icon = <Bot className="text-purple-600" size={24} />,
}: AgentActionProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  // Function to handle running the agent (using useCallback to memoize)
  const handleRunAgent = useCallback(async () => {
    setIsRunning(true);
    setResult(null);

    try {
      // Simulate an API call to run the agent
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // In a real app, you would call an API to run the agent
      const mockResult = `${name} has completed the task successfully. Here are the results:

1. Generated monthly financial report
2. Analyzed cash flow trends
3. Identified cost-saving opportunities
4. Prepared budget forecast for next quarter`;

      setResult(mockResult);
      return mockResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      setResult(`Error: ${errorMessage}`);
      return `Error: ${errorMessage}`;
    } finally {
      setIsRunning(false);
    }
  }, [name]);

  // Register the agent action with CopilotKit inside useEffect
  useEffect(() => {
    useCopilotAction({
      name: `run_${name.toLowerCase().replace(/\s+/g, "_")}`,
      description: `Run the ${name} agent to ${description}`,
      parameters: [],
      handler: async () => {
        return await handleRunAgent();
      },
    });
  }, [name, description, handleRunAgent]);

  return (
    <div className="relative group transition-all duration-300 hover:scale-[1.02]">
      <MagicCard
        className="rounded-xl overflow-hidden"
        focus
        glare
        glareSize={0.3}
        glareOpacity={0.2}
        glarePosition="all"
        glareColor="rgba(139, 92, 246, 0.6)"
        glareBorderRadius="0.75rem"
      >
        <div className="bg-card rounded-xl shadow-sm p-6">
          <div className="flex items-start gap-4">
            <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-full">
              {icon}
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-lg text-card-foreground">{name}</h3>
              <p className="text-card-foreground/70 text-sm mb-4">{description}</p>

              {isRunning ? (
                <button
                  disabled
                  className="flex items-center gap-2 px-4 py-2 rounded-md text-white font-medium bg-purple-400 dark:bg-purple-700/50"
                >
                  <Loader2 size={18} className="animate-spin" />
                  <span>Running...</span>
                </button>
              ) : (
                <ShimmerButton
                  onClick={handleRunAgent}
                  className="px-4 py-2 rounded-md font-medium bg-primary text-primary-foreground"
                >
                  <Play size={18} className="mr-2" />
                  Run Agent
                </ShimmerButton>
              )}

              {result && (
                <div className="mt-4 p-3 bg-muted rounded-md text-sm whitespace-pre-line text-card-foreground/90">
                  {result}
                </div>
              )}
            </div>
          </div>
        </div>
      </MagicCard>
    </div>
  );
}
