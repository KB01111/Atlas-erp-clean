"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Upload, FileText, Check } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Progress } from "@/components/ui/progress";
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text";
import { EnhancedActionButton } from "@/components/ui/enhanced-action-button";
import { EnhancedCard } from "@/components/ui/enhanced-card";

interface UploadResult {
  success: boolean;
  document: {
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
    category: string;
    uploadedAt: string;
    vectorEmbedding: boolean;
    processed: boolean;
    knowledgeGraph: boolean;
  };
  vectorized: boolean;
  processed: boolean;
  knowledgeGraph: boolean;
  knowledgeNode?: {
    id: string;
    type: string;
    name: string;
  };
}

export function EnhancedDocumentUploader({ onUploadComplete }: { onUploadComplete?: (result: UploadResult) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [category, setCategory] = useState("Documents");
  const [useVectorEmbedding, setUseVectorEmbedding] = useState(true);
  const [useUnstructured, setUseUnstructured] = useState(true);
  const [extractEntities, setExtractEntities] = useState(true);
  const [addToKnowledgeGraph, setAddToKnowledgeGraph] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setUploadResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Create a progress simulation
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 5;
        });
      }, 500);

      // Create form data
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", category);
      formData.append("vectorize", useVectorEmbedding.toString());
      formData.append("useUnstructured", useUnstructured.toString());
      formData.append("extractEntities", extractEntities.toString());
      formData.append("addToKnowledgeGraph", addToKnowledgeGraph.toString());

      // Upload file
      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Upload failed with status: ${response.status}`);
      }

      const result = await response.json();
      setUploadResult(result);

      toast({
        title: "Upload successful",
        description: `${file.name} has been uploaded successfully`,
      });

      // Call the callback if provided
      if (onUploadComplete) {
        onUploadComplete(result);
      }

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Reset file state after a delay
      setTimeout(() => {
        setFile(null);
        setUploadProgress(0);
      }, 3000);
    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        title: "Upload failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <EnhancedCard className="w-full" interactive hoverEffect="shadow">
      <Card className="w-full border-none bg-transparent">
        <CardHeader>
          <CardTitle>
            <AnimatedGradientText>Enhanced Document Upload</AnimatedGradientText>
          </CardTitle>
          <CardDescription>
            Upload documents with AI processing and knowledge graph integration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="file">Document</Label>
              <Input
                id="file"
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                disabled={isUploading}
              />
            </div>

            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={isUploading}
              >
                <option value="Documents">Documents</option>
                <option value="Financial">Financial</option>
                <option value="Marketing">Marketing</option>
                <option value="HR">HR</option>
                <option value="Legal">Legal</option>
                <option value="Media">Media</option>
                <option value="Archives">Archives</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="vectorEmbedding"
                  checked={useVectorEmbedding}
                  onCheckedChange={setUseVectorEmbedding}
                  disabled={isUploading}
                />
                <Label htmlFor="vectorEmbedding">Vector Embedding</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="useUnstructured"
                  checked={useUnstructured}
                  onCheckedChange={setUseUnstructured}
                  disabled={isUploading}
                />
                <Label htmlFor="useUnstructured">Use unstructured.io</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="extractEntities"
                  checked={extractEntities}
                  onCheckedChange={setExtractEntities}
                  disabled={isUploading || !useUnstructured}
                />
                <Label htmlFor="extractEntities">Extract Entities</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="addToKnowledgeGraph"
                  checked={addToKnowledgeGraph}
                  onCheckedChange={setAddToKnowledgeGraph}
                  disabled={isUploading || !useUnstructured}
                />
                <Label htmlFor="addToKnowledgeGraph">Add to Knowledge Graph</Label>
              </div>
            </div>

            {isUploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Uploading...</span>
                  <span className="text-sm font-medium">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            {uploadResult && (
              <div className="rounded-md bg-muted p-4">
                <div className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-2" />
                  <h4 className="font-medium">Upload Complete</h4>
                </div>
                <div className="mt-2 text-sm space-y-1">
                  <p>Document: {uploadResult.document.name}</p>
                  <p>Size: {Math.round(uploadResult.document.size / 1024)} KB</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {uploadResult.vectorized && (
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                        Vectorized
                      </span>
                    )}
                    {uploadResult.processed && (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-300">
                        Processed
                      </span>
                    )}
                    {uploadResult.knowledgeGraph && (
                      <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                        Knowledge Graph
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <EnhancedActionButton
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="w-full"
           variant="default" size="sm" hover="lift">
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload Document
              </>
            )}
          </EnhancedActionButton>
        </CardFooter>
      </Card>
    </EnhancedCard>
  );
}
