import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it } from 'vitest';

import { Header } from '~/components/layout/header';
import HomeRoute from '~/routes/home';

function renderWithRoot(
  element: ReactNode,
  resolvedTheme: 'light' | 'dark' = 'light',
) {
  document.documentElement.setAttribute('data-theme-preference', resolvedTheme);
  document.documentElement.setAttribute('data-resolved-theme', resolvedTheme);
  const loaderData = {
    preference: resolvedTheme,
    resolvedTheme,
  };

  const router = createMemoryRouter(
    [
      {
        id: 'root',
        path: '/',
        loader: () => loaderData,
        element,
      },
    ],
    {
      hydrationData: {
        loaderData: {
          root: loaderData,
        },
      },
      initialEntries: ['/'],
    },
  );

  return render(<RouterProvider router={router} />);
}

beforeEach(() => {
  document.documentElement.removeAttribute('data-theme-preference');
  document.documentElement.removeAttribute('data-resolved-theme');
});

describe('home route branding', () => {
  it('renders one hero image', async () => {
    const { container } = renderWithRoot(<HomeRoute />, 'light');

    const heroImage = await screen.findByRole('img', {
      name: 'InlinePDF logo',
    });
    const renderedImages = container.querySelectorAll('picture img');

    expect(renderedImages).toHaveLength(1);
    expect(heroImage).toHaveAttribute('src');
    expect(heroImage.getAttribute('src')).toContain('hero-logo-');
  });

  it('shows the InlinePDF title without hero badges or CTA buttons', async () => {
    renderWithRoot(<HomeRoute />, 'light');

    await screen.findByRole('heading', { name: 'InlinePDF' });

    expect(screen.queryByText('Local-First')).not.toBeInTheDocument();
    expect(screen.queryByText('On Device')).not.toBeInTheDocument();
    expect(screen.queryByText('Open Source')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Get Started' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Browse Tools' }),
    ).not.toBeInTheDocument();
  });

  it('renders the GitHub source section with the official lockup and source link', async () => {
    renderWithRoot(<HomeRoute />, 'dark');

    const githubLogo = await screen.findByRole('img', { name: 'GitHub' });
    const sourceLink = screen.getByRole('link', {
      name: 'View Source Code',
    });

    expect(githubLogo).toHaveAttribute('src');
    expect(githubLogo.getAttribute('src')).toContain("fill='white'");
    expect(sourceLink).toHaveAttribute(
      'href',
      'https://github.com/DG02002/inlinepdf',
    );
  });

  it('uses the dark-on-light GitHub lockup in light theme', async () => {
    renderWithRoot(<HomeRoute />, 'light');

    const githubLogo = await screen.findByRole('img', { name: 'GitHub' });

    expect(githubLogo.getAttribute('src')).toContain("fill='black'");
  });
});

describe('header branding', () => {
  it('renders one header logo image for the resolved theme', async () => {
    const { container } = renderWithRoot(<Header />, 'dark');
    await screen.findByText('InlinePDF');

    const headerImage = container.querySelector('picture img');

    expect(headerImage).not.toBeNull();
    expect(container.querySelectorAll('picture img')).toHaveLength(1);
    expect(headerImage?.getAttribute('src')).toContain('header-logo-');
    expect(headerImage).toHaveAttribute('width', '40');
    expect(headerImage).toHaveAttribute('height', '40');
  });
});
