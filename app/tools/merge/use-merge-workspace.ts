import { readPdfDetails } from '~/platform/pdf/read-pdf-details';
import {
  applyPdfDetailsToQueuedFile,
  createLoadingPdfQueuedFile,
  markPdfQueuedFileUnavailable,
} from '~/shared/tool-ui/pdf-queued-file';
import { useMultiFileActionWorkspace } from '~/shared/tool-ui/use-multi-file-action-workspace';

import type { MergeInputFile } from './models';

export function getMergeWorkspaceViewModel(args: {
  fileCount: number;
  isMerging: boolean;
}) {
  const { fileCount, isMerging } = args;

  return {
    canMerge: fileCount >= 2 && !isMerging,
    mergeButtonLabel: isMerging ? 'Merging...' : 'Merge PDF',
  };
}

export function useMergeWorkspace() {
  const workspace = useMultiFileActionWorkspace<MergeInputFile>();
  const viewModel = getMergeWorkspaceViewModel({
    fileCount: workspace.entries.length,
    isMerging: workspace.isBusy,
  });

  function handleFilesAdded(newFiles: File[]) {
    const addedEntries = newFiles.map((file) =>
      createLoadingPdfQueuedFile(file),
    );
    workspace.appendEntries(addedEntries);

    addedEntries.forEach((entry) => {
      void readPdfDetails(entry.file)
        .then((details) => {
          workspace.updateEntry(entry.id, (item) =>
            applyPdfDetailsToQueuedFile(item, details),
          );
        })
        .catch(() => {
          workspace.updateEntry(entry.id, (item) =>
            markPdfQueuedFileUnavailable(item),
          );
        });
    });
  }

  function handleMerge() {
    if (!viewModel.canMerge) {
      return;
    }

    workspace.submitAction({
      payload: { files: workspace.entries.map((entry) => entry.file) },
      writeFormData(formData) {
        workspace.entries.forEach((entry) => {
          formData.append('files[]', entry.file);
        });
      },
    });
  }

  return {
    canMerge: viewModel.canMerge,
    errorMessage: workspace.errorMessage,
    files: workspace.entries,
    handleClearAll: workspace.clearEntries,
    handleFilesAdded,
    handleMerge,
    handleRemove: workspace.removeEntry,
    handleReorder: workspace.reorderEntries,
    isMerging: workspace.isBusy,
    mergeButtonLabel: viewModel.mergeButtonLabel,
    successMessage: workspace.successMessage,
  };
}
