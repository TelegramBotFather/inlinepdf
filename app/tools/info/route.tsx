import type { Route } from './+types/route';
import { getFile } from '~/platform/files/read-form-data';
import { createToolRouteModule } from '~/shared/tool-ui/create-tool-route-module';

import { infoToolDefinition } from './definition';
import type { PdfInfoResult } from './models';
import { PdfInfoToolScreen } from './screen';
import { readPdfInfoForFile } from './use-cases/read-pdf-info';

interface PdfInfoActionPayload {
  file: File;
}

const routeModule = createToolRouteModule<
  PdfInfoActionPayload,
  { files: File[] },
  PdfInfoResult,
  PdfInfoResult
>({
  definition: infoToolDefinition,
  errorMessage: 'Unable to read PDF details.',
  parseInput({ formData, fallbackPayload }) {
    const file = getFile(formData, 'file') ?? fallbackPayload?.file;
    return { files: file ? [file] : [] };
  },
  execute({ files }) {
    return readPdfInfoForFile({ files });
  },
  getSuccessMessage() {
    return 'PDF details ready.';
  },
  mapSuccessResult(result) {
    return result;
  },
});

export function meta() {
  return routeModule.meta();
}

export function clientAction(args: Route.ClientActionArgs) {
  return routeModule.clientAction(args);
}

export default function InfoRoute() {
  return <PdfInfoToolScreen />;
}
