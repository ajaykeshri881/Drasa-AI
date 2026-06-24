import { Job } from 'bullmq';
import { DocumentJobData, enqueueEmbedding } from '../../lib/queue/producers';
import fs from 'fs';
import path from 'path';

/**
 * Real document processor — extracts text from PDF and DOCX files,
 * chunks the text, and enqueues embedding jobs.
 */
export async function processDocument(job: Job<DocumentJobData>): Promise<any> {
    const { userId, fileName, mimeType, fileUrl, filePath } = job.data;

    // Step 1: Load the file
    await job.updateProgress(10);
    console.log(`[Job ${job.id}] Loading document: ${fileName}`);

    let fileBuffer: Buffer | null = null;
    const resolvedPath = filePath || fileUrl;

    if (resolvedPath && fs.existsSync(resolvedPath)) {
        fileBuffer = fs.readFileSync(resolvedPath);
    } else if (resolvedPath?.startsWith('http')) {
        // Fetch remote URL
        try {
            const response = await fetch(resolvedPath);
            const arrayBuffer = await response.arrayBuffer();
            fileBuffer = Buffer.from(arrayBuffer);
        } catch (err) {
            console.error(`[Job ${job.id}] Failed to download file:`, err);
            throw new Error(`Failed to download file from ${resolvedPath}`);
        }
    }

    if (!fileBuffer) {
        throw new Error(`Could not load file: ${resolvedPath || 'no path provided'}`);
    }

    // Step 2: Extract text based on MIME type
    await job.updateProgress(30);
    console.log(`[Job ${job.id}] Extracting text from ${mimeType}...`);
    let extractedText = '';

    try {
        if (mimeType === 'application/pdf' || fileName.endsWith('.pdf')) {
            const pdfParseLib = await import('pdf-parse');
            const pdfParse = (pdfParseLib as any).default || pdfParseLib;
            const pdfData = await pdfParse(fileBuffer);
            extractedText = pdfData.text;
        } else if (
            mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
            fileName.endsWith('.docx')
        ) {
            const mammoth = await import('mammoth');
            const result = await mammoth.extractRawText({ buffer: fileBuffer });
            extractedText = result.value;
        } else if (mimeType?.startsWith('text/') || fileName.endsWith('.txt') || fileName.endsWith('.md')) {
            extractedText = fileBuffer.toString('utf-8');
        } else {
            // Fallback: try to read as text
            extractedText = fileBuffer.toString('utf-8');
        }
    } catch (err: any) {
        console.error(`[Job ${job.id}] Text extraction failed:`, err.message);
        throw new Error(`Failed to extract text from ${fileName}: ${err.message}`);
    }

    if (!extractedText.trim()) {
        return {
            success: true,
            documentId: `doc_${Date.now()}`,
            chunksProcessed: 0,
            message: "Document processed but no text content was found.",
        };
    }

    // Step 3: Clean and chunk the text
    await job.updateProgress(60);
    console.log(`[Job ${job.id}] Chunking ${extractedText.length} chars of text...`);

    // Clean up whitespace
    const cleanedText = extractedText
        .replace(/\r\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .replace(/[ \t]+/g, ' ')
        .trim();

    const chunks = chunkTextWithOverlap(cleanedText, 800, 100);

    // Step 4: Enqueue embedding jobs for each chunk
    await job.updateProgress(80);
    console.log(`[Job ${job.id}] Enqueueing ${chunks.length} embedding jobs...`);

    const documentId = `doc_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    for (let i = 0; i < chunks.length; i++) {
        await enqueueEmbedding({
            userId,
            documentId,
            chunkId: `${documentId}_chunk_${i}`,
            text: chunks[i],
        });
    }

    // Done
    await job.updateProgress(100);
    return {
        success: true,
        documentId,
        chunksProcessed: chunks.length,
        textLength: cleanedText.length,
        message: `Document "${fileName}" processed: ${chunks.length} chunks queued for embedding.`,
    };
}

/**
 * Chunk text with overlap to preserve context across chunk boundaries.
 */
function chunkTextWithOverlap(text: string, chunkSize: number, overlap: number): string[] {
    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
        let end = start + chunkSize;

        // Try to break at a sentence or paragraph boundary
        if (end < text.length) {
            const lastParagraph = text.lastIndexOf('\n\n', end);
            const lastSentence = text.lastIndexOf('. ', end);

            if (lastParagraph > start + chunkSize * 0.5) {
                end = lastParagraph + 2;
            } else if (lastSentence > start + chunkSize * 0.5) {
                end = lastSentence + 2;
            }
        }

        chunks.push(text.slice(start, end).trim());
        start = end - overlap;

        if (start >= text.length) break;
    }

    return chunks.filter(c => c.length > 0);
}
