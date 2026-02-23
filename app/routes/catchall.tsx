import { Link } from 'react-router';

import { Shell } from '~/components/layout/shell';
import { buttonVariants } from '~/components/ui/button';

export function meta() {
  return [
    { title: 'Page Not Found | InlinePDF' },
    {
      name: 'description',
      content: 'The page you requested does not exist.',
    },
  ];
}

export default function CatchallRoute() {
  return (
    <Shell>
      <section className="mx-auto max-w-2xl space-y-4 rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-sm">
        <p className="text-sm font-medium text-muted-foreground">404</p>
        <h1 className="text-3xl font-semibold tracking-tight">Page not found</h1>
        <p className="text-muted-foreground">
          The URL does not exist. Go back to home or open tools.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/"
            className={buttonVariants({ size: 'lg' })}
          >
            Go Home
          </Link>
          <Link
            to="/tools"
            className={buttonVariants({ variant: 'outline', size: 'lg' })}
          >
            Open Tools
          </Link>
        </div>
      </section>
    </Shell>
  );
}
