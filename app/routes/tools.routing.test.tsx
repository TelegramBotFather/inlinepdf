import { render, screen } from '@testing-library/react';
import {
  RouterProvider,
  createMemoryRouter,
  isRouteErrorResponse,
  useRouteError,
} from 'react-router';
import { describe, expect, it } from 'vitest';

import ToolDetailRoute, { loader as toolLoader } from '~/routes/tools.$toolSlug';

function RouteErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return <p>{`status:${String(error.status)}`}</p>;
  }

  return <p>unknown-error</p>;
}

describe('tool detail routing', () => {
  it('returns 404 for unknown tool slugs', async () => {
    const router = createMemoryRouter(
      [
        {
          path: '/:toolSlug',
          loader: toolLoader,
          element: <ToolDetailRoute />,
          errorElement: <RouteErrorBoundary />,
        },
      ],
      { initialEntries: ['/does-not-exist'] },
    );

    render(<RouterProvider router={router} />);

    expect(await screen.findByText('status:404')).toBeInTheDocument();
  });

  it('renders planned tool view without loading an active module', async () => {
    const router = createMemoryRouter(
      [
        {
          path: '/:toolSlug',
          loader: toolLoader,
          element: <ToolDetailRoute />,
        },
      ],
      { initialEntries: ['/split'] },
    );

    render(<RouterProvider router={router} />);

    expect(await screen.findByText('Split PDF')).toBeInTheDocument();
    expect(
      screen.getByText(
        'This tool is planned and will be released in an upcoming milestone.',
      ),
    ).toBeInTheDocument();
  });
});
