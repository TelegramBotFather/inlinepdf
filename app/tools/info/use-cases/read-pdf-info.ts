import { readPdfInfo } from '~/tools/info/service/read-pdf-info';
import type { PdfInfoResult } from '~/tools/info/models';

export async function readPdfInfoForFile({
  files,
}: {
  files: File[];
}): Promise<PdfInfoResult> {
  const firstFile = files.at(0);
  if (!firstFile) {
    throw new Error('Select a PDF file before reading details.');
  }

  return readPdfInfo(firstFile);
}
