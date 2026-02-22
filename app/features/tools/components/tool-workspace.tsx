interface ToolWorkspaceProps {
  title: string;
  description: string;
  helperText?: string;
  inputPanel?: React.ReactNode;
  optionsPanel?: React.ReactNode;
  actionBar?: React.ReactNode;
  outputPanel?: React.ReactNode;
  errorMessage?: string | null;
  successMessage?: string | null;
}

export function ToolWorkspace({
  title,
  description,
  helperText,
  inputPanel,
  optionsPanel,
  actionBar,
  outputPanel,
  errorMessage,
  successMessage,
}: ToolWorkspaceProps) {
  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
        {helperText ? (
          <p className="text-sm text-muted-foreground">{helperText}</p>
        ) : null}
      </header>

      {errorMessage ? (
        <p role="alert" className="text-sm font-medium text-destructive">
          {errorMessage}
        </p>
      ) : null}
      {successMessage ? (
        <p className="text-sm font-medium text-foreground" aria-live="polite">
          {successMessage}
        </p>
      ) : null}

      {inputPanel ? <section className="space-y-3">{inputPanel}</section> : null}
      {optionsPanel ? (
        <section className="space-y-3">{optionsPanel}</section>
      ) : null}
      {actionBar ? <section className="space-y-3">{actionBar}</section> : null}
      {outputPanel ? <section className="space-y-3">{outputPanel}</section> : null}
    </section>
  );
}
