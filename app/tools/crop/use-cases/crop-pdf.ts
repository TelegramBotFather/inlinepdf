import { hasValidRect } from '~/tools/crop/domain/coordinate-math';
import type { CropResult, NormalizedRect } from '~/tools/crop/models';

import { exportCroppedPdf } from './export-cropped-pdf-file';

interface CropPdfDocumentInput {
  file: File | null;
  cropRect: NormalizedRect | null;
  mode: 'current' | 'allWithOriginalOthers' | null;
  pageNumber: number | null;
  totalPages: number | null;
}

export async function cropPdfDocument({
  file,
  cropRect,
  mode,
  pageNumber,
  totalPages,
}: CropPdfDocumentInput): Promise<CropResult> {
  if (!file) {
    throw new Error('Select a PDF file before cropping.');
  }

  if (!cropRect || !hasValidRect(cropRect)) {
    throw new Error('Set a valid crop area before exporting the PDF.');
  }

  if (!mode || !pageNumber || !totalPages) {
    throw new Error('The crop settings are missing. Try again.');
  }

  return mode === 'allWithOriginalOthers'
    ? exportCroppedPdf({
        file,
        selectedPages: Array.from(
          { length: totalPages },
          (_, index) => index + 1,
        ),
        pageCrops: { [pageNumber]: cropRect },
        keepUncroppedPages: true,
      })
    : exportCroppedPdf({
        file,
        selectedPages: [pageNumber],
        pageCrops: { [pageNumber]: cropRect },
      });
}
