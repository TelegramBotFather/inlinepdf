import { useMemo, useState } from 'react';

import { PdfFileSelector } from '~/components/pdf-file-selector';
import { Shell } from '~/components/layout/shell';
import { MergeActions } from '~/features/merge/components/merge-actions';
import { MergeFileList } from '~/features/merge/components/merge-file-list';
import { mergeWithPdfLib } from '~/features/merge/service/merge-with-pdf-lib';
import type { MergeInputFile } from '~/features/merge/types';

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

function reorderList(
  items: MergeInputFile[],
  currentIndex: number,
  direction: -1 | 1,
): MergeInputFile[] {
  const nextIndex = currentIndex + direction;
  if (nextIndex < 0 || nextIndex >= items.length) {
    return items;
  }

  const updated = [...items];
  const currentItem = updated[currentIndex];
  const nextItem = updated[nextIndex];

  updated[currentIndex] = nextItem;
  updated[nextIndex] = currentItem;
  return updated;
}

export function meta() {
  return [
    { title: 'Merge PDF | InlinePDF' },
    {
      name: 'description',
      content:
        'Merge multiple PDFs directly in your browser. No file transfer, no accounts, local-only processing.',
    },
  ];
}

export default function MergePdfRoute() {
  const [files, setFiles] = useState<MergeInputFile[]>([]);
  const [isMerging, setIsMerging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const canMerge = files.length >= 2;
  const selectedFileCount = useMemo(() => files.length, [files]);

  function handleFilesAdded(newFiles: File[]) {
    const mapped = newFiles.map((file) => ({ id: createEntryId(file), file }));
    setFiles((current) => [...current, ...mapped]);
    setErrorMessage(null);
    setSuccessMessage(null);
  }

  function handleMoveUp(id: string) {
    setFiles((current) => {
      const index = current.findIndex((entry) => entry.id === id);
      if (index === -1) {
        return current;
      }

      return reorderList(current, index, -1);
    });
  }

  function handleMoveDown(id: string) {
    setFiles((current) => {
      const index = current.findIndex((entry) => entry.id === id);
      if (index === -1) {
        return current;
      }

      return reorderList(current, index, 1);
    });
  }

  function handleRemove(id: string) {
    setFiles((current) => current.filter((entry) => entry.id !== id));
    setErrorMessage(null);
    setSuccessMessage(null);
  }

  async function handleMerge() {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsMerging(true);

    try {
      const result = await mergeWithPdfLib(files.map((entry) => entry.file));
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
    <Shell>
      <section className="space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Merge PDF</h1>
          <p className="text-muted-foreground">
            Combine PDFs in the exact order you choose.
          </p>
          <p className="text-sm text-muted-foreground">
            {selectedFileCount} file{selectedFileCount === 1 ? '' : 's'}{' '}
            selected
          </p>
        </header>

        {files.length === 0 ? (
          <PdfFileSelector
            multiple
            ariaLabel="Select PDF files"
            onSelect={handleFilesAdded}
            disabled={isMerging}
            title="Drag and drop PDF files"
          />
        ) : null}

        {files.length > 0 ? (
          <>
            <MergeFileList
              files={files}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
              onRemove={handleRemove}
              disabled={isMerging}
            />
            <PdfFileSelector
              variant="inline"
              multiple
              ariaLabel="Select PDF files"
              onSelect={handleFilesAdded}
              disabled={isMerging}
              buttonLabel="Select more PDF files"
            />
          </>
        ) : null}

        <MergeActions
          canMerge={canMerge}
          isMerging={isMerging}
          onMerge={handleMerge}
          errorMessage={errorMessage}
          successMessage={successMessage}
        />
      </section>
    </Shell>
  );
}
