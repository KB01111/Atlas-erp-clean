/**
 * Unstructured.io Service
 * 
 * This module provides integration with unstructured.io for enhanced document processing.
 * It supports both local Docker and cloud API integration options.
 * 
 * Unstructured.io is used to extract structured content from unstructured documents
 * like PDFs, Word documents, PowerPoint presentations, images, HTML, and more.
 */

import axios from 'axios';
import FormData from 'form-data';
import { sendDocumentProcessingUpdate } from './websocket-server';

// Define service configuration
export interface UnstructuredServiceConfig {
  // API endpoint (local Docker or cloud API)
  endpoint: string;
  // API key (for cloud API)
  apiKey?: string;
  // Whether to use local Docker
  useDocker: boolean;
  // Docker container name (for local Docker)
  dockerContainer?: string;
  // Additional options
  options?: Record<string, any>;
}

// Default configuration
const DEFAULT_CONFIG: UnstructuredServiceConfig = {
  endpoint: 'http://localhost:8000/general/v0/general',
  useDocker: true,
  dockerContainer: 'unstructured',
  options: {
    strategy: 'auto',
    chunking_strategy: 'by_title',
  },
};

// Service configuration (can be updated at runtime)
let serviceConfig: UnstructuredServiceConfig = { ...DEFAULT_CONFIG };

/**
 * Update the service configuration
 * @param config New configuration
 */
export function updateServiceConfig(config: Partial<UnstructuredServiceConfig>): void {
  serviceConfig = { ...serviceConfig, ...config };
}

/**
 * Get the current service configuration
 * @returns Current configuration
 */
export function getServiceConfig(): UnstructuredServiceConfig {
  return { ...serviceConfig };
}

// Define element types from unstructured.io
export enum ElementType {
  TITLE = 'Title',
  NARRATIVE_TEXT = 'NarrativeText',
  TABLE = 'Table',
  LIST = 'List',
  LIST_ITEM = 'ListItem',
  IMAGE = 'Image',
  FORMULA = 'Formula',
  HEADER = 'Header',
  FOOTER = 'Footer',
  PAGE_BREAK = 'PageBreak',
  TABLE_OF_CONTENTS = 'TableOfContents',
  ADDRESS = 'Address',
  UNCATEGORIZED = 'UncategorizedText',
}

// Define element interface
export interface Element {
  type: ElementType;
  element_id: string;
  text: string;
  metadata: {
    page_number?: number;
    filename?: string;
    [key: string]: any;
  };
}

// Define processing options
export interface ProcessingOptions {
  strategy?: 'auto' | 'hi_res' | 'fast';
  coordinates?: boolean;
  include_page_breaks?: boolean;
  include_metadata?: boolean;
  chunking_strategy?: 'by_title' | 'by_paragraph' | 'none';
  languages?: string[];
  ocr_languages?: string[];
  ocr_enabled?: boolean;
  extract_images?: boolean;
  extract_tables?: boolean;
  extract_formulas?: boolean;
}

// Define processing result
export interface ProcessingResult {
  documentId: string;
  elements: Element[];
  text: string;
  metadata: Record<string, any>;
  error?: string;
}

/**
 * Process a document using unstructured.io
 * @param documentId Document ID
 * @param file Document file
 * @param options Processing options
 * @returns Processing result
 */
export async function processDocument(
  documentId: string,
  file: File,
  options: ProcessingOptions = {}
): Promise<ProcessingResult> {
  try {
    // Send initial processing update
    sendDocumentProcessingUpdate({
      documentId,
      status: 'processing',
      progress: 0,
      message: 'Initializing unstructured.io processing...',
      timestamp: new Date().toISOString(),
    });

    // Prepare form data
    const formData = new FormData();
    formData.append('files', file);

    // Add options
    const processingOptions = {
      ...serviceConfig.options,
      ...options,
    };

    Object.entries(processingOptions).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(key, String(value));
      }
    });

    // Prepare headers
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };

    // Add API key if using cloud API
    if (!serviceConfig.useDocker && serviceConfig.apiKey) {
      headers['Authorization'] = `Bearer ${serviceConfig.apiKey}`;
    }

    // Send progress update
    sendDocumentProcessingUpdate({
      documentId,
      status: 'processing',
      progress: 20,
      message: 'Sending document to unstructured.io...',
      timestamp: new Date().toISOString(),
    });

    // Make API request
    const response = await axios.post(serviceConfig.endpoint, formData, {
      headers,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });

    // Send progress update
    sendDocumentProcessingUpdate({
      documentId,
      status: 'processing',
      progress: 80,
      message: 'Processing document completed, finalizing results...',
      timestamp: new Date().toISOString(),
    });

    // Process response
    const elements = response.data as Element[];

    // Extract full text
    const fullText = elements
      .filter(el => el.type !== ElementType.PAGE_BREAK)
      .map(el => el.text)
      .join('\n\n');

    // Extract metadata
    const metadata: Record<string, any> = {};
    elements.forEach(el => {
      if (el.metadata) {
        Object.entries(el.metadata).forEach(([key, value]) => {
          if (key !== 'page_number' && key !== 'filename') {
            metadata[key] = value;
          }
        });
      }
    });

    // Create result
    const result: ProcessingResult = {
      documentId,
      elements,
      text: fullText,
      metadata,
    };

    // Send completion update
    sendDocumentProcessingUpdate({
      documentId,
      status: 'completed',
      progress: 100,
      message: 'Document processed successfully with unstructured.io',
      timestamp: new Date().toISOString(),
    });

    return result;
  } catch (error) {
    console.error('Error processing document with unstructured.io:', error);

    // Send error update
    sendDocumentProcessingUpdate({
      documentId,
      status: 'failed',
      progress: 0,
      message: `Error processing document with unstructured.io: ${(error as Error).message}`,
      timestamp: new Date().toISOString(),
    });

    return {
      documentId,
      elements: [],
      text: '',
      metadata: {},
      error: (error as Error).message,
    };
  }
}

/**
 * Check if unstructured.io service is available
 * @returns True if service is available
 */
export async function isServiceAvailable(): Promise<boolean> {
  try {
    // Try to make a simple request to the health endpoint
    const healthEndpoint = serviceConfig.endpoint.replace('/general/v0/general', '/health');
    
    await axios.get(healthEndpoint, {
      timeout: 5000,
    });
    
    return true;
  } catch (error) {
    console.error('Unstructured.io service is not available:', error);
    return false;
  }
}
