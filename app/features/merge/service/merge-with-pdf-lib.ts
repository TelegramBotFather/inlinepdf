import type { MergeResult } from '~/features/merge/types';
import { BrowserPdfLibMergeService } from '~/features/pdf/adapters/pdf-lib-adapter';
import type { PdfMergeService } from '~/features/pdf/core/processor';

const pdfMergeService: PdfMergeService = new BrowserPdfLibMergeService();

export async function mergeWithPdfLib(files: File[]): Promise<MergeResult> {
  return pdfMergeService.merge(files);
}
