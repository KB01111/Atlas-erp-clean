"use client";

import React, { useState, useRef } from 'react';
import { EnhancedCard } from "@/components/ui/enhanced-card";
import { BorderContainer } from "@/components/ui/shine-border";
import { EnhancedActionButton } from "@/components/ui/enhanced-action-button";
import { NodeType } from '@/lib/arango-knowledge-service';
import { FileText, Upload, X, Check, AlertCircle, Loader2 } from 'lucide-react';

interface DocumentUploaderProps {
  onDocumentProcessed: (document: unknown, chunks: unknown[]) => void;
  className?: string;
}

export default function DocumentUploader({
  onDocumentProcessed,
  className = '',
}: DocumentUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [documentName, setDocumentName] = useState('');
  const [documentContent, setDocumentContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setDocumentName(selectedFile.name);
    setError(null);
    setSuccess(false);

    // Read text file content
    if (selectedFile.type === 'text/plain' || 
        selectedFile.type === 'application/json' || 
        selectedFile.type === 'text/markdown' ||
        selectedFile.type === 'text/csv') {
      try {
        const text = await selectedFile.text();
        setDocumentContent(text);
      } catch (err) {
        setError('Failed to read file content');
        console.error('Error reading file:', err);
      }
    } else {
      setError('Only text files are supported for now');
      setDocumentContent('');
    }
  };

  // Handle document processing
  const handleProcessDocument = async () => {
    if (!documentContent || !documentName) {
      setError('Document content and name are required');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/knowledge/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: documentContent,
          name: documentName,
          metadata: {
            fileName: file?.name,
            fileType: file?.type,
            fileSize: file?.size,
            uploadedAt: new Date().toISOString(),
          },
          chunkSize: 1000,
          chunkOverlap: 200,
          maxChunks: 20,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process document');
      }

      const data = await response.json();
      setSuccess(true);
      
      // Call the callback with the processed document
      onDocumentProcessed(data.document, data.chunks);
      
      // Reset form after successful processing
      setTimeout(() => {
        setFile(null);
        setDocumentName('');
        setDocumentContent('');
        setSuccess(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 2000);
    } catch (err) {
      setError((err as Error).message || 'Failed to process document');
      console.error('Error processing document:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <EnhancedCard className={`rounded-xl overflow-hidden ${className}`} interactive hoverEffect="shadow">
      <BorderContainer borderRadius="0.75rem" className="p-0.5" variant="primary" rounded="xl">
        <div className="bg-card rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <FileText className="mr-2 text-primary" size={20} />
            Document Upload
          </h3>
          
          <div className="space-y-4">
            {/* File input */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".txt,.md,.json,.csv"
              />
              
              {!file ? (
                <div>
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">
                    Drag and drop a file here, or{' '}
                    <button
                      type="button"
                      className="text-primary hover:text-primary/80"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      browse
                    </button>
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Supported formats: TXT, MD, JSON, CSV
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="h-10 w-10 text-primary" />
                    <div className="ml-4 text-left">
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="p-1 rounded-full bg-gray-200 hover:bg-gray-300"
                    onClick={() => {
                      setFile(null);
                      setDocumentName('');
                      setDocumentContent('');
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>
            
            {/* Document name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Document Name
              </label>
              <input
                type="text"
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="Enter document name"
              />
            </div>
            
            {/* Process button */}
            <div className="flex justify-end">
              <EnhancedActionButton
                onClick={handleProcessDocument}
                disabled={isLoading || !documentContent || !documentName}
                className="px-4 py-2 rounded-md font-medium bg-primary text-primary-foreground disabled:opacity-50"
               variant="default" size="sm" hover="lift">
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    Processing...
                  </>
                ) : success ? (
                  <>
                    <Check size={16} className="mr-2" />
                    Processed
                  </>
                ) : (
                  <>
                    <FileText size={16} className="mr-2" />
                    Process Document
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
            
            {/* Success message */}
            {success && (
              <div className="mt-2 text-sm text-green-600 flex items-center">
                <Check size={16} className="mr-1" />
                Document processed successfully
              </div>
            )}
          </div>
        </div>
      </BorderContainer>
    </EnhancedCard>
  );
}
