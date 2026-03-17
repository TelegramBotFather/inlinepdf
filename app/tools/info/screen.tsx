import { useState } from 'react';
import { useFetcher } from 'react-router';

import { PdfFileSelector } from '~/components/pdf-file-selector';
import { Skeleton } from '~/components/ui/skeleton';
import { saveClientActionFallback } from '~/platform/files/client-action-fallback';
import { readPdfDetails } from '~/platform/pdf/read-pdf-details';
import {
  FileQueueList,
  type QueuedFile,
} from '~/shared/tool-ui/file-queue-list';
import { ToolWorkspace } from '~/shared/tool-ui/tool-workspace';
import { createFileEntryId } from '~/shared/tool-ui/create-file-entry-id';
import type { ToolActionResult } from '~/shared/tool-ui/action-result';
import type { PdfInfoResult } from '~/tools/info/models';

const genericFontFamilies = new Set([
  'serif',
  'sans-serif',
  'monospace',
  'cursive',
  'fantasy',
  'system-ui',
  'ui-serif',
  'ui-sans-serif',
  'ui-monospace',
  'emoji',
  'math',
  'fangsong',
]);

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${String(bytes)} B`;
  }

  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(2)} KB`;
  }

  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
}

export function PdfInfoToolScreen() {
  const fetcher = useFetcher<ToolActionResult<PdfInfoResult>>();
  const [localErrorMessage, setLocalErrorMessage] = useState<string | null>(
    null,
  );
  const [selectedFileEntry, setSelectedFileEntry] = useState<QueuedFile | null>(
    null,
  );

  const isLoading = fetcher.state !== 'idle';
  const actionErrorMessage =
    fetcher.data && !fetcher.data.ok ? fetcher.data.message : null;
  const errorMessage = localErrorMessage ?? actionErrorMessage;
  const result =
    selectedFileEntry && fetcher.data?.ok
      ? (fetcher.data.result ?? null)
      : null;

  function handleFileSelection(file: File) {
    const entryId = createFileEntryId(file);

    setSelectedFileEntry({
      id: entryId,
      file,
      pageCount: null,
      previewDataUrl: null,
      previewStatus: 'loading',
    });
    setLocalErrorMessage(null);

    void readPdfDetails(file).then((details) => {
      setSelectedFileEntry((current) =>
        current?.id === entryId
          ? {
              ...current,
              pageCount: details.pageCount,
              previewDataUrl: details.previewDataUrl,
              previewStatus: details.previewDataUrl ? 'ready' : 'unavailable',
            }
          : current,
      );
    });

    const submissionId = saveClientActionFallback({ file });
    const formData = new FormData();
    formData.set('file', file);
    formData.set('submissionId', submissionId);
    void fetcher.submit(formData, { method: 'post' });
  }

  function handleClearSelection() {
    if (isLoading) {
      return;
    }

    setSelectedFileEntry(null);
    setLocalErrorMessage(null);
  }

  const additionalInfoEntries = result
    ? Object.entries(result.infoDictionary).sort(([a], [b]) =>
        a.localeCompare(b),
      )
    : [];
  const visibleFontFamilies = result
    ? [...new Set(result.fonts.fontFamilies)]
        .map((value) => value.trim())
        .filter((value) => value.length > 0)
        .filter((value) => !genericFontFamilies.has(value.toLowerCase()))
    : [];
  const metadataRows = result
    ? [
        ['File name', result.document.fileName],
        ['File size', formatBytes(result.document.fileSizeBytes)],
        ['Pages', String(result.document.pageCount)],
        ['Encrypted', result.document.isEncrypted ? 'Yes' : 'No'],
        ['Title', result.core.title ?? 'Not set'],
        ['Author', result.core.author ?? 'Not set'],
        ['Subject', result.core.subject ?? 'Not set'],
        [
          'Keywords',
          result.core.keywords.length > 0
            ? result.core.keywords.join(', ')
            : 'Not set',
        ],
        ['Creator', result.core.creator ?? 'Not set'],
        ['Producer', result.core.producer ?? 'Not set'],
        ['Creation date', result.core.creationDate ?? 'Not set'],
        ['Modification date', result.core.modificationDate ?? 'Not set'],
        [
          'Font families',
          visibleFontFamilies.length > 0
            ? visibleFontFamilies.join(', ')
            : 'Not identified',
        ],
        [
          'Font identifiers detected',
          `${String(result.fonts.internalNames.length)} technical IDs`,
        ],
      ]
    : [];

  return (
    <ToolWorkspace
      title="PDF Info"
      description="Extract metadata, hidden info dictionary fields, and font details."
      inputPanel={
        selectedFileEntry ? (
          <FileQueueList
            files={[selectedFileEntry]}
            disabled={isLoading}
            showIndexBadge={false}
            onRemove={() => {
              handleClearSelection();
            }}
          />
        ) : (
          <PdfFileSelector
            ariaLabel="Select PDF file"
            onSelect={(files) => {
              handleFileSelection(files[0]);
            }}
            disabled={isLoading}
          />
        )
      }
      helperText={isLoading ? 'Extracting PDF details...' : undefined}
      outputPanel={
        isLoading ? (
          <div className="space-y-3">
            <p className="text-sm font-medium">Metadata</p>
            <div className="space-y-2">
              {Array.from({ length: 8 }, (_, rowIndex) => (
                <div
                  key={String(rowIndex)}
                  className="grid gap-2 rounded-md border border-border/60 bg-muted/20 p-3 sm:grid-cols-[12rem_1fr]"
                >
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-full" />
                </div>
              ))}
            </div>
          </div>
        ) : result ? (
          <div className="space-y-4">
            <p className="text-sm font-medium">Metadata</p>
            <div className="space-y-2">
              {metadataRows.map(([label, value]) => (
                <div
                  key={label}
                  className="grid gap-1 border-b border-border pb-2 last:border-b-0 sm:grid-cols-[12rem_1fr]"
                >
                  <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                    {label}
                  </p>
                  <p className="text-sm font-medium wrap-break-word">{value}</p>
                </div>
              ))}
              {additionalInfoEntries.map(([key, value]) => (
                <div
                  key={key}
                  className="grid gap-1 border-b border-border pb-2 last:border-b-0 sm:grid-cols-[12rem_1fr]"
                >
                  <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                    {`Info: ${key}`}
                  </p>
                  <p className="text-sm font-medium wrap-break-word">{value}</p>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Raw XMP metadata</p>
              {result.rawXmpMetadata ? (
                <pre className="overflow-x-auto rounded-md border border-border p-3 text-xs">
                  <code>{result.rawXmpMetadata}</code>
                </pre>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No XMP metadata present.
                </p>
              )}
            </div>
          </div>
        ) : null
      }
      errorMessage={errorMessage}
    />
  );
}
