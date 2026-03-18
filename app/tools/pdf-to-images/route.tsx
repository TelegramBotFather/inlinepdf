import type { Route } from './+types/route';
import { getFile, getJson, getString } from '~/platform/files/read-form-data';
import { saveBlobFile } from '~/platform/files/save-blob-file';
import { createToolRouteModule } from '~/shared/tool-ui/create-tool-route-module';

import { pdfToImagesToolDefinition } from './definition';
import { PdfToImagesToolScreen } from './screen';
import { convertPdfToImagesArchive, type PdfToImagesResult } from './use-cases/convert-pdf-to-images';

interface PdfToImagesActionPayload {
  file: File;
  format: string;
  maxDimensionCap: number;
  pageNumbers?: number[];
}

function parsePositiveInteger(value: string | null): number | null {
  if (!value) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function parsePageNumbers(value: unknown): number[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const pageNumbers = value.filter(
    (item): item is number => Number.isInteger(item) && item > 0,
  );
  return pageNumbers.length === value.length ? pageNumbers : undefined;
}

const routeModule = createToolRouteModule<
  PdfToImagesActionPayload,
  {
    files: File[];
    format: string | null;
    maxDimensionCap: number | null;
    pageNumbers?: number[];
  },
  PdfToImagesResult
>({
  definition: pdfToImagesToolDefinition,
  errorMessage: 'Unable to export PDF pages as images.',
  parseInput({ formData, fallbackPayload }) {
    const file = getFile(formData, 'file') ?? fallbackPayload?.file;
    const format =
      getString(formData, 'format') ?? fallbackPayload?.format ?? null;
    const maxDimensionCap =
      parsePositiveInteger(getString(formData, 'maxDimensionCap')) ??
      fallbackPayload?.maxDimensionCap ??
      null;
    const pageNumbers =
      parsePageNumbers(getJson(formData, 'pageNumbers')) ??
      fallbackPayload?.pageNumbers;

    return {
      files: file ? [file] : [],
      format,
      maxDimensionCap,
      pageNumbers: Array.isArray(pageNumbers) ? pageNumbers : undefined,
    };
  },
  execute({ files, format, maxDimensionCap, pageNumbers }) {
    return convertPdfToImagesArchive({
      files,
      format,
      maxDimensionCap,
      pageNumbers,
    });
  },
  onSuccess(result) {
    saveBlobFile(result.blob, result.fileName);
  },
  getSuccessMessage(result) {
    return `Image archive prepared with ${String(result.pageCount)} file${result.pageCount === 1 ? '' : 's'}.`;
  },
});

export function meta() {
  return routeModule.meta();
}

export function clientAction(args: Route.ClientActionArgs) {
  return routeModule.clientAction(args);
}

export default function PdfToImagesRoute() {
  return <PdfToImagesToolScreen />;
}
