import type { MergeResult } from '~/features/merge/types';

export interface PdfMergeService {
  merge(files: File[]): Promise<MergeResult>;
}
