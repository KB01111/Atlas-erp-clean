"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useCopilotReadable, useCopilotAction } from "@copilotkit/react-core";
import {
  FileText, Folder, Search, Upload, Download, Trash2, Loader2,
  Eye, AlertCircle, RefreshCw, FileUp, Filter
} from "lucide-react";
import DocumentPreview from "@/components/DocumentPreview";
import { useRateLimit } from "@/context/RateLimitContext";

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
      <h1 className="text-3xl font-bold">Documents</h1>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowVectorOnly(!showVectorOnly)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-md ${
              showVectorOnly
                ? 'bg-indigo-100 border-indigo-300 text-indigo-700'
                : 'bg-white border-slate-300 text-slate-700'
            }`}
            title={showVectorOnly ? "Showing only documents with vector embeddings" : "Show all documents"}
          >
            <Filter size={18} />
            <span>AI Searchable</span>
          </button>
          <button
            onClick={handleRefresh}
            className={`flex items-center gap-2 px-4 py-2 border rounded-md ${
              isLoading || isRefreshDisabled || isRateLimited
                ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
            }`}
            disabled={isLoading || isRefreshDisabled || isRateLimited}
            title={
              isRateLimited
                ? "Rate limited. Please wait before refreshing again"
                : isRefreshDisabled
                  ? "Please wait before refreshing again"
                  : "Refresh documents"
            }
          >
            <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
            <span>
              {isLoading
                ? "Loading..."
                : isRateLimited
                  ? "Rate limited..."
                  : isRefreshDisabled
                    ? "Please wait..."
                    : "Refresh"
              }
            </span>
          </button>
        </div>
        <label className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 cursor-pointer">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />
          {isUploading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <FileUp size={18} />
          )}
          <span>{isUploading ? `Uploading ${uploadProgress}%` : 'Upload'}</span>
        </label>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-md">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Upload Progress */}
      {isUploading && uploadProgress > 0 && (
        <div className="w-full bg-slate-200 rounded-full h-2.5">
          <div
            className="bg-indigo-600 h-2.5 rounded-full"
            style={{ width: `${uploadProgress}%` }}
          ></div>
        </div>
      )}

      {/* Actions Bar */}
      {selectedDocuments.length > 0 && (
        <div className="flex items-center gap-4 p-3 bg-slate-100 rounded-md">
          <span className="text-slate-600">
            {selectedDocuments.length} document(s) selected
          </span>
          <div className="flex-1"></div>
          <button
            onClick={downloadSelectedDocuments}
            className="flex items-center gap-1 px-3 py-1 text-slate-600 hover:text-slate-900"
          >
            <Download size={18} />
            <span>Download</span>
          </button>
          <button
            onClick={deleteSelectedDocuments}
            className="flex items-center gap-1 px-3 py-1 text-red-600 hover:text-red-800"
          >
            <Trash2 size={18} />
            <span>Delete</span>
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-8">
          <Loader2 size={32} className="animate-spin text-indigo-600" />
          <span className="ml-2 text-slate-600">Loading documents...</span>
        </div>
      )}

      {/* Documents Table */}
      {!isLoading && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="w-12 px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedDocuments.length === filteredDocuments.length && filteredDocuments.length > 0}
                    onChange={() => {
                      if (selectedDocuments.length === filteredDocuments.length) {
                        setSelectedDocuments([]);
                      } else {
                        setSelectedDocuments(filteredDocuments.map(doc => doc.id));
                      }
                    }}
                    className="rounded"
                  />
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Name</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Category</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Size</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Last Modified</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">AI Searchable</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredDocuments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    No documents found
                  </td>
                </tr>
              ) : (
                filteredDocuments.map((doc) => (
                  <tr
                    key={doc.id}
                    className={`hover:bg-slate-50 ${
                      selectedDocuments.includes(doc.id) ? "bg-indigo-50" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedDocuments.includes(doc.id)}
                        onChange={() => toggleDocumentSelection(doc.id)}
                        className="rounded"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {getFileIcon(doc.type)}
                        <span>{doc.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{doc.category}</td>
                    <td className="px-4 py-3 text-slate-600">{formatFileSize(doc.size)}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(doc.uploadedAt)}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {doc.vectorEmbedding ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Yes
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                          No
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handlePreviewDocument(doc)}
                          className="p-1 text-slate-600 hover:text-indigo-600"
                          title="Preview"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => downloadDocument(doc)}
                          className="p-1 text-slate-600 hover:text-indigo-600"
                          title="Download"
                        >
                          <Download size={16} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete "${doc.name}"?`)) {
                              setSelectedDocuments([doc.id]);
                              deleteSelectedDocuments();
                            }
                          }}
                          className="p-1 text-slate-600 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Document Preview Modal */}
      {previewDocument && (
        <DocumentPreview
          document={previewDocument}
          onClose={closePreview}
        />
      )}
    </div>
  );
}
