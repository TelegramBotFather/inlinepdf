import type { ReactNode } from 'react';

import { Button } from '~/components/ui/button';

import { FileQueueList, type QueuedFile } from './file-queue-list';
import { ToolWorkspace } from './tool-workspace';

interface MultiFileToolWorkspaceProps {
  title: string;
  description: string;
  files: QueuedFile[];
  isBusy: boolean;
  emptyState: ReactNode;
  appendItem?: ReactNode;
  inputFooter?: ReactNode;
  optionsPanel?: ReactNode;
  actionBar?: ReactNode;
  errorMessage?: string | null;
  onReorder?: (activeId: string, overId: string) => void;
  onRemove?: (entryId: string) => void;
  onClearAll?: () => void;
  clearAllLabel?: string;
}

export function MultiFileToolWorkspace({
  title,
  description,
  files,
  isBusy,
  emptyState,
  appendItem,
  inputFooter,
  optionsPanel,
  actionBar,
  errorMessage,
  onReorder,
  onRemove,
  onClearAll,
  clearAllLabel = 'Clear All',
}: MultiFileToolWorkspaceProps) {
  return (
    <ToolWorkspace
      title={title}
      description={description}
      inputPanel={
        files.length === 0 ? (
          emptyState
        ) : (
          <div className="space-y-4">
            <FileQueueList
              files={files}
              disabled={isBusy}
              onReorder={onReorder}
              onRemove={onRemove}
              appendItem={appendItem}
            />
            {inputFooter ??
              (onClearAll ? (
                <Button
                  variant="outline"
                  disabled={isBusy}
                  onClick={() => {
                    onClearAll();
                  }}
                >
                  {clearAllLabel}
                </Button>
              ) : null)}
          </div>
        )
      }
      optionsPanel={optionsPanel}
      actionBar={actionBar}
      errorMessage={errorMessage}
    />
  );
}
