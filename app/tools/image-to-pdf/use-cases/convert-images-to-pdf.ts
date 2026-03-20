import {
  convertImagesToPdf,
  type ConvertImagesToPdfInput,
} from '~/tools/image-to-pdf/service/convert-images-to-pdf';
import type {
  ImageToPdfQuality,
  ImageToPdfResult,
  ImageToPdfRunOptions,
} from '~/tools/image-to-pdf/models';

export function isImageToPdfQuality(
  value: unknown,
): value is ImageToPdfQuality {
  return value === 'high' || value === 'medium' || value === 'low';
}

interface ConvertImagesToPdfDocumentInput {
  files: File[];
  quality: unknown;
  onProgress?: ImageToPdfRunOptions['onProgress'];
}

export async function convertImagesToPdfDocument({
  files,
  quality,
  onProgress,
}: ConvertImagesToPdfDocumentInput): Promise<ImageToPdfResult> {
  if (!isImageToPdfQuality(quality)) {
    throw new Error('Choose a quality setting before converting.');
  }

  const input: ConvertImagesToPdfInput = {
    files,
    quality,
    onProgress,
  };
  return convertImagesToPdf(input);
}
