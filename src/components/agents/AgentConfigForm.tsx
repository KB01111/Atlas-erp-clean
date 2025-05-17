"use client";

import React, { useState, useEffect } from 'react';
import { EnhancedCard } from "@/components/ui/enhanced-card";
import { BorderContainer } from "@/components/ui/shine-border";
import { EnhancedActionButton } from "@/components/ui/enhanced-action-button";
import { Agent } from '@/lib/agent-service';
import { Loader2, Save, AlertCircle, Check, Bot, Brain, Settings, Zap } from 'lucide-react';

interface AgentConfigFormProps {
  agent?: Agent;
  onSave: (agent: Agent) => Promise<void>;
  className?: string;
}

export default function AgentConfigForm({
  agent,
  onSave,
  className = '',
}: AgentConfigFormProps) {
  const [name, setName] = useState(agent?.name || '');
  const [description, setDescription] = useState(agent?.description || '');
  const [prompt, setPrompt] = useState(agent?.prompt || '');
  const [model, setModel] = useState(agent?.model || 'gpt-3.5-turbo');
  const [temperature, setTemperature] = useState(agent?.temperature?.toString() || '0.7');
  const [maxTokens, setMaxTokens] = useState(agent?.maxTokens?.toString() || '1000');
  const [tools, setTools] = useState<string[]>(agent?.tools || []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [availableTools, setAvailableTools] = useState<string[]>([
    'web-search',
    'web-browser',
    'calculator',
    'knowledge-graph',
    'file-system',
    'code-interpreter',
    'image-generation',
  ]);
  const [activeTab, setActiveTab] = useState<'basic' | 'advanced' | 'tools'>('basic');

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !prompt) {
      setError('Name and prompt are required');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      const updatedAgent: Agent = {
        id: agent?.id || '',
        name,
        description,
        prompt,
        model,
        temperature: parseFloat(temperature),
        maxTokens: parseInt(maxTokens),
        tools,
        createdAt: agent?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      await onSave(updatedAgent);
      setSuccess(true);
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      setError((err as Error).message || 'Failed to save agent');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle tool toggle
  const toggleTool = (tool: string) => {
    if (tools.includes(tool)) {
      setTools(tools.filter(t => t !== tool));
    } else {
      setTools([...tools, tool]);
    }
  };

  return (
    <EnhancedCard className={`rounded-xl overflow-hidden ${className}`} interactive hoverEffect="shadow">
      <BorderContainer borderRadius="0.75rem" className="p-0.5" variant="primary" rounded="xl">
        <div className="bg-card rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Bot className="mr-2 text-primary" size={20} />
            Agent Configuration
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-4">
              <button
                type="button"
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === 'basic' 
                    ? 'text-primary border-b-2 border-primary' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('basic')}
              >
                Basic
              </button>
              <button
                type="button"
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === 'advanced' 
                    ? 'text-primary border-b-2 border-primary' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('advanced')}
              >
                Advanced
              </button>
              <button
                type="button"
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === 'tools' 
                    ? 'text-primary border-b-2 border-primary' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('tools')}
              >
                Tools
              </button>
            </div>
            
            {/* Basic tab */}
            {activeTab === 'basic' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                    placeholder="Enter agent name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary h-20"
                    placeholder="Enter agent description"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prompt
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary h-40 font-mono text-sm"
                    placeholder="Enter agent prompt"
                  />
                </div>
              </div>
            )}
            
            {/* Advanced tab */}
            {activeTab === 'advanced' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Model
                  </label>
                  <select
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                  >
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                    <option value="gpt-4">GPT-4</option>
                    <option value="gpt-4-turbo">GPT-4 Turbo</option>
                    <option value="claude-3-opus">Claude 3 Opus</option>
                    <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                    <option value="claude-3-haiku">Claude 3 Haiku</option>
                    <option value="gemini-pro">Gemini Pro</option>
                    <option value="llama-3-70b">Llama 3 70B</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Temperature ({temperature})
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value)}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Precise</span>
                    <span>Creative</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Tokens
                  </label>
                  <input
                    type="number"
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                    placeholder="Enter max tokens"
                    min="1"
                    max="8192"
                  />
                </div>
              </div>
            )}
            
            {/* Tools tab */}
            {activeTab === 'tools' && (
              <div className="space-y-4">
                <p className="text-sm text-gray-500">
                  Select the tools this agent can use:
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {availableTools.map((tool) => (
                    <div
                      key={tool}
                      className={`flex items-center p-3 rounded-md border cursor-pointer ${
                        tools.includes(tool) 
                          ? 'border-primary bg-primary/5' 
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => toggleTool(tool)}
                    >
                      <input
                        type="checkbox"
                        checked={tools.includes(tool)}
                        onChange={() => toggleTool(tool)}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium">{tool.replace(/-/g, ' ')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Form actions */}
            <div className="flex justify-end">
              <EnhancedActionButton
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 rounded-md font-medium bg-primary text-primary-foreground disabled:opacity-50"
               variant="default" size="sm" hover="lift">
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    Saving...
                  </>
                ) : success ? (
                  <>
                    <Check size={16} className="mr-2" />
                    Saved
                  </>
                ) : (
                  <>
                    <Save size={16} className="mr-2" />
                    Save Agent
                  </>
                )}
              </EnhancedActionButton>
            </div>
            
            {/* Error message */}
            {error && (
              <div className="mt-2 text-sm text-red-600 flex items-center">
                <AlertCircle size={16} className="mr-1" />
                {error}
              </div>
            )}
          </form>
        </div>
      </BorderContainer>
    </EnhancedCard>
  );
}
