"use client";

import { useState, useCallback } from "react";
import { useCopilotAction, useCopilotReadable } from "@copilotkit/react-core";
import {
  Bot,
  Play,
  Loader2,
  CheckCircle,
  XCircle,
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
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useRateLimit } from "@/context/RateLimitContext";

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

export default function AgentAction({
  name = "Quick Agent Action",
  description = "Execute a quick task with an AI agent",
  icon = <Bot size={20} />,
  className = "",
  capabilities = ["Text generation", "Data analysis", "Task automation"],
  systemPrompt = "You are a helpful AI assistant that can perform various tasks.",
  model = "gpt-4o",
  onRun,
  autoAnimate = true
}: AgentActionProps) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [isSuccess, setIsSuccess] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [activeTab, setActiveTab] = useState<'input' | 'output' | 'logs'>('input');
  const { throttle } = useRateLimit();

  // Make the agent action readable by CopilotKit
  useCopilotReadable({
    name: "agent_action",
    description: "AI agent action component for executing tasks",
    value: {
      name,
      description,
      capabilities,
      systemPrompt,
      model,
      input,
      output,
      isRunning,
      isSuccess,
      error,
    },
  });

  // Register the run action with CopilotKit
  useCopilotAction({
    name: "run_agent_action",
    description: "Run the agent action with the current input",
    parameters: [],
    handler: async () => {
      if (!input.trim()) {
        return "Please provide input for the agent action";
      }
      await runAgentAction();
      return "Agent action executed successfully";
    },
  });

  // Function to run the agent action
  const runAgentAction = useCallback(async () => {
    if (!input.trim()) {
      setError("Please enter a task for the agent");
      return;
    }

    setIsRunning(true);
    setIsSuccess(null);
    setError(null);
    setActiveTab('output');

    try {
      // Throttle the API calls to prevent rate limiting
      await throttle('agent-action', async () => {
        // In a real implementation, you would call an API to run the agent
        // For now, we'll simulate a response after a delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Simulate a successful response
        const simulatedOutput = `Task completed successfully. Here's the result for "${input}":\n\n` +
          `I've analyzed your request and here are my findings:\n\n` +
          `1. The task has been processed\n` +
          `2. All required data has been collected\n` +
          `3. The analysis shows positive results\n\n` +
          `Let me know if you need any clarification or have follow-up questions.`;

        setOutput(simulatedOutput);
        setIsSuccess(true);

        // Call the onRun callback if provided
        if (onRun) {
          onRun(simulatedOutput);
        }
      }, 3000);
    } catch (err) {
      console.error('Error running agent action:', err);
      setIsSuccess(false);
      setError(`Failed to run agent action: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsRunning(false);
    }
  }, [input, throttle, onRun]);

  // Function to copy output to clipboard
  const copyToClipboard = useCallback(() => {
    if (output) {
      navigator.clipboard.writeText(output)
        .then(() => {
          // Show a temporary success message
          const originalOutput = output;
          setOutput("Copied to clipboard!");
          setTimeout(() => {
            setOutput(originalOutput);
          }, 1000);
        })
        .catch(err => {
          console.error('Failed to copy text: ', err);
        });
    }
  }, [output]);

  return (
    <Card className={`${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-2 rounded-full">
              {icon}
            </div>
            <CardTitle className="text-lg">{name}</CardTitle>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowDetails(!showDetails)}
            aria-label={showDetails ? "Hide details" : "Show details"}
          >
            {showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </CardHeader>
      
      <Collapsible open={showDetails} onOpenChange={setShowDetails}>
        <CollapsibleContent>
          <div className="px-6 py-2 bg-muted/50 text-sm">
            <div className="flex flex-wrap gap-2 mb-2">
              {capabilities.map((capability, index) => (
                <Badge key={index} variant="outline" className="bg-primary/5">
                  {capability}
                </Badge>
              ))}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Brain size={12} />
              <span>Model: {model}</span>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
      
      <CardContent className="pt-4">
        <Tabs defaultValue="input" value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="input">Input</TabsTrigger>
            <TabsTrigger value="output">Output</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
          </TabsList>
          
          <TabsContent value="input" className="space-y-4">
            <textarea
              className="w-full min-h-[100px] p-3 border rounded-md bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Enter a task for the agent to perform..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isRunning}
            />
          </TabsContent>
          
          <TabsContent value="output" className="space-y-4">
            <div className="relative">
              <div className="min-h-[100px] p-3 border rounded-md bg-muted/30 whitespace-pre-wrap">
                {output ? (
                  output
                ) : (
                  <span className="text-muted-foreground">Output will appear here after running the agent...</span>
                )}
              </div>
              
              {output && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8 bg-background/80"
                  onClick={copyToClipboard}
                >
                  <Copy size={14} />
                </Button>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="logs" className="space-y-4">
            <div className="min-h-[100px] p-3 border rounded-md bg-black text-green-400 font-mono text-xs">
              {isRunning ? (
                <div className="animate-pulse">
                  > Running agent action...<br />
                  > Processing input: "{input.substring(0, 30)}..."<br />
                  > Using model: {model}<br />
                  > Please wait...
                </div>
              ) : isSuccess === true ? (
                <>
                  > Agent action completed successfully<br />
                  > Execution time: {Math.floor(Math.random() * 1000) + 500}ms<br />
                  > Tokens used: {Math.floor(Math.random() * 500) + 100}<br />
                  > Output generated: {output.length} characters
                </>
              ) : isSuccess === false ? (
                <>
                  > Error executing agent action<br />
                  > {error}<br />
                  > Please try again or modify your input
                </>
              ) : (
                <span className="text-gray-500">Logs will appear here after running the agent...</span>
              )}
            </div>
          </TabsContent>
        </Tabs>
        
        {error && (
          <div className="mt-4 p-2 bg-destructive/10 text-destructive rounded-md flex items-center gap-2 text-sm">
            <AlertCircle size={16} />
            {error}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <div className="flex items-center gap-2">
          {isSuccess === true && (
            <div className="flex items-center text-green-500 text-sm">
              <CheckCircle size={16} className="mr-1" />
              Success
            </div>
          )}
          {isSuccess === false && (
            <div className="flex items-center text-red-500 text-sm">
              <XCircle size={16} className="mr-1" />
              Failed
            </div>
          )}
        </div>
        
        <Button
          onClick={runAgentAction}
          disabled={isRunning || !input.trim()}
          className="gap-2"
        >
          {isRunning ? (
            <>
              <Loader2 className="animate-spin" size={16} />
              Running...
            </>
          ) : (
            <>
              <Play size={16} />
              Run Agent
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
