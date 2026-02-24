import { DragDropProvider } from '@dnd-kit/react';
import { Cancel01Icon, File01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useSortable } from '@dnd-kit/react/sortable';
import type { ReactNode } from 'react';
import { Button } from '~/components/ui/button';
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

interface SortableFileRowProps {
  entry: QueuedFile;
  index: number;
  disabled: boolean;
  showIndexBadge: boolean;
  onRemove?: (id: string) => void;
}

interface SortableIndices {
  index: number;
  initialIndex: number;
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

function SortableFileRow({
  entry,
  index,
  disabled,
  showIndexBadge,
  onRemove,
}: SortableFileRowProps) {
  const { ref, isDragging } = useSortable({
    id: entry.id,
    index,
    type: 'merge-file',
    group: 'merge-files',
    disabled,
  });

  return (
    <li
      ref={ref}
      data-testid="file-queue-item"
      className={cn(
        'relative rounded-2xl border border-border/90 bg-card p-3 transition-shadow',
        !disabled && 'cursor-grab active:cursor-grabbing',
        isDragging && 'ring-2 ring-ring shadow-sm',
        disabled && 'opacity-70',
      )}
    >
      <div className="flex items-center gap-3 lg:flex-col lg:items-stretch">
        <div className="relative h-24 w-[76px] shrink-0 overflow-hidden rounded-lg border border-border/70 bg-white dark:border-white/15 lg:h-auto lg:w-full lg:aspect-[4/5]">
          {entry.previewStatus === 'loading' ? (
            <div className="flex h-full w-full items-center justify-center bg-background/80">
              <Spinner className="h-6 w-6" />
            </div>
          ) : entry.previewDataUrl ? (
            <img
              src={entry.previewDataUrl}
              alt={`First page preview of ${entry.file.name}`}
              className="h-full w-full object-cover object-top transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-background">
              <HugeiconsIcon icon={File01Icon} size={30} />
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 rounded-[inherit] shadow-[inset_0_0_0_1px_rgba(15,23,42,0.08),inset_0_0_24px_-14px_rgba(15,23,42,0.28)] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08),inset_0_0_40px_-8px_rgba(0,0,0,0.78)]" />
        </div>

        <div
          className={cn(
            'grid min-w-0 flex-1 gap-x-2 lg:w-full',
            showIndexBadge ? 'grid-cols-[2rem_minmax(0,1fr)]' : 'grid-cols-1',
          )}
        >
          {showIndexBadge ? (
            <span className="row-span-3 inline-flex h-10 items-center justify-center rounded-md bg-muted text-xs font-semibold tabular-nums text-muted-foreground">
              {index + 1}
            </span>
          ) : null}
          <p className="text-sm font-semibold leading-tight break-all [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3] overflow-hidden">
            {entry.file.name}
          </p>
          <p className="text-xs text-muted-foreground">
            {entry.metadataText ?? (
              entry.pageCount === null
                ? 'Pages unavailable'
                : `${String(entry.pageCount)} page${entry.pageCount === 1 ? '' : 's'}`
            )}
          </p>
          <p className="text-xs text-muted-foreground">{formatBytes(entry.file.size)}</p>
        </div>

        {onRemove ? (
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={`Remove ${entry.file.name}`}
            onClick={() => {
              onRemove(entry.id);
            }}
            disabled={disabled}
            className="h-9 w-9 shrink-0 rounded-full border-border/90 bg-card/90 text-foreground shadow-md backdrop-blur-xl hover:bg-card lg:absolute lg:right-4 lg:top-4 lg:z-20"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={20} />
          </Button>
        ) : null}
      </div>
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

  return (
    <DragDropProvider
      onDragEnd={(event) => {
        if (disabled || event.canceled || !onReorder) {
          return;
        }

        const { operation } = event;
        const source = operation.source;
        if (!source) {
          return;
        }

        const target = operation.target;
        if (target && source.id !== target.id) {
          const sourceId = toSortableId(source.id);
          const targetId = toSortableId(target.id);
          if (!sourceId || !targetId) {
            return;
          }

          onReorder(sourceId, targetId);
          return;
        }

        if (!hasSortableIndices(source) || source.index === source.initialIndex) {
          return;
        }

        const targetId = files[source.index]?.id;
        if (!targetId || targetId === source.id) {
          return;
        }

        const sourceId = toSortableId(source.id);
        if (!sourceId) {
          return;
        }

        onReorder(sourceId, targetId);
      }}
    >
      <section className="space-y-3" aria-label={title}>
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {files.map((entry, index) => (
            <SortableFileRow
              key={entry.id}
              entry={entry}
              index={index}
              disabled={disabled}
              showIndexBadge={showIndexBadge}
              onRemove={onRemove}
            />
          ))}
          {appendItem}
        </ul>
      </section>
    </DragDropProvider>
  );
}
