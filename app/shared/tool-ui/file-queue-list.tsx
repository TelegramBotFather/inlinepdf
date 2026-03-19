import Cancel01Icon from '@hugeicons/core-free-icons/Cancel01Icon';
import File01Icon from '@hugeicons/core-free-icons/File01Icon';
import { type ReactNode } from 'react';
import { isSortable, useSortable } from '@dnd-kit/react/sortable';
import { HugeiconsIcon } from '@hugeicons/react';
import { CspDragDropProvider } from '~/components/dnd/csp-drag-drop-provider';
import { AspectRatio } from '~/components/ui/aspect-ratio';
import { Button } from '~/components/ui/button';
import { Card, CardContent } from '~/components/ui/card';
import { Spinner } from '~/components/ui/spinner';

import { cn } from '~/lib/utils';

export interface QueuedFile {
  id: string;
  file: File;
  pageCount: number | null;
  previewDataUrl: string | null;
  previewStatus: 'loading' | 'ready' | 'unavailable';
  metadataText?: string;
}

interface FileQueueListProps {
  title?: string;
  files: QueuedFile[];
  disabled?: boolean;
  showIndexBadge?: boolean;
  onReorder?: (activeId: string, overId: string) => void;
  onRemove?: (id: string) => void;
  appendItem?: ReactNode;
}

const FILE_ROW_CLASS_NAME =
  'relative rounded-2xl select-none transition-shadow touch-none';
const FILE_ROW_ACTION_BUTTON_CLASS =
  'h-9 w-9 shrink-0 rounded-full border border-border bg-muted text-foreground shadow-sm transition-colors duration-150 hover:border-destructive hover:bg-destructive hover:text-white hover:shadow-sm focus-visible:border-destructive focus-visible:bg-destructive focus-visible:text-white focus-visible:shadow-sm dark:bg-muted dark:text-foreground dark:hover:border-destructive dark:hover:bg-destructive dark:hover:text-white dark:focus-visible:border-destructive dark:focus-visible:bg-destructive dark:focus-visible:text-white';

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

interface FileQueueRowCardProps {
  entry: QueuedFile;
  index: number;
  disabled: boolean;
  showIndexBadge: boolean;
  onRemove?: (id: string) => void;
}

function FileQueueRowCard({
  entry,
  index,
  disabled,
  showIndexBadge,
  onRemove,
}: FileQueueRowCardProps) {
  const pageText =
    entry.metadataText ??
    (entry.pageCount === null
      ? 'Pages unavailable'
      : `${String(entry.pageCount)} page${entry.pageCount === 1 ? '' : 's'}`);

  return (
    <Card className="depth-shadow-s h-full gap-0 border border-border/90 bg-muted/45 py-3 shadow-none ring-0 dark:depth-shadow-l dark:bg-card/95 dark:border-border/80">
      <CardContent className="px-3">
        <div className="flex items-center gap-3 lg:flex-col lg:items-stretch">
          <div className="w-[76px] shrink-0 lg:w-full">
            <AspectRatio
              ratio={4 / 5}
              className="overflow-hidden rounded-lg bg-muted/45 dark:bg-muted/30"
            >
              {entry.previewStatus === 'loading' ? (
                <div className="flex h-full w-full items-center justify-center bg-background/80">
                  <Spinner className="h-6 w-6" />
                </div>
              ) : entry.previewDataUrl ? (
                <>
                  <img
                    src={entry.previewDataUrl}
                    alt={`First page preview of ${entry.file.name}`}
                    draggable={false}
                    className="h-full w-full object-cover object-top transition-transform duration-300"
                    loading="lazy"
                  />
                </>
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-background">
                  <HugeiconsIcon icon={File01Icon} size={30} />
                </div>
              )}
            </AspectRatio>
          </div>

          <div
            className={cn(
              'grid min-w-0 flex-1 gap-x-2 lg:w-full',
              showIndexBadge ? 'grid-cols-[2rem_minmax(0,1fr)]' : 'grid-cols-1',
            )}
          >
            {showIndexBadge ? (
              <span className="row-span-3 inline-flex h-10 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 px-2 text-xs font-semibold tabular-nums text-primary shadow-sm">
                {index + 1}
              </span>
            ) : null}
            <p className="text-[0.95rem] font-semibold leading-snug tracking-[-0.01em] wrap-break-word text-foreground select-none [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3] overflow-hidden">
              {entry.file.name}
            </p>
            <p className="text-xs leading-relaxed font-medium tabular-nums text-foreground/90 select-none">
              {pageText}
            </p>
            <p className="text-xs leading-relaxed font-medium tabular-nums text-foreground/80 select-none">
              {formatBytes(entry.file.size)}
            </p>
          </div>

          {onRemove ? (
            <div className="flex shrink-0 items-center gap-2 self-start lg:absolute lg:right-4 lg:top-4 lg:z-20">
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label={`Remove ${entry.file.name}`}
                data-dnd-interactive="true"
                onClick={() => {
                  onRemove(entry.id);
                }}
                disabled={disabled}
                className={FILE_ROW_ACTION_BUTTON_CLASS}
              >
                <HugeiconsIcon icon={Cancel01Icon} size={20} />
              </Button>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

interface SortableFileRowProps {
  entry: QueuedFile;
  index: number;
  disabled: boolean;
  showIndexBadge: boolean;
  canReorder: boolean;
  onRemove?: (id: string) => void;
}

function SortableFileRow({
  entry,
  index,
  disabled,
  showIndexBadge,
  canReorder,
  onRemove,
}: SortableFileRowProps) {
  const { ref, isDragging } = useSortable({
    id: entry.id,
    index,
    disabled: disabled || !canReorder,
    transition: {
      duration: 250,
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
      idle: false,
    },
  });

  return (
    <li
      ref={ref}
      data-testid="file-queue-item"
      className={cn(
        FILE_ROW_CLASS_NAME,
        canReorder &&
          !disabled &&
          'cursor-grab active:cursor-grabbing',
        isDragging && 'ring-2 ring-ring shadow-sm',
        disabled && 'opacity-70',
      )}
      tabIndex={canReorder && !disabled ? 0 : undefined}
      aria-label={canReorder ? `Reorder ${entry.file.name}` : undefined}
    >
      <FileQueueRowCard
        entry={entry}
        index={index}
        disabled={disabled}
        showIndexBadge={showIndexBadge}
        onRemove={onRemove}
      />
    </li>
  );
}

export function FileQueueList({
  title = 'Selected files',
  files,
  disabled = false,
  showIndexBadge = true,
  onReorder,
  onRemove,
  appendItem,
}: FileQueueListProps) {
  if (files.length === 0) {
    return null;
  }

  const canReorder = !!onReorder && files.length > 1;
  const reorderFiles = onReorder;

  function handleDragEnd(event: unknown) {
    if (
      !canReorder ||
      disabled ||
      !reorderFiles ||
      !isRecord(event) ||
      !isRecord(event.operation) ||
      event.canceled === true
    ) {
      return;
    }

    const source = event.operation.source;

    if (!isSortable(source)) {
      return;
    }

    const { initialIndex, index } = source;

    if (initialIndex === index) {
      return;
    }

    const sourceId = files[initialIndex]?.id;
    const targetId = files[index]?.id;

    if (!sourceId || !targetId) {
      return;
    }

    reorderFiles(sourceId, targetId);
  }

  return (
    <section
      className="isolate space-y-3 [contain:layout_paint]"
      aria-label={title}
    >
      <CspDragDropProvider onDragEnd={handleDragEnd}>
        <ul className="grid grid-cols-1 gap-3 [contain:layout] sm:grid-cols-2 lg:grid-cols-3">
          {files.map((entry, index) => (
            <SortableFileRow
              key={entry.id}
              entry={entry}
              index={index}
              disabled={disabled}
              showIndexBadge={showIndexBadge}
              canReorder={canReorder}
              onRemove={onRemove}
            />
          ))}
          {appendItem}
        </ul>
      </CspDragDropProvider>
    </section>
  );
}
