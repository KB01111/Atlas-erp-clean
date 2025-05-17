"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useCopilotReadable, useCopilotAction } from "@copilotkit/react-core";
import {
  FileText, Folder, Search, Upload, Download, Trash2, Loader2,
  Eye, AlertCircle, RefreshCw, FileUp, Filter, CheckCircle, X
} from "lucide-react";
import DocumentPreview from "@/components/DocumentPreview";
import { useRateLimit } from "@/context/RateLimitContext";
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text";
import { EnhancedCard } from "@/components/ui/enhanced-card";
import { EnhancedButton } from "@/components/ui/enhanced-button";
import { ErrorMessage } from "@/components/ui/error-message";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { EnhancedDocumentUploader } from "@/components/documents/EnhancedDocumentUploader";

// Document type definition
interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: string;
  url: string;
  category?: string;
  objectName: string;
  vectorEmbedding?: boolean;
}

// Document categories
const categories = [
  "All",
  "Financial",
  "Marketing",
  "HR",
  "Product",
  "Legal",
];

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showVectorOnly, setShowVectorOnly] = useState(false);
  const [isRefreshDisabled, setIsRefreshDisabled] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use the rate limit context
  const { rateLimitOperation, isRateLimited } = useRateLimit();

  // Fetch documents on component mount
  useEffect(() => {
    // Just call our fetchDocuments function for the initial load
    fetchDocuments();
  }, [fetchDocuments]);

  // Helper function to categorize documents by file type
  const categorizeByFileType = useCallback((fileType: string): string => {
    const typeMap: Record<string, string> = {
      'pdf': 'Documents',
      'doc': 'Documents',
      'docx': 'Documents',
      'xls': 'Financial',
      'xlsx': 'Financial',
      'csv': 'Financial',
      'jpg': 'Media',
      'jpeg': 'Media',
      'png': 'Media',
      'gif': 'Media',
      'mp4': 'Media',
      'zip': 'Archives',
      'rar': 'Archives',
    };

    return typeMap[fileType.toLowerCase()] || 'Other';
  }, []);

  // Base function to fetch documents from the API
  const fetchDocumentsBase = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/documents', {
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch documents: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.documents) {
        // Add file type from extension and format size
        const processedDocs = data.documents.map((doc: Document) => {
          const fileExtension = doc.name.split('.').pop() || '';
          return {
            ...doc,
            type: fileExtension,
            // Add a default category if none exists
            category: doc.category || categorizeByFileType(fileExtension),
          };
        });

        setDocuments(processedDocs);
      } else {
        setDocuments([]);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch documents');
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  }, [categorizeByFileType]);

  // Rate-limited version of fetchDocuments
  const fetchDocuments = useCallback(() => {
    // For the initial load, we don't want to apply rate limiting
    fetchDocumentsBase();
  }, [fetchDocumentsBase]);

  // Rate-limited version of fetchDocuments for UI interactions
  const handleRefresh = useCallback(() => {
    // If already loading, don't proceed
    if (isLoading) return;

    // Use the rate limit context to limit refresh operations
    rateLimitOperation(fetchDocumentsBase, {
      delay: 3000, // 3 seconds minimum between refreshes
      onLimitReached: () => {
        // Show visual feedback when rate limited
        setIsRefreshDisabled(true);
        setTimeout(() => {
          setIsRefreshDisabled(false);
        }, 1000); // Show the disabled state briefly for visual feedback
      }
    })();
  }, [isLoading, rateLimitOperation, fetchDocumentsBase]);



  // Make documents readable by the AI - must be at the top level of the component
  useCopilotReadable({
    name: "documents",
    description: "List of all documents in the system",
    value: documents,
  });

  // Search documents action for the AI - must be at the top level of the component
  useCopilotAction({
    name: "search_documents",
    description: "Search for documents by name or category",
    parameters: [
      {
        name: "query",
        type: "string",
        description: "Search query",
        required: false,
      },
      {
        name: "category",
        type: "string",
        description: "Document category",
        required: false,
      },
    ],
    handler: async ({ query, category }) => {
      let filteredDocs = [...documents];

      if (query) {
        filteredDocs = filteredDocs.filter(doc =>
          doc.name.toLowerCase().includes(query.toLowerCase())
        );
      }

      if (category && category !== "All") {
        filteredDocs = filteredDocs.filter(doc =>
          doc.category === category
        );
      }

      return filteredDocs;
    },
  });



  // Toggle document selection
  const toggleDocumentSelection = useCallback((id: string) => {
    if (selectedDocuments.includes(id)) {
      setSelectedDocuments(selectedDocuments.filter(docId => docId !== id));
    } else {
      setSelectedDocuments([...selectedDocuments, id]);
    }
  }, [selectedDocuments]);

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    try {
      setIsUploading(true);
      setUploadProgress(0);
      setError(null);

      // Validate file size (max 50MB)
      const maxSize = 50 * 1024 * 1024; // 50MB in bytes
      if (files[0].size > maxSize) {
        throw new Error(`File size exceeds the maximum limit of 50MB`);
      }

      // Create FormData and append the file
      const formData = new FormData();
      formData.append('file', files[0]);

      // Add category if selected
      if (selectedCategory !== 'All') {
        formData.append('category', selectedCategory);
      }

      // Add vectorize flag
      formData.append('vectorize', 'true');

      // Create a custom fetch with upload progress
      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      });

      // Create a promise to handle the XHR request
      const uploadPromise = new Promise<any>((resolve, reject) => {
        xhr.open('POST', '/api/documents/upload');

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch (e) {
              reject(new Error('Invalid response format'));
            }
          } else {
            try {
              const errorData = JSON.parse(xhr.responseText);
              reject(new Error(errorData.error || `Upload failed with status ${xhr.status}`));
            } catch (e) {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          }
        };

        xhr.onerror = () => {
          reject(new Error('Network error occurred during upload'));
        };

        xhr.send(formData);
      });

      // Wait for the upload to complete
      const result = await uploadPromise;

      // Set upload progress to 100% when done
      setUploadProgress(100);

      // Refresh the documents list
      await fetchDocuments();

      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Show success message
      alert(`File "${files[0].name}" uploaded successfully!`);

    } catch (error) {
      console.error('Error uploading document:', error);
      setError(error instanceof Error ? error.message : 'Failed to upload document');
    } finally {
      setIsUploading(false);
      // Reset progress after a delay
      setTimeout(() => setUploadProgress(0), 3000);
    }
  };

  // Delete selected documents
  const deleteSelectedDocuments = useCallback(async () => {
    if (selectedDocuments.length === 0) return;

    if (confirm(`Are you sure you want to delete ${selectedDocuments.length} document(s)?`)) {
      try {
        setIsLoading(true);

        // Delete each selected document
        for (const docId of selectedDocuments) {
          await fetch('/api/documents', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id: docId }),
          });
        }

        // Refresh the documents list
        await fetchDocuments();
        setSelectedDocuments([]);
      } catch (error) {
        console.error('Error deleting documents:', error);
        alert('Failed to delete some documents. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  }, [selectedDocuments, fetchDocuments]);

  // Preview a document
  const handlePreviewDocument = useCallback((doc: Document) => {
    setPreviewDocument(doc);
  }, []);

  // Close document preview
  const closePreview = useCallback(() => {
    setPreviewDocument(null);
  }, []);

  // Download a document
  const downloadDocument = useCallback((doc: Document) => {
    window.open(doc.url, '_blank');
  }, []);

  // Download selected documents
  const downloadSelectedDocuments = useCallback(() => {
    const selectedDocs = documents.filter(doc => selectedDocuments.includes(doc.id));
    selectedDocs.forEach(doc => {
      window.open(doc.url, '_blank');
    });
  }, [documents, selectedDocuments]);

  // Filter documents based on search query, selected category, and vector embedding flag
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || doc.category === selectedCategory;
    const matchesVectorFilter = !showVectorOnly || doc.vectorEmbedding;
    return matchesSearch && matchesCategory && matchesVectorFilter;
  });

  // Get file icon based on type
  const getFileIcon = (type: string) => {
    const iconMap: Record<string, JSX.Element> = {
      'pdf': <FileText size={20} className="text-red-500" />,
      'doc': <FileText size={20} className="text-blue-500" />,
      'docx': <FileText size={20} className="text-blue-500" />,
      'xls': <FileText size={20} className="text-green-500" />,
      'xlsx': <FileText size={20} className="text-green-500" />,
      'csv': <FileText size={20} className="text-green-500" />,
      'jpg': <FileText size={20} className="text-purple-500" />,
      'jpeg': <FileText size={20} className="text-purple-500" />,
      'png': <FileText size={20} className="text-purple-500" />,
      'zip': <FileText size={20} className="text-orange-500" />,
      'rar': <FileText size={20} className="text-orange-500" />,
    };

    return iconMap[type.toLowerCase()] || <FileText size={20} />;
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">
          <AnimatedGradientText>Documents</AnimatedGradientText>
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isLoading || isRefreshDisabled}
            className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 px-2 py-1 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Document Uploader */}
        <div className="md:col-span-1">
          <EnhancedDocumentUploader
            onUploadComplete={(result) => {
              // Refresh the documents list after upload
              fetchDocuments();
            }}
          />
        </div>

        {/* Document List */}
        <div className="md:col-span-2">
          {isLoading ? (
            <LoadingState message="Loading documents..." variant="card" size="medium" />
          ) : error ? (
            <ErrorMessage message={error} variant="error" size="sm" onRetry={handleRefresh} />
          ) : documents.length === 0 ? (
            <EmptyState
              title="No documents found"
              description="Upload your first document to get started"
              icon={<FileText size={48} className="text-gray-400" />}
            />
          ) : (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Document Library</h2>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      placeholder="Search documents..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
                    />
                  </div>

                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>

                  <div className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      id="vectorOnly"
                      checked={showVectorOnly}
                      onChange={(e) => setShowVectorOnly(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="vectorOnly" className="text-sm text-gray-700">
                      Vectorized Only
                    </label>
                  </div>
                </div>
              </div>

              <div className="mt-2 text-sm text-gray-500">
                Showing {filteredDocuments.length} of {documents.length} documents
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3">
                {filteredDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-md hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="text-indigo-600" size={20} />
                      <div>
                        <div className="font-medium">{doc.name}</div>
                        <div className="text-sm text-gray-500">
                          {formatFileSize(doc.size)} • {new Date(doc.uploadedAt).toLocaleDateString()}
                        </div>
                      </div>
                      {doc.vectorEmbedding && (
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                          Vectorized
                        </span>
                      )}
                      {doc.category && (
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                          {doc.category}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePreviewDocument(doc)}
                        className="p-1 text-gray-500 hover:text-indigo-600"
                        title="Preview"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => downloadDocument(doc)}
                        className="p-1 text-gray-500 hover:text-indigo-600"
                        title="Download"
                      >
                        <Download size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Document Preview Modal */}
      {previewDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">{previewDocument.name}</h3>
              <button
                onClick={closePreview}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <DocumentPreview document={previewDocument} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
