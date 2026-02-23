/* eslint-disable react-refresh/only-export-components */

import { useState } from 'react';

import { PdfFileSelector } from '~/components/pdf-file-selector';
import { Button } from '~/components/ui/button';
import { NativeSelect, NativeSelectOption } from '~/components/ui/native-select';
import { Spinner } from '~/components/ui/spinner';
import { PageSelectionCarousel } from '~/features/crop/components/page-selection-carousel';
import { PdfCropEditor } from '~/features/crop/components/pdf-crop-editor';
import { hasValidRect } from '~/features/crop/service/coordinate-math';
import { exportCroppedPdf } from '~/features/crop/service/export-cropped-pdf';
import { readPdfPages } from '~/features/crop/service/read-pdf-pages';
import type {
  CropDocumentPreview,
  CropPreset,
  CropResult,
  CropRunOptions,
  CropStep,
  PageCropState,
} from '~/features/crop/types';
import { ToolWorkspace } from '~/features/tools/components/tool-workspace';
import type {
  ToolModule,
  ToolModuleRunInput,
} from '~/features/tools/tool-modules';

const PRESET_OPTIONS: { value: CropPreset; label: string }[] = [
  { value: 'free', label: 'Freeform' },
  { value: 'a4', label: 'A4' },
  { value: 'letter', label: 'Letter' },
  { value: '1:1', label: '1:1' },
  { value: '4:3', label: '4:3' },
  { value: '16:9', label: '16:9' },
];

const DEFAULT_CROP_RECT = {
  x: 0,
  y: 0,
  width: 1,
  height: 1,
};

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

function triggerFileDownload(blob: Blob, fileName: string) {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(objectUrl);
}

function isPageCropState(value: unknown): value is PageCropState {
  return typeof value === 'object' && value !== null;
}

function isCropRunOptions(value: unknown): value is CropRunOptions {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const options = value as CropRunOptions;
  return Array.isArray(options.selectedPages) && isPageCropState(options.pageCrops);
}

function normalizePageSelection(pageNumbers: number[]): number[] {
  return [...new Set(pageNumbers)].sort((a, b) => a - b);
}

async function runCrop(
  { files }: ToolModuleRunInput,
  options?: Record<string, unknown>,
): Promise<CropResult> {
  const sourceFile = files.at(0);
  if (!sourceFile) {
    throw new Error('Select a PDF file before cropping.');
  }

  if (!isCropRunOptions(options)) {
    throw new Error('Missing crop settings. Please select pages and crop areas.');
  }

  return exportCroppedPdf({
    file: sourceFile,
    selectedPages: options.selectedPages,
    pageCrops: options.pageCrops,
  });
}

function CropToolWorkspace() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentPreview, setDocumentPreview] = useState<CropDocumentPreview | null>(
    null,
  );
  const [step, setStep] = useState<CropStep>('select');
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [activePageNumber, setActivePageNumber] = useState<number | null>(null);
  const [pageCrops, setPageCrops] = useState<PageCropState>({});
  const [preset, setPreset] = useState<CropPreset>('free');
  const [isReadingPdf, setIsReadingPdf] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const selectedPageCount = selectedPages.length;
  const activePageIndex =
    activePageNumber === null ? -1 : selectedPages.indexOf(activePageNumber);
  const hasPreviousSelectedPage = activePageIndex > 0;
  const hasNextSelectedPage =
    activePageIndex !== -1 && activePageIndex < selectedPages.length - 1;
  const configuredPageCount = selectedPages.filter((pageNumber) =>
    hasValidRect(pageCrops[pageNumber]),
  ).length;
  const canContinueToCrop =
    !!documentPreview && selectedPageCount > 0 && !isReadingPdf && !isExporting;
  const canExport =
    selectedFile !== null &&
    step === 'crop' &&
    selectedPageCount > 0 &&
    configuredPageCount === selectedPageCount &&
    !isExporting &&
    !isReadingPdf;
  const firstPagePreview = documentPreview?.pages[0]?.thumbnailDataUrl ?? null;

  function clearMessages() {
    setErrorMessage(null);
    setSuccessMessage(null);
  }

  async function handleFileSelected(file: File) {
    clearMessages();
    setIsReadingPdf(true);
    setSelectedFile(file);
    setDocumentPreview(null);
    setSelectedPages([]);
    setActivePageNumber(null);
    setPageCrops({});
    setStep('select');
    setPreset('free');

    try {
      const preview = await readPdfPages(file);
      const initialSelection = preview.pageCount > 0 ? [1] : [];

      setDocumentPreview(preview);
      setSelectedPages(initialSelection);
      setActivePageNumber(initialSelection[0] ?? null);
      setPageCrops(
        initialSelection[0]
          ? {
              1: { ...DEFAULT_CROP_RECT },
            }
          : {},
      );
    } catch (error: unknown) {
      const fallback = 'Failed to read PDF pages.';
      setErrorMessage(error instanceof Error ? error.message : fallback);
      setSelectedFile(null);
      setDocumentPreview(null);
    } finally {
      setIsReadingPdf(false);
    }
  }

  function handleReplaceFile() {
    if (isReadingPdf || isExporting) {
      return;
    }

    setSelectedFile(null);
    setDocumentPreview(null);
    setStep('select');
    setSelectedPages([]);
    setActivePageNumber(null);
    setPageCrops({});
    clearMessages();
  }

  function handleTogglePage(pageNumber: number) {
    clearMessages();

    setSelectedPages((current) => {
      const isAlreadySelected = current.includes(pageNumber);
      const nextSelection = isAlreadySelected
        ? current.filter((value) => value !== pageNumber)
        : normalizePageSelection([...current, pageNumber]);

      if (!isAlreadySelected) {
        setPageCrops((currentCrops) =>
          pageNumber in currentCrops
            ? currentCrops
            : { ...currentCrops, [pageNumber]: { ...DEFAULT_CROP_RECT } },
        );
      }

      setActivePageNumber((currentActive) => {
        if (nextSelection.length === 0) {
          return null;
        }

        if (currentActive !== null && nextSelection.includes(currentActive)) {
          return currentActive;
        }

        return nextSelection[0];
      });

      return nextSelection;
    });
  }

  function handleContinueToCrop() {
    if (!canContinueToCrop) {
      return;
    }

    setStep('crop');
    setActivePageNumber((current) => current ?? selectedPages[0]);
  }

  function handleBackToSelection() {
    if (isExporting) {
      return;
    }

    setStep('select');
    clearMessages();
  }

  function handleCropChanged(pageNumber: number, nextRect: PageCropState[number]) {
    setPageCrops((current) => ({
      ...current,
      [pageNumber]: nextRect,
    }));
    setErrorMessage(null);
  }

  async function handleExport() {
    if (!selectedFile) {
      return;
    }

    clearMessages();
    setIsExporting(true);

    try {
      const result = await runCrop(
        { files: [selectedFile] },
        { selectedPages, pageCrops },
      );
      triggerFileDownload(result.blob, result.fileName);
      setSuccessMessage(
        `Cropped PDF ready. Exported ${String(result.pagesExported)} page${result.pagesExported === 1 ? '' : 's'}.`,
      );
    } catch (error: unknown) {
      const fallback = 'Failed to crop this PDF.';
      setErrorMessage(error instanceof Error ? error.message : fallback);
    } finally {
      setIsExporting(false);
    }
  }

  function goToPreviousPage() {
    if (activePageIndex <= 0) {
      return;
    }

    setActivePageNumber(selectedPages[activePageIndex - 1]);
  }

  function goToNextPage() {
    if (activePageIndex === -1 || activePageIndex >= selectedPages.length - 1) {
      return;
    }

    setActivePageNumber(selectedPages[activePageIndex + 1]);
  }

  if (!selectedFile) {
    return (
      <ToolWorkspace
        title="Crop PDF"
        description="Select pages and crop areas in an immersive editor."
        inputPanel={
          <PdfFileSelector
            ariaLabel="Select PDF file for cropping"
            onSelect={(files) => {
              void handleFileSelected(files[0]);
            }}
            disabled={isReadingPdf || isExporting}
            title="Drag and drop a PDF to crop"
          />
        }
        errorMessage={errorMessage}
      />
    );
  }

  if (step === 'select') {
    const fileInfoPanel = (
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="h-24 w-[74px] shrink-0 overflow-hidden rounded-md border border-border bg-white">
              {firstPagePreview ? (
                <img
                  src={firstPagePreview}
                  alt={`First page preview of ${selectedFile.name}`}
                  className="h-full w-full object-cover object-top"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                  Preview
                </div>
              )}
            </div>
            <div className="min-w-0 space-y-1">
              <p className="text-sm text-muted-foreground">Selected file</p>
              <p className="text-sm font-semibold break-all">{selectedFile.name}</p>
              <p className="text-xs text-muted-foreground">
                {documentPreview
                  ? `${String(documentPreview.pageCount)} total page${documentPreview.pageCount === 1 ? '' : 's'}`
                  : 'Preparing pages...'}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatBytes(selectedFile.size)}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            disabled={isReadingPdf || isExporting}
            onClick={handleReplaceFile}
          >
            Choose another file
          </Button>
        </div>
      </div>
    );

    if (isReadingPdf || !documentPreview) {
      return (
        <ToolWorkspace
          title="Crop PDF"
          description="Select pages and crop areas before exporting."
          helperText="Reading PDF and generating page previews..."
          inputPanel={fileInfoPanel}
          outputPanel={
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner className="h-4 w-4" />
              <span>Preparing page previews...</span>
            </div>
          }
          errorMessage={errorMessage}
        />
      );
    }

    return (
      <ToolWorkspace
        title="Crop PDF"
        description="Select pages and crop areas before exporting."
        inputPanel={fileInfoPanel}
        actionBar={
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-3">
            <p className="text-sm text-muted-foreground">
              {selectedPageCount === 0
                ? 'No pages selected.'
                : `${String(selectedPageCount)} selected · continue to set crop areas`}
            </p>
            <Button disabled={!canContinueToCrop} onClick={handleContinueToCrop}>
              Continue to crop
            </Button>
          </div>
        }
        outputPanel={
          <PageSelectionCarousel
            pages={documentPreview.pages}
            selectedPages={selectedPages}
            disabled={isExporting}
            onTogglePage={handleTogglePage}
          />
        }
        errorMessage={errorMessage}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-[80] bg-background">
      <div className="flex h-full flex-col">
        <header className="flex flex-wrap items-center gap-2 border-b border-border/70 px-3 py-3 md:px-4">
          <Button variant="ghost" onClick={handleBackToSelection} disabled={isExporting}>
            Pages
          </Button>
          <Button variant="ghost" onClick={handleReplaceFile} disabled={isExporting}>
            Replace file
          </Button>
          <div className="h-6 w-px bg-border/80" />
          <label className="ml-1 flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Aspect</span>
            <NativeSelect
              value={preset}
              disabled={isExporting}
              onChange={(event) => {
                setPreset(event.currentTarget.value as CropPreset);
              }}
            >
              {PRESET_OPTIONS.map((option) => (
                <NativeSelectOption key={option.value} value={option.value}>
                  {option.label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </label>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              disabled={!hasPreviousSelectedPage || isExporting}
              onClick={goToPreviousPage}
            >
              Prev
            </Button>
            <p className="min-w-[9rem] text-center text-sm text-muted-foreground">
              {activePageIndex === -1
                ? 'No page selected'
                : `Page ${String(activePageIndex + 1)} of ${String(selectedPageCount)}`}
            </p>
            <Button
              variant="outline"
              disabled={!hasNextSelectedPage || isExporting}
              onClick={goToNextPage}
            >
              Next
            </Button>
            <Button
              disabled={!canExport}
              onClick={() => {
                void handleExport();
              }}
            >
              {isExporting ? 'Cropping...' : 'Crop and Download'}
            </Button>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-hidden px-2 py-2 md:px-4 md:py-3">
          {activePageNumber ? (
            <PdfCropEditor
              key={String(activePageNumber)}
              immersive
              sourceFile={selectedFile}
              pageNumber={activePageNumber}
              preset={preset}
              cropRect={pageCrops[activePageNumber]}
              onCropChange={(nextRect) => {
                handleCropChanged(activePageNumber, nextRect);
              }}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-muted-foreground">
                Select at least one page to start cropping.
              </p>
            </div>
          )}
        </main>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 px-4 py-3">
          <p className="text-sm text-muted-foreground">
            {`${String(configuredPageCount)}/${String(selectedPageCount)} selected pages have crop areas`}
          </p>
          {errorMessage ? (
            <p role="alert" className="text-sm font-medium text-destructive">
              {errorMessage}
            </p>
          ) : successMessage ? (
            <p className="text-sm font-medium">{successMessage}</p>
          ) : null}
        </footer>
      </div>
    </div>
  );
}

const cropToolModule: ToolModule = {
  meta: {
    title: 'Crop PDF',
    description:
      'Select pages and crop areas with touch-friendly controls before exporting.',
  },
  run: runCrop,
  renderWorkspaceContent: () => <CropToolWorkspace />,
};

export default cropToolModule;
