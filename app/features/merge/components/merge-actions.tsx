import { Button } from '~/components/ui/button';

interface MergeActionsProps {
  canMerge: boolean;
  isMerging: boolean;
  onMerge: () => Promise<void>;
  errorMessage: string | null;
  successMessage: string | null;
}

export function MergeActions({
  canMerge,
  isMerging,
  onMerge,
  errorMessage,
  successMessage,
}: MergeActionsProps) {
  return (
    <div className="space-y-3">
      <Button
        onClick={() => {
          void onMerge();
        }}
        disabled={!canMerge || isMerging}
      >
        {isMerging ? 'Merging…' : 'Merge and Download'}
      </Button>
      <p className="text-sm text-muted-foreground">
        Local-only mode: no file transfer, no accounts, no server-side
        processing.
      </p>
      {errorMessage ? (
        <p role="alert" className="text-sm font-medium text-destructive">
          {errorMessage}
        </p>
      ) : null}
      {successMessage ? (
        <p className="text-sm font-medium text-foreground">{successMessage}</p>
      ) : null}
    </div>
  );
}
