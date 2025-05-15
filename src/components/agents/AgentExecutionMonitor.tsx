"use client";

import React, { useState, useEffect, useRef } from 'react';
import { MagicCard } from "@/components/magicui/magic-card";
import { ShineBorder } from "@/components/ui/shine-border";
import { ShimmerButton } from "@/components/magicui/shimmer-button";
import { Agent } from '@/lib/agent-service';
import { Loader2, Play, StopCircle, AlertCircle, Clock, CheckCircle, XCircle, Bot, MessageSquare, ArrowRight } from 'lucide-react';
import { AnimatedGradientText } from '@/components/ui/animated-gradient-text';

interface AgentExecutionMonitorProps {
  agent: Agent;
  className?: string;
}

interface ExecutionStep {
  id: string;
  type: 'input' | 'thinking' | 'tool' | 'output';
  content: string;
  timestamp: string;
  status?: 'pending' | 'success' | 'error';
  toolName?: string;
}

export default function AgentExecutionMonitor({
  agent,
  className = '',
}: AgentExecutionMonitorProps) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [input, setInput] = useState('');
  const [executionSteps, setExecutionSteps] = useState<ExecutionStep[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [executionSteps]);
  
  // Update progress based on execution steps
  useEffect(() => {
    if (!isExecuting) {
      setProgress(0);
      return;
    }
    
    // Simple progress calculation
    const progressStep = 100 / (executionSteps.length + 1);
    setProgress(Math.min(progressStep * executionSteps.length, 95));
    
    // If the last step is output, set progress to 100%
    const lastStep = executionSteps[executionSteps.length - 1];
    if (lastStep && lastStep.type === 'output') {
      setProgress(100);
    }
  }, [isExecuting, executionSteps]);
  
  // Handle agent execution
  const executeAgent = async () => {
    if (!input.trim()) {
      setError('Input is required');
      return;
    }
    
    setIsExecuting(true);
    setError(null);
    setExecutionSteps([
      {
        id: `step-${Date.now()}-input`,
        type: 'input',
        content: input,
        timestamp: new Date().toISOString(),
      }
    ]);
    
    try {
      // Start execution
      const response = await fetch(`/api/agents/${agent.id}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to execute agent');
      }
      
      const data = await response.json();
      setExecutionId(data.executionId);
      
      // Simulate execution steps for now
      // In a real implementation, you would use WebSockets or polling to get real-time updates
      simulateExecution(input);
    } catch (err) {
      setError((err as Error).message || 'Failed to execute agent');
      setIsExecuting(false);
    }
  };
  
  // Simulate execution steps (for demo purposes)
  const simulateExecution = (userInput: string) => {
    // Add thinking step
    setTimeout(() => {
      setExecutionSteps(prev => [
        ...prev,
        {
          id: `step-${Date.now()}-thinking`,
          type: 'thinking',
          content: 'Analyzing input and determining next steps...',
          timestamp: new Date().toISOString(),
        }
      ]);
      
      // Add tool usage step
      setTimeout(() => {
        setExecutionSteps(prev => [
          ...prev,
          {
            id: `step-${Date.now()}-tool`,
            type: 'tool',
            content: 'Searching for information related to the query...',
            timestamp: new Date().toISOString(),
            toolName: 'web-search',
            status: 'pending',
          }
        ]);
        
        // Update tool status to success
        setTimeout(() => {
          setExecutionSteps(prev => prev.map(step => 
            step.type === 'tool' && step.status === 'pending'
              ? { ...step, status: 'success' }
              : step
          ));
          
          // Add output step
          setTimeout(() => {
            setExecutionSteps(prev => [
              ...prev,
              {
                id: `step-${Date.now()}-output`,
                type: 'output',
                content: generateResponse(userInput),
                timestamp: new Date().toISOString(),
              }
            ]);
            
            // Complete execution
            setIsExecuting(false);
          }, 1500);
        }, 2000);
      }, 1500);
    }, 1000);
  };
  
  // Generate a simple response based on input (for demo purposes)
  const generateResponse = (userInput: string) => {
    return `Based on your request "${userInput}", I've analyzed the available information and found the following:
    
1. The query appears to be related to ${userInput.includes('how') ? 'a process or method' : 'information or facts'}.
2. I've searched relevant sources and compiled the most accurate information.
3. The answer takes into account the context and specifics of your question.

Let me know if you need any clarification or have follow-up questions!`;
  };
  
  // Stop execution
  const stopExecution = () => {
    setIsExecuting(false);
    
    // Add a stopped message
    setExecutionSteps(prev => [
      ...prev,
      {
        id: `step-${Date.now()}-output`,
        type: 'output',
        content: 'Execution stopped by user.',
        timestamp: new Date().toISOString(),
      }
    ]);
  };
  
  // Render execution step
  const renderExecutionStep = (step: ExecutionStep) => {
    switch (step.type) {
      case 'input':
        return (
          <div className="flex items-start mb-4">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-2 flex-shrink-0">
              <MessageSquare size={16} className="text-gray-600" />
            </div>
            <div className="bg-gray-100 rounded-lg p-3 max-w-[85%]">
              <p className="text-sm">{step.content}</p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(step.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        );
      
      case 'thinking':
        return (
          <div className="flex items-start mb-4">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2 flex-shrink-0">
              <Bot size={16} className="text-blue-600" />
            </div>
            <div className="bg-blue-50 rounded-lg p-3 max-w-[85%]">
              <div className="flex items-center">
                <Loader2 size={14} className="animate-spin mr-2 text-blue-500" />
                <p className="text-sm text-blue-700">{step.content}</p>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(step.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        );
      
      case 'tool':
        return (
          <div className="flex items-start mb-4">
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center mr-2 flex-shrink-0">
              <ArrowRight size={16} className="text-purple-600" />
            </div>
            <div className="bg-purple-50 rounded-lg p-3 max-w-[85%]">
              <div className="flex items-center">
                {step.status === 'pending' && (
                  <Loader2 size={14} className="animate-spin mr-2 text-purple-500" />
                )}
                {step.status === 'success' && (
                  <CheckCircle size={14} className="mr-2 text-green-500" />
                )}
                {step.status === 'error' && (
                  <XCircle size={14} className="mr-2 text-red-500" />
                )}
                <p className="text-sm text-purple-700">
                  <span className="font-medium">{step.toolName}: </span>
                  {step.content}
                </p>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(step.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        );
      
      case 'output':
        return (
          <div className="flex items-start mb-4">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-2 flex-shrink-0">
              <Bot size={16} className="text-green-600" />
            </div>
            <div className="bg-green-50 rounded-lg p-3 max-w-[85%]">
              <p className="text-sm whitespace-pre-wrap">{step.content}</p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(step.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <MagicCard className={`rounded-xl overflow-hidden ${className}`}>
      <ShineBorder borderRadius="0.75rem" className="p-0.5">
        <div className="bg-card rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center">
              <Bot className="mr-2 text-primary" size={20} />
              Agent Execution
            </h3>
            
            {executionId && (
              <div className="text-xs text-gray-500">
                ID: {executionId}
              </div>
            )}
          </div>
          
          {/* Progress bar */}
          {isExecuting && (
            <div className="w-full h-2 bg-gray-200 rounded-full mb-4 overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          )}
          
          {/* Execution steps */}
          <div className="border border-gray-200 rounded-md p-4 mb-4 h-[400px] overflow-y-auto">
            {executionSteps.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Bot size={48} className="text-gray-300 mb-2" />
                <p className="text-gray-500">No execution history</p>
                <p className="text-sm text-gray-400">
                  Enter a prompt and click Execute to start
                </p>
              </div>
            ) : (
              <div>
                {executionSteps.map(step => (
                  <div key={step.id}>
                    {renderExecutionStep(step)}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
          
          {/* Input form */}
          <div className="space-y-4">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary h-20"
              placeholder="Enter your prompt here..."
              disabled={isExecuting}
            />
            
            <div className="flex justify-end">
              {isExecuting ? (
                <ShimmerButton
                  onClick={stopExecution}
                  className="px-4 py-2 rounded-md font-medium bg-red-500 text-white"
                >
                  <StopCircle size={16} className="mr-2" />
                  Stop Execution
                </ShimmerButton>
              ) : (
                <ShimmerButton
                  onClick={executeAgent}
                  disabled={!input.trim()}
                  className="px-4 py-2 rounded-md font-medium bg-primary text-primary-foreground disabled:opacity-50"
                >
                  <Play size={16} className="mr-2" />
                  Execute Agent
                </ShimmerButton>
              )}
            </div>
            
            {/* Error message */}
            {error && (
              <div className="mt-2 text-sm text-red-600 flex items-center">
                <AlertCircle size={16} className="mr-1" />
                {error}
              </div>
            )}
          </div>
        </div>
      </ShineBorder>
    </MagicCard>
  );
}
