import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

const readOrganizePreviewMock = vi.hoisted(() => vi.fn());
const exportOrganizedPdfMock = vi.hoisted(() => vi.fn());

vi.mock('~/features/organize/service/read-organize-preview', () => ({
  readOrganizePreview: readOrganizePreviewMock,
}));

vi.mock('~/features/organize/service/export-organized-pdf', () => ({
  exportOrganizedPdf: exportOrganizedPdfMock,
}));

import ToolDetailRoute, { loader as toolLoader } from '~/routes/tools.$toolSlug';
import type { OrganizePageState } from '~/features/organize/types';

function renderRoute() {
  const router = createMemoryRouter(
    [
      {
        path: '/:toolSlug',
        loader: toolLoader,
        element: <ToolDetailRoute />,
      },
    ],
    { initialEntries: ['/organize'] },
  );

  return render(<RouterProvider router={router} />);
}

function createFile() {
  return new File(['%PDF-1.4'], 'sample.pdf', { type: 'application/pdf' });
}

afterEach(() => {
  readOrganizePreviewMock.mockReset();
  exportOrganizedPdfMock.mockReset();
});

describe('Organize tool route', () => {
  it('supports pagination, rotate, select/remove controls, and export', async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const createObjectUrlSpy = vi.spyOn(URL, 'createObjectURL');

    readOrganizePreviewMock.mockResolvedValue({
      pageCount: 13,
      getPageThumbnail: vi.fn(
        () => new Promise<string | null>(() => undefined),
      ),
      destroy: vi.fn(() => Promise.resolve(undefined)),
    });

    exportOrganizedPdfMock.mockResolvedValue({
      blob: new Blob(['%PDF-1.4'], { type: 'application/pdf' }),
      fileName: 'sample-organized-2026-02-24.pdf',
      pagesExported: 13,
    });

    renderRoute();

    await screen.findByText('Drag and drop a PDF to organize', undefined, {
      timeout: 5000,
    });

    await user.upload(
      await screen.findByLabelText('Select PDF file for organizing'),
      createFile(),
    );

    expect(
      await screen.findByText('Showing pages 1-12 of 13'),
    ).toBeInTheDocument();

    await user.click(screen.getByLabelText('Go to pagination page 2'));

    expect(
      await screen.findByText('Showing pages 13-13 of 13'),
    ).toBeInTheDocument();

    await user.click(screen.getByLabelText('Go to pagination page 1'));

    await user.click(screen.getByLabelText('Rotate page 1'));
    await user.click(screen.getByLabelText('Remove page 2'));
    await user.click(screen.getByLabelText('Select page 2'));

    await user.click(screen.getByRole('button', { name: 'Organize and Download' }));

    const exportInput = exportOrganizedPdfMock.mock.calls[0]?.[0] as
      | {
          file: File;
          pages: OrganizePageState[];
        }
      | undefined;

    expect(exportInput?.file).toBeInstanceOf(File);

    const page1State = exportInput?.pages.find(
      (page) => page.sourcePageNumber === 1,
    );
    const page2State = exportInput?.pages.find(
      (page) => page.sourcePageNumber === 2,
    );

    expect(page1State?.rotationQuarterTurns).toBe(1);
    expect(page2State?.isDeleted).toBe(false);

    expect(createObjectUrlSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(
      await screen.findByText('Organized PDF ready. Exported 13 pages.'),
    ).toBeInTheDocument();

    createObjectUrlSpy.mockRestore();
    fetchSpy.mockRestore();
  }, 10000);
});
