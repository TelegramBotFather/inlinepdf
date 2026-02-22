import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { PdfInfoResult } from '~/features/pdf-info/types';
import ToolDetailRoute, { loader as toolLoader } from '~/routes/tools.$toolSlug';

const extractPdfInfoMock = vi.hoisted(() => vi.fn());

vi.mock('~/features/pdf-info/service/extract-pdf-info', () => ({
  extractPdfInfo: extractPdfInfoMock,
}));

const sampleResult: PdfInfoResult = {
  document: {
    fileName: 'sample.pdf',
    fileSizeBytes: 1024,
    pageCount: 2,
    isEncrypted: false,
  },
  core: {
    title: 'Spec',
    author: 'Darshan',
    subject: 'InlinePDF',
    keywords: ['local', 'pdf'],
    creator: 'Writer',
    producer: 'Producer',
    creationDate: '2026-02-20T12:00:00.000Z',
    modificationDate: '2026-02-20T13:00:00.000Z',
  },
  fonts: {
    fontFamilies: ['Helvetica'],
    internalNames: ['g_d0_f1'],
  },
  infoDictionary: {
    Custom: 'Value',
  },
  rawXmpMetadata: '<xmp>meta</xmp>',
};

function renderRoute() {
  const router = createMemoryRouter(
    [
      {
        path: '/:toolSlug',
        loader: toolLoader,
        element: <ToolDetailRoute />,
      },
    ],
    { initialEntries: ['/info'] },
  );

  return render(
    <RouterProvider router={router} />,
  );
}

function createFile() {
  return new File(['%PDF-1.4'], 'sample.pdf', { type: 'application/pdf' });
}

async function waitForPdfInfoToolReady() {
  await screen.findByText('Drag and drop a PDF file', undefined, { timeout: 5000 });
}

afterEach(() => {
  extractPdfInfoMock.mockReset();
});

describe('PDF info tool route', () => {
  it('shows loading state while metadata extraction is pending', async () => {
    const user = userEvent.setup();
    let resolveExtraction: ((value: PdfInfoResult) => void) | undefined;
    extractPdfInfoMock.mockReturnValue(
      new Promise<PdfInfoResult>((resolve) => {
        resolveExtraction = resolve;
      }),
    );

    renderRoute();
    await waitForPdfInfoToolReady();

    await user.upload(
      await screen.findByLabelText('Select PDF file'),
      createFile(),
    );
    expect(screen.getByText('Extracting PDF details...')).toBeInTheDocument();

    resolveExtraction?.(sampleResult);
    expect(await screen.findByText('File name')).toBeInTheDocument();
  });

  it('renders extracted metadata sections', async () => {
    const user = userEvent.setup();
    extractPdfInfoMock.mockResolvedValue(sampleResult);

    renderRoute();
    await waitForPdfInfoToolReady();

    await user.upload(
      await screen.findByLabelText('Select PDF file'),
      createFile(),
    );

    expect(await screen.findByText('File name')).toBeInTheDocument();
    expect(screen.getByText('Raw XMP metadata')).toBeInTheDocument();
    expect(screen.getByText('File name')).toBeInTheDocument();
    expect(screen.getAllByText('sample.pdf').length).toBeGreaterThan(0);
    expect(screen.getByText('Author')).toBeInTheDocument();
    expect(screen.getByText('Darshan')).toBeInTheDocument();
  });

  it('renders extraction errors', async () => {
    const user = userEvent.setup();
    extractPdfInfoMock.mockRejectedValue(new Error('PDF parse failed'));

    renderRoute();
    await waitForPdfInfoToolReady();

    await user.upload(
      await screen.findByLabelText('Select PDF file'),
      createFile(),
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'PDF parse failed',
    );
  });
});
