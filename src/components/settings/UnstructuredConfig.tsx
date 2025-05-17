"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text";

interface UnstructuredConfig {
  endpoint: string;
  apiKey?: string;
  useDocker: boolean;
  dockerContainer?: string;
  options?: Record<string, any>;
}

export function UnstructuredConfig() {
  const [config, setConfig] = useState<UnstructuredConfig | null>(null);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  // Fetch current configuration
  useEffect(() => {
    async function fetchConfig() {
      try {
        setIsLoading(true);
        const response = await fetch("/api/unstructured/config");
        
        if (!response.ok) {
          throw new Error(`Failed to fetch configuration: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        setConfig(data.config);
        setIsAvailable(data.available);
      } catch (error) {
        console.error("Error fetching unstructured.io configuration:", error);
        toast({
          title: "Error",
          description: `Failed to fetch unstructured.io configuration: ${(error as Error).message}`,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchConfig();
  }, []);

  // Save configuration
  const handleSave = async () => {
    if (!config) return;
    
    try {
      setIsSaving(true);
      
      const response = await fetch("/api/unstructured/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ config }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to save configuration: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setConfig(data.config);
      setIsAvailable(data.available);
      
      toast({
        title: "Success",
        description: "unstructured.io configuration saved successfully",
      });
    } catch (error) {
      console.error("Error saving unstructured.io configuration:", error);
      toast({
        title: "Error",
        description: `Failed to save unstructured.io configuration: ${(error as Error).message}`,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Check health
  const checkHealth = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch("/api/unstructured/health");
      
      if (!response.ok) {
        throw new Error(`Failed to check health: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setIsAvailable(data.status === "healthy");
      
      toast({
        title: data.status === "healthy" ? "Success" : "Warning",
        description: data.message,
        variant: data.status === "healthy" ? "default" : "destructive",
      });
    } catch (error) {
      console.error("Error checking unstructured.io health:", error);
      toast({
        title: "Error",
        description: `Failed to check unstructured.io health: ${(error as Error).message}`,
        variant: "destructive",
      });
      setIsAvailable(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !config) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>unstructured.io Configuration</CardTitle>
          <CardDescription>Configure unstructured.io for enhanced document processing</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>
              <AnimatedGradientText>unstructured.io Configuration</AnimatedGradientText>
            </CardTitle>
            <CardDescription>Configure unstructured.io for enhanced document processing</CardDescription>
          </div>
          <Badge variant={isAvailable ? "success" : "destructive"}>
            {isAvailable ? "Available" : "Unavailable"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general">
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="useDocker">Use Docker</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="useDocker"
                    checked={config?.useDocker}
                    onCheckedChange={(checked) => setConfig(prev => prev ? { ...prev, useDocker: checked } : null)}
                  />
                  <span>{config?.useDocker ? "Using local Docker container" : "Using cloud API"}</span>
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="endpoint">API Endpoint</Label>
                <Input
                  id="endpoint"
                  value={config?.endpoint || ""}
                  onChange={(e) => setConfig(prev => prev ? { ...prev, endpoint: e.target.value } : null)}
                  placeholder="http://localhost:8000/general/v0/general"
                />
              </div>
              
              {config?.useDocker ? (
                <div className="grid gap-2">
                  <Label htmlFor="dockerContainer">Docker Container Name</Label>
                  <Input
                    id="dockerContainer"
                    value={config?.dockerContainer || ""}
                    onChange={(e) => setConfig(prev => prev ? { ...prev, dockerContainer: e.target.value } : null)}
                    placeholder="unstructured"
                  />
                </div>
              ) : (
                <div className="grid gap-2">
                  <Label htmlFor="apiKey">API Key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    value={config?.apiKey || ""}
                    onChange={(e) => setConfig(prev => prev ? { ...prev, apiKey: e.target.value } : null)}
                    placeholder="Enter your unstructured.io API key"
                  />
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="advanced">
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label>Default Chunking Strategy</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={config?.options?.chunking_strategy || "by_title"}
                  onChange={(e) => setConfig(prev => prev ? {
                    ...prev,
                    options: {
                      ...prev.options,
                      chunking_strategy: e.target.value
                    }
                  } : null)}
                >
                  <option value="by_title">By Title</option>
                  <option value="by_paragraph">By Paragraph</option>
                  <option value="none">None</option>
                </select>
              </div>
              
              <div className="grid gap-2">
                <Label>Processing Strategy</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={config?.options?.strategy || "auto"}
                  onChange={(e) => setConfig(prev => prev ? {
                    ...prev,
                    options: {
                      ...prev.options,
                      strategy: e.target.value
                    }
                  } : null)}
                >
                  <option value="auto">Auto</option>
                  <option value="hi_res">High Resolution</option>
                  <option value="fast">Fast</option>
                </select>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={checkHealth} disabled={isLoading || isSaving}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : isAvailable ? <CheckCircle className="mr-2 h-4 w-4" /> : <XCircle className="mr-2 h-4 w-4" />}
          Check Connection
        </Button>
        <Button onClick={handleSave} disabled={isLoading || isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Configuration
        </Button>
      </CardFooter>
    </Card>
  );
}
