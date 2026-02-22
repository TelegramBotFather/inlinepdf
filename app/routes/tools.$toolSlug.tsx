import { Component, Suspense } from 'react';
import type { LoaderFunctionArgs } from 'react-router';
import { useLoaderData } from 'react-router';

import { Shell } from '~/components/layout/shell';
import { ToolWorkspace } from '~/features/tools/components/tool-workspace';
import { getToolBySlug, type ToolSlug } from '~/features/tools/registry';
import { lazyToolRenderers } from '~/features/tools/tool-modules';
import type { ToolDefinition } from '~/features/tools/types';

interface ToolRouteLoaderData {
  tool: ToolDefinition;
}

function formatKinds(values: readonly string[]): string {
  return values.join(', ');
}

export function loader({ params }: LoaderFunctionArgs): ToolRouteLoaderData {
  const slug = params.toolSlug ?? '';
  const tool = getToolBySlug(slug);

  if (!tool) {
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw new Response('Tool not found.', { status: 404 });
  }

  return { tool };
}

export function meta({ data }: { data?: ToolRouteLoaderData }) {
  if (!data) {
    return [{ title: 'Tool | InlinePDF' }];
  }

  return [
    { title: `${data.tool.title} | InlinePDF` },
    {
      name: 'description',
      content: data.tool.description,
    },
  ];
}

function PlannedToolView({ tool }: { tool: ToolDefinition }) {
  const statusText =
    tool.status === 'coming_soon'
      ? 'This tool is planned and will be released in an upcoming milestone.'
      : 'This workflow is blocked because it cannot be shipped as local-only yet.';

  return (
    <ToolWorkspace
      title={tool.title}
      description={tool.description}
      helperText="Planned tools stay visible so you can track upcoming capabilities."
      actionBar={<p className="text-sm text-muted-foreground">{statusText}</p>}
      outputPanel={
        <dl className="space-y-2 text-sm">
          <div className="space-y-1">
            <dt className="text-muted-foreground">Input kinds</dt>
            <dd>{formatKinds(tool.inputKinds)}</dd>
          </div>
          <div className="space-y-1">
            <dt className="text-muted-foreground">Output kinds</dt>
            <dd>{formatKinds(tool.outputKinds)}</dd>
          </div>
          <div className="space-y-1">
            <dt className="text-muted-foreground">Batch support</dt>
            <dd>{tool.supportsBatch ? 'Yes' : 'No'}</dd>
          </div>
          <div className="space-y-1">
            <dt className="text-muted-foreground">Complexity</dt>
            <dd>{tool.estimatedComplexity}</dd>
          </div>
        </dl>
      }
    />
  );
}

interface ToolModuleErrorBoundaryProps {
  tool: ToolDefinition;
  children: React.ReactNode;
}

interface ToolModuleErrorBoundaryState {
  hasError: boolean;
}

class ToolModuleErrorBoundary extends Component<
  ToolModuleErrorBoundaryProps,
  ToolModuleErrorBoundaryState
> {
  constructor(props: ToolModuleErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ToolModuleErrorBoundaryState {
    return { hasError: true };
  }

  override render() {
    if (this.state.hasError) {
      return (
        <ToolWorkspace
          title={this.props.tool.title}
          description={this.props.tool.description}
          errorMessage="Failed to load this tool. Please refresh and try again."
        />
      );
    }

    return this.props.children;
  }
}

export default function ToolDetailRoute() {
  const { tool } = useLoaderData<typeof loader>();

  let content: React.ReactNode;

  if (tool.status !== 'ready') {
    content = <PlannedToolView tool={tool} />;
  } else {
    const ToolRenderer = lazyToolRenderers[tool.slug as ToolSlug];

    if (!ToolRenderer) {
      content = (
        <ToolWorkspace
          title={tool.title}
          description={tool.description}
          errorMessage="This ready tool has no module loader configured yet."
        />
      );
    } else {
      content = (
        <ToolModuleErrorBoundary key={tool.slug} tool={tool}>
          <Suspense
            fallback={
              <ToolWorkspace
                title={tool.title}
                description={tool.description}
                actionBar={
                  <p className="text-sm text-muted-foreground">
                    Loading tool module...
                  </p>
                }
              />
            }
          >
            <ToolRenderer tool={tool} />
          </Suspense>
        </ToolModuleErrorBoundary>
      );
    }
  }

  return (
    <Shell>
      {content}
    </Shell>
  );
}
