import { data } from 'react-router';

import type { Route } from './+types/catchall';
import { Empty, EmptyHeader, EmptyTitle } from '~/components/ui/empty';

export const meta: Route.MetaFunction = () => {
  return [
    { title: 'Page Not Found | InlinePDF' },
    {
      name: 'description',
      content: 'The page you requested does not exist.',
    },
  ];
};

export function loader() {
  return data(null, { status: 404 });
}

export default function CatchallRoute() {
  return (
    <section className="flex min-h-[calc(100vh-16rem)] items-center justify-center">
      <Empty>
        <EmptyHeader className="max-w-2xl">
          <EmptyTitle className="max-w-none text-3xl font-semibold tracking-tight text-balance sm:text-4xl md:text-[2.5rem]">
            The page you&apos;re looking for can&apos;t be found.
          </EmptyTitle>
        </EmptyHeader>
      </Empty>
    </section>
  );
}
