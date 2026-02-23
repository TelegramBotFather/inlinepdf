import { Link, useSearchParams } from 'react-router';

import { Shell } from '~/components/layout/shell';
import { buttonVariants } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { toolsRegistry } from '~/features/tools/registry';
import type { ToolCategory, ToolStatus } from '~/features/tools/types';

const categoryLabels: Record<ToolCategory, string> = {
  organize: 'Organize',
  convert: 'Convert',
  secure: 'Secure',
  optimize: 'Optimize',
  advanced: 'Advanced',
};

const statusLabels: Record<ToolStatus, string> = {
  ready: 'Ready',
  coming_soon: 'Coming soon',
  blocked_non_local: 'Blocked (non-local)',
};

const statusClassNames: Record<ToolStatus, string> = {
  ready: 'bg-foreground text-background border-border',
  coming_soon: 'bg-card text-muted-foreground border-border',
  blocked_non_local: 'bg-destructive text-destructive-foreground border-destructive',
};

export function meta() {
  return [
    { title: 'PDF Tools | InlinePDF' },
    {
      name: 'description',
      content:
        'Browse local-first PDF tools for merge, conversion, optimization, security, and OCR workflows.',
    },
  ];
}

export default function ToolsIndexRoute() {
  const [searchParams] = useSearchParams();
  const selectedCategory = searchParams.get('category') as ToolCategory | null;

  const visibleTools =
    selectedCategory && selectedCategory in categoryLabels
      ? toolsRegistry.filter((tool) => tool.category === selectedCategory)
      : toolsRegistry;

  return (
    <Shell>
      <section className="space-y-4">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">PDF Tools</h1>
          <p className="text-muted-foreground">
            Local-first tooling. Your files never leave your browser.
          </p>
        </header>

        <p className="text-sm text-muted-foreground">
          {visibleTools.length} tool{visibleTools.length === 1 ? '' : 's'}
        </p>

        <ul className="space-y-4">
          {visibleTools.map((tool) => {
            const isReady = tool.status === 'ready';

            return (
              <li key={tool.id}>
                <Card className="h-full">
                  <CardHeader className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <CardTitle className="text-lg">{tool.title}</CardTitle>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-xs font-medium ${statusClassNames[tool.status]}`}
                      >
                        {statusLabels[tool.status]}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {tool.description}
                    </p>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <p className="text-xs text-muted-foreground">
                      Category: {categoryLabels[tool.category]}
                    </p>

                    {isReady ? (
                      <Link
                        to={tool.path}
                        prefetch="intent"
                        className={buttonVariants({ size: 'lg' })}
                      >
                        Open tool
                      </Link>
                    ) : (
                      <Link
                        to={tool.path}
                        className={buttonVariants({ variant: 'outline', size: 'lg' })}
                      >
                        View details
                      </Link>
                    )}
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      </section>
    </Shell>
  );
}
