/**
 * PDF Service
 * 
 * This module provides PDF processing services using PDF.js.
 * It can extract text, images, and metadata from PDF documents.
 */

import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
import { sendDocumentProcessingUpdate } from './websocket-server';

// Set the worker source for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';

// Define PDF processing options
export interface PDFProcessingOptions {
  maxPages?: number;
  extractImages?: boolean;
  extractFonts?: boolean;
  extractMetadata?: boolean;
  extractOutline?: boolean;
  extractAnnotations?: boolean;
  extractAttachments?: boolean;
  extractTextContent?: boolean;
  extractStructTree?: boolean;
  extractOperatorList?: boolean;
  extractMarkedContent?: boolean;
  extractDestinations?: boolean;
  extractPermissions?: boolean;
  extractJavaScript?: boolean;
  extractAcroForm?: boolean;
  extractXFA?: boolean;
  extractEmbeddedFiles?: boolean;
  extractSignatures?: boolean;
  extractBookmarks?: boolean;
  extractLayers?: boolean;
  extractPageLabels?: boolean;
  extractPageLayout?: boolean;
  extractPageMode?: boolean;
  extractViewerPreferences?: boolean;
  extractOpenAction?: boolean;
  extractPrintScaling?: boolean;
  extractDuplex?: boolean;
  extractPickTrayByPDFSize?: boolean;
  extractPrintPageRange?: boolean;
  extractNumCopies?: boolean;
  extractPrintScaling?: boolean;
  extractPrintAnnotations?: boolean;
  extractPrintPageLabels?: boolean;
  extractPrintPageMode?: boolean;
  extractPrintPageBoundaries?: boolean;
  extractPrintPageOrientation?: boolean;
  extractPrintPageSize?: boolean;
  extractPrintPageMargins?: boolean;
  extractPrintPageRotate?: boolean;
  extractPrintPageScale?: boolean;
  extractPrintPageRange?: boolean;
  extractPrintPageRangeMode?: boolean;
  extractPrintPageRangePages?: boolean;
  extractPrintPageRangeSubset?: boolean;
  extractPrintPageRangeSubsetPages?: boolean;
  extractPrintPageRangeSubsetPagesMode?: boolean;
  extractPrintPageRangeSubsetPagesPages?: boolean;
  extractPrintPageRangeSubsetPagesSubset?: boolean;
  extractPrintPageRangeSubsetPagesSubsetPages?: boolean;
  extractPrintPageRangeSubsetPagesSubsetPagesMode?: boolean;
  extractPrintPageRangeSubsetPagesSubsetPagesPages?: boolean;
  extractPrintPageRangeSubsetPagesSubsetPagesSubset?: boolean;
  extractPrintPageRangeSubsetPagesSubsetPagesSubsetPages?: boolean;
}

// Define PDF processing result
export interface PDFProcessingResult {
  text: string;
  metadata: {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string;
    creator?: string;
    producer?: string;
    creationDate?: string;
    modificationDate?: string;
    pageCount?: number;
    fileSize?: number;
    isEncrypted?: boolean;
    isLinearized?: boolean;
    isAcroFormPresent?: boolean;
    isXFAPresent?: boolean;
    isCollectionPresent?: boolean;
    isSignaturesPresent?: boolean;
    permissions?: {
      canPrint?: boolean;
      canModify?: boolean;
      canCopy?: boolean;
      canAnnotate?: boolean;
      canFillForms?: boolean;
      canExtractContent?: boolean;
      canAssemble?: boolean;
      canPrintHighQuality?: boolean;
    };
  };
  pages: {
    pageNumber: number;
    text: string;
    images?: string[];
    width?: number;
    height?: number;
    rotation?: number;
  }[];
  outline?: {
    title: string;
    dest: string;
    items?: any[];
  }[];
  attachments?: {
    filename: string;
    content: ArrayBuffer;
    contentType: string;
  }[];
  error?: string;
}

/**
 * Process a PDF document
 * @param documentId Document ID
 * @param pdfData PDF data as ArrayBuffer
 * @param options Processing options
 * @returns Processing result
 */
export async function processPDF(
  documentId: string,
  pdfData: ArrayBuffer,
  options: PDFProcessingOptions = {}
): Promise<PDFProcessingResult> {
  try {
    // Send initial processing update
    sendDocumentProcessingUpdate({
      documentId,
      status: 'processing',
      progress: 0,
      message: 'Loading PDF document...',
      timestamp: new Date().toISOString(),
    });
    
    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument({ data: pdfData });
    const pdf = await loadingTask.promise;
    
    // Send progress update
    sendDocumentProcessingUpdate({
      documentId,
      status: 'processing',
      progress: 10,
      message: 'PDF document loaded, extracting metadata...',
      timestamp: new Date().toISOString(),
    });
    
    // Get document metadata
    const metadata = await pdf.getMetadata();
    
    // Determine the number of pages to process
    const pageCount = pdf.numPages;
    const maxPages = options.maxPages || pageCount;
    const pagesToProcess = Math.min(pageCount, maxPages);
    
    // Send progress update
    sendDocumentProcessingUpdate({
      documentId,
      status: 'processing',
      progress: 20,
      message: `Extracting text from ${pagesToProcess} pages...`,
      timestamp: new Date().toISOString(),
    });
    
    // Process each page
    const pages = [];
    let fullText = '';
    
    for (let i = 1; i <= pagesToProcess; i++) {
      // Send progress update
      const progressPercentage = 20 + Math.round((i / pagesToProcess) * 70);
      sendDocumentProcessingUpdate({
        documentId,
        status: 'processing',
        progress: progressPercentage,
        message: `Processing page ${i} of ${pagesToProcess}...`,
        timestamp: new Date().toISOString(),
      });
      
      // Get the page
      const page = await pdf.getPage(i);
      
      // Get page dimensions
      const viewport = page.getViewport({ scale: 1.0 });
      
      // Extract text content
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      
      // Extract images if requested
      let images: string[] | undefined;
      
      if (options.extractImages) {
        // This is a simplified approach; extracting images from PDFs is complex
        // and may require additional processing for proper extraction
        const operatorList = await page.getOperatorList();
        const imageIds = new Set<string>();
        
        for (const op of operatorList.fnArray) {
          if (op === pdfjsLib.OPS.paintImageXObject) {
            const imageIndex = operatorList.argsArray.findIndex(args => args && args[0]);
            if (imageIndex !== -1) {
              const imageId = operatorList.argsArray[imageIndex][0];
              imageIds.add(imageId);
            }
          }
        }
        
        // Note: This is a placeholder. Actual image extraction would require
        // rendering each image to a canvas and converting to data URLs
        images = Array.from(imageIds).map(id => `image_${id}`);
      }
      
      // Add page to result
      pages.push({
        pageNumber: i,
        text: pageText,
        images,
        width: viewport.width,
        height: viewport.height,
        rotation: page.rotate,
      });
      
      // Add to full text
      fullText += pageText + '\n\n';
    }
    
    // Extract outline (table of contents) if requested
    let outline;
    if (options.extractOutline) {
      outline = await pdf.getOutline();
    }
    
    // Extract attachments if requested
    let attachments;
    if (options.extractAttachments) {
      const attachmentNames = await pdf.getAttachments();
      if (attachmentNames) {
        attachments = await Promise.all(
          Object.entries(attachmentNames).map(async ([filename, attachment]) => {
            return {
              filename,
              content: await attachment.content,
              contentType: attachment.content_type,
            };
          })
        );
      }
    }
    
    // Create result
    const result: PDFProcessingResult = {
      text: fullText,
      metadata: {
        title: metadata.info?.Title,
        author: metadata.info?.Author,
        subject: metadata.info?.Subject,
        keywords: metadata.info?.Keywords,
        creator: metadata.info?.Creator,
        producer: metadata.info?.Producer,
        creationDate: metadata.info?.CreationDate,
        modificationDate: metadata.info?.ModDate,
        pageCount,
        fileSize: pdfData.byteLength,
        isEncrypted: metadata.encrypted,
        isLinearized: metadata.linearized,
        isAcroFormPresent: metadata.acroForm,
        isXFAPresent: metadata.xfa,
        isCollectionPresent: metadata.collection,
        isSignaturesPresent: metadata.signatures,
      },
      pages,
      outline,
      attachments,
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
      text: '',
      metadata: {},
      pages: [],
      error: (error as Error).message,
    };
  }
}

/**
 * Extract text from a PDF document
 * @param documentId Document ID
 * @param pdfData PDF data as ArrayBuffer
 * @param options Processing options
 * @returns Extracted text
 */
export async function extractTextFromPDF(
  documentId: string,
  pdfData: ArrayBuffer,
  options: PDFProcessingOptions = {}
): Promise<string> {
  try {
    const result = await processPDF(documentId, pdfData, {
      ...options,
      extractImages: false,
      extractFonts: false,
      extractMetadata: false,
      extractOutline: false,
      extractAnnotations: false,
      extractAttachments: false,
    });
    
    return result.text;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    return '';
  }
}
