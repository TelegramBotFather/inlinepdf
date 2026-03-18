import type { Route } from './+types/route';
import { getFile, getJson } from '~/platform/files/read-form-data';
import { saveBlobFile } from '~/platform/files/save-blob-file';
import { createToolRouteModule } from '~/shared/tool-ui/create-tool-route-module';

import { organizeToolDefinition } from './definition';
import type { OrganizePageState } from './models';
import type { OrganizeResult } from './models';
import { OrganizeToolScreen } from './screen';
import { organizePdfDocument } from './use-cases/export-organized-pdf';

interface OrganizeActionPayload {
  file: File;
  pages: OrganizePageState[];
}

const routeModule = createToolRouteModule<
  OrganizeActionPayload,
  { files: File[]; pages?: OrganizePageState[] },
  OrganizeResult
>({
  definition: organizeToolDefinition,
  errorMessage: 'Unable to organize this PDF.',
  parseInput({ formData, fallbackPayload }) {
    const file = getFile(formData, 'file') ?? fallbackPayload?.file;
    const pagesData = getJson(formData, 'pages');
    return {
      files: file ? [file] : [],
      pages: Array.isArray(pagesData)
        ? (pagesData as OrganizePageState[])
        : fallbackPayload?.pages,
    };
  },
  execute({ files, pages }) {
    return organizePdfDocument({ files }, pages ? { pages } : undefined);
  },
  onSuccess(result) {
    saveBlobFile(result.blob, result.fileName);
  },
  getSuccessMessage(result) {
    return `Organized PDF prepared with ${String(result.pagesExported)} page${result.pagesExported === 1 ? '' : 's'}.`;
  },
});

export function meta() {
  return routeModule.meta();
}

export function clientAction(args: Route.ClientActionArgs) {
  return routeModule.clientAction(args);
}

export default function OrganizeRoute() {
  return <OrganizeToolScreen />;
}
