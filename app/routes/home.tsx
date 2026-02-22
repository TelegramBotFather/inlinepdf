import { Link } from 'react-router';

import { Shell } from '~/components/layout/shell';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { toolsRegistry } from '~/features/tools/registry';

export function meta() {
  return [
    { title: 'InlinePDF | Local-First PDF Tools' },
    {
      name: 'description',
      content:
        'InlinePDF is a local-first iLovePDF alternative. PDF processing runs in your browser with PDF.js and PDF-Lib.',
    },
  ];
}

export default function HomeRoute() {
  const readyTools = toolsRegistry.filter((tool) => tool.status === 'ready');

  return (
    <Shell>
      <section className="space-y-8">
        <header className="space-y-3">
          <h1 className="text-4xl font-semibold tracking-tight">
            Local-first PDF toolkit
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            Open a tool and process documents directly in your browser. No
            uploads, no accounts, no server-side PDF processing.
          </p>
          <Link
            to="/tools"
            prefetch="intent"
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:brightness-95"
          >
            Browse tools
          </Link>
        </header>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold tracking-tight">Ready now</h2>
          <ul className="space-y-4">
            {readyTools.map((tool) => (
              <li key={tool.id}>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{tool.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      {tool.description}
                    </p>
                    <Link
                      to={tool.path}
                      prefetch="intent"
                      className="inline-flex h-9 items-center justify-center rounded-md border border-border bg-card px-3 text-sm font-medium hover:bg-muted"
                    >
                      Open
                    </Link>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      </section>
    </Shell>
  );
}
