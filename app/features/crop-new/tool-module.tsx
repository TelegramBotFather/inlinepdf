/* eslint-disable react-refresh/only-export-components */

import { type SyntheticEvent, useState } from 'react';
import { ArrowLeft01Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import { PdfFileSelector } from '~/components/pdf-file-selector';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { NativeSelect, NativeSelectOption } from '~/components/ui/native-select';
import { Spinner } from '~/components/ui/spinner';
import { PdfCropEditor } from '~/features/crop/components/pdf-crop-editor';
import { hasValidRect } from '~/features/crop/service/coordinate-math';
import { exportCroppedPdf } from '~/features/crop/service/export-cropped-pdf';
import { readPdfPages } from '~/features/crop/service/read-pdf-pages';
import type {
  CropDocumentPreview,
  CropPreset,
  CropResult,
  NormalizedRect,
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

const DEFAULT_CROP_RECT: NormalizedRect = {
  x: 0.002,
  y: 0.002,
  width: 0.996,
  height: 0.996,
};

interface CropNewRunOptions {
  pageNumber: number;
  cropRect: NormalizedRect | null;
}

function isCropNewRunOptions(value: unknown): value is CropNewRunOptions {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const options = value as Partial<CropNewRunOptions>;
  return (
    Number.isInteger(options.pageNumber) &&
    typeof options.cropRect === 'object' &&
    options.cropRect !== null
  );
}

function triggerFileDownload(blob: Blob, fileName: string) {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(objectUrl);
}

async function runCropNew(
  { files }: ToolModuleRunInput,
  options?: Record<string, unknown>,
): Promise<CropResult> {
  const sourceFile = files.at(0);
  if (!sourceFile) {
    throw new Error('Select a PDF file before cropping.');
  }

  if (!isCropNewRunOptions(options) || !hasValidRect(options.cropRect)) {
    throw new Error('Set a valid crop area before downloading.');
  }

  const pageNumber = Math.max(1, options.pageNumber);

  return exportCroppedPdf({
    file: sourceFile,
    selectedPages: [pageNumber],
    pageCrops: {
      [pageNumber]: options.cropRect,
    },
  });
}

function CropNewToolWorkspace() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentPreview, setDocumentPreview] = useState<CropDocumentPreview | null>(
    null,
  );
  const [activePageNumber, setActivePageNumber] = useState<number | null>(null);
  const [pageInputValue, setPageInputValue] = useState('1');
  const [pageCrops, setPageCrops] = useState<PageCropState>({});
  const [preset, setPreset] = useState<CropPreset>('free');
  const [isReadingPdf, setIsReadingPdf] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const totalPages = documentPreview?.pageCount ?? 0;
  const hasActivePage = activePageNumber !== null && activePageNumber >= 1;
  const canGoPrevious = hasActivePage && activePageNumber > 1;
  const canGoNext = hasActivePage && activePageNumber < totalPages;
  const canExport =
    !!selectedFile &&
    hasActivePage &&
    hasValidRect(pageCrops[activePageNumber]) &&
    !isReadingPdf &&
    !isExporting;

  function clearMessages() {
    setErrorMessage(null);
  }

  function ensurePageCrop(pageNumber: number) {
    setPageCrops((current) =>
      pageNumber in current
        ? current
        : { ...current, [pageNumber]: { ...DEFAULT_CROP_RECT } },
    );
  }

  function setPage(pageNumber: number) {
    if (!documentPreview) {
      return;
    }

    const clamped = Math.min(Math.max(pageNumber, 1), documentPreview.pageCount);
    setActivePageNumber(clamped);
    setPageInputValue(String(clamped));
    ensurePageCrop(clamped);
    setErrorMessage(null);
  }

  async function handleFileSelected(file: File) {
    clearMessages();
    setSelectedFile(file);
    setDocumentPreview(null);
    setActivePageNumber(null);
    setPageCrops({});
    setPreset('free');
    setPageInputValue('1');
    setIsReadingPdf(true);

    try {
      const preview = await readPdfPages(file);
      if (preview.pageCount < 1) {
        throw new Error('This PDF has no pages to crop.');
      }

      setDocumentPreview(preview);
      setActivePageNumber(1);
      setPageInputValue('1');
      setPageCrops({ 1: { ...DEFAULT_CROP_RECT } });
    } catch (error: unknown) {
      const fallback = 'Failed to read PDF pages.';
      setErrorMessage(error instanceof Error ? error.message : fallback);
      setSelectedFile(null);
      setDocumentPreview(null);
      setActivePageNumber(null);
    } finally {
      setIsReadingPdf(false);
    }
  }

  function handlePageJump(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = Number.parseInt(pageInputValue, 10);
    if (!Number.isFinite(next)) {
      setPageInputValue(activePageNumber ? String(activePageNumber) : '1');
      return;
    }

    setPage(next);
  }

  function handleResetCrop() {
    if (!activePageNumber) {
      return;
    }

    clearMessages();
    setPageCrops((current) => ({
      ...current,
      [activePageNumber]: { ...DEFAULT_CROP_RECT },
    }));
  }

  async function handleExport(mode: 'current' | 'allWithOriginalOthers') {
    if (!selectedFile || !activePageNumber || !documentPreview) {
      return;
    }

    const cropRect = pageCrops[activePageNumber];
    if (!cropRect || !hasValidRect(cropRect)) {
      setErrorMessage('Set a valid crop area before downloading.');
      return;
    }
    const activeCrop: NormalizedRect = cropRect;

    setIsExportDialogOpen(false);
    clearMessages();
    setIsExporting(true);

    try {
      let result: CropResult;

      if (mode === 'current') {
        result = await exportCroppedPdf({
          file: selectedFile,
          selectedPages: [activePageNumber],
          pageCrops: { [activePageNumber]: { ...activeCrop } },
        });
      } else {
        const selectedPages = Array.from(
          { length: documentPreview.pageCount },
          (_, index) => index + 1,
        );
        result = await exportCroppedPdf({
          file: selectedFile,
          selectedPages,
          pageCrops: { [activePageNumber]: { ...activeCrop } },
          keepUncroppedPages: true,
        });
      }

      triggerFileDownload(result.blob, result.fileName);
    } catch (error: unknown) {
      const fallback = 'Failed to crop this page.';
      setErrorMessage(error instanceof Error ? error.message : fallback);
    } finally {
      setIsExporting(false);
    }
  }

  if (!selectedFile) {
    return (
      <ToolWorkspace
        title="Crop PDF New"
        description="Pick a PDF and jump straight into page-by-page cropping."
        inputPanel={
          <PdfFileSelector
            ariaLabel="Select PDF file for crop new"
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

  return (
    <div className="fixed inset-0 z-[80] bg-background">
      <div className="flex h-full flex-col">
        <main className="min-h-0 flex flex-1 flex-col overflow-hidden px-2 py-2 md:px-4 md:py-3">
          <div className="pb-2 text-center">
            <p className="text-sm font-medium">{selectedFile.name}</p>
          </div>
          <div className="flex items-center justify-center pb-2 md:hidden">
              <label className="flex items-center gap-2 text-sm whitespace-nowrap">
                <span className="text-muted-foreground">Aspect</span>
                <NativeSelect
                  value={preset}
                  disabled={isReadingPdf || isExporting}
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
            </div>
          {isReadingPdf || !documentPreview || !activePageNumber ? (
            <div className="flex h-full items-center justify-center">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Spinner className="h-4 w-4" />
                <p>Reading PDF and preparing crop preview...</p>
              </div>
            </div>
          ) : (
            <div className="min-h-0 flex-1">
              <PdfCropEditor
                key={String(activePageNumber)}
                immersive
                showHeader={false}
                sourceFile={selectedFile}
                pageNumber={activePageNumber}
                preset={preset}
                cropRect={pageCrops[activePageNumber] ?? null}
                onCropChange={(nextRect) => {
                  setPageCrops((current) => ({
                    ...current,
                    [activePageNumber]: nextRect,
                  }));
                  setErrorMessage(null);
                }}
              />
            </div>
          )}
        </main>

        <div className="space-y-2 px-3 pb-3 md:px-4 md:pb-4">
          <div className="grid items-center gap-3 md:grid-cols-[1fr_auto_1fr]">
            <div className="hidden md:block" />

            <div className="flex justify-center">
              <div className="inline-flex items-center gap-1 rounded-full border border-border bg-primary px-1.5 py-1.5 text-primary-foreground md:gap-1.5 md:px-2">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={!canGoPrevious || isReadingPdf || isExporting}
                  onClick={() => {
                    if (!activePageNumber) {
                      return;
                    }

                    setPage(activePageNumber - 1);
                  }}
                  className="h-8 w-8 rounded-full p-0 text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground"
                  aria-label="Previous page"
                >
                  <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
                </Button>

                <form className="flex items-center gap-2" onSubmit={handlePageJump}>
                  <Input
                    value={pageInputValue}
                    onChange={(event) => {
                      const digitsOnly = event.currentTarget.value.replace(/\D/g, '');
                      setPageInputValue(digitsOnly);
                    }}
                    inputMode="numeric"
                    aria-label="Jump to page"
                    className="h-8 w-12 border-primary-foreground/30 bg-primary-foreground/15 px-2 text-center text-base font-medium text-primary-foreground placeholder:text-primary-foreground/70 focus-visible:ring-primary-foreground/70"
                    disabled={isReadingPdf || isExporting || totalPages < 1}
                  />
                  <span className="text-lg leading-none text-primary-foreground/95">/</span>
                  <span className="min-w-6 text-center text-xl leading-none text-primary-foreground/95">
                    {String(totalPages)}
                  </span>
                </form>

                <Button
                  variant="ghost"
                  size="sm"
                  disabled={!canGoNext || isReadingPdf || isExporting}
                  onClick={() => {
                    if (!activePageNumber) {
                      return;
                    }

                    setPage(activePageNumber + 1);
                  }}
                  className="h-8 w-8 rounded-full p-0 text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground"
                  aria-label="Next page"
                >
                  <HugeiconsIcon icon={ArrowRight01Icon} size={18} />
                </Button>
              </div>
            </div>

            <div className="hidden items-center justify-end gap-2 md:flex">
              <label className="flex items-center gap-2 text-sm whitespace-nowrap">
                <span className="text-muted-foreground">Aspect</span>
                <NativeSelect
                  value={preset}
                  disabled={isReadingPdf || isExporting}
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

              <Button
                variant="outline"
                disabled={!hasActivePage || isReadingPdf || isExporting}
                onClick={handleResetCrop}
                className="whitespace-nowrap"
              >
                Reset crop
              </Button>
              <Button
                disabled={!canExport}
                onClick={() => {
                  setIsExportDialogOpen(true);
                }}
                className="whitespace-nowrap"
              >
                {isExporting ? 'Cropping...' : 'Crop and Download'}
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 md:hidden">
            <Button
              variant="outline"
              disabled={!hasActivePage || isReadingPdf || isExporting}
              onClick={handleResetCrop}
              className="w-full"
            >
              Reset crop
            </Button>
            <Button
              disabled={!canExport}
              onClick={() => {
                setIsExportDialogOpen(true);
              }}
              className="w-full"
            >
              {isExporting ? 'Cropping...' : 'Crop and Download'}
            </Button>
          </div>

          {errorMessage ? (
            <p role="alert" className="text-sm font-medium text-destructive">
              {errorMessage}
            </p>
          ) : null}
        </div>
      </div>

      <AlertDialog
        open={isExportDialogOpen}
        onOpenChange={(open) => {
          if (isExporting) {
            return;
          }

          setIsExportDialogOpen(open);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Choose Download Scope</AlertDialogTitle>
            <AlertDialogDescription>
              Download only the cropped current page, or the full document with only this page cropped.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isExporting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isExporting || !canExport}
              onClick={() => {
                void handleExport('allWithOriginalOthers');
              }}
              className="border border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground"
            >
              Full document
            </AlertDialogAction>
            <AlertDialogAction
              disabled={isExporting || !canExport}
              onClick={() => {
                void handleExport('current');
              }}
            >
              Current page only
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

const cropNewToolModule: ToolModule = {
  meta: {
    title: 'Crop PDF New',
    description:
      'Enter page crop mode immediately and export the cropped current page.',
  },
  run: runCropNew,
  renderWorkspaceContent: () => <CropNewToolWorkspace />,
};

export default cropNewToolModule;
