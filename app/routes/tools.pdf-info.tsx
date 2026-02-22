import { useState } from 'react';

import { Cancel01Icon, File01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { PdfFileSelector } from '~/components/pdf-file-selector';
import { Shell } from '~/components/layout/shell';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { extractPdfInfo } from '~/features/pdf-info/service/extract-pdf-info';
import type { PdfInfoResult } from '~/features/pdf-info/types';

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

export function meta() {
  return [
    { title: 'PDF Info | InlinePDF' },
    {
      name: 'description',
      content:
        'Extract metadata, producer/writer fields, and font details from PDFs directly in your browser.',
    },
  ];
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[220px_1fr] sm:gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="break-words">{value}</dd>
    </div>
  );
}

export default function PdfInfoRoute() {
  const [result, setResult] = useState<PdfInfoResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  async function extractFromFile(file: File) {
    setErrorMessage(null);
    setResult(null);
    setIsLoading(true);

    try {
      const extracted = await extractPdfInfo(file);
      setResult(extracted);
    } catch (error: unknown) {
      const fallback = 'Failed to extract PDF information.';
      setErrorMessage(error instanceof Error ? error.message : fallback);
    } finally {
      setIsLoading(false);
    }
  }

  function handleFileSelection(file: File) {
    setSelectedFile(file);
    void extractFromFile(file);
  }

  function handleClearSelection() {
    if (isLoading) {
      return;
    }

    setSelectedFile(null);
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

  return (
    <Shell>
      <section className="space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">PDF Info</h1>
          <p className="text-muted-foreground">
            Extract metadata, hidden info dictionary fields, and font details.
          </p>
        </header>

        {selectedFile ? (
          <div className="space-y-3">
            <div className="relative rounded-xl border border-border bg-card p-4 pr-12">
              <button
                type="button"
                aria-label="Clear selected PDF file"
                onClick={handleClearSelection}
                disabled={isLoading}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={20} />
              </button>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background">
                  <HugeiconsIcon icon={File01Icon} size={20} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(selectedFile.size)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <PdfFileSelector
            ariaLabel="Select PDF file"
            onSelect={(files) => {
              handleFileSelection(files[0]);
            }}
            disabled={isLoading}
            title="Drag and drop a PDF file"
          />
        )}

        {isLoading ? (
          <p className="text-sm text-muted-foreground">
            Extracting PDF details...
          </p>
        ) : null}
        {errorMessage ? (
          <p role="alert" className="text-sm font-medium text-destructive">
            {errorMessage}
          </p>
        ) : null}

        {result ? (
          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <dl className="space-y-2 text-sm">
                <InfoRow label="File name" value={result.document.fileName} />
                <InfoRow
                  label="File size"
                  value={formatBytes(result.document.fileSizeBytes)}
                />
                <InfoRow label="Pages" value={result.document.pageCount} />
                <InfoRow
                  label="Encrypted"
                  value={result.document.isEncrypted ? 'Yes' : 'No'}
                />
                <InfoRow label="Title" value={result.core.title ?? 'Not set'} />
                <InfoRow
                  label="Author"
                  value={result.core.author ?? 'Not set'}
                />
                <InfoRow
                  label="Subject"
                  value={result.core.subject ?? 'Not set'}
                />
                <InfoRow
                  label="Keywords"
                  value={
                    result.core.keywords.length > 0
                      ? result.core.keywords.join(', ')
                      : 'Not set'
                  }
                />
                <InfoRow
                  label="Creator"
                  value={result.core.creator ?? 'Not set'}
                />
                <InfoRow
                  label="Producer"
                  value={result.core.producer ?? 'Not set'}
                />
                <InfoRow
                  label="Creation date"
                  value={result.core.creationDate ?? 'Not set'}
                />
                <InfoRow
                  label="Modification date"
                  value={result.core.modificationDate ?? 'Not set'}
                />
                <InfoRow
                  label="Font families"
                  value={
                    visibleFontFamilies.length > 0
                      ? visibleFontFamilies.join(', ')
                      : 'Not identified'
                  }
                />
                <InfoRow
                  label="Font identifiers detected"
                  value={`${String(result.fonts.internalNames.length)} technical IDs`}
                />
                {additionalInfoEntries.length > 0
                  ? additionalInfoEntries.map(([key, value]) => (
                      <InfoRow key={key} label={`Info: ${key}`} value={value} />
                    ))
                  : null}
              </dl>

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
            </CardContent>
          </Card>
        ) : null}
      </section>
    </Shell>
  );
}
