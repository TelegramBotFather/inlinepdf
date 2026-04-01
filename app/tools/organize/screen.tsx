import { type ReactNode, useState } from 'react';
import { DragOverlay } from '@dnd-kit/react';
import { useSortable } from '@dnd-kit/react/sortable';
import Tick02Icon from '@hugeicons/core-free-icons/Tick02Icon';
import { HugeiconsIcon } from '@hugeicons/react';

import { CspDragDropProvider } from '~/components/dnd/csp-drag-drop-provider';
import { PdfFileSelector } from '~/components/pdf-file-selector';
import { AspectRatio } from '~/components/ui/aspect-ratio';
import { Button } from '~/components/ui/button';
import { Spinner } from '~/components/ui/spinner';
import {
  FileQueueList,
  type QueuedFile,
} from '~/shared/tool-ui/file-queue-list';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '~/components/ui/pagination';
import { TooltipProvider } from '~/components/ui/tooltip';
import type { OrganizePageState } from '~/tools/organize/models';
import {
  getDisplayedPageAspectRatio,
  quarterTurnsToDegrees,
} from '~/tools/organize/models';
import { organizeToolDefinition } from '~/tools/organize/definition';
import { ToolWorkspace } from '~/shared/tool-ui/tool-workspace';
import { useSuccessToast } from '~/shared/tool-ui/use-success-toast';
import { buildOrganizePaginationItems } from '~/tools/organize/workspace-state';
import { useOrganizeWorkspace } from '~/tools/organize/use-organize-workspace';
import { cn } from '~/lib/utils';

const PAGE_CARD_CLASS_NAME =
  'rounded-2xl select-none transition-all touch-none';

interface SortableOrganizePageCardProps {
  page: OrganizePageState;
  index: number;
  displayPageNumber: number;
  disabled: boolean;
  canReorder: boolean;
  isOverlay?: boolean;
  onToggleSelected: (pageId: string) => void;
}

function getProjectedTargetId(
  items: { id: string }[],
  sourceId: string,
  targetIndex: number,
): string | null {
  if (targetIndex < 0 || targetIndex >= items.length) {
    return null;
  }

  const targetId = items[targetIndex]?.id;

  if (!targetId || targetId === sourceId) {
    return null;
  }

  return targetId;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getEventSourceId(event: unknown): string | null {
  if (
    !isRecord(event) ||
    !isRecord(event.operation) ||
    !isRecord(event.operation.source)
  ) {
    return null;
  }

  return typeof event.operation.source.id === 'string'
    ? event.operation.source.id
    : null;
}

function getEventTargetId(event: unknown): string | null {
  if (
    !isRecord(event) ||
    !isRecord(event.operation) ||
    !isRecord(event.operation.target)
  ) {
    return null;
  }

  return typeof event.operation.target.id === 'string'
    ? event.operation.target.id
    : null;
}

function getEventSortableIndex(event: unknown): number | null {
  if (
    !isRecord(event) ||
    !isRecord(event.operation) ||
    !isRecord(event.operation.source) ||
    !isRecord(event.operation.source.sortable)
  ) {
    return null;
  }

  return typeof event.operation.source.sortable.index === 'number'
    ? event.operation.source.sortable.index
    : null;
}

function OrganizePageCardContent({
  page,
  displayPageNumber,
  disabled,
  onToggleSelected,
}: {
  page: OrganizePageState;
  displayPageNumber: number;
  disabled: boolean;
  onToggleSelected?: (pageId: string) => void;
}) {
  const rotationDegrees = quarterTurnsToDegrees(page.rotationQuarterTurns);
  const isSelected = !page.isDeleted;
  const displayAspectRatio = getDisplayedPageAspectRatio(
    page.aspectRatio,
    page.rotationQuarterTurns,
  );

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-pressed={isSelected}
      aria-label={`${isSelected ? 'Deselect' : 'Select'} page ${String(displayPageNumber)}`}
      className={cn(
        'group/page relative overflow-hidden rounded-2xl border p-2 text-left outline-none transition-all',
        'focus-visible:ring-2 focus-visible:ring-ring/60',
        isSelected
          ? 'border-sky-500 bg-sky-500/5 ring-2 ring-sky-400/45 ring-offset-1 ring-offset-background shadow-sm dark:border-sky-400 dark:bg-sky-400/10 dark:ring-sky-300/50'
          : 'border-border/80 bg-muted/20 hover:border-border hover:bg-muted/35',
        disabled && 'pointer-events-none opacity-70',
      )}
      onClick={() => {
        onToggleSelected?.(page.id);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onToggleSelected?.(page.id);
        }
      }}
    >
      <div
        className={cn(
          'pointer-events-none absolute inset-0 rounded-[inherit] transition-all',
          isSelected ? 'bg-sky-500/10 dark:bg-sky-400/10' : 'bg-transparent',
        )}
      />

      <AspectRatio
        ratio={displayAspectRatio}
        className="relative z-10 overflow-hidden rounded-xl bg-background"
      >
        {page.thumbnailStatus === 'loading' ? (
          <div className="relative z-10 flex h-full items-center justify-center">
            <Spinner className="h-5 w-5" />
          </div>
        ) : page.thumbnailDataUrl ? (
          <img
            src={page.thumbnailDataUrl}
            alt={`Preview for page ${String(page.sourcePageNumber)}`}
            draggable={false}
            className="relative z-10 h-full w-full scale-[1.03] object-cover object-center origin-center transition-transform duration-300 ease-out"
            style={{ transform: `rotate(${String(rotationDegrees)}deg)` }}
            loading="lazy"
          />
        ) : (
          <div className="relative z-10 flex h-full items-center justify-center text-sm text-muted-foreground">
            Preview not available
          </div>
        )}

        <div
          className={cn(
            'pointer-events-none absolute inset-0 z-20 transition-all',
            isSelected
              ? 'bg-slate-900/6 dark:bg-slate-50/6'
              : 'bg-transparent',
          )}
        />

        <div className="pointer-events-none absolute inset-x-3 bottom-3 z-30 flex justify-center">
          <span
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium shadow-sm backdrop-blur',
              'supports-[backdrop-filter]:bg-background/75',
              isSelected
                ? 'bg-sky-50/95 text-sky-700 ring-1 ring-sky-200 dark:bg-sky-950/85 dark:text-sky-100 dark:ring-sky-700/70'
                : 'bg-background/90 text-foreground',
            )}
          >
            {`Page ${String(displayPageNumber)}`}
          </span>
        </div>

        {isSelected ? (
          <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
            <div className="flex size-12 items-center justify-center rounded-full border border-sky-200 bg-background/90 text-sky-600 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/80 dark:border-sky-700 dark:text-sky-300">
              <HugeiconsIcon icon={Tick02Icon} strokeWidth={2.2} />
            </div>
          </div>
        ) : null}
      </AspectRatio>
    </div>
  );
}

function SortableOrganizePageCard({
  page,
  index,
  displayPageNumber,
  disabled,
  canReorder,
  isOverlay = false,
  onToggleSelected,
}: SortableOrganizePageCardProps) {
  const { ref, isDragging, isDropTarget } = useSortable({
    id: page.id,
    index,
    disabled: isOverlay || disabled || !canReorder,
    transition: {
      duration: 250,
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
      idle: false,
    },
  });

  return (
    <li
      ref={isOverlay ? undefined : ref}
      data-testid="organize-page-card"
      className={cn(
        PAGE_CARD_CLASS_NAME,
        canReorder &&
          !disabled &&
          !isOverlay &&
          'cursor-grab active:cursor-grabbing',
        isDragging && 'ring-2 ring-ring shadow-sm',
        isDropTarget && 'scale-[1.01] ring-2 ring-primary/30',
      )}
      tabIndex={canReorder && !disabled && !isOverlay ? 0 : undefined}
      aria-label={
        canReorder && !isOverlay
          ? `Reorder page ${String(displayPageNumber)}`
          : undefined
      }
    >
      <OrganizePageCardContent
        page={page}
        displayPageNumber={displayPageNumber}
        disabled={disabled}
        onToggleSelected={isOverlay ? undefined : onToggleSelected}
      />
    </li>
  );
}

function OrganizePageOverlay({
  page,
  displayPageNumber,
}: {
  page: OrganizePageState;
  displayPageNumber: number;
}) {
  return (
    <li className={PAGE_CARD_CLASS_NAME}>
      <OrganizePageCardContent
        page={page}
        displayPageNumber={displayPageNumber}
        disabled
      />
    </li>
  );
}

function OrganizeSummaryBar({
  selectedPageCount,
  excludedPageCount,
  visibleRangeLabel,
}: {
  selectedPageCount: number;
  excludedPageCount: number;
  visibleRangeLabel: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="text-sm text-muted-foreground">
        {`${String(selectedPageCount)} included · ${String(excludedPageCount)} excluded`}
      </p>
      <p className="text-sm text-muted-foreground">{visibleRangeLabel}</p>
    </div>
  );
}

interface OrganizePaginationControlsProps {
  currentPaginationPage: number;
  totalPaginationPages: number;
  onGoToPage: (page: number) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
}

function OrganizePaginationControls({
  currentPaginationPage,
  totalPaginationPages,
  onGoToPage,
  onPreviousPage,
  onNextPage,
}: OrganizePaginationControlsProps) {
  if (totalPaginationPages <= 1) {
    return null;
  }

  const paginationItems = buildOrganizePaginationItems(
    totalPaginationPages,
    currentPaginationPage,
  );

  return (
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
              onPreviousPage();
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
                  onGoToPage(item);
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
              onNextPage();
            }}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

interface OrganizePageGridProps {
  visiblePages: OrganizePageState[];
  startIndex: number;
  isExporting: boolean;
  onDragReorder: (sourceId: string, targetId: string) => void;
  onToggleSelected: (pageId: string) => void;
}

function OrganizePageGrid({
  visiblePages,
  startIndex,
  isExporting,
  onDragReorder,
  onToggleSelected,
}: OrganizePageGridProps) {
  const [draggedPageId, setDraggedPageId] = useState<string | null>(null);
  const canReorder = visiblePages.length > 1;
  const activePage =
    visiblePages.find((page) => page.id === draggedPageId) ?? null;

  function handleDragStart(event: unknown) {
    setDraggedPageId(getEventSourceId(event));
  }

  function handleDragEnd(event: unknown) {
    const sourceId = getEventSourceId(event);
    setDraggedPageId(null);

    if (isExporting || typeof sourceId !== 'string') {
      return;
    }

    const nextIndex = getEventSortableIndex(event);
    const targetId =
      getEventTargetId(event) ??
      (nextIndex === null
        ? null
        : getProjectedTargetId(visiblePages, sourceId, nextIndex));

    if (!targetId) {
      return;
    }

    onDragReorder(sourceId, targetId);
  }

  return (
    <CspDragDropProvider
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {visiblePages.map((page, index) => (
          <SortableOrganizePageCard
            key={page.id}
            page={page}
            index={index}
            displayPageNumber={startIndex + index + 1}
            disabled={isExporting}
            canReorder={canReorder}
            onToggleSelected={onToggleSelected}
          />
        ))}
      </ul>

      <DragOverlay disabled={activePage == null}>
        {activePage ? (
          <ul className="grid w-full max-w-sm">
            <OrganizePageOverlay
              page={activePage}
              displayPageNumber={
                startIndex +
                visiblePages.findIndex((page) => page.id === activePage.id) +
                1
              }
            />
          </ul>
        ) : null}
      </DragOverlay>
    </CspDragDropProvider>
  );
}

function OrganizeFileInfoPanel({
  fileInfoEntry,
  disabled,
  onRemove,
}: {
  fileInfoEntry: QueuedFile;
  disabled: boolean;
  onRemove: () => void;
}) {
  return (
    <FileQueueList
      title="Selected File"
      files={[fileInfoEntry]}
      disabled={disabled}
      showIndexBadge={false}
      onRemove={onRemove}
    />
  );
}

function OrganizeSelectionState({
  disabled,
  errorMessage,
  onSelectFile,
}: {
  disabled: boolean;
  errorMessage: string | null;
  onSelectFile: (file: File) => Promise<void>;
}) {
  return (
    <ToolWorkspace
      title="Extract Pages"
      description="Choose a PDF, then select the pages to keep."
      titleIcon={organizeToolDefinition.icon}
      inputPanel={
        <PdfFileSelector
          ariaLabel="Select PDF file for organizing"
          onSelect={(files) => {
            void onSelectFile(files[0]);
          }}
          disabled={disabled}
        />
      }
      errorMessage={errorMessage}
    />
  );
}

function OrganizeLoadingState({
  fileInfoPanel,
  errorMessage,
}: {
  fileInfoPanel: ReactNode;
  errorMessage: string | null;
}) {
  return (
    <ToolWorkspace
      title="Extract Pages"
      description="Loading pages."
      titleIcon={organizeToolDefinition.icon}
      inputPanel={fileInfoPanel}
      outputPanel={
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner className="h-4 w-4" />
          <span>Loading pages...</span>
        </div>
      }
      errorMessage={errorMessage}
    />
  );
}

interface OrganizeReadyStateProps {
  fileInfoPanel: ReactNode;
  selectedPageCount: number;
  excludedPageCount: number;
  visibleRangeLabel: string;
  currentPaginationPage: number;
  totalPaginationPages: number;
  visiblePages: OrganizePageState[];
  startIndex: number;
  isExporting: boolean;
  canExport: boolean;
  errorMessage: string | null;
  onGoToPage: (page: number) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onDragReorder: (sourceId: string, targetId: string) => void;
  onToggleSelected: (pageId: string) => void;
  onDeselectAllPages: () => void;
  onExport: () => void;
}

function OrganizeReadyState({
  fileInfoPanel,
  selectedPageCount,
  excludedPageCount,
  visibleRangeLabel,
  currentPaginationPage,
  totalPaginationPages,
  visiblePages,
  startIndex,
  isExporting,
  canExport,
  errorMessage,
  onGoToPage,
  onPreviousPage,
  onNextPage,
  onDragReorder,
  onToggleSelected,
  onDeselectAllPages,
  onExport,
}: OrganizeReadyStateProps) {
  return (
    <ToolWorkspace
      title="Extract Pages"
      description="Select pages, reorder them, then export a new PDF."
      titleIcon={organizeToolDefinition.icon}
      inputPanel={fileInfoPanel}
      outputPanel={
        <section className="space-y-4">
          <OrganizeSummaryBar
            selectedPageCount={selectedPageCount}
            excludedPageCount={excludedPageCount}
            visibleRangeLabel={visibleRangeLabel}
          />

          <OrganizePaginationControls
            currentPaginationPage={currentPaginationPage}
            totalPaginationPages={totalPaginationPages}
            onGoToPage={onGoToPage}
            onPreviousPage={onPreviousPage}
            onNextPage={onNextPage}
          />

          <TooltipProvider>
            <OrganizePageGrid
              visiblePages={visiblePages}
              startIndex={startIndex}
              isExporting={isExporting}
              onDragReorder={onDragReorder}
              onToggleSelected={onToggleSelected}
            />
          </TooltipProvider>

          <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
            <Button
              variant="outline"
              disabled={selectedPageCount < 1 || isExporting}
              onClick={onDeselectAllPages}
            >
              Unselect all
            </Button>
            <Button disabled={!canExport} onClick={onExport}>
              {isExporting ? <Spinner data-icon="inline-start" /> : null}
              {isExporting ? 'Exporting...' : 'Export PDF'}
            </Button>
          </div>
        </section>
      }
      errorMessage={errorMessage}
    />
  );
}

export function OrganizeToolScreen() {
  const workspace = useOrganizeWorkspace();

  useSuccessToast(workspace.successMessage);

  if (!workspace.selectedFile) {
    return (
      <OrganizeSelectionState
        disabled={workspace.isReadingPdf || workspace.isExporting}
        errorMessage={workspace.errorMessage}
        onSelectFile={workspace.handleFileSelected}
      />
    );
  }

  if (!workspace.fileInfoEntry) {
    return null;
  }

  const fileInfoPanel = (
    <OrganizeFileInfoPanel
      fileInfoEntry={workspace.fileInfoEntry}
      disabled={workspace.isReadingPdf || workspace.isExporting}
      onRemove={() => {
        workspace.handleReplaceFile();
      }}
    />
  );

  if (workspace.isLoadingPreview) {
    return (
      <OrganizeLoadingState
        fileInfoPanel={fileInfoPanel}
        errorMessage={workspace.errorMessage}
      />
    );
  }

  return (
    <OrganizeReadyState
      fileInfoPanel={fileInfoPanel}
      selectedPageCount={workspace.selectedPageCount}
      excludedPageCount={workspace.excludedPageCount}
      visibleRangeLabel={workspace.visibleRangeLabel}
      currentPaginationPage={workspace.currentPaginationPage}
      totalPaginationPages={workspace.totalPaginationPages}
      visiblePages={workspace.visiblePages}
      startIndex={workspace.startIndex}
      isExporting={workspace.isExporting}
      canExport={workspace.canExport}
      errorMessage={workspace.errorMessage}
      onGoToPage={(page) => {
        workspace.goToPage(page);
      }}
      onPreviousPage={() => {
        workspace.goToPreviousPage();
      }}
      onNextPage={() => {
        workspace.goToNextPage();
      }}
      onDragReorder={(sourceId, targetId) => {
        workspace.reorderPages(sourceId, targetId);
      }}
      onToggleSelected={(pageId) => {
        workspace.togglePageSelected(pageId);
      }}
      onDeselectAllPages={() => {
        workspace.deselectAllPages();
      }}
      onExport={() => {
        workspace.handleExport();
      }}
    />
  );
}
