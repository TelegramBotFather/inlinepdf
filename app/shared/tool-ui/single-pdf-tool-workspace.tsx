import type { ComponentProps, ReactNode } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';

import { PdfFileSelector } from '~/components/pdf-file-selector';

import { FileQueueList, type QueuedFile } from './file-queue-list';
import { ToolWorkspace } from './tool-workspace';

interface SinglePdfToolWorkspaceProps {
  title: string;
  description: string;
  titleIcon?: ComponentProps<typeof HugeiconsIcon>['icon'];
  selectorAriaLabel: string;
  selectedFileEntry: QueuedFile | null;
  isBusy: boolean;
  helperText?: string;
  optionsPanel?: ReactNode;
  actionBar?: ReactNode;
  outputPanel?: ReactNode;
  errorMessage?: string | null;
  showIndexBadge?: boolean;
  onSelectFile: (file: File) => void;
  onClearSelection: () => void;
}

export function SinglePdfToolWorkspace({
  title,
  description,
  titleIcon,
  selectorAriaLabel,
  selectedFileEntry,
  isBusy,
  helperText,
  optionsPanel,
  actionBar,
  outputPanel,
  errorMessage,
  showIndexBadge = false,
  onSelectFile,
  onClearSelection,
}: SinglePdfToolWorkspaceProps) {
  return (
    <ToolWorkspace
      title={title}
      description={description}
      titleIcon={titleIcon}
      helperText={helperText}
      inputPanel={
        selectedFileEntry ? (
          <FileQueueList
            files={[selectedFileEntry]}
            disabled={isBusy}
            showIndexBadge={showIndexBadge}
            onRemove={() => {
              onClearSelection();
            }}
          />
        ) : (
          <PdfFileSelector
            ariaLabel={selectorAriaLabel}
            onSelect={(files) => {
              onSelectFile(files[0]);
            }}
            disabled={isBusy}
          />
        )
      }
      optionsPanel={optionsPanel}
      actionBar={actionBar}
      outputPanel={outputPanel}
      errorMessage={errorMessage}
    />
  );
}
