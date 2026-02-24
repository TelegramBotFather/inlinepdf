/* eslint-disable react-refresh/only-export-components */

import { useEffect, useRef, useState } from 'react';

import { ImageFileSelector } from '~/components/image-file-selector';
import { Button } from '~/components/ui/button';
import { NativeSelect, NativeSelectOption } from '~/components/ui/native-select';
import {
  convertImagesToPdf,
  isSupportedImageFile,
  readImageDimensions,
} from '~/features/image-to-pdf/service/convert-images-to-pdf';
import type {
  ImageToPdfQuality,
  ImageToPdfResult,
  ImageToPdfRunOptions,
} from '~/features/image-to-pdf/types';
import {
  FileQueueList,
  type QueuedFile,
} from '~/features/tools/components/file-queue-list';
import { ToolWorkspace } from '~/features/tools/components/tool-workspace';
import type {
  ToolModule,
  ToolModuleRunInput,
} from '~/features/tools/tool-modules';

const QUALITY_OPTIONS: { value: ImageToPdfQuality; label: string }[] = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
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

function reorderListByIndex<T>(
  items: T[],
  sourceIndex: number,
  targetIndex: number,
): T[] {
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

function isImageToPdfQuality(value: unknown): value is ImageToPdfQuality {
  return value === 'high' || value === 'medium' || value === 'low';
}

function isImageToPdfRunOptions(value: unknown): value is ImageToPdfRunOptions {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const options = value as Partial<ImageToPdfRunOptions>;
  return (
    isImageToPdfQuality(options.quality) &&
    (options.onProgress === undefined || typeof options.onProgress === 'function')
  );
}

function revokeEntryPreviewUrl(entry: QueuedFile) {
  if (entry.previewDataUrl?.startsWith('blob:')) {
    URL.revokeObjectURL(entry.previewDataUrl);
  }
}

async function runImageToPdf(
  { files }: ToolModuleRunInput,
  options?: Record<string, unknown>,
): Promise<ImageToPdfResult> {
  if (!isImageToPdfRunOptions(options)) {
    throw new Error('Select an output quality before converting.');
  }

  return convertImagesToPdf({
    files,
    quality: options.quality,
    onProgress: options.onProgress,
  });
}

function ImageToPdfToolWorkspace() {
  const filesRef = useRef<QueuedFile[]>([]);
  const [files, setFiles] = useState<QueuedFile[]>([]);
  const [quality, setQuality] = useState<ImageToPdfQuality>('medium');
  const [isConverting, setIsConverting] = useState(false);
  const [progressText, setProgressText] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const canConvert = files.length > 0 && !isConverting;

  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  useEffect(
    () => () => {
      filesRef.current.forEach((entry) => {
        revokeEntryPreviewUrl(entry);
      });
    },
    [],
  );

  function handleFilesAdded(newFiles: File[]) {
    const supportedFiles = newFiles.filter((file) => isSupportedImageFile(file));
    const unsupportedFiles = newFiles.filter((file) => !isSupportedImageFile(file));

    if (supportedFiles.length < 1) {
      if (unsupportedFiles.length > 0) {
        setErrorMessage(
          `Only JPG and PNG images are supported. Unsupported: ${unsupportedFiles[0]?.name}.`,
        );
      }

      return;
    }

    const addedEntries = supportedFiles.map((file) => {
      const objectUrl = URL.createObjectURL(file);
      return {
        id: createEntryId(file),
        file,
        pageCount: null,
        previewDataUrl: objectUrl,
        previewStatus: 'ready' as const,
        metadataText: 'Reading dimensions...',
      };
    });

    setFiles((current) => [...current, ...addedEntries]);
    setErrorMessage(
      unsupportedFiles.length > 0
        ? `Only JPG and PNG images are supported. Unsupported: ${unsupportedFiles[0]?.name}.`
        : null,
    );
    setSuccessMessage(null);

    addedEntries.forEach((entry) => {
      void readImageDimensions(entry.file)
        .then((dimensions) => {
          setFiles((current) =>
            current.map((item) =>
              item.id === entry.id
                ? {
                    ...item,
                    metadataText: `${String(dimensions.width)} x ${String(dimensions.height)} px`,
                  }
                : item,
            ),
          );
        })
        .catch(() => {
          setFiles((current) =>
            current.map((item) =>
              item.id === entry.id
                ? {
                    ...item,
                    metadataText: 'Dimensions unavailable',
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
    setFiles((current) => {
      const entryToRemove = current.find((entry) => entry.id === id);
      if (entryToRemove) {
        revokeEntryPreviewUrl(entryToRemove);
      }

      return current.filter((entry) => entry.id !== id);
    });
    setErrorMessage(null);
    setSuccessMessage(null);
  }

  function handleClearAll() {
    if (isConverting) {
      return;
    }

    files.forEach((entry) => {
      revokeEntryPreviewUrl(entry);
    });

    setFiles([]);
    setErrorMessage(null);
    setSuccessMessage(null);
    setProgressText(null);
  }

  async function handleConvert() {
    if (!canConvert) {
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setProgressText(null);
    setIsConverting(true);

    try {
      const result = await runImageToPdf(
        { files: files.map((entry) => entry.file) },
        {
          quality,
          onProgress: ({ currentFile, totalFiles }) => {
            setProgressText(
              `Converting image ${String(currentFile)} of ${String(totalFiles)}...`,
            );
          },
        },
      );

      triggerFileDownload(result.blob, result.fileName);
      setSuccessMessage(
        `PDF download started with ${String(result.pagesExported)} page${result.pagesExported === 1 ? '' : 's'}.`,
      );
    } catch (error: unknown) {
      const fallback = 'Failed to convert images to PDF.';
      setErrorMessage(error instanceof Error ? error.message : fallback);
    } finally {
      setIsConverting(false);
      setProgressText(null);
    }
  }

  return (
    <ToolWorkspace
      title="Image to PDF"
      description="Convert JPG and PNG images into a single PDF directly in your browser."
      inputPanel={
        files.length === 0 ? (
          <ImageFileSelector
            multiple
            ariaLabel="Select image files"
            onSelect={handleFilesAdded}
            disabled={isConverting}
            title="Drag and drop image files"
            description="Select JPG or PNG images by dragging and dropping, or choose from your device."
          />
        ) : (
          <div className="space-y-4">
            <FileQueueList
              files={files}
              disabled={isConverting}
              onReorder={handleReorder}
              onRemove={handleRemove}
              appendItem={
                <li>
                  <ImageFileSelector
                    variant="tile"
                    multiple
                    ariaLabel="Select image files"
                    onSelect={handleFilesAdded}
                    disabled={isConverting}
                    buttonLabel="Add more images"
                  />
                </li>
              }
            />
            <Button
              variant="outline"
              disabled={isConverting}
              onClick={handleClearAll}
            >
              Clear all
            </Button>
          </div>
        )
      }
      optionsPanel={
        files.length > 0 ? (
          <div className="max-w-sm space-y-3">
            <label className="space-y-2 text-sm font-medium">
              <span>Quality</span>
              <NativeSelect
                aria-label="PDF quality"
                value={quality}
                disabled={isConverting}
                onChange={(event) => {
                  const nextQuality = event.currentTarget.value;
                  if (isImageToPdfQuality(nextQuality)) {
                    setQuality(nextQuality);
                  }
                }}
                className="w-full"
              >
                {QUALITY_OPTIONS.map((option) => (
                  <NativeSelectOption key={option.value} value={option.value}>
                    {option.label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </label>
            <p className="text-xs text-muted-foreground">
              PNG files stay PNG in the PDF (lossless format). Medium and Low reduce
              image dimensions for smaller output. JPEG files also use stronger lossy
              compression at Medium and Low.
            </p>
          </div>
        ) : null
      }
      actionBar={
        files.length > 0 ? (
          <div className="space-y-2">
            <Button
              disabled={!canConvert}
              onClick={() => {
                void handleConvert();
              }}
            >
              {isConverting ? 'Converting...' : 'Convert and Download'}
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

const imageToPdfToolModule: ToolModule = {
  meta: {
    title: 'Image to PDF',
    description:
      'Convert JPG and PNG images into a single PDF directly in your browser.',
  },
  run: runImageToPdf,
  renderWorkspaceContent: () => <ImageToPdfToolWorkspace />,
};

export default imageToPdfToolModule;
