import type { Route } from './+types/route';
import { getFiles, getString } from '~/platform/files/read-form-data';
import { saveBlobFile } from '~/platform/files/save-blob-file';
import { createToolRouteModule } from '~/shared/tool-ui/create-tool-route-module';

import { imageToPdfToolDefinition } from './definition';
import type { ImageToPdfResult } from './models';
import { ImageToPdfToolScreen } from './screen';
import { convertImagesToPdfDocument } from './use-cases/convert-images-to-pdf';

interface ImageToPdfActionPayload {
  files: File[];
  quality: string;
}

const routeModule = createToolRouteModule<
  ImageToPdfActionPayload,
  { files: File[]; quality: string },
  ImageToPdfResult
>({
  definition: imageToPdfToolDefinition,
  errorMessage: 'Unable to create a PDF from these images.',
  parseInput({ formData, fallbackPayload }) {
    const files = getFiles(formData, 'files[]');
    return {
      files: files.length > 0 ? files : (fallbackPayload?.files ?? []),
      quality: getString(formData, 'quality') ?? fallbackPayload?.quality ?? '',
    };
  },
  execute({ files, quality }) {
    return convertImagesToPdfDocument({ files, quality });
  },
  onSuccess(result) {
    saveBlobFile(result.blob, result.fileName);
  },
  getSuccessMessage(result) {
    return `PDF ready with ${String(result.pagesExported)} page${result.pagesExported === 1 ? '' : 's'}.`;
  },
});

export function meta() {
  return routeModule.meta();
}

export function clientAction(args: Route.ClientActionArgs) {
  return routeModule.clientAction(args);
}

export default function ImageToPdfRoute() {
  return <ImageToPdfToolScreen />;
}
