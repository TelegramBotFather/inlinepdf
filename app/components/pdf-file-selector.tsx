import { Add01Icon, File01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { type ChangeEvent, type DragEvent, useRef, useState } from 'react';

import { cn } from '~/lib/utils';

type SelectorVariant = 'dropzone' | 'inline';

interface PdfFileSelectorProps {
  disabled?: boolean;
  multiple?: boolean;
  onSelect: (files: File[]) => void;
  ariaLabel: string;
  variant?: SelectorVariant;
  title?: string;
  description?: string;
  buttonLabel?: string;
}

function filesFromList(fileList: FileList | null, multiple: boolean): File[] {
  const files = Array.from(fileList ?? []);

  if (multiple) {
    return files;
  }

  if (files.length === 0) {
    return [];
  }

  return [files[0]];
}

export function PdfFileSelector({
  disabled = false,
  multiple = false,
  onSelect,
  ariaLabel,
  variant = 'dropzone',
  title,
  description,
  buttonLabel,
}: PdfFileSelectorProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  function commitSelection(fileList: FileList | null) {
    if (disabled) {
      return;
    }

    const files = filesFromList(fileList, multiple);
    if (files.length > 0) {
      onSelect(files);
    }
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    commitSelection(event.currentTarget.files);
    event.currentTarget.value = '';
  }

  function openPicker() {
    if (!disabled) {
      inputRef.current?.click();
    }
  }

  const defaultTitle = multiple
    ? 'Drag and drop PDF files'
    : 'Drag and drop a PDF file';
  const defaultDescription = multiple
    ? 'Select PDF files by dragging and dropping, or choose from your device.'
    : 'Select a PDF file by dragging and dropping, or choose from your device.';

  return (
    <section>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        multiple={multiple}
        onChange={handleInputChange}
        disabled={disabled}
        className="sr-only"
        aria-label={ariaLabel}
      />

      {variant === 'inline' ? (
        <button
          type="button"
          disabled={disabled}
          className={cn(
            'flex w-full items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card px-4 py-5 text-sm font-medium transition-colors',
            !disabled && 'hover:border-primary/40 hover:bg-muted/50',
            disabled && 'cursor-not-allowed opacity-70',
          )}
          onClick={openPicker}
        >
          <HugeiconsIcon icon={Add01Icon} size={18} />
          {buttonLabel ?? 'Select more PDF files'}
        </button>
      ) : (
        <div
          role="button"
          tabIndex={0}
          aria-disabled={disabled}
          className={cn(
            'rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center transition-colors',
            !disabled &&
              'cursor-pointer hover:border-primary/40 hover:bg-muted/50',
            isDragActive && 'border-primary/60 bg-muted/60',
            disabled && 'cursor-not-allowed opacity-70',
          )}
          onClick={openPicker}
          onKeyDown={(event) => {
            if (disabled) {
              return;
            }

            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              openPicker();
            }
          }}
          onDragEnter={(event) => {
            event.preventDefault();
            if (!disabled) {
              setIsDragActive(true);
            }
          }}
          onDragOver={(event) => {
            event.preventDefault();
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            setIsDragActive(false);
          }}
          onDrop={(event: DragEvent<HTMLDivElement>) => {
            event.preventDefault();
            setIsDragActive(false);
            commitSelection(event.dataTransfer.files);
          }}
        >
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl border border-border bg-background">
            <HugeiconsIcon icon={File01Icon} size={30} />
          </div>
          <p className="text-2xl font-semibold tracking-tight">
            {title ?? defaultTitle}
          </p>
          <p className="mt-2 text-muted-foreground">
            {description ?? defaultDescription}
          </p>
        </div>
      )}
    </section>
  );
}
