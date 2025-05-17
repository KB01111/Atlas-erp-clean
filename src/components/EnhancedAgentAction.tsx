"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Bot,
  Play,
  Loader2,
  CheckCircle,
  XCircle,
  RefreshCw,
  Copy,
  Terminal,
  Sparkles,
  Brain,
  Zap,
  ChevronDown,
  ChevronUp,
  Info,
  AlertCircle,
  Code
} from "lucide-react";
import { useCopilotAction, useCopilotReadable } from "@copilotkit/react-core";
import { BorderContainer } from "@/components/ui/shine-border";
import { EnhancedActionButton } from "@/components/ui/enhanced-action-button";
import { EnhancedCard } from "@/components/ui/enhanced-card";
import { EnhancedButton } from "@/components/ui/enhanced-button";
import { useRateLimit } from "@/context/RateLimitContext";
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text";
import { DotBackground } from "@/components/ui/dot-background";
import { usePerformanceOptimization } from "@/hooks/usePerformanceOptimization";

interface AgentActionProps {
  name?: string;
  description?: string;
  icon?: React.ReactNode;
  className?: string;
  capabilities?: string[];
  systemPrompt?: string;
  model?: string;
  onRun?: (result: string) => void;
  autoAnimate?: boolean;
}

export default function EnhancedAgentAction({
  name = "CFO-Bot",
  description = "Generate financial reports and analysis",
  icon = <Bot className="text-purple-600" size={24} />,
  className = "",
  capabilities = ["Financial Analysis", "Report Generation", "Budget Planning", "Cost Optimization"],
  systemPrompt = "You are a financial analysis AI assistant that helps with generating reports and analyzing financial data.",
  model = "gpt-4o",
  onRun,
  autoAnimate = false,
}: AgentActionProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "running" | "success" | "error">("idle");
  const [runCount, setRunCount] = useState(0);
  const [lastRunTime, setLastRunTime] = useState<Date | null>(null);
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [animationPlayed, setAnimationPlayed] = useState(false);
  const { throttle } = useRateLimit();
  const { isLowEndDevice } = usePerformanceOptimization();
  const startTimeRef = useRef<number | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Make the agent readable by CopilotKit
  useCopilotReadable({
    name: `agent_${name.toLowerCase().replace(/\s+/g, "_")}`,
    description: `${name} agent information and status`,
    value: {
      name,
      description,
      status,
      capabilities,
      runCount,
      lastRunTime: lastRunTime?.toISOString() || null,
      executionTime,
      model,
      systemPrompt,
    },
  });

  // Auto-animate effect when component mounts
  useEffect(() => {
    if (autoAnimate && !animationPlayed) {
      const timer = setTimeout(() => {
        // Add a subtle animation to draw attention
        if (cardRef.current) {
          cardRef.current.classList.add('animate-pulse');
          setTimeout(() => {
            if (cardRef.current) {
              cardRef.current.classList.remove('animate-pulse');
            }
          }, 1000);
        }
        setAnimationPlayed(true);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [autoAnimate, animationPlayed]);

  // Function to handle running the agent (using useCallback to memoize)
  const handleRunAgent = useCallback(async () => {
    // Prevent multiple simultaneous runs
    if (isRunning) return null;

    setIsRunning(true);
    setStatus("running");
    setResult(null);
    startTimeRef.current = Date.now();

    try {
      // In a real app, you would call an API to run the agent
      // For now, we'll simulate a delay and response
      await throttle(`agent-run-${name}`, async () => {
        // Simulate longer execution time for more complex agents
        const simulatedExecutionTime = name.length * 200 + 1000;
        await new Promise((resolve) => setTimeout(resolve, simulatedExecutionTime));
      }, 5000);

      // Simulate agent execution with more dynamic content
      const mockResults = [
        `${name} has completed the task successfully. Here are the results:

1. Generated monthly financial report
2. Analyzed cash flow trends
3. Identified cost-saving opportunities
4. Prepared budget forecast for next quarter
5. Highlighted key performance indicators
6. Provided recommendations for financial strategy`,

        `Task completed by ${name}. Summary of findings:

• Revenue increased by 12% compared to last quarter
• Operating expenses reduced by 8% through optimization
• Cash flow improved by implementing new collection policies
• Identified 3 areas for potential investment
• Prepared financial projections for the next fiscal year`,

        `${name} analysis complete:

1. Completed financial health assessment
2. Identified 5 key areas for improvement
3. Generated comprehensive budget report
4. Analyzed market trends and competitive positioning
5. Prepared executive summary with actionable recommendations`
      ];

      // Select a random result
      const mockResult = mockResults[Math.floor(Math.random() * mockResults.length)];

      setResult(mockResult);
      setStatus("success");
      setRunCount(prev => prev + 1);
      setLastRunTime(new Date());

      if (startTimeRef.current) {
        setExecutionTime(Date.now() - startTimeRef.current);
      }

      // Call the onRun callback if provided
      if (onRun) {
        onRun(mockResult);
      }

      return mockResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      setResult(`Error: ${errorMessage}`);
      setStatus("error");
      return `Error: ${errorMessage}`;
    } finally {
      setIsRunning(false);
    }
  }, [name, isRunning, throttle, onRun]);

  // Copy result to clipboard
  const copyToClipboard = useCallback(() => {
    if (result) {
      navigator.clipboard.writeText(result);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  }, [result]);

  // Toggle system prompt visibility
  const togglePrompt = useCallback(() => {
    setShowPrompt(prev => !prev);
  }, []);

  // Get status color based on current status
  const getStatusColor = useCallback(() => {
    switch (status) {
      case "running":
        return "bg-amber-500 text-white";
      case "success":
        return "bg-green-500 text-white";
      case "error":
        return "bg-red-500 text-white";
      default:
        return "bg-primary/20 text-primary";
    }
  }, [status]);

  // Register the agent action with CopilotKit at the top level of the component
  useCopilotAction({
    name: `run_${name.toLowerCase().replace(/\s+/g, "_")}`,
    description: `Run the ${name} agent to ${description}`,
    parameters: [],
    handler: async () => {
      return await handleRunAgent();
    },
  });

  return (
    <div
      ref={cardRef}
      className={`relative group transition-all duration-300 hover:scale-[1.02] ${className}`}
    >
      <EnhancedCard
        className="rounded-xl overflow-hidden"
        focus
        glare
        glareSize={0.3}
        glareOpacity={0.2}
        glarePosition="all"
        glareColor="rgba(139, 92, 246, 0.6)"
        glareBorderRadius="0.75rem"
       interactive hoverEffect="shadow">
        <BorderContainer borderRadius="0.75rem" className="p-0.5" variant="primary" rounded="xl">
          <div className="bg-card rounded-xl shadow-sm p-6 relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-5 pointer-events-none">
              <DotBackground
                size={32}
                className="absolute inset-0 text-primary"
                dotClassName="opacity-50"
              />
            </div>

            <div className="flex items-start gap-4 relative z-10">
              {/* Agent icon with status indicator */}
              <div className="relative">
                <div className={`bg-purple-100 dark:bg-purple-900/30 p-3 rounded-full ${
                  status === "running" ? "animate-pulse" : ""
                }`}>
                  {icon}

                  {/* Pulse effect for running state */}
                  {status === "running" && (
                    <div className="absolute inset-0 -z-10">
                      <div className="w-16 h-16 rounded-full bg-purple-500/20 animate-pulse"></div>
                    </div>
                  )}
                </div>

                {/* Status indicator */}
                {status !== "idle" && (
                  <div className="absolute -bottom-1 -right-1">
                    {status === "running" && (
                      <div className="bg-amber-500 text-white p-1 rounded-full">
                        <Loader2 size={12} className="animate-spin" />
                      </div>
                    )}
                    {status === "success" && (
                      <div className="bg-green-500 text-white p-1 rounded-full">
                        <CheckCircle size={12} />
                      </div>
                    )}
                    {status === "error" && (
                      <div className="bg-red-500 text-white p-1 rounded-full">
                        <XCircle size={12} />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex-1">
                {/* Agent name and description */}
                <div className="flex justify-between items-start">
                  <div>
                    <AnimatedGradientText
                      text={name}
                      className="font-medium text-lg"
                      gradient="linear-gradient(to right, #8b5cf6, #6366f1)"
                      duration={8}
                    />
                    <p className="text-card-foreground/70 text-sm mb-4">{description}</p>
                  </div>

                  {/* Model badge */}
                  <div className="flex items-center gap-1 bg-secondary/20 px-2 py-1 rounded text-xs text-secondary-foreground">
                    <Brain size={12} />
                    {model}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap gap-2">
                  {isRunning ? (
                    <button
                      disabled
                      className="flex items-center gap-2 px-4 py-2 rounded-md text-white font-medium bg-purple-400 dark:bg-purple-700/50"
                    >
                      <Loader2 size={18} className="animate-spin" />
                      <span>Running...</span>
                    </button>
                  ) : (
                    <EnhancedActionButton
                      onClick={handleRunAgent}
                      className="px-4 py-2 rounded-md font-medium bg-primary text-primary-foreground"
                     variant="default" size="sm" hover="lift">
                      <Zap size={18} className="mr-2" />
                      Run Agent
                    </EnhancedActionButton>
                  )}

                  {/* Toggle details button */}
                  <EnhancedButton
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDetails(!showDetails)}
                    className="ml-2"
                    effect="glow"
                    effectIntensity="low"
                  >
                    {showDetails ? (
                      <ChevronUp size={14} className="mr-1" />
                    ) : (
                      <ChevronDown size={14} className="mr-1" />
                    )}
                    {showDetails ? "Hide Details" : "Show Details"}
                  </EnhancedButton>

                  {/* System prompt button */}
                  <EnhancedButton
                    variant="ghost"
                    size="sm"
                    onClick={togglePrompt}
                    className="ml-auto"
                    title="View system prompt"
                  >
                    <Info size={16} className="text-muted-foreground" />
                  </EnhancedButton>
                </div>

                {/* System prompt */}
                {showPrompt && (
                  <div className="mt-4 p-3 bg-muted/50 rounded-md text-sm border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Code size={14} className="text-primary" />
                        <span className="text-xs font-medium">System Prompt</span>
                      </div>
                      <button
                        onClick={togglePrompt}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <XCircle size={14} />
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground whitespace-pre-line">{systemPrompt}</p>
                  </div>
                )}

                {/* Agent capabilities */}
                {showDetails && (
                  <div className="mt-4 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles size={14} className="text-primary" />
                      <h4 className="text-sm font-medium">Capabilities</h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {capabilities.map((capability, index) => (
                        <span
                          key={index}
                          className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full"
                        >
                          {capability}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Result display */}
                {result && (
                  <div className="mt-4 relative">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <Terminal size={14} className="text-primary" />
                        <h4 className="text-sm font-medium">Result</h4>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={copyToClipboard}
                          className="text-primary hover:text-primary/80 transition-colors p-1 rounded hover:bg-primary/10"
                          title="Copy to clipboard"
                        >
                          {isCopied ? <CheckCircle size={14} /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>
                    <div className="p-3 bg-muted rounded-md text-sm whitespace-pre-line text-card-foreground/90 border border-border relative">
                      {/* Border glow effect */}
                      {status === "success" && (
                        <div className="absolute inset-0 border border-green-500/30 rounded-md animate-pulse"></div>
                      )}
                      <div className="relative z-10">
                        {result}
                      </div>
                    </div>
                  </div>
                )}

                {/* Status badge */}
                {status !== "idle" && (
                  <div className={`mt-4 inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs ${getStatusColor()}`}>
                    {status === "running" && <Loader2 size={12} className="animate-spin" />}
                    {status === "success" && <CheckCircle size={12} />}
                    {status === "error" && <AlertCircle size={12} />}
                    <span>
                      {status === "running" && "Running..."}
                      {status === "success" && "Completed successfully"}
                      {status === "error" && "Error occurred"}
                    </span>
                  </div>
                )}

                {/* Execution details */}
                {showDetails && (lastRunTime || executionTime || runCount > 0) && (
                  <div className="mt-4 text-xs text-muted-foreground space-y-1">
                    {runCount > 0 && (
                      <div className="flex items-center gap-1">
                        <span>Total runs: {runCount}</span>
                      </div>
                    )}
                    {lastRunTime && (
                      <div className="flex items-center gap-1">
                        <RefreshCw size={12} />
                        <span>Last run: {lastRunTime.toLocaleString()}</span>
                      </div>
                    )}
                    {executionTime && (
                      <div className="flex items-center gap-1">
                        <Clock size={12} />
                        <span>Execution time: {(executionTime / 1000).toFixed(2)}s</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </BorderContainer>
      </EnhancedCard>
    </div>
  );
}
