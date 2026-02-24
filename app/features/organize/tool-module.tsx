/* eslint-disable react-refresh/only-export-components */

import { useEffect, useMemo, useRef, useState } from 'react';
import { DragDropProvider } from '@dnd-kit/react';
import { useSortable } from '@dnd-kit/react/sortable';
import {
  Cancel01Icon,
  Rotate02Icon,
  Tick01Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import { PdfFileSelector } from '~/components/pdf-file-selector';
import { Button } from '~/components/ui/button';
import {
  FileQueueList,
  type QueuedFile,
} from '~/features/tools/components/file-queue-list';
import { readPdfDetails } from '~/features/pdf/service/read-pdf-details';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '~/components/ui/pagination';
import { Spinner } from '~/components/ui/spinner';
import { exportOrganizedPdf } from '~/features/organize/service/export-organized-pdf';
import { readOrganizePreview } from '~/features/organize/service/read-organize-preview';
import type {
  OrganizePageState,
  OrganizePreviewSession,
  OrganizeResult,
  OrganizeRunOptions,
} from '~/features/organize/types';
import {
  normalizeQuarterTurns,
  quarterTurnsToDegrees,
} from '~/features/organize/types';
import { ToolWorkspace } from '~/features/tools/components/tool-workspace';
import type {
  ToolModule,
  ToolModuleRunInput,
} from '~/features/tools/tool-modules';
import { cn } from '~/lib/utils';

const PAGES_PER_VIEW = 12;
const OVERLAY_ICON_BUTTON_CLASS =
  'rounded-full border-border bg-white text-foreground shadow-sm hover:bg-white active:bg-white';

type PaginationToken = number | 'ellipsis';

interface SortableOrganizePageCardProps {
  page: OrganizePageState;
  sortableIndex: number;
  displayPageNumber: number;
  disabled: boolean;
  onToggleSelected: (pageId: string) => void;
  onRotate: (pageId: string) => void;
  onRemove: (pageId: string) => void;
}

function triggerFileDownload(blob: Blob, fileName: string) {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(objectUrl);
}

function toSortableId(value: unknown): string | null {
  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number') {
    return String(value);
  }

  return null;
}

interface SortableIndices {
  index: number;
  initialIndex: number;
}

function hasSortableIndices(value: unknown): value is SortableIndices {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<SortableIndices>;
  return (
    typeof candidate.index === 'number' &&
    typeof candidate.initialIndex === 'number'
  );
}

function moveItemByIndex<T>(items: T[], sourceIndex: number, targetIndex: number): T[] {
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

function reorderPagesById(
  pages: OrganizePageState[],
  sourceId: string,
  targetId: string,
): OrganizePageState[] {
  const sourceIndex = pages.findIndex((page) => page.id === sourceId);
  const targetIndex = pages.findIndex((page) => page.id === targetId);

  if (sourceIndex === -1 || targetIndex === -1) {
    return pages;
  }

  return moveItemByIndex(pages, sourceIndex, targetIndex);
}

function isOrganizePageState(value: unknown): value is OrganizePageState {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<OrganizePageState>;
  return (
    typeof candidate.id === 'string' &&
    Number.isInteger(candidate.sourcePageNumber) &&
    typeof candidate.rotationQuarterTurns === 'number' &&
    typeof candidate.isDeleted === 'boolean'
  );
}

function isOrganizeRunOptions(value: unknown): value is OrganizeRunOptions {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const options = value as Partial<OrganizeRunOptions>;
  return Array.isArray(options.pages) && options.pages.every(isOrganizePageState);
}

function buildPaginationItems(totalPages: number, currentPage: number): PaginationToken[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set<number>([
    1,
    totalPages,
    currentPage - 1,
    currentPage,
    currentPage + 1,
  ]);

  if (currentPage <= 3) {
    pages.add(2);
    pages.add(3);
  }

  if (currentPage >= totalPages - 2) {
    pages.add(totalPages - 1);
    pages.add(totalPages - 2);
  }

  const sortedPages = [...pages]
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);

  const items: PaginationToken[] = [];

  for (const [index, page] of sortedPages.entries()) {
    const previous = sortedPages[index - 1];
    if (previous && page - previous > 1) {
      items.push('ellipsis');
    }

    items.push(page);
  }

  return items;
}

function getVisiblePageRangeLabel(
  currentPage: number,
  pageSize: number,
  totalPages: number,
): string {
  if (totalPages < 1) {
    return 'No pages available';
  }

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(start + pageSize - 1, totalPages);
  return `Showing pages ${String(start)}-${String(end)} of ${String(totalPages)}`;
}

function SortableOrganizePageCard({
  page,
  sortableIndex,
  displayPageNumber,
  disabled,
  onToggleSelected,
  onRotate,
  onRemove,
}: SortableOrganizePageCardProps) {
  const { ref, isDragging } = useSortable({
    id: page.id,
    index: sortableIndex,
    type: 'organize-page',
    group: 'organize-pages',
    disabled,
  });

  const rotationDegrees = quarterTurnsToDegrees(page.rotationQuarterTurns);
  const isSelected = !page.isDeleted;

  return (
    <li
      ref={ref}
      data-testid="organize-page-card"
      className={cn(
        'rounded-3xl border border-border bg-card p-3 transition-shadow',
        !disabled && 'cursor-grab active:cursor-grabbing',
        isDragging && 'ring-2 ring-ring shadow-sm',
      )}
    >
      <div className="space-y-3">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-white p-2">
          <div className="absolute left-3 right-3 top-3 z-20 flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              disabled={disabled}
              className={OVERLAY_ICON_BUTTON_CLASS}
              aria-label={`${isSelected ? 'Deselect' : 'Select'} page ${String(displayPageNumber)}`}
              onClick={() => {
                onToggleSelected(page.id);
              }}
            >
              {isSelected ? <HugeiconsIcon icon={Tick01Icon} strokeWidth={2} /> : null}
            </Button>

            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                disabled={disabled || !isSelected}
                className={OVERLAY_ICON_BUTTON_CLASS}
                aria-label={`Rotate page ${String(displayPageNumber)}`}
                onClick={() => {
                  onRotate(page.id);
                }}
              >
                <HugeiconsIcon icon={Rotate02Icon} strokeWidth={2} />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                disabled={disabled || !isSelected}
                className={OVERLAY_ICON_BUTTON_CLASS}
                aria-label={`Remove page ${String(displayPageNumber)}`}
                onClick={() => {
                  onRemove(page.id);
                }}
              >
                <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
              </Button>
            </div>
          </div>

          {page.thumbnailStatus === 'loading' ? (
            <div className="flex h-[300px] items-center justify-center">
              <Spinner className="h-5 w-5" />
            </div>
          ) : page.thumbnailDataUrl ? (
            <img
              src={page.thumbnailDataUrl}
              alt={`Preview for page ${String(page.sourcePageNumber)}`}
              className={cn(
                'h-[300px] w-full rounded-xl object-contain object-top origin-center transition-transform duration-300 ease-out',
                page.isDeleted && 'opacity-40',
              )}
              style={{ transform: `rotate(${String(rotationDegrees)}deg)` }}
              loading="lazy"
            />
          ) : (
            <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
              Preview unavailable
            </div>
          )}

          {page.isDeleted ? (
            <div className="absolute inset-0 z-10 flex items-end justify-center bg-background/40 pb-3">
              <span className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium">
                Excluded from download
              </span>
            </div>
          ) : null}
        </div>

        <div className="px-1">
          <p className="text-base font-semibold">{`Page ${String(displayPageNumber)}`}</p>
        </div>
      </div>
    </li>
  );
}

async function runOrganize(
  { files }: ToolModuleRunInput,
  options?: Record<string, unknown>,
): Promise<OrganizeResult> {
  const sourceFile = files.at(0);
  if (!sourceFile) {
    throw new Error('Select a PDF file before organizing.');
  }

  if (!isOrganizeRunOptions(options)) {
    throw new Error('Missing organize settings. Arrange pages before downloading.');
  }

  return exportOrganizedPdf({
    file: sourceFile,
    pages: options.pages,
  });
}

function OrganizeToolWorkspace() {
  const selectionTokenRef = useRef(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileEntry, setSelectedFileEntry] = useState<QueuedFile | null>(null);
  const [previewSession, setPreviewSession] = useState<OrganizePreviewSession | null>(
    null,
  );
  const [pageStates, setPageStates] = useState<OrganizePageState[]>([]);
  const [currentPaginationPage, setCurrentPaginationPage] = useState(1);
  const [isReadingPdf, setIsReadingPdf] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const selectedPageCount = useMemo(
    () => pageStates.filter((page) => !page.isDeleted).length,
    [pageStates],
  );
  const excludedPageCount = pageStates.length - selectedPageCount;
  const totalPaginationPages = Math.max(1, Math.ceil(pageStates.length / PAGES_PER_VIEW));
  const startIndex = (currentPaginationPage - 1) * PAGES_PER_VIEW;
  const visiblePages = pageStates.slice(startIndex, startIndex + PAGES_PER_VIEW);
  const canExport =
    !!selectedFile &&
    selectedPageCount > 0 &&
    pageStates.length > 0 &&
    !isExporting &&
    !isReadingPdf;

  useEffect(() => {
    return () => {
      if (previewSession) {
        void previewSession.destroy();
      }
    };
  }, [previewSession]);

  useEffect(() => {
    setCurrentPaginationPage((current) => Math.min(current, totalPaginationPages));
  }, [totalPaginationPages]);

  useEffect(() => {
    if (!previewSession || pageStates.length < 1) {
      return;
    }

    const targetPageNumbers = new Set<number>();

    for (const pageOffset of [-1, 0, 1]) {
      const paginationPage = currentPaginationPage + pageOffset;
      if (paginationPage < 1 || paginationPage > totalPaginationPages) {
        continue;
      }

      const rangeStart = (paginationPage - 1) * PAGES_PER_VIEW;
      const rangeEnd = rangeStart + PAGES_PER_VIEW;
      const pagesInRange = pageStates.slice(rangeStart, rangeEnd);

      for (const page of pagesInRange) {
        targetPageNumbers.add(page.sourcePageNumber);
      }
    }

    const pagesToLoad = pageStates.filter(
      (page) =>
        targetPageNumbers.has(page.sourcePageNumber) && page.thumbnailStatus === 'idle',
    );

    if (pagesToLoad.length < 1) {
      return;
    }

    const activeSelectionToken = selectionTokenRef.current;
    const targetIds = new Set(pagesToLoad.map((page) => page.id));
    setPageStates((current) =>
      current.map((page) =>
        targetIds.has(page.id)
          ? {
              ...page,
              thumbnailStatus: 'loading',
            }
          : page,
      ),
    );

    for (const page of pagesToLoad) {
      void previewSession
        .getPageThumbnail(page.sourcePageNumber)
        .then((thumbnailDataUrl) => {
          if (selectionTokenRef.current !== activeSelectionToken) {
            return;
          }

          setPageStates((current) =>
            current.map((entry) =>
              entry.id === page.id
                ? {
                    ...entry,
                    thumbnailStatus: thumbnailDataUrl ? 'ready' : 'unavailable',
                    thumbnailDataUrl,
                  }
                : entry,
            ),
          );
        })
        .catch(() => {
          if (selectionTokenRef.current !== activeSelectionToken) {
            return;
          }

          setPageStates((current) =>
            current.map((entry) =>
              entry.id === page.id
                ? {
                    ...entry,
                    thumbnailStatus: 'unavailable',
                    thumbnailDataUrl: null,
                  }
                : entry,
            ),
          );
        });
    }
  }, [
    currentPaginationPage,
    pageStates,
    previewSession,
    totalPaginationPages,
  ]);

  function clearMessages() {
    setErrorMessage(null);
    setSuccessMessage(null);
  }

  async function handleFileSelected(file: File) {
    const selectionToken = selectionTokenRef.current + 1;
    const entryId = `organize-file-${String(selectionToken)}`;
    selectionTokenRef.current = selectionToken;

    clearMessages();
    setIsReadingPdf(true);
    setSelectedFile(file);
    setSelectedFileEntry({
      id: entryId,
      file,
      pageCount: null,
      previewDataUrl: null,
      previewStatus: 'loading',
    });
    setPageStates([]);
    setCurrentPaginationPage(1);
    setPreviewSession(null);

    void readPdfDetails(file)
      .then((details) => {
        if (selectionTokenRef.current !== selectionToken) {
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
        if (selectionTokenRef.current !== selectionToken) {
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

    try {
      const nextPreviewSession = await readOrganizePreview(file);

      if (selectionTokenRef.current !== selectionToken) {
        await nextPreviewSession.destroy();
        return;
      }

      if (nextPreviewSession.pageCount < 1) {
        await nextPreviewSession.destroy();
        throw new Error('This PDF has no pages to organize.');
      }

      setPreviewSession(nextPreviewSession);
      setSelectedFileEntry((current) =>
        current?.id === entryId
          ? {
              ...current,
              pageCount: nextPreviewSession.pageCount,
            }
          : current,
      );
      setPageStates(
        Array.from({ length: nextPreviewSession.pageCount }, (_, index) => ({
          id: `page-${String(index + 1)}`,
          sourcePageNumber: index + 1,
          rotationQuarterTurns: 0,
          isDeleted: false,
          thumbnailDataUrl: null,
          thumbnailStatus: 'idle' as const,
        })),
      );
    } catch (error: unknown) {
      if (selectionTokenRef.current !== selectionToken) {
        return;
      }

      const fallback = 'Failed to read PDF pages.';
      setErrorMessage(error instanceof Error ? error.message : fallback);
      setSelectedFile(null);
      setSelectedFileEntry(null);
      setPageStates([]);
      setPreviewSession(null);
    } finally {
      if (selectionTokenRef.current === selectionToken) {
        setIsReadingPdf(false);
      }
    }
  }

  function handleReplaceFile() {
    if (isReadingPdf || isExporting) {
      return;
    }

    selectionTokenRef.current += 1;
    clearMessages();
    setSelectedFile(null);
    setSelectedFileEntry(null);
    setPreviewSession(null);
    setPageStates([]);
    setCurrentPaginationPage(1);
  }

  function handleToggleSelected(pageId: string) {
    clearMessages();
    setPageStates((current) =>
      current.map((page) =>
        page.id === pageId
          ? {
              ...page,
              isDeleted: !page.isDeleted,
            }
          : page,
      ),
    );
  }

  function handleRotate(pageId: string) {
    clearMessages();
    setPageStates((current) =>
      current.map((page) =>
        page.id === pageId
          ? {
              ...page,
              rotationQuarterTurns: normalizeQuarterTurns(
                page.rotationQuarterTurns + 1,
              ),
            }
          : page,
      ),
    );
  }

  function handleRemove(pageId: string) {
    clearMessages();
    setPageStates((current) =>
      current.map((page) =>
        page.id === pageId
          ? {
              ...page,
              isDeleted: true,
            }
          : page,
      ),
    );
  }

  async function handleExport() {
    if (!selectedFile) {
      return;
    }

    clearMessages();
    setIsExporting(true);

    try {
      const result = await runOrganize({ files: [selectedFile] }, { pages: pageStates });
      triggerFileDownload(result.blob, result.fileName);
      setSuccessMessage(
        `Organized PDF ready. Exported ${String(result.pagesExported)} page${result.pagesExported === 1 ? '' : 's'}.`,
      );
    } catch (error: unknown) {
      const fallback = 'Failed to organize this PDF.';
      setErrorMessage(error instanceof Error ? error.message : fallback);
    } finally {
      setIsExporting(false);
    }
  }

  if (!selectedFile) {
    return (
      <ToolWorkspace
        title="Organize PDF"
        description="Reorder, rotate, and remove pages before downloading a new PDF."
        inputPanel={
          <PdfFileSelector
            ariaLabel="Select PDF file for organizing"
            onSelect={(files) => {
              void handleFileSelected(files[0]);
            }}
            disabled={isReadingPdf || isExporting}
            title="Drag and drop a PDF to organize"
          />
        }
        errorMessage={errorMessage}
      />
    );
  }

  const fileInfoEntry: QueuedFile = selectedFileEntry ?? {
    id: 'organize-file-fallback',
    file: selectedFile,
    pageCount: pageStates.length > 0 ? pageStates.length : null,
    previewDataUrl: null,
    previewStatus: isReadingPdf ? 'loading' : 'unavailable',
  };

  const fileInfoPanel = (
    <FileQueueList
      title="Selected file"
      files={[fileInfoEntry]}
      disabled={isReadingPdf || isExporting}
      showIndexBadge={false}
      onRemove={() => {
        handleReplaceFile();
      }}
    />
  );

  if (isReadingPdf || !previewSession || pageStates.length < 1) {
    return (
      <ToolWorkspace
        title="Organize PDF"
        description="Reorder pages and export a new PDF."
        inputPanel={fileInfoPanel}
        outputPanel={
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner className="h-4 w-4" />
            <span>Reading PDF and preparing pages...</span>
          </div>
        }
        errorMessage={errorMessage}
      />
    );
  }

  const paginationItems = buildPaginationItems(totalPaginationPages, currentPaginationPage);
  const visibleRangeLabel = getVisiblePageRangeLabel(
    currentPaginationPage,
    PAGES_PER_VIEW,
    pageStates.length,
  );

  return (
    <ToolWorkspace
      title="Organize PDF"
      description="Reorder pages with drag and drop, then download the updated PDF."
      inputPanel={fileInfoPanel}
      outputPanel={
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              {`${String(selectedPageCount)} selected · ${String(excludedPageCount)} removed`}
            </p>
            <p className="text-sm text-muted-foreground">{visibleRangeLabel}</p>
          </div>

          {totalPaginationPages > 1 ? (
            <Pagination className="mx-0 w-auto justify-end">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    text="Prev"
                    aria-disabled={currentPaginationPage <= 1}
                    className={cn(
                      currentPaginationPage <= 1 && 'pointer-events-none opacity-50',
                    )}
                    onClick={(event) => {
                      event.preventDefault();
                      if (currentPaginationPage > 1) {
                        setCurrentPaginationPage(currentPaginationPage - 1);
                      }
                    }}
                  />
                </PaginationItem>
                {paginationItems.map((item, index) => (
                  <PaginationItem key={`page-token-${String(item)}-${String(index)}`}>
                    {item === 'ellipsis' ? (
                      <PaginationEllipsis />
                    ) : (
                      <PaginationLink
                        href="#"
                        isActive={item === currentPaginationPage}
                        aria-label={`Go to pagination page ${String(item)}`}
                        onClick={(event) => {
                          event.preventDefault();
                          setCurrentPaginationPage(item);
                        }}
                      >
                        {String(item)}
                      </PaginationLink>
                    )}
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    text="Next"
                    aria-disabled={currentPaginationPage >= totalPaginationPages}
                    className={cn(
                      currentPaginationPage >= totalPaginationPages &&
                        'pointer-events-none opacity-50',
                    )}
                    onClick={(event) => {
                      event.preventDefault();
                      if (currentPaginationPage < totalPaginationPages) {
                        setCurrentPaginationPage(currentPaginationPage + 1);
                      }
                    }}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          ) : null}

          <DragDropProvider
            onDragEnd={(event) => {
              if (isExporting) {
                return;
              }

              const source = event.operation.source;
              const target = event.operation.target;
              if (source && target && source.id !== target.id) {
                const sourceId = toSortableId(source.id);
                const targetId = toSortableId(target.id);

                if (!sourceId || !targetId) {
                  return;
                }

                setPageStates((current) => reorderPagesById(current, sourceId, targetId));
                clearMessages();
                return;
              }

              if (!source || !hasSortableIndices(source)) {
                return;
              }

              if (source.index === source.initialIndex) {
                return;
              }

              if (
                source.initialIndex < 0 ||
                source.initialIndex >= visiblePages.length ||
                source.index < 0 ||
                source.index >= visiblePages.length
              ) {
                return;
              }

              const sourceEntry = visiblePages[source.initialIndex];
              const targetEntry = visiblePages[source.index];
              if (sourceEntry.id === targetEntry.id) {
                return;
              }

              setPageStates((current) =>
                reorderPagesById(current, sourceEntry.id, targetEntry.id),
              );
              clearMessages();
            }}
          >
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {visiblePages.map((page, index) => (
                <SortableOrganizePageCard
                  key={page.id}
                  page={page}
                  sortableIndex={index}
                  displayPageNumber={startIndex + index + 1}
                  disabled={isExporting}
                  onToggleSelected={handleToggleSelected}
                  onRotate={(pageId) => {
                    handleRotate(pageId);
                  }}
                  onRemove={handleRemove}
                />
              ))}
            </ul>
          </DragDropProvider>

          <div className="flex justify-end pt-1">
            <Button
              disabled={!canExport}
              onClick={() => {
                void handleExport();
              }}
            >
              {isExporting ? 'Organizing...' : 'Organize and Download'}
            </Button>
          </div>
        </section>
      }
      errorMessage={errorMessage}
      successMessage={successMessage}
    />
  );
}

const organizeToolModule: ToolModule = {
  meta: {
    title: 'Organize PDF',
    description: 'Reorder, rotate, and remove pages before saving.',
  },
  run: runOrganize,
  renderWorkspaceContent: () => <OrganizeToolWorkspace />,
};

export default organizeToolModule;
