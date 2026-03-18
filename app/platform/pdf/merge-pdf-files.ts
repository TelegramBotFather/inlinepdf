import { PDFDocument } from 'pdf-lib';

import {
  MAX_BATCH_TOTAL_BYTES,
  MAX_MERGE_FILES,
  validateFiles,
} from '~/platform/files/security/file-validation';

export interface MergedPdfFile {
  blob: Blob;
  fileName: string;
}

function createMergedName(files: File[]): string {
  const baseName = files[0]?.name.replace(/\.pdf$/i, '') || 'document';
  const stamp = new Date().toISOString().slice(0, 10);
  return `${baseName}-merged-${stamp}.pdf`;
}

async function readFileBytes(file: File): Promise<ArrayBuffer> {
  const maybeBlob = file as Blob & {
    arrayBuffer?: () => Promise<ArrayBuffer>;
  };

  if (typeof maybeBlob.arrayBuffer === 'function') {
    return maybeBlob.arrayBuffer();
  }

  return new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result);
        return;
      }

      reject(new Error(`Unable to read PDF data: ${file.name}`));
    };

    reader.onerror = () => {
      reject(new Error(`Unable to read PDF data: ${file.name}`));
    };

    reader.readAsArrayBuffer(file);
  });
}

async function loadMergeSourceDocument(file: File): Promise<{
  file: File;
  source: PDFDocument;
}> {
  const bytes = await readFileBytes(file);

  try {
    return {
      file,
      source: await PDFDocument.load(bytes),
    };
  } catch {
    throw new Error(`Unable to read PDF: ${file.name}`);
  }
}

export class BrowserPdfLibMergeService {
  async merge(files: File[]): Promise<MergedPdfFile> {
    if (files.length < 2) {
      throw new Error('Select at least two PDF files to merge.');
    }

    await validateFiles(files, {
      kind: 'pdf',
      maxFiles: MAX_MERGE_FILES,
      maxBatchTotalBytes: MAX_BATCH_TOTAL_BYTES,
    });

    const merged = await PDFDocument.create();
    const sourceDocuments = await Promise.all(
      files.map((file) => loadMergeSourceDocument(file)),
    );

    for (const { source } of sourceDocuments) {
      const pages = await merged.copyPages(source, source.getPageIndices());
      for (const page of pages) {
        merged.addPage(page);
      }
    }

    const mergedBytes = await merged.save();
    const normalizedBytes = new Uint8Array(mergedBytes.byteLength);
    normalizedBytes.set(mergedBytes);
    const mergedBuffer = normalizedBytes.buffer;

    return {
      blob: new Blob([mergedBuffer], { type: 'application/pdf' }),
      fileName: createMergedName(files),
    };
  }
}
