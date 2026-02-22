import { Button } from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import type { MergeInputFile } from '~/features/merge/types';

interface MergeFileListProps {
  files: MergeInputFile[];
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onRemove: (id: string) => void;
  disabled: boolean;
}

export function MergeFileList({
  files,
  onMoveUp,
  onMoveDown,
  onRemove,
  disabled,
}: MergeFileListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>File Order</CardTitle>
        <CardDescription>
          Reorder files before merge. Output follows this exact order.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {files.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No files selected yet.
          </p>
        ) : (
          <ul className="space-y-3" aria-label="Selected files">
            {files.map((entry, index) => {
              const atStart = index === 0;
              const atEnd = index === files.length - 1;

              return (
                <li
                  key={entry.id}
                  data-testid="merge-file-item"
                  className="flex flex-col gap-2 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <p className="min-w-0 break-words text-sm font-medium">
                    {index + 1}. {entry.file.name}
                  </p>
                  <div className="shrink-0 flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={disabled || atStart}
                      onClick={() => {
                        onMoveUp(entry.id);
                      }}
                      aria-label={`Move ${entry.file.name} up`}
                    >
                      Up
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={disabled || atEnd}
                      onClick={() => {
                        onMoveDown(entry.id);
                      }}
                      aria-label={`Move ${entry.file.name} down`}
                    >
                      Down
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={disabled}
                      onClick={() => {
                        onRemove(entry.id);
                      }}
                      aria-label={`Remove ${entry.file.name}`}
                    >
                      Remove
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
