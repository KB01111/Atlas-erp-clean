"use client";

import { useState, useEffect } from "react";
import { X, Download, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

interface DocumentPreviewProps {
  document: {
    id: string;
    name: string;
    type: string;
    url: string;
  } | null;
  onClose: () => void;
}

export default function DocumentPreview({ document, onClose }: DocumentPreviewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (document) {
      setIsLoading(true);
      setError(null);
    }
  }, [document]);

  if (!document) return null;

  const fileExtension = document.name.split('.').pop()?.toLowerCase() || '';
  
  // Determine the appropriate preview component based on file type
  const renderPreview = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <Loader2 size={48} className="animate-spin text-indigo-600 mb-4" />
          <p className="text-slate-600">Loading preview...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <p className="text-red-600 mb-4">{error}</p>
          <a 
            href={document.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Download to view
          </a>
        </div>
      );
    }

    // Images
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileExtension)) {
      return (
        <img 
          src={document.url} 
          alt={document.name} 
          className="max-w-full max-h-full object-contain"
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setError("Failed to load image");
          }}
        />
      );
    }
    
    // PDFs
    if (fileExtension === 'pdf') {
      return (
        <iframe 
          src={`${document.url}#toolbar=0`} 
          className="w-full h-full"
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setError("Failed to load PDF");
          }}
        />
      );
    }
    
    // Text files
    if (['txt', 'md', 'json', 'csv'].includes(fileExtension)) {
      return (
        <iframe 
          src={document.url} 
          className="w-full h-full bg-white"
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setError("Failed to load text file");
          }}
        />
      );
    }
    
    // Video files
    if (['mp4', 'webm', 'ogg'].includes(fileExtension)) {
      return (
        <video 
          src={document.url} 
          controls 
          className="max-w-full max-h-full"
          onLoadedData={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setError("Failed to load video");
          }}
        />
      );
    }
    
    // Audio files
    if (['mp3', 'wav', 'ogg'].includes(fileExtension)) {
      return (
        <audio 
          src={document.url} 
          controls 
          className="w-full mt-20"
          onLoadedData={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setError("Failed to load audio");
          }}
        />
      );
    }
    
    // Unsupported file type
    setIsLoading(false);
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-slate-600 mb-4">Preview not available for this file type</p>
        <a 
          href={document.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Download to view
        </a>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-medium">{document.name}</h3>
          <div className="flex items-center gap-2">
            <a 
              href={document.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-2 text-slate-600 hover:text-indigo-600 rounded-full"
              title="Download"
            >
              <Download size={20} />
            </a>
            <button 
              onClick={onClose}
              className="p-2 text-slate-600 hover:text-red-600 rounded-full"
              title="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        
        {/* Preview Content */}
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-100">
          {renderPreview()}
        </div>
      </div>
    </div>
  );
}
