/* eslint-disable react-refresh/only-export-components */

import { useState } from 'react';

import { PdfFileSelector } from '~/components/pdf-file-selector';
import { Skeleton } from '~/components/ui/skeleton';
import { readPdfDetails } from '~/features/pdf/service/read-pdf-details';
import {
  FileQueueList,
  type QueuedFile,
} from '~/features/tools/components/file-queue-list';
import { ToolWorkspace } from '~/features/tools/components/tool-workspace';
import { extractPdfInfo } from '~/features/pdf-info/service/extract-pdf-info';
import type { PdfInfoResult } from '~/features/pdf-info/types';
import type {
  ToolModule,
  ToolModuleRunInput,
} from '~/features/tools/tool-modules';

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

function createEntryId(file: File): string {
  if ('randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `${file.name}-${String(file.size)}-${String(Date.now())}`;
}

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

async function runPdfInfo({ files }: ToolModuleRunInput): Promise<PdfInfoResult> {
  const firstFile = files[0];
  return extractPdfInfo(firstFile);
}

function PdfInfoToolWorkspace() {
  const [result, setResult] = useState<PdfInfoResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedFileEntry, setSelectedFileEntry] = useState<QueuedFile | null>(null);

  async function extractFromFile(file: File, entryId: string) {
    setErrorMessage(null);
    setResult(null);
    setIsLoading(true);

    try {
      const extracted = await runPdfInfo({ files: [file] });
      setResult(extracted);
      setSelectedFileEntry((current) =>
        current?.id === entryId
          ? { ...current, pageCount: extracted.document.pageCount }
          : current,
      );
    } catch (error: unknown) {
      const fallback = 'Failed to extract PDF information.';
      setErrorMessage(error instanceof Error ? error.message : fallback);
    } finally {
      setIsLoading(false);
    }
  }

  function handleFileSelection(file: File) {
    const entryId = createEntryId(file);

    setSelectedFileEntry({
      id: entryId,
      file,
      pageCount: null,
      previewDataUrl: null,
      previewStatus: 'loading',
    });
    setErrorMessage(null);
    setResult(null);

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

    void extractFromFile(file, entryId);
  }

  function handleClearSelection() {
    if (isLoading) {
      return;
    }

    setSelectedFileEntry(null);
    setResult(null);
    setErrorMessage(null);
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
            title="Drag and drop a PDF file"
          />
        )
      }
      helperText={isLoading ? 'Extracting PDF details...' : undefined}
      outputPanel={
        isLoading ? (
          <div className="space-y-3">
            <p className="text-sm font-medium">Metadata</p>
            <div className="overflow-x-auto rounded-lg border border-border">
              <div className="min-w-full divide-y divide-border">
                {Array.from({ length: 8 }, (_, rowIndex) => (
                  <div
                    key={String(rowIndex)}
                    className="grid grid-cols-[11rem_minmax(0,1fr)] gap-3 px-3 py-2"
                  >
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : result ? (
          <div className="space-y-4">
            <p className="text-sm font-medium">Metadata</p>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="min-w-full text-sm">
                <tbody className="divide-y divide-border">
                  {metadataRows.map(([label, value]) => (
                    <tr key={label}>
                      <th
                        scope="row"
                        className="w-44 bg-muted/30 px-3 py-2 text-left font-medium text-muted-foreground align-top"
                      >
                        {label}
                      </th>
                      <td className="px-3 py-2 break-words">{value}</td>
                    </tr>
                  ))}
                  {additionalInfoEntries.map(([key, value]) => (
                    <tr key={key}>
                      <th
                        scope="row"
                        className="w-44 bg-muted/30 px-3 py-2 text-left font-medium text-muted-foreground align-top"
                      >
                        {`Info: ${key}`}
                      </th>
                      <td className="px-3 py-2 break-words">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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

const pdfInfoToolModule: ToolModule = {
  meta: {
    title: 'PDF Info',
    description:
      'Extract metadata, producer/writer fields, and font details from PDFs directly in your browser.',
  },
  run: runPdfInfo,
  renderWorkspaceContent: () => <PdfInfoToolWorkspace />,
};

export default pdfInfoToolModule;
