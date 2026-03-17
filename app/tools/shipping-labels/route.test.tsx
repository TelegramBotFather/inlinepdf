import { describe, expect, it, vi } from 'vitest';

const {
  extractShippingLabelsMock,
  triggerFileDownloadMock,
  validatePdfFileMock,
} = vi.hoisted(() => ({
  extractShippingLabelsMock: vi.fn(),
  triggerFileDownloadMock: vi.fn(),
  validatePdfFileMock: vi.fn(() => Promise.resolve(undefined)),
}));

vi.mock('~/platform/files/security/file-validation', () => ({
  validatePdfFile: validatePdfFileMock,
}));

vi.mock('~/platform/files/trigger-file-download', () => ({
  triggerFileDownload: triggerFileDownloadMock,
}));

vi.mock('./use-cases/extract-shipping-labels', () => ({
  extractShippingLabels: extractShippingLabelsMock,
  isShippingLabelOutputPageSize: (value: string | null | undefined) =>
    [
      'auto',
      'a3',
      'a4',
      'a5',
      'b5',
      'envelope10',
      'envelopeChoukei3',
      'envelopeDl',
      'jisB5',
      'roc16k',
      'superBA3',
      'tabloid',
      'tabloidOversize',
      'legal',
      'letter',
    ].includes(value ?? ''),
  isShippingLabelSortDirection: (value: string | null | undefined) =>
    value === 'asc' || value === 'desc',
}));

import { createShippingLabelClientAction } from './shared-route';

function createRequest(formData: FormData) {
  return {
    formData: vi.fn(() => Promise.resolve(formData)),
  } as unknown as Request;
}

describe('shipping labels route clientAction', () => {
  const meeshoClientAction = createShippingLabelClientAction('meesho');
  const amazonClientAction = createShippingLabelClientAction('amazon');

  it('rejects requests without a file', async () => {
    const formData = new FormData();
    formData.set('outputPageSize', 'a4');

    const result = await meeshoClientAction({
      request: createRequest(formData),
    });

    expect(result).toEqual({
      ok: false,
      message: 'Select a PDF file before extracting labels.',
    });
  });

  it('surfaces placeholder-brand errors from the extractor use case', async () => {
    const formData = new FormData();
    formData.set(
      'file',
      new File(['%PDF-1.4'], 'amazon.pdf', { type: 'application/pdf' }),
    );
    formData.set('outputPageSize', 'a4');
    extractShippingLabelsMock.mockRejectedValueOnce(
      new Error('Amazon label extraction is not available yet.'),
    );

    const result = await amazonClientAction({
      request: createRequest(formData),
    });

    expect(validatePdfFileMock).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      ok: false,
      message: 'Amazon label extraction is not available yet.',
    });
  });

  it('returns a zero-label error from extraction failures', async () => {
    const formData = new FormData();
    formData.set(
      'file',
      new File(['%PDF-1.4'], 'meesho.pdf', { type: 'application/pdf' }),
    );
    formData.set('outputPageSize', 'auto');
    extractShippingLabelsMock.mockRejectedValueOnce(
      new Error('No Meesho shipping labels were found in this PDF.'),
    );

    const result = await meeshoClientAction({
      request: createRequest(formData),
    });

    expect(result).toEqual({
      ok: false,
      message: 'No Meesho shipping labels were found in this PDF.',
    });
  });

  it('starts a download and returns extraction stats on success', async () => {
    const formData = new FormData();
    formData.set(
      'file',
      new File(['%PDF-1.4'], 'meesho.pdf', { type: 'application/pdf' }),
    );
    formData.set('outputPageSize', 'a4');
    formData.set('pickupPartnerDirection', 'asc');
    formData.set('skuDirection', 'desc');
    extractShippingLabelsMock.mockResolvedValueOnce({
      blob: new Blob(['pdf'], { type: 'application/pdf' }),
      fileName: 'meesho-meesho-labels-2026-03-17.pdf',
      pagesProcessed: 10,
      labelsExtracted: 8,
      pagesSkipped: 2,
    });

    const result = await meeshoClientAction({
      request: createRequest(formData),
    });

    expect(triggerFileDownloadMock).toHaveBeenCalledTimes(1);
    expect(extractShippingLabelsMock).toHaveBeenCalledWith(expect.any(File), {
      brand: 'meesho',
      outputPageSize: 'a4',
      sort: {
        pickupPartnerDirection: 'asc',
        skuDirection: 'desc',
      },
    });
    expect(result).toEqual({
      ok: true,
      message: 'Download started with 8 extracted labels.',
      result: {
        pagesProcessed: 10,
        labelsExtracted: 8,
        pagesSkipped: 2,
        fileName: 'meesho-meesho-labels-2026-03-17.pdf',
      },
    });
  });
});
