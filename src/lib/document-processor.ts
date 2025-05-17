/**
 * Document Processor
 *
 * This module provides utilities for processing documents, including OCR for images
 * and PDF parsing. It uses Tesseract.js for OCR, PDF.js for PDF parsing,
 * and unstructured.io for enhanced document processing.
 */

import { createWorker } from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
import { sendDocumentProcessingUpdate } from './websocket-server';
import {
  processDocument as processWithUnstructured,
  isServiceAvailable as isUnstructuredAvailable,
  ElementType
} from './unstructured-service';

// Set the worker source for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';

// Define document types
export enum DocumentType {
  TEXT = 'text',
  PDF = 'pdf',
  IMAGE = 'image',
  DOCX = 'docx',
  PPTX = 'pptx',
  XLSX = 'xlsx',
  HTML = 'html',
  MARKDOWN = 'markdown',
  EMAIL = 'email',
  UNKNOWN = 'unknown',
}

// Define document processing options
export interface DocumentProcessingOptions {
  languages?: string[];
  maxPages?: number;
  ocrEnabled?: boolean;
  extractImages?: boolean;
  useUnstructured?: boolean;
  chunkingStrategy?: 'by_title' | 'by_paragraph' | 'none';
  extractEntities?: boolean;
  extractTables?: boolean;
}

// Define document processing result
export interface DocumentProcessingResult {
  documentId: string;
  text: string;
  metadata: {
    title?: string;
    author?: string;
    creationDate?: string;
    modificationDate?: string;
    pageCount?: number;
    fileSize?: number;
    mimeType?: string;
    [key: string]: any;
  };
  pages?: {
    pageNumber: number;
    text: string;
    images?: string[];
  }[];
  elements?: {
    type: string;
    text: string;
    metadata?: Record<string, any>;
  }[];
  entities?: {
    type: string;
    text: string;
    category: string;
  }[];
  tables?: {
    rows: number;
    columns: number;
    data: string[][];
  }[];
  usedUnstructured?: boolean;
  error?: string;
}

/**
 * Determine the document type based on the file extension
 * @param filename Filename
 * @returns Document type
 */
export function getDocumentType(filename: string): DocumentType {
  const extension = filename.split('.').pop()?.toLowerCase();

  if (!extension) {
    return DocumentType.UNKNOWN;
  }

  switch (extension) {
    case 'pdf':
      return DocumentType.PDF;
    case 'txt':
      return DocumentType.TEXT;
    case 'md':
    case 'markdown':
      return DocumentType.MARKDOWN;
    case 'html':
    case 'htm':
      return DocumentType.HTML;
    case 'eml':
    case 'msg':
      return DocumentType.EMAIL;
    case 'docx':
    case 'doc':
      return DocumentType.DOCX;
    case 'pptx':
    case 'ppt':
      return DocumentType.PPTX;
    case 'xlsx':
    case 'xls':
    case 'csv':
      return DocumentType.XLSX;
    case 'xml':
    case 'json':
      return DocumentType.TEXT;
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'bmp':
    case 'webp':
    case 'tiff':
    case 'tif':
      return DocumentType.IMAGE;
    default:
      return DocumentType.UNKNOWN;
  }
}

/**
 * Process a text document
 * @param documentId Document ID
 * @param content Document content
 * @param options Processing options
 * @returns Processing result
 */
export async function processTextDocument(
  documentId: string,
  content: string,
  options: DocumentProcessingOptions = {}
): Promise<DocumentProcessingResult> {
  try {
    // Send initial processing update
    sendDocumentProcessingUpdate({
      documentId,
      status: 'processing',
      progress: 0,
      message: 'Processing text document...',
      timestamp: new Date().toISOString(),
    });

    // Process the text document
    const result: DocumentProcessingResult = {
      documentId,
      text: content,
      metadata: {
        fileSize: new Blob([content]).size,
        mimeType: 'text/plain',
      },
      pages: [
        {
          pageNumber: 1,
          text: content,
        },
      ],
    };

    // Send completion update
    sendDocumentProcessingUpdate({
      documentId,
      status: 'completed',
      progress: 100,
      message: 'Text document processed successfully',
      timestamp: new Date().toISOString(),
    });

    return result;
  } catch (error) {
    console.error('Error processing text document:', error);

    // Send error update
    sendDocumentProcessingUpdate({
      documentId,
      status: 'failed',
      progress: 0,
      message: `Error processing text document: ${(error as Error).message}`,
      timestamp: new Date().toISOString(),
    });

    return {
      documentId,
      text: '',
      metadata: {},
      error: (error as Error).message,
    };
  }
}

/**
 * Process a PDF document
 * @param documentId Document ID
 * @param arrayBuffer PDF document as ArrayBuffer
 * @param options Processing options
 * @returns Processing result
 */
export async function processPdfDocument(
  documentId: string,
  arrayBuffer: ArrayBuffer,
  options: DocumentProcessingOptions = {}
): Promise<DocumentProcessingResult> {
  try {
    // Send initial processing update
    sendDocumentProcessingUpdate({
      documentId,
      status: 'processing',
      progress: 0,
      message: 'Processing PDF document...',
      timestamp: new Date().toISOString(),
    });

    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    // Get document metadata
    const metadata = await pdf.getMetadata();

    // Determine the number of pages to process
    const pageCount = pdf.numPages;
    const maxPages = options.maxPages || pageCount;
    const pagesToProcess = Math.min(pageCount, maxPages);

    // Process each page
    const pages = [];
    let fullText = '';

    for (let i = 1; i <= pagesToProcess; i++) {
      // Send progress update
      sendDocumentProcessingUpdate({
        documentId,
        status: 'processing',
        progress: Math.round((i / pagesToProcess) * 100),
        message: `Processing page ${i} of ${pagesToProcess}...`,
        timestamp: new Date().toISOString(),
      });

      // Get the page
      const page = await pdf.getPage(i);

      // Extract text content
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: unknown) => item.str)
        .join(' ');

      // Add page to result
      pages.push({
        pageNumber: i,
        text: pageText,
      });

      // Add to full text
      fullText += pageText + '\n\n';
    }

    // Create result
    const result: DocumentProcessingResult = {
      documentId,
      text: fullText,
      metadata: {
        title: metadata.info?.Title,
        author: metadata.info?.Author,
        creationDate: metadata.info?.CreationDate,
        modificationDate: metadata.info?.ModDate,
        pageCount,
        fileSize: arrayBuffer.byteLength,
        mimeType: 'application/pdf',
      },
      pages,
    };

    // Send completion update
    sendDocumentProcessingUpdate({
      documentId,
      status: 'completed',
      progress: 100,
      message: 'PDF document processed successfully',
      timestamp: new Date().toISOString(),
    });

    return result;
  } catch (error) {
    console.error('Error processing PDF document:', error);

    // Send error update
    sendDocumentProcessingUpdate({
      documentId,
      status: 'failed',
      progress: 0,
      message: `Error processing PDF document: ${(error as Error).message}`,
      timestamp: new Date().toISOString(),
    });

    return {
      documentId,
      text: '',
      metadata: {},
      error: (error as Error).message,
    };
  }
}

/**
 * Process an image document using OCR
 * @param documentId Document ID
 * @param imageData Image data (URL, Buffer, or File)
 * @param options Processing options
 * @returns Processing result
 */
export async function processImageDocument(
  documentId: string,
  imageData: string | ArrayBuffer | File,
  options: DocumentProcessingOptions = {}
): Promise<DocumentProcessingResult> {
  try {
    // Send initial processing update
    sendDocumentProcessingUpdate({
      documentId,
      status: 'processing',
      progress: 0,
      message: 'Processing image document with OCR...',
      timestamp: new Date().toISOString(),
    });

    // Create Tesseract worker
    const languages = options.languages || ['eng'];
    const worker = await createWorker(languages.join('+'));

    // Send progress update
    sendDocumentProcessingUpdate({
      documentId,
      status: 'processing',
      progress: 20,
      message: 'OCR engine initialized, recognizing text...',
      timestamp: new Date().toISOString(),
    });

    // Recognize text
    const { data } = await worker.recognize(imageData);

    // Send progress update
    sendDocumentProcessingUpdate({
      documentId,
      status: 'processing',
      progress: 80,
      message: 'Text recognition completed, finalizing...',
      timestamp: new Date().toISOString(),
    });

    // Terminate worker
    await worker.terminate();

    // Create result
    const result: DocumentProcessingResult = {
      documentId,
      text: data.text,
      metadata: {
        fileSize: imageData instanceof File ? imageData.size : 0,
        mimeType: imageData instanceof File ? imageData.type : 'image/unknown',
      },
      pages: [
        {
          pageNumber: 1,
          text: data.text,
        },
      ],
    };

    // Send completion update
    sendDocumentProcessingUpdate({
      documentId,
      status: 'completed',
      progress: 100,
      message: 'Image document processed successfully with OCR',
      timestamp: new Date().toISOString(),
    });

    return result;
  } catch (error) {
    console.error('Error processing image document:', error);

    // Send error update
    sendDocumentProcessingUpdate({
      documentId,
      status: 'failed',
      progress: 0,
      message: `Error processing image document: ${(error as Error).message}`,
      timestamp: new Date().toISOString(),
    });

    return {
      documentId,
      text: '',
      metadata: {},
      error: (error as Error).message,
    };
  }
}

/**
 * Process a document
 * @param documentId Document ID
 * @param file Document file
 * @param options Processing options
 * @returns Processing result
 */
export async function processDocument(
  documentId: string,
  file: File,
  options: DocumentProcessingOptions = {}
): Promise<DocumentProcessingResult> {
  try {
    // Check if unstructured.io is available and should be used
    const useUnstructured = options.useUnstructured !== false;
    const unstructuredAvailable = useUnstructured && await isUnstructuredAvailable();

    // If unstructured.io is available and should be used, process with it
    if (unstructuredAvailable) {
      try {
        // Process with unstructured.io
        const unstructuredResult = await processWithUnstructured(documentId, file, {
          strategy: 'auto',
          coordinates: true,
          include_page_breaks: true,
          include_metadata: true,
          chunking_strategy: options.chunkingStrategy || 'by_title',
          languages: options.languages,
          ocr_languages: options.languages,
          ocr_enabled: options.ocrEnabled,
          extract_images: options.extractImages,
          extract_tables: options.extractTables,
        });

        // Convert unstructured.io result to DocumentProcessingResult
        const pages: { pageNumber: number; text: string; }[] = [];
        const pageMap = new Map<number, string>();

        // Group elements by page
        unstructuredResult.elements.forEach(element => {
          const pageNumber = element.metadata.page_number || 1;
          const currentText = pageMap.get(pageNumber) || '';
          pageMap.set(pageNumber, currentText + element.text + '\n');
        });

        // Create pages array
        pageMap.forEach((text, pageNumber) => {
          pages.push({
            pageNumber,
            text,
          });
        });

        // Extract tables if available
        const tables = unstructuredResult.elements
          .filter(element => element.type === ElementType.TABLE)
          .map(table => {
            // In a real implementation, we would parse the table data
            // For now, we'll just create a placeholder
            return {
              rows: 1,
              columns: 1,
              data: [[table.text]],
            };
          });

        return {
          documentId,
          text: unstructuredResult.text,
          metadata: {
            ...unstructuredResult.metadata,
            fileSize: file.size,
            mimeType: file.type,
            pageCount: pageMap.size,
          },
          pages,
          elements: unstructuredResult.elements.map(element => ({
            type: element.type,
            text: element.text,
            metadata: element.metadata,
          })),
          tables,
          usedUnstructured: true,
        };
      } catch (unstructuredError) {
        console.error('Error processing with unstructured.io, falling back to standard processing:', unstructuredError);
        // Fall back to standard processing
      }
    }

    // Standard processing
    const documentType = getDocumentType(file.name);

    switch (documentType) {
      case DocumentType.TEXT:
      case DocumentType.MARKDOWN:
      case DocumentType.HTML:
        const textContent = await file.text();
        return processTextDocument(documentId, textContent, options);

      case DocumentType.PDF:
        const pdfBuffer = await file.arrayBuffer();
        return processPdfDocument(documentId, pdfBuffer, options);

      case DocumentType.IMAGE:
        return processImageDocument(documentId, file, options);

      case DocumentType.DOCX:
      case DocumentType.PPTX:
      case DocumentType.XLSX:
      case DocumentType.EMAIL:
        // For these types, we need unstructured.io
        // Since we've already tried unstructured.io or it's not available, return an error
        throw new Error(`Document type ${documentType} requires unstructured.io, which is not available`);

      default:
        throw new Error(`Unsupported document type: ${documentType}`);
    }
  } catch (error) {
    console.error('Error processing document:', error);

    return {
      documentId,
      text: '',
      metadata: {
        fileSize: file.size,
        mimeType: file.type,
      },
      error: (error as Error).message,
    };
  }
}
