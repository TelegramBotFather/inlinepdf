import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';

import ToolsIndexRoute from '~/routes/tools._index';

function renderRoute(pathname = '/tools') {
  return render(
    <MemoryRouter initialEntries={[pathname]}>
      <Routes>
        <Route path="/tools" element={<ToolsIndexRoute />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('tools index route', () => {
  it('lists ready tools with open action', () => {
    renderRoute();

    expect(screen.getByText('Merge PDF')).toBeInTheDocument();
    expect(screen.getByText('PDF Info')).toBeInTheDocument();

    const openLinks = screen.getAllByRole('link', { name: 'Open tool' });
    expect(openLinks.length).toBeGreaterThan(0);
  });

  it('supports category filters from search params', () => {
    renderRoute('/tools?category=convert');

    expect(screen.getByText('JPG to PDF')).toBeInTheDocument();
    expect(screen.getByText('PNG to PDF')).toBeInTheDocument();
    expect(screen.queryByText('Merge PDF')).not.toBeInTheDocument();
  });
});
