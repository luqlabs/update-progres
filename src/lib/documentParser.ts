import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import mammoth from 'mammoth';
import { normalizeExtractedText } from './rtlText';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_TEXT_LENGTH = 20000; // characters

export interface ParsedDocument {
  success: boolean;
  text: string;
  fileName: string;
  characterCount: number;
  wasTruncated: boolean;
  error?: string;
}

/**
 * Extract text from a PDF file using PDF.js
 */
async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  let fullText = '';
  
  // Extract text from all pages
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    fullText += pageText + '\n\n';
    
    // Stop if we've exceeded max length
    if (fullText.length > MAX_TEXT_LENGTH * 1.5) {
      break;
    }
  }
  
  return normalizeExtractedText(fullText.trim());
}

/**
 * Extract text from a TXT file
 */
async function extractTextFromTXT(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      resolve(text || '');
    };
    reader.onerror = () => reject(new Error('Failed to read text file'));
    reader.readAsText(file);
  });
}

/**
 * Extract text from a DOCX file
 */
async function extractTextFromDOCX(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

/**
 * Extract thumbnail previews for each page of a PDF
 */
export async function extractPdfPagePreviews(file: File): Promise<{ pageNum: number; dataUrl: string }[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  const maxPages = Math.min(pdf.numPages, 50);
  const previews: { pageNum: number; dataUrl: string }[] = [];
  
  for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 0.3 });
    
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d')!;
    
    await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;
    
    previews.push({
      pageNum,
      dataUrl: canvas.toDataURL('image/jpeg', 0.7),
    });
  }
  
  return previews;
}

/**
 * Extract text from only the selected pages of a PDF
 */
export async function extractTextFromSelectedPages(file: File, pages: number[]): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  let fullText = '';
  
  for (const pageNum of pages.sort((a, b) => a - b)) {
    if (pageNum < 1 || pageNum > pdf.numPages) continue;
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    fullText += pageText + '\n\n';
    
    if (fullText.length > MAX_TEXT_LENGTH * 1.5) break;
  }
  
  return normalizeExtractedText(fullText.trim());
}

/**
 * Parse a document file and extract text content
 */
export async function parseDocument(file: File): Promise<ParsedDocument> {
  try {
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return {
        success: false,
        text: '',
        fileName: file.name,
        characterCount: 0,
        wasTruncated: false,
        error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`,
      };
    }

    // Validate file type
    const fileType = file.type.toLowerCase();
    const fileName = file.name.toLowerCase();
    
    let extractedText = '';

    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      extractedText = await extractTextFromPDF(file);
    } else if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
      extractedText = await extractTextFromTXT(file);
    } else if (
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
      fileName.endsWith('.docx')
    ) {
      extractedText = await extractTextFromDOCX(file);
    } else {
      return {
        success: false,
        text: '',
        fileName: file.name,
        characterCount: 0,
        wasTruncated: false,
        error: 'Unsupported file type. Please upload PDF, DOCX, or TXT files.',
      };
    }

    // Check if text was extracted
    if (!extractedText || extractedText.trim().length === 0) {
      return {
        success: false,
        text: '',
        fileName: file.name,
        characterCount: 0,
        wasTruncated: false,
        error: 'No text content found in the document',
      };
    }

    // Truncate if necessary
    const wasTruncated = extractedText.length > MAX_TEXT_LENGTH;
    const finalText = wasTruncated 
      ? extractedText.substring(0, MAX_TEXT_LENGTH) + '...[truncated]'
      : extractedText;

    return {
      success: true,
      text: finalText,
      fileName: file.name,
      characterCount: finalText.length,
      wasTruncated,
    };

  } catch (error) {
    console.error('Document parsing error:', error);
    return {
      success: false,
      text: '',
      fileName: file.name,
      characterCount: 0,
      wasTruncated: false,
      error: error instanceof Error ? error.message : 'Failed to parse document',
    };
  }
}
