import { useState } from 'react';

import { readPdfDetails } from '~/platform/pdf/read-pdf-details';

import { createFileEntryId } from './create-file-entry-id';
import type { QueuedFile } from './file-queue-list';
import { useLatestAsyncId } from './use-latest-async';

type PdfDetails = Awaited<ReturnType<typeof readPdfDetails>>;

export function createLoadingPdfQueuedFile(file: File): QueuedFile {
  return {
    id: createFileEntryId(file),
    file,
    pageCount: null,
    previewDataUrl: null,
    previewStatus: 'loading',
  };
}

export function applyPdfDetailsToQueuedFile(
  entry: QueuedFile,
  details: PdfDetails,
): QueuedFile {
  return {
    ...entry,
    pageCount: details.pageCount,
    previewDataUrl: details.previewDataUrl,
    previewStatus: details.previewDataUrl ? 'ready' : 'unavailable',
  };
}

export function markPdfQueuedFileUnavailable(entry: QueuedFile): QueuedFile {
  return {
    ...entry,
    previewStatus: 'unavailable',
  };
}

export function useSinglePdfQueuedFileSelection() {
  const activeSelection = useLatestAsyncId<string>();
  const [selectedFileEntry, setSelectedFileEntry] = useState<QueuedFile | null>(
    null,
  );

  function selectFile(file: File) {
    const entry = createLoadingPdfQueuedFile(file);
    activeSelection.activate(entry.id);
    setSelectedFileEntry(entry);

    void readPdfDetails(file)
      .then((details) => {
        if (!activeSelection.isActive(entry.id)) {
          return;
        }

        setSelectedFileEntry((current) =>
          current?.id === entry.id
            ? applyPdfDetailsToQueuedFile(current, details)
            : current,
        );
      })
      .catch(() => {
        if (!activeSelection.isActive(entry.id)) {
          return;
        }

        setSelectedFileEntry((current) =>
          current?.id === entry.id
            ? markPdfQueuedFileUnavailable(current)
            : current,
        );
      });

    return entry;
  }

  function clearSelection() {
    activeSelection.clear();
    setSelectedFileEntry(null);
  }

  return {
    selectedFileEntry,
    selectFile,
    clearSelection,
    setSelectedFileEntry,
  };
}
