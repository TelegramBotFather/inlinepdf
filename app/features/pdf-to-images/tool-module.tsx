/* eslint-disable react-refresh/only-export-components */

import { useRef, useState } from 'react';

import { PdfFileSelector } from '~/components/pdf-file-selector';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { NativeSelect, NativeSelectOption } from '~/components/ui/native-select';
import { readPdfDetails } from '~/features/pdf/service/read-pdf-details';
import {
  MAX_QUALITY_LONG_EDGE_TARGET_PX,
  readPdfImageBaseResolution,
  renderPdfToImages,
} from '~/features/pdf-to-images/service/render-pdf-to-images';
import {
  createImagesArchiveName,
  zipImages,
} from '~/features/pdf-to-images/service/zip-images';
import type {
  ImageOutputFormat,
  MaxDimensionCap,
  PdfImageBaseResolution,
  RenderProgress,
  ResolutionInfo,
} from '~/features/pdf-to-images/types';
import {
  FileQueueList,
  type QueuedFile,
} from '~/features/tools/components/file-queue-list';
import { ToolWorkspace } from '~/features/tools/components/tool-workspace';
import type {
  ToolModule,
  ToolModuleRunInput,
} from '~/features/tools/tool-modules';

interface PdfToImagesRunOptions {
  format: ImageOutputFormat;
  maxDimensionCap: MaxDimensionCap;
  pageNumbers?: number[];
  onProgress?: (progress: RenderProgress) => void;
}

interface PdfToImagesResult {
  blob: Blob;
  fileName: string;
  pageCount: number;
}

const FORMAT_OPTIONS: { value: ImageOutputFormat; label: string }[] = [
  { value: 'png', label: 'PNG' },
  { value: 'jpeg', label: 'JPEG' },
  { value: 'webp', label: 'WEBP' },
];

const MAX_DIMENSION_CAP_OPTIONS: { value: MaxDimensionCap; label: string }[] = [
  { value: 3000, label: '3000 px' },
  { value: 4000, label: '4000 px' },
  { value: 5000, label: '5000 px' },
  { value: 6000, label: '6000 px' },
  { value: 8000, label: '8000 px' },
];

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

function isImageOutputFormat(value: unknown): value is ImageOutputFormat {
  return value === 'png' || value === 'jpeg' || value === 'webp';
}

function isMaxDimensionCap(value: unknown): value is MaxDimensionCap {
  return value === 3000 || value === 4000 || value === 5000 || value === 6000 || value === 8000;
}

function parsePageRangeToken(
  token: string,
  totalPages: number,
): number[] {
  const normalized = token.trim();
  if (!normalized) {
    return [];
  }

  if (/^\d+$/.test(normalized)) {
    const pageNumber = Number.parseInt(normalized, 10);
    if (pageNumber < 1 || pageNumber > totalPages) {
      throw new Error(`Page ${String(pageNumber)} is outside the document range.`);
    }

    return [pageNumber];
  }

  const rangeMatch = /^(\d+)\s*-\s*(\d+)$/.exec(normalized);
  if (!rangeMatch) {
    throw new Error(`Invalid range token "${normalized}". Use formats like 1, 3-5, 8.`);
  }

  const start = Number.parseInt(rangeMatch[1], 10);
  const end = Number.parseInt(rangeMatch[2], 10);
  if (start > end) {
    throw new Error(`Invalid range "${normalized}". Start page must be before end page.`);
  }

  if (start < 1 || end > totalPages) {
    throw new Error(`Range "${normalized}" is outside the document range.`);
  }

  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function parsePageRangeInput(
  value: string,
  totalPages: number,
): number[] {
  const pageNumbers = value
    .split(',')
    .flatMap((token) => parsePageRangeToken(token, totalPages));

  const uniqueSorted = [...new Set(pageNumbers)].sort((a, b) => a - b);
  if (uniqueSorted.length < 1) {
    throw new Error('Enter at least one page number.');
  }

  return uniqueSorted;
}

function isPdfToImagesRunOptions(value: unknown): value is PdfToImagesRunOptions {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const options = value as Partial<PdfToImagesRunOptions>;
  const onProgressIsValid =
    options.onProgress === undefined || typeof options.onProgress === 'function';

  return (
    isImageOutputFormat(options.format) &&
    isMaxDimensionCap(options.maxDimensionCap) &&
    (options.pageNumbers === undefined || Array.isArray(options.pageNumbers)) &&
    onProgressIsValid
  );
}

function calculateResolutionInfo(
  base: PdfImageBaseResolution,
  maxDimensionCap: MaxDimensionCap,
): ResolutionInfo {
  const baseLongEdgePx = Math.max(base.baseWidthPx, base.baseHeightPx);
  const selectedLongEdgePx = Math.min(
    MAX_QUALITY_LONG_EDGE_TARGET_PX,
    maxDimensionCap,
  );
  const effectiveScale = selectedLongEdgePx / Math.max(1, baseLongEdgePx);

  return {
    ...base,
    scaledWidthPx: Math.max(1, Math.round(base.baseWidthPx * effectiveScale)),
    scaledHeightPx: Math.max(1, Math.round(base.baseHeightPx * effectiveScale)),
    selectedLongEdgePx,
    effectiveScale,
  };
}

async function runPdfToImages(
  { files }: ToolModuleRunInput,
  options?: Record<string, unknown>,
): Promise<PdfToImagesResult> {
  const sourceFile = files.at(0);
  if (!sourceFile) {
    throw new Error('Select a PDF file before converting.');
  }

  if (!isPdfToImagesRunOptions(options)) {
    throw new Error('Select an output format before converting.');
  }

  const images = await renderPdfToImages({
    file: sourceFile,
    format: options.format,
    maxDimensionCap: options.maxDimensionCap,
    pageNumbers: options.pageNumbers,
    onProgress: options.onProgress,
  });

  const archiveBlob = await zipImages({ images });
  const archiveName = createImagesArchiveName(
    sourceFile.name,
    options.format,
  );

  return {
    blob: archiveBlob,
    fileName: archiveName,
    pageCount: images.length,
  };
}

function PdfToImagesToolWorkspace() {
  const activeEntryIdRef = useRef<string | null>(null);
  const [selectedFileEntry, setSelectedFileEntry] = useState<QueuedFile | null>(null);
  const [format, setFormat] = useState<ImageOutputFormat>('png');
  const [maxDimensionCap, setMaxDimensionCap] = useState<MaxDimensionCap>(5000);
  const [pageRangeMode, setPageRangeMode] = useState<'all' | 'custom'>('all');
  const [pageRangeInput, setPageRangeInput] = useState('1');
  const [baseResolution, setBaseResolution] = useState<PdfImageBaseResolution | null>(
    null,
  );
  const [isReadingResolution, setIsReadingResolution] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [progressText, setProgressText] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const hasSelectedFile = !!selectedFileEntry;
  const resolutionInfo = baseResolution
    ? calculateResolutionInfo(baseResolution, maxDimensionCap)
    : null;
  const selectedPageCount = (() => {
    if (!baseResolution) {
      return null;
    }

    if (pageRangeMode === 'all') {
      return baseResolution.pageCount;
    }

    try {
      return parsePageRangeInput(pageRangeInput, baseResolution.pageCount).length;
    } catch {
      return null;
    }
  })();
  const hasValidPageRange = pageRangeMode === 'all' || selectedPageCount !== null;
  const canConvert =
    hasSelectedFile && !!baseResolution && hasValidPageRange && !isConverting;

  function resetMessages() {
    setErrorMessage(null);
    setSuccessMessage(null);
  }

  function handleFileSelection(file: File) {
    const entryId = createEntryId(file);
    activeEntryIdRef.current = entryId;

    setSelectedFileEntry({
      id: entryId,
      file,
      pageCount: null,
      previewDataUrl: null,
      previewStatus: 'loading',
    });
    setBaseResolution(null);
    setProgressText(null);
    setPageRangeMode('all');
    setPageRangeInput('1');
    resetMessages();
    setIsReadingResolution(true);

    void readPdfDetails(file)
      .then((details) => {
        if (activeEntryIdRef.current !== entryId) {
          return;
        }

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
      })
      .catch(() => {
        if (activeEntryIdRef.current !== entryId) {
          return;
        }

        setSelectedFileEntry((current) =>
          current?.id === entryId
            ? {
                ...current,
                previewStatus: 'unavailable',
              }
            : current,
        );
      });

    void readPdfImageBaseResolution(file)
      .then((resolution) => {
        if (activeEntryIdRef.current !== entryId) {
          return;
        }

        setBaseResolution(resolution);
        setSelectedFileEntry((current) =>
          current?.id === entryId
            ? {
                ...current,
                pageCount: current.pageCount ?? resolution.pageCount,
              }
            : current,
        );
      })
      .catch((error: unknown) => {
        if (activeEntryIdRef.current !== entryId) {
          return;
        }

        const fallback = 'Failed to read PDF resolution.';
        setErrorMessage(error instanceof Error ? error.message : fallback);
      })
      .finally(() => {
        if (activeEntryIdRef.current === entryId) {
          setIsReadingResolution(false);
        }
      });
  }

  function handleClearSelection() {
    if (isConverting) {
      return;
    }

    activeEntryIdRef.current = null;
    setSelectedFileEntry(null);
    setBaseResolution(null);
    setProgressText(null);
    setIsReadingResolution(false);
    resetMessages();
  }

  async function handleConvert() {
    if (!selectedFileEntry || !baseResolution) {
      return;
    }

    resetMessages();
    setIsConverting(true);
    setProgressText(null);

    try {
      const selectedPageNumbers =
        pageRangeMode === 'all'
          ? undefined
          : parsePageRangeInput(pageRangeInput, baseResolution.pageCount);

      const result = await runPdfToImages(
        { files: [selectedFileEntry.file] },
        {
          format,
          maxDimensionCap,
          pageNumbers: selectedPageNumbers,
          onProgress: ({ currentPage, totalPages }: RenderProgress) => {
            setProgressText(`Converting page ${String(currentPage)} of ${String(totalPages)}...`);
          },
        },
      );

      triggerFileDownload(result.blob, result.fileName);
      setSuccessMessage(
        `ZIP download started with ${String(result.pageCount)} image${result.pageCount === 1 ? '' : 's'}.`,
      );
    } catch (error: unknown) {
      const fallback = 'Failed to convert PDF into images.';
      setErrorMessage(error instanceof Error ? error.message : fallback);
    } finally {
      setIsConverting(false);
      setProgressText(null);
    }
  }

  return (
    <ToolWorkspace
      title="PDF to Images"
      description="Convert every PDF page into PNG, JPEG, or WEBP and download one ZIP."
      inputPanel={
        selectedFileEntry ? (
          <FileQueueList
            files={[selectedFileEntry]}
            disabled={isConverting}
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
            disabled={isConverting}
            title="Drag and drop a PDF file"
          />
        )
      }
      optionsPanel={
        hasSelectedFile ? (
          <div className="max-w-sm space-y-3">
            <label className="space-y-2 text-sm font-medium">
              <span>Output format</span>
              <NativeSelect
                aria-label="Output format"
                value={format}
                disabled={isConverting}
                onChange={(event) => {
                  setFormat(event.currentTarget.value as ImageOutputFormat);
                }}
                className="w-full"
              >
                {FORMAT_OPTIONS.map((option) => (
                  <NativeSelectOption key={option.value} value={option.value}>
                    {option.label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </label>
            <label className="space-y-2 text-sm font-medium">
              <span>Max dimension cap</span>
              <NativeSelect
                aria-label="Max dimension cap"
                value={String(maxDimensionCap)}
                disabled={isConverting}
                onChange={(event) => {
                  const nextCap = Number(event.currentTarget.value);
                  if (isMaxDimensionCap(nextCap)) {
                    setMaxDimensionCap(nextCap);
                  }
                }}
                className="w-full"
              >
                {MAX_DIMENSION_CAP_OPTIONS.map((option) => (
                  <NativeSelectOption key={String(option.value)} value={String(option.value)}>
                    {option.label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </label>
            <label className="space-y-2 text-sm font-medium">
              <span>Pages to convert</span>
              <NativeSelect
                aria-label="Pages to convert"
                value={pageRangeMode}
                disabled={isConverting}
                onChange={(event) => {
                  const value = event.currentTarget.value;
                  setPageRangeMode(value === 'custom' ? 'custom' : 'all');
                }}
                className="w-full"
              >
                <NativeSelectOption value="all">All pages</NativeSelectOption>
                <NativeSelectOption value="custom">Custom range</NativeSelectOption>
              </NativeSelect>
            </label>
            {pageRangeMode === 'custom' ? (
              <label className="space-y-2 text-sm font-medium">
                <span>Custom range</span>
                <Input
                  aria-label="Custom page range"
                  value={pageRangeInput}
                  disabled={isConverting}
                  onChange={(event) => {
                    setPageRangeInput(event.currentTarget.value);
                  }}
                  placeholder="e.g. 1-3, 5, 9-12"
                />
                <p className="text-xs font-normal text-muted-foreground">
                  Use comma-separated pages and ranges.
                </p>
                {selectedPageCount === null ? (
                  <p className="text-xs font-normal text-destructive">
                    Invalid range. Use values like 1, 3-5, 9.
                  </p>
                ) : null}
              </label>
            ) : null}
          </div>
        ) : null
      }
      outputPanel={
        hasSelectedFile ? (
          isReadingResolution ? (
            <p className="text-sm text-muted-foreground">Reading PDF resolution...</p>
          ) : resolutionInfo ? (
            <div className="space-y-2 rounded-xl border border-border p-4">
              <p className="text-sm font-medium">Output resolution preview</p>
              <dl className="space-y-1 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Pages</dt>
                  <dd>
                    {selectedPageCount === null
                      ? `of ${String(resolutionInfo.pageCount)} total`
                      : `${String(selectedPageCount)} of ${String(resolutionInfo.pageCount)}`}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Base PDF (72 DPI points)</dt>
                  <dd>{`${String(resolutionInfo.baseWidthPx)} x ${String(resolutionInfo.baseHeightPx)} px`}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Selected (Maximum quality)</dt>
                  <dd>{`${String(resolutionInfo.scaledWidthPx)} x ${String(resolutionInfo.scaledHeightPx)} px`}</dd>
                </div>
              </dl>
              <p className="text-xs text-muted-foreground">
                {`Maximum quality targets a ~${String(MAX_QUALITY_LONG_EDGE_TARGET_PX)} px long edge, capped at ${String(maxDimensionCap)} px.`}
                {' '}
                Resolution preview is based on page 1; page sizes can vary in some PDFs.
                {` Effective render scale on page 1: ${resolutionInfo.effectiveScale.toFixed(2)}x.`}
              </p>
            </div>
          ) : null
        ) : null
      }
      actionBar={
        hasSelectedFile ? (
          <div className="space-y-2">
            <Button
              disabled={!canConvert}
              onClick={() => {
                void handleConvert();
              }}
            >
              {isConverting ? 'Converting...' : 'Convert and Download ZIP'}
            </Button>
            {progressText ? (
              <p className="text-sm text-muted-foreground" aria-live="polite">
                {progressText}
              </p>
            ) : null}
          </div>
        ) : null
      }
      errorMessage={errorMessage}
      successMessage={successMessage}
    />
  );
}

const pdfToImagesToolModule: ToolModule = {
  meta: {
    title: 'PDF to Images',
    description:
      'Convert PDF pages into PNG, JPEG, or WEBP images and download as an uncompressed ZIP archive.',
  },
  run: runPdfToImages,
  renderWorkspaceContent: () => <PdfToImagesToolWorkspace />,
};

export default pdfToImagesToolModule;
