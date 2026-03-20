import type { Route } from './+types/route';
import { getFile, getJson, getString } from '~/platform/files/read-form-data';
import { saveBlobFile } from '~/platform/files/save-blob-file';
import { createToolRouteModule } from '~/shared/tool-ui/create-tool-route-module';

import { cropToolDefinition } from './definition';
import type { CropResult, NormalizedRect } from './models';
import { CropToolScreen } from './screen';
import { cropPdfDocument } from './use-cases/crop-pdf';

interface CropActionPayload {
  file: File;
  pageNumber: number;
  totalPages: number;
  mode: 'current' | 'allWithOriginalOthers';
  cropRect: NormalizedRect;
}

function parsePositiveInteger(value: string | null): number | null {
  if (!value) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function parseCropRect(value: unknown): NormalizedRect | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const candidate = value as Partial<NormalizedRect>;
  if (
    typeof candidate.x !== 'number' ||
    typeof candidate.y !== 'number' ||
    typeof candidate.width !== 'number' ||
    typeof candidate.height !== 'number'
  ) {
    return null;
  }

  return {
    x: candidate.x,
    y: candidate.y,
    width: candidate.width,
    height: candidate.height,
  };
}

const routeModule = createToolRouteModule<
  CropActionPayload,
  {
    file: File | null;
    cropRect: NormalizedRect | null;
    mode: CropActionPayload['mode'] | null;
    pageNumber: number | null;
    totalPages: number | null;
  },
  CropResult
>({
  definition: cropToolDefinition,
  errorMessage: 'Unable to crop this page.',
  parseInput({ formData, fallbackPayload }) {
    const file = getFile(formData, 'file') ?? fallbackPayload?.file;
    const cropRect =
      parseCropRect(getJson(formData, 'cropRect')) ??
      fallbackPayload?.cropRect ??
      null;
    const modeValue = getString(formData, 'mode');
    const mode =
      modeValue === 'current' || modeValue === 'allWithOriginalOthers'
        ? modeValue
        : (fallbackPayload?.mode ?? null);
    const pageNumber =
      parsePositiveInteger(getString(formData, 'pageNumber')) ??
      fallbackPayload?.pageNumber ??
      null;
    const totalPages =
      parsePositiveInteger(getString(formData, 'totalPages')) ??
      fallbackPayload?.totalPages ??
      null;

    return {
      file: file ?? null,
      cropRect,
      mode,
      pageNumber,
      totalPages,
    };
  },
  execute(input) {
    return cropPdfDocument(input);
  },
  onSuccess(result) {
    saveBlobFile(result.blob, result.fileName);
  },
  getSuccessMessage() {
    return 'Cropped PDF ready.';
  },
});

export function meta() {
  return routeModule.meta();
}

export function clientAction(args: Route.ClientActionArgs) {
  return routeModule.clientAction(args);
}

export default function CropRoute() {
  return <CropToolScreen />;
}
