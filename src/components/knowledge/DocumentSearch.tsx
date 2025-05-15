"use client";

import React, { useState, useEffect } from 'react';
import { MagicCard } from "@/components/magicui/magic-card";
import { ShineBorder } from "@/components/ui/shine-border";
import { ShimmerButton } from "@/components/magicui/shimmer-button";
import { NodeType } from '@/lib/arango-knowledge-service';
import { FileText, Search, Loader2, AlertCircle, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';

interface DocumentSearchProps {
  onDocumentSelected: (document: any) => void;
  className?: string;
}

export default function DocumentSearch({
  onDocumentSelected,
  className = '',
}: DocumentSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [expandedDocumentId, setExpandedDocumentId] = useState<string | null>(null);

  // Load documents on mount
  useEffect(() => {
    loadDocuments();
  }, []);

  // Load all documents
  const loadDocuments = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/knowledge/documents');
      
      if (!response.ok) {
        throw new Error('Failed to load documents');
      }

      const data = await response.json();
      setDocuments(data.documents || []);
    } catch (err) {
      setError((err as Error).message || 'Failed to load documents');
      console.error('Error loading documents:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Search documents
  const searchDocuments = async () => {
    if (!searchQuery.trim()) {
      loadDocuments();
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/knowledge/documents?query=${encodeURIComponent(searchQuery)}`);
      
      if (!response.ok) {
        throw new Error('Failed to search documents');
      }

      const data = await response.json();
      setDocuments(data.documents || []);
    } catch (err) {
      setError((err as Error).message || 'Failed to search documents');
      console.error('Error searching documents:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle document selection
  const handleDocumentSelect = (document: any) => {
    onDocumentSelected(document);
  };

  // Toggle document expansion
  const toggleDocumentExpansion = (documentId: string) => {
    setExpandedDocumentId(expandedDocumentId === documentId ? null : documentId);
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (e) {
      return 'Unknown date';
    }
  };

  return (
    <MagicCard className={`rounded-xl overflow-hidden ${className}`}>
      <ShineBorder borderRadius="0.75rem" className="p-0.5">
        <div className="bg-card rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Search className="mr-2 text-primary" size={20} />
            Document Search
          </h3>
          
          <div className="space-y-4">
            {/* Search input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchDocuments()}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="Search documents..."
              />
              <ShimmerButton
                onClick={searchDocuments}
                disabled={isLoading}
                className="px-4 py-2 rounded-md font-medium bg-primary text-primary-foreground disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Search size={16} />
                )}
              </ShimmerButton>
            </div>
            
            {/* Error message */}
            {error && (
              <div className="mt-2 text-sm text-red-600 flex items-center">
                <AlertCircle size={16} className="mr-1" />
                {error}
              </div>
            )}
            
            {/* Document list */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {isLoading && documents.length === 0 ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 size={24} className="animate-spin text-primary" />
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText size={32} className="mx-auto mb-2 opacity-50" />
                  <p>No documents found</p>
                </div>
              ) : (
                documents.map((document) => (
                  <div
                    key={document.id}
                    className="border border-gray-200 rounded-md p-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-2">
                        <FileText className="text-primary mt-1" size={18} />
                        <div>
                          <h4 
                            className="font-medium text-gray-900 cursor-pointer hover:text-primary"
                            onClick={() => handleDocumentSelect(document)}
                          >
                            {document.name}
                          </h4>
                          <p className="text-xs text-gray-500">
                            {document.metadata?.fileType || 'Text'} • 
                            {document.metadata?.fileSize 
                              ? ` ${(document.metadata.fileSize / 1024).toFixed(2)} KB • ` 
                              : ' '}
                            {document.metadata?.uploadedAt 
                              ? formatDate(document.metadata.uploadedAt)
                              : formatDate(document.createdAt)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleDocumentExpansion(document.id)}
                        className="p-1 rounded-full hover:bg-gray-200"
                      >
                        {expandedDocumentId === document.id ? (
                          <ChevronUp size={16} />
                        ) : (
                          <ChevronDown size={16} />
                        )}
                      </button>
                    </div>
                    
                    {expandedDocumentId === document.id && (
                      <div className="mt-2 pl-6">
                        <p className="text-sm text-gray-700 line-clamp-3">
                          {document.content}
                        </p>
                        <div className="mt-2 flex justify-end">
                          <button
                            onClick={() => handleDocumentSelect(document)}
                            className="text-xs text-primary flex items-center hover:underline"
                          >
                            View in Knowledge Graph
                            <ExternalLink size={12} className="ml-1" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </ShineBorder>
    </MagicCard>
  );
}
