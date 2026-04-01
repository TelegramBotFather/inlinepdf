import { startTransition, useState } from 'react';

import {
  isSupportedImageFile,
  readImageDimensions,
} from '~/tools/image-to-pdf/service/convert-images-to-pdf';
import type { ImageToPdfQuality } from '~/tools/image-to-pdf/models';
import type { QueuedFile } from '~/shared/tool-ui/file-queue-list';
import { createFileEntryId } from '~/shared/tool-ui/create-file-entry-id';
import { useMultiFileActionWorkspace } from '~/shared/tool-ui/use-multi-file-action-workspace';

export const IMAGE_TO_PDF_QUALITY_OPTIONS: {
  value: ImageToPdfQuality;
  label: string;
}[] = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

export function getUnsupportedImageMessage(
  fileName: string | null,
): string | null {
  if (!fileName) {
    return null;
  }

  return `Only JPG and PNG images are supported. ${fileName} is not supported.`;
}

export function getImageToPdfWorkspaceViewModel(args: {
  fileCount: number;
  isConverting: boolean;
  localErrorMessage: string | null;
  actionErrorMessage: string | null;
}) {
  const { fileCount, isConverting, localErrorMessage, actionErrorMessage } =
    args;

  return {
    canConvert: fileCount > 0 && !isConverting,
    convertButtonLabel: isConverting ? 'Converting...' : 'Create PDF',
    errorMessage: localErrorMessage ?? actionErrorMessage,
    helperText: isConverting ? 'Creating PDF...' : null,
  };
}

function revokeEntryPreviewUrl(entry: QueuedFile) {
  if (entry.previewDataUrl?.startsWith('blob:')) {
    URL.revokeObjectURL(entry.previewDataUrl);
  }
}

export function useImageToPdfWorkspace() {
  const workspace = useMultiFileActionWorkspace<QueuedFile>({
    cleanupEntry: revokeEntryPreviewUrl,
  });
  const [quality, setQuality] = useState<ImageToPdfQuality>('medium');
  const viewModel = getImageToPdfWorkspaceViewModel({
    fileCount: workspace.entries.length,
    isConverting: workspace.isBusy,
    localErrorMessage: workspace.localErrorMessage,
    actionErrorMessage: workspace.actionErrorMessage,
  });

  function updateEntryMetadata(entryId: string, metadataText: string) {
    startTransition(() => {
      workspace.updateEntry(entryId, (item) => ({
        ...item,
        metadataText,
      }));
    });
  }

  function handleFilesAdded(newFiles: File[]) {
    const supportedFiles = newFiles.filter((file) =>
      isSupportedImageFile(file),
    );
    const unsupportedFileName =
      newFiles.find((file) => !isSupportedImageFile(file))?.name ?? null;

    if (supportedFiles.length < 1) {
      workspace.setLocalErrorMessage(
        getUnsupportedImageMessage(unsupportedFileName),
      );
      return;
    }

    const addedEntries = supportedFiles.map((file) => {
      const objectUrl = URL.createObjectURL(file);

      return {
        id: createFileEntryId(file),
        file,
        pageCount: null,
        previewDataUrl: objectUrl,
        previewStatus: 'ready' as const,
        metadataText: 'Reading dimensions...',
      };
    });

    workspace.appendEntries(addedEntries);
    workspace.setLocalErrorMessage(
      getUnsupportedImageMessage(unsupportedFileName),
    );

    addedEntries.forEach((entry) => {
      void readImageDimensions(entry.file)
        .then((dimensions) => {
          updateEntryMetadata(
            entry.id,
            `${String(dimensions.width)} x ${String(dimensions.height)} px`,
          );
        })
        .catch(() => {
          updateEntryMetadata(entry.id, 'Size unavailable');
        });
    });
  }

  function handleConvert() {
    const entries = workspace.getEntriesSnapshot();

    if (workspace.isBusy || entries.length < 1) {
      return;
    }

    workspace.submitAction({
      payload: {
        files: entries.map((entry) => entry.file),
        quality,
      },
      writeFormData(formData) {
        entries.forEach((entry) => {
          formData.append('files[]', entry.file);
        });
        formData.set('quality', quality);
      },
    });
  }

  return {
    canConvert: viewModel.canConvert,
    convertButtonLabel: viewModel.convertButtonLabel,
    errorMessage: viewModel.errorMessage,
    files: workspace.entries,
    handleClearAll: workspace.clearEntries,
    handleConvert,
    handleFilesAdded,
    handleRemove: workspace.removeEntry,
    handleReorder: workspace.reorderEntries,
    helperText: viewModel.helperText,
    isConverting: workspace.isBusy,
    quality,
    setQuality,
    successMessage: workspace.successMessage,
  };
}
