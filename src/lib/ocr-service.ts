/**
 * OCR Service
 * 
 * This module provides OCR (Optical Character Recognition) services for images
 * using Tesseract.js. It can recognize text from various image formats.
 */

import { createWorker, createScheduler, PSM, OEM } from 'tesseract.js';
import { sendDocumentProcessingUpdate } from './websocket-server';

// Define OCR options
export interface OCROptions {
  languages?: string[];
  psm?: number; // Page segmentation mode
  oem?: number; // OCR Engine mode
  whitelist?: string; // Character whitelist
  blacklist?: string; // Character blacklist
  rectangle?: { // Region of interest
    left: number;
    top: number;
    width: number;
    height: number;
  };
  scale?: number; // Image scale factor
  logger?: (message: any) => void; // Progress logger
}

// Define OCR result
export interface OCRResult {
  text: string;
  confidence: number;
  words?: {
    text: string;
    confidence: number;
    bbox: {
      x0: number;
      y0: number;
      x1: number;
      y1: number;
    };
  }[];
  hocr?: string; // HTML OCR format
  tsv?: string; // Tab-separated values format
  paragraphs?: string[];
  lines?: string[];
  error?: string;
}

/**
 * Perform OCR on an image
 * @param documentId Document ID
 * @param imageData Image data (URL, Buffer, or File)
 * @param options OCR options
 * @returns OCR result
 */
export async function performOCR(
  documentId: string,
  imageData: string | ArrayBuffer | File,
  options: OCROptions = {}
): Promise<OCRResult> {
  try {
    // Send initial processing update
    sendDocumentProcessingUpdate({
      documentId,
      status: 'processing',
      progress: 0,
      message: 'Initializing OCR engine...',
      timestamp: new Date().toISOString(),
    });
    
    // Create Tesseract worker
    const languages = options.languages || ['eng'];
    const worker = await createWorker(languages.join('+'), 1, {
      logger: options.logger || ((m) => {
        if (m.status === 'recognizing text') {
          // Send progress update
          sendDocumentProcessingUpdate({
            documentId,
            status: 'processing',
            progress: Math.round(m.progress * 100),
            message: `Recognizing text: ${Math.round(m.progress * 100)}%`,
            timestamp: new Date().toISOString(),
          });
        }
      }),
    });
    
    // Set parameters if provided
    if (options.psm !== undefined || options.oem !== undefined || options.whitelist || options.blacklist) {
      const params: any = {};
      
      if (options.psm !== undefined) {
        params.tessedit_pageseg_mode = options.psm;
      }
      
      if (options.oem !== undefined) {
        params.tessedit_ocr_engine_mode = options.oem;
      }
      
      if (options.whitelist) {
        params.tessedit_char_whitelist = options.whitelist;
      }
      
      if (options.blacklist) {
        params.tessedit_char_blacklist = options.blacklist;
      }
      
      await worker.setParameters(params);
    }
    
    // Recognize text
    const recognizeOptions: any = {};
    
    if (options.rectangle) {
      recognizeOptions.rectangle = options.rectangle;
    }
    
    const { data } = await worker.recognize(imageData, recognizeOptions);
    
    // Terminate worker
    await worker.terminate();
    
    // Extract paragraphs and lines
    const paragraphs = data.text.split('\n\n').filter(p => p.trim().length > 0);
    const lines = data.text.split('\n').filter(l => l.trim().length > 0);
    
    // Create result
    const result: OCRResult = {
      text: data.text,
      confidence: data.confidence,
      words: data.words,
      hocr: data.hocr,
      tsv: data.tsv,
      paragraphs,
      lines,
    };
    
    // Send completion update
    sendDocumentProcessingUpdate({
      documentId,
      status: 'completed',
      progress: 100,
      message: 'OCR completed successfully',
      timestamp: new Date().toISOString(),
    });
    
    return result;
  } catch (error) {
    console.error('Error performing OCR:', error);
    
    // Send error update
    sendDocumentProcessingUpdate({
      documentId,
      status: 'failed',
      progress: 0,
      message: `Error performing OCR: ${(error as Error).message}`,
      timestamp: new Date().toISOString(),
    });
    
    return {
      text: '',
      confidence: 0,
      error: (error as Error).message,
    };
  }
}

/**
 * Perform OCR on multiple regions of an image
 * @param documentId Document ID
 * @param imageData Image data (URL, Buffer, or File)
 * @param regions Regions of interest
 * @param options OCR options
 * @returns OCR results for each region
 */
export async function performMultiRegionOCR(
  documentId: string,
  imageData: string | ArrayBuffer | File,
  regions: { id: string; rectangle: { left: number; top: number; width: number; height: number } }[],
  options: OCROptions = {}
): Promise<{ [regionId: string]: OCRResult }> {
  try {
    // Send initial processing update
    sendDocumentProcessingUpdate({
      documentId,
      status: 'processing',
      progress: 0,
      message: 'Initializing OCR engine for multiple regions...',
      timestamp: new Date().toISOString(),
    });
    
    // Create scheduler and workers
    const scheduler = createScheduler();
    const languages = options.languages || ['eng'];
    const numWorkers = Math.min(regions.length, 4); // Limit to 4 workers
    
    // Create workers
    for (let i = 0; i < numWorkers; i++) {
      const worker = await createWorker(languages.join('+'));
      
      // Set parameters if provided
      if (options.psm !== undefined || options.oem !== undefined || options.whitelist || options.blacklist) {
        const params: any = {};
        
        if (options.psm !== undefined) {
          params.tessedit_pageseg_mode = options.psm;
        }
        
        if (options.oem !== undefined) {
          params.tessedit_ocr_engine_mode = options.oem;
        }
        
        if (options.whitelist) {
          params.tessedit_char_whitelist = options.whitelist;
        }
        
        if (options.blacklist) {
          params.tessedit_char_blacklist = options.blacklist;
        }
        
        await worker.setParameters(params);
      }
      
      scheduler.addWorker(worker);
    }
    
    // Process each region
    const recognitionPromises = regions.map((region, index) => {
      // Send progress update
      sendDocumentProcessingUpdate({
        documentId,
        status: 'processing',
        progress: Math.round((index / regions.length) * 50),
        message: `Processing region ${index + 1} of ${regions.length}...`,
        timestamp: new Date().toISOString(),
      });
      
      return scheduler.addJob('recognize', imageData, { rectangle: region.rectangle });
    });
    
    // Wait for all recognition jobs to complete
    const recognitionResults = await Promise.all(recognitionPromises);
    
    // Terminate scheduler and workers
    await scheduler.terminate();
    
    // Create result map
    const results: { [regionId: string]: OCRResult } = {};
    
    recognitionResults.forEach((result, index) => {
      const region = regions[index];
      const data = result.data;
      
      // Extract paragraphs and lines
      const paragraphs = data.text.split('\n\n').filter(p => p.trim().length > 0);
      const lines = data.text.split('\n').filter(l => l.trim().length > 0);
      
      results[region.id] = {
        text: data.text,
        confidence: data.confidence,
        words: data.words,
        hocr: data.hocr,
        tsv: data.tsv,
        paragraphs,
        lines,
      };
    });
    
    // Send completion update
    sendDocumentProcessingUpdate({
      documentId,
      status: 'completed',
      progress: 100,
      message: 'Multi-region OCR completed successfully',
      timestamp: new Date().toISOString(),
    });
    
    return results;
  } catch (error) {
    console.error('Error performing multi-region OCR:', error);
    
    // Send error update
    sendDocumentProcessingUpdate({
      documentId,
      status: 'failed',
      progress: 0,
      message: `Error performing multi-region OCR: ${(error as Error).message}`,
      timestamp: new Date().toISOString(),
    });
    
    return {};
  }
}

// Export Tesseract constants for convenience
export const PageSegmentationMode = PSM;
export const OCREngineMode = OEM;
