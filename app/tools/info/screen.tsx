import { Skeleton } from '~/components/ui/skeleton';
import { SinglePdfToolWorkspace } from '~/shared/tool-ui/single-pdf-tool-workspace';
import { infoToolDefinition } from '~/tools/info/definition';
import { usePdfInfoWorkspace } from '~/tools/info/use-pdf-info-workspace';

export function PdfInfoToolScreen() {
  const workspace = usePdfInfoWorkspace();

  return (
    <SinglePdfToolWorkspace
      title="PDF Info"
      description="Review metadata, info dictionary fields, and font details."
      titleIcon={infoToolDefinition.icon}
      selectorAriaLabel="Select PDF file"
      selectedFileEntry={workspace.selectedFileEntry}
      isBusy={workspace.isLoading}
      onSelectFile={workspace.handleFileSelection}
      onClearSelection={workspace.handleClearSelection}
      outputPanel={
        workspace.isLoading ? (
          <section className="space-y-5 pt-2">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                Metadata
              </h2>
            </div>
            <div className="overflow-hidden rounded-2xl border border-border/70">
              {Array.from({ length: 8 }, (_, rowIndex) => (
                <div
                  key={String(rowIndex)}
                  className="grid gap-3 border-b border-border/70 px-4 py-3 last:border-b-0 odd:bg-muted/18 even:bg-background sm:grid-cols-[13rem_minmax(0,1fr)] sm:items-center sm:px-5"
                >
                  <Skeleton className="h-3.5 w-24 rounded-full" />
                  <Skeleton className="h-5 w-full max-w-xl" />
                </div>
              ))}
            </div>
          </section>
        ) : workspace.result ? (
          <div className="space-y-5">
            <section className="space-y-5 pt-2">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                  Metadata
                </h2>
              </div>
              <div className="overflow-hidden rounded-2xl border border-border/70">
                {workspace.metadataRows.map(([label, value]) => (
                  <div
                    key={label}
                    className="grid gap-2 border-b border-border/70 px-4 py-3 last:border-b-0 odd:bg-muted/18 even:bg-background sm:grid-cols-[13rem_minmax(0,1fr)] sm:items-start sm:px-5"
                  >
                    <p className="pt-0.5 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {label}
                    </p>
                    <p className="text-sm font-semibold leading-6 text-foreground wrap-break-word sm:text-[0.95rem]">
                      {value}
                    </p>
                  </div>
                ))}
                {workspace.additionalInfoEntries.map(([key, value]) => (
                  <div
                    key={key}
                    className="grid gap-2 border-b border-border/70 px-4 py-3 last:border-b-0 odd:bg-muted/18 even:bg-background sm:grid-cols-[13rem_minmax(0,1fr)] sm:items-start sm:px-5"
                  >
                    <p className="pt-0.5 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {`Info: ${key}`}
                    </p>
                    <p className="text-sm font-semibold leading-6 text-foreground wrap-break-word sm:text-[0.95rem]">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-3 pt-1">
              <p className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
                Raw XMP metadata
              </p>
              {workspace.rawXmpMetadata ? (
                <pre className="overflow-x-auto rounded-2xl border border-border/70 bg-muted/12 p-4 text-xs leading-6">
                  <code>{workspace.rawXmpMetadata}</code>
                </pre>
              ) : (
                <p className="text-sm leading-6 text-muted-foreground">
                  No XMP metadata present.
                </p>
              )}
            </section>
          </div>
        ) : null
      }
      errorMessage={workspace.errorMessage}
    />
  );
}
