/* eslint-disable react-refresh/only-export-components */

import { useState } from 'react';

import { readPdfDetails } from '~/features/pdf/service/read-pdf-details';
import { PdfFileSelector } from '~/components/pdf-file-selector';
import { Button } from '~/components/ui/button';
import { FileQueueList } from '~/features/tools/components/file-queue-list';
import { ToolWorkspace } from '~/features/tools/components/tool-workspace';
import { mergeWithPdfLib } from '~/features/merge/service/merge-with-pdf-lib';
import type { MergeInputFile, MergeResult } from '~/features/merge/types';
import type {
  ToolModule,
  ToolModuleRunInput,
} from '~/features/tools/tool-modules';

function createEntryId(file: File): string {
  if ('randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `${file.name}-${String(file.size)}-${String(Date.now())}`;
}

function triggerFileDownload(blob: Blob, fileName: string) {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(objectUrl);
}

function reorderListByIndex(
  items: MergeInputFile[],
  sourceIndex: number,
  targetIndex: number,
): MergeInputFile[] {
  if (
    sourceIndex < 0 ||
    sourceIndex >= items.length ||
    targetIndex < 0 ||
    targetIndex >= items.length ||
    sourceIndex === targetIndex
  ) {
    return items;
  }

  const updated = [...items];
  const [moved] = updated.splice(sourceIndex, 1);
  updated.splice(targetIndex, 0, moved);
  return updated;
}

async function runMerge({ files }: ToolModuleRunInput): Promise<MergeResult> {
  return mergeWithPdfLib(files);
}

function MergeToolWorkspace() {
  const [files, setFiles] = useState<MergeInputFile[]>([]);
  const [isMerging, setIsMerging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const canMerge = files.length >= 2;

  function handleFilesAdded(newFiles: File[]) {
    const mapped = newFiles.map((file) => ({
      id: createEntryId(file),
      file,
      pageCount: null,
      previewDataUrl: null,
      previewStatus: 'loading' as const,
    }));
    setFiles((current) => [...current, ...mapped]);
    setErrorMessage(null);
    setSuccessMessage(null);

    mapped.forEach((entry) => {
      void readPdfDetails(entry.file).then((details) => {
        setFiles((current) =>
          current.map((item) =>
            item.id === entry.id
              ? {
                  ...item,
                  pageCount: details.pageCount,
                  previewDataUrl: details.previewDataUrl,
                  previewStatus: details.previewDataUrl ? 'ready' : 'unavailable',
                }
              : item,
          ),
        );
      });
    });
  }

  function handleReorder(activeId: string, overId: string) {
    setFiles((current) => {
      const sourceIndex = current.findIndex((entry) => entry.id === activeId);
      const targetIndex = current.findIndex((entry) => entry.id === overId);

      if (sourceIndex === -1 || targetIndex === -1) {
        return current;
      }

      return reorderListByIndex(current, sourceIndex, targetIndex);
    });
  }

  function handleRemove(id: string) {
    setFiles((current) => current.filter((entry) => entry.id !== id));
    setErrorMessage(null);
    setSuccessMessage(null);
  }

  function handleClearAll() {
    if (isMerging) {
      return;
    }

    setFiles([]);
    setErrorMessage(null);
    setSuccessMessage(null);
  }

  async function handleMerge() {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsMerging(true);

    try {
      const result = await runMerge({ files: files.map((entry) => entry.file) });
      triggerFileDownload(result.blob, result.fileName);
      setSuccessMessage('Merged PDF is ready and download has started.');
    } catch (error: unknown) {
      const fallbackMessage =
        'Merge failed. Please check your PDF files and try again.';
      setErrorMessage(error instanceof Error ? error.message : fallbackMessage);
    } finally {
      setIsMerging(false);
    }
  }

  return (
    <ToolWorkspace
      title="Merge PDF"
      description="Combine PDFs in the exact order you choose."
      inputPanel={
        <div className="space-y-4">
          {files.length === 0 ? (
            <PdfFileSelector
              multiple
              ariaLabel="Select PDF files"
              onSelect={handleFilesAdded}
              disabled={isMerging}
              title="Drag and drop PDF files"
            />
          ) : (
            <>
              <FileQueueList
                files={files}
                disabled={isMerging}
                onReorder={handleReorder}
                onRemove={handleRemove}
                appendItem={
                  <li>
                    <PdfFileSelector
                      variant="tile"
                      multiple
                      ariaLabel="Select PDF files"
                      onSelect={handleFilesAdded}
                      disabled={isMerging}
                      buttonLabel="Add more files"
                    />
                  </li>
                }
              />
              <div className="flex items-center justify-between gap-3">
                <Button
                  variant="outline"
                  disabled={isMerging}
                  onClick={handleClearAll}
                >
                  Clear all
                </Button>
                <Button
                  disabled={!canMerge || isMerging}
                  onClick={() => {
                    void handleMerge();
                  }}
                >
                  {isMerging ? 'Merging...' : 'Merge and Download'}
                </Button>
              </div>
            </>
          )}
        </div>
      }
      errorMessage={errorMessage}
      successMessage={successMessage}
    />
  );
}

const mergeToolModule: ToolModule = {
  meta: {
    title: 'Merge PDF',
    description: 'Combine PDFs in the order you choose directly in your browser.',
  },
  run: runMerge,
  renderWorkspaceContent: () => <MergeToolWorkspace />,
};

export default mergeToolModule;
