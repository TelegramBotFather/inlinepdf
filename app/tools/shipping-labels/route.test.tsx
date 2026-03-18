import { describe, expect, it, vi } from 'vitest';

const {
  prepareShippingLabelsMock,
  saveBlobFileMock,
} = vi.hoisted(() => ({
  prepareShippingLabelsMock: vi.fn(),
  saveBlobFileMock: vi.fn(),
}));

vi.mock('~/platform/files/save-blob-file', () => ({
  saveBlobFile: saveBlobFileMock,
}));

vi.mock('./use-cases/prepare-shipping-labels', () => ({
  prepareShippingLabels: (input: {
    file: File | null;
    brand: string;
    outputPageSize: string | null;
    pickupPartnerDirection: string | null;
    skuDirection: string | null;
  }) => {
    if (!input.file) {
      return Promise.reject(
        new Error('Select a PDF file before preparing label pages.'),
      );
    }

    return prepareShippingLabelsMock(input) as Promise<unknown>;
  },
}));
import { amazonShippingLabelsToolDefinition } from './definitions';
import { createShippingLabelRouteModule } from './create-route-module';

function createRequest(formData: FormData) {
  return {
    formData: vi.fn(() => Promise.resolve(formData)),
  } as unknown as Request;
}

describe('shipping labels route clientAction', () => {
  const meeshoClientAction = createShippingLabelRouteModule(
    {
      ...amazonShippingLabelsToolDefinition,
      title: 'Meesho Labels',
      shortDescription: 'Prepare Meesho label pages from marketplace PDFs.',
    },
    'meesho',
  ).clientAction;
  const amazonClientAction = createShippingLabelRouteModule(
    amazonShippingLabelsToolDefinition,
    'amazon',
  ).clientAction;

  it('rejects requests without a file', async () => {
    const formData = new FormData();
    formData.set('outputPageSize', 'a4');

    const result = await meeshoClientAction({
      request: createRequest(formData),
    });

    expect(result).toEqual({
      ok: false,
      message: 'Select a PDF file before preparing label pages.',
    });
  });

  it('surfaces placeholder-brand errors from the preparation use case', async () => {
    const formData = new FormData();
    formData.set(
      'file',
      new File(['%PDF-1.4'], 'amazon.pdf', { type: 'application/pdf' }),
    );
    formData.set('outputPageSize', 'a4');
    prepareShippingLabelsMock.mockRejectedValueOnce(
      new Error('Amazon labels are not available yet.'),
    );

    const result = await amazonClientAction({
      request: createRequest(formData),
    });

    expect(result).toEqual({
      ok: false,
      message: 'Amazon labels are not available yet.',
    });
  });

  it('returns a zero-label error when no label pages are found', async () => {
    const formData = new FormData();
    formData.set(
      'file',
      new File(['%PDF-1.4'], 'meesho.pdf', { type: 'application/pdf' }),
    );
    formData.set('outputPageSize', 'auto');
    prepareShippingLabelsMock.mockRejectedValueOnce(
      new Error('No Meesho label pages were found in this PDF.'),
    );

    const result = await meeshoClientAction({
      request: createRequest(formData),
    });

    expect(result).toEqual({
      ok: false,
      message: 'No Meesho label pages were found in this PDF.',
    });
  });

  it('returns preparation stats on success', async () => {
    const formData = new FormData();
    formData.set(
      'file',
      new File(['%PDF-1.4'], 'meesho.pdf', { type: 'application/pdf' }),
    );
    formData.set('outputPageSize', 'a4');
    formData.set('pickupPartnerDirection', 'asc');
    formData.set('skuDirection', 'desc');
    prepareShippingLabelsMock.mockResolvedValueOnce({
      blob: new Blob(['pdf'], { type: 'application/pdf' }),
      fileName: 'meesho-meesho-labels-2026-03-17.pdf',
      pagesProcessed: 10,
      labelsPrepared: 8,
      pagesSkipped: 2,
    });

    const result = await meeshoClientAction({
      request: createRequest(formData),
    });

    expect(saveBlobFileMock).toHaveBeenCalledTimes(1);
    const firstCall = prepareShippingLabelsMock.mock.calls.at(-1)?.[0] as
      | {
          file: File;
          brand: string;
          outputPageSize: string;
          pickupPartnerDirection: string | null;
          skuDirection: string | null;
        }
      | undefined;
    expect(firstCall).toMatchObject({
      brand: 'meesho',
      outputPageSize: 'a4',
      pickupPartnerDirection: 'asc',
      skuDirection: 'desc',
    });
    expect(firstCall?.file).toBeInstanceOf(File);
    expect(result).toEqual({
      ok: true,
      message: 'Prepared 8 label pages.',
      result: {
        pagesProcessed: 10,
        labelsPrepared: 8,
        pagesSkipped: 2,
        fileName: 'meesho-meesho-labels-2026-03-17.pdf',
      },
    });
  });
});
