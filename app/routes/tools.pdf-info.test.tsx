import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { PdfInfoResult } from '~/features/pdf-info/types';
import PdfInfoRoute from '~/routes/tools.pdf-info';

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
  return render(
    <MemoryRouter initialEntries={['/info']}>
      <Routes>
        <Route path="/info" element={<PdfInfoRoute />} />
      </Routes>
    </MemoryRouter>,
  );
}

function createFile() {
  return new File(['%PDF-1.4'], 'sample.pdf', { type: 'application/pdf' });
}

afterEach(() => {
  extractPdfInfoMock.mockReset();
});

describe('PdfInfoRoute', () => {
  it('shows loading state while metadata extraction is pending', async () => {
    const user = userEvent.setup();
    let resolveExtraction: ((value: PdfInfoResult) => void) | undefined;
    extractPdfInfoMock.mockReturnValue(
      new Promise<PdfInfoResult>((resolve) => {
        resolveExtraction = resolve;
      }),
    );

    renderRoute();

    await user.upload(screen.getByLabelText('Select PDF file'), createFile());

    expect(screen.getByText('Extracting PDF details...')).toBeInTheDocument();

    resolveExtraction?.(sampleResult);
    expect(await screen.findByText('File name')).toBeInTheDocument();
  });

  it('renders extracted metadata sections', async () => {
    const user = userEvent.setup();
    extractPdfInfoMock.mockResolvedValue(sampleResult);

    renderRoute();

    await user.upload(screen.getByLabelText('Select PDF file'), createFile());

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

    await user.upload(screen.getByLabelText('Select PDF file'), createFile());

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'PDF parse failed',
    );
  });
});
