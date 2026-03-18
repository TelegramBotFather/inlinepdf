import type { Route } from './+types/route';
import { getFiles } from '~/platform/files/read-form-data';
import { saveBlobFile } from '~/platform/files/save-blob-file';
import { createToolRouteModule } from '~/shared/tool-ui/create-tool-route-module';

import { mergeToolDefinition } from './definition';
import type { MergeResult } from './models';
import { MergeToolScreen } from './screen';
import { mergePdf } from './use-cases/merge-pdf';

interface MergeActionPayload {
  files: File[];
}

const routeModule = createToolRouteModule<
  MergeActionPayload,
  { files: File[] },
  MergeResult
>({
  definition: mergeToolDefinition,
  errorMessage: 'Unable to merge the selected PDF files.',
  parseInput({ formData, fallbackPayload }) {
    const files = getFiles(formData, 'files[]');
    return {
      files: files.length > 0 ? files : (fallbackPayload?.files ?? []),
    };
  },
  execute({ files }) {
    return mergePdf({ files });
  },
  onSuccess(result) {
    saveBlobFile(result.blob, result.fileName);
  },
  getSuccessMessage() {
    return 'Merged PDF prepared.';
  },
});

export function meta() {
  return routeModule.meta();
}

export function clientAction(args: Route.ClientActionArgs) {
  return routeModule.clientAction(args);
}

export default function MergeRoute() {
  return <MergeToolScreen />;
}
