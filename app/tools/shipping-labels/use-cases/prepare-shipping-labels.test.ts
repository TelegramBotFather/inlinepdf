import { PDFDocument } from 'pdf-lib';
import { describe, expect, it, vi } from 'vitest';

const { getDocumentMock } = vi.hoisted(() => ({
  getDocumentMock: vi.fn(),
}));

vi.mock('~/platform/pdf/load-pdfjs', () => ({
  loadPdfJsModule: vi.fn(() =>
    Promise.resolve({
      getDocument: getDocumentMock,
    }),
  ),
}));

import { prepareShippingLabelPdf } from './prepare-shipping-labels';

interface MockTextItem {
  str: string;
  transform: number[];
  height?: number;
}

async function createPdfFile(
  name: string,
  pageSizes: [number, number][],
): Promise<File> {
  const document = await PDFDocument.create();

  for (const [width, height] of pageSizes) {
    const page = document.addPage([width, height]);
    page.drawText('Shipping label test page', {
      x: 12,
      y: height / 2,
      size: 12,
    });
  }

  const bytes = await document.save();
  const normalizedBytes = new Uint8Array(bytes.byteLength);
  normalizedBytes.set(bytes);

  return new File([normalizedBytes.buffer], name, { type: 'application/pdf' });
}

async function readBlobAsArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  const maybeBlob = blob as Blob & {
    arrayBuffer?: () => Promise<ArrayBuffer>;
  };

  if (typeof maybeBlob.arrayBuffer === 'function') {
    return maybeBlob.arrayBuffer();
  }

  return new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result);
        return;
      }

      reject(new Error('Could not read blob'));
    };

    reader.onerror = () => {
      reject(new Error('Could not read blob'));
    };

    reader.readAsArrayBuffer(blob);
  });
}

function createPdfJsLoadingTask(
  pages: { width: number; height: number; items: MockTextItem[] }[],
) {
  const loadingTaskDestroy = vi.fn();
  const documentDestroy = vi.fn(() => Promise.resolve(undefined));
  const documentCleanup = vi.fn(() => Promise.resolve(undefined));
  const pageCleanupMocks = pages.map(() => vi.fn());

  const loadingTask = {
    destroy: loadingTaskDestroy,
    promise: Promise.resolve({
      numPages: pages.length,
      cleanup: documentCleanup,
      destroy: documentDestroy,
      getPage: vi.fn((pageNumber: number) => {
        const page = pages[pageNumber - 1];
        const pageCleanup = pageCleanupMocks[pageNumber - 1];

        return Promise.resolve({
          getTextContent: vi.fn(() => Promise.resolve({ items: page.items })),
          getViewport: ({ scale }: { scale: number }) => ({
            width: page.width * scale,
            height: page.height * scale,
            rotation: 0,
            viewBox: [0, 0, page.width, page.height],
            convertToPdfPoint: (x: number, y: number) => [x, page.height - y],
          }),
          cleanup: pageCleanup,
        });
      }),
    }),
  };

  return {
    loadingTask,
    loadingTaskDestroy,
    documentCleanup,
    documentDestroy,
    pageCleanupMocks,
  };
}

describe('prepareShippingLabelPdf', () => {
  it('prepares a Meesho label page at the auto size with bottom padding', async () => {
    const file = await createPdfFile('meesho.pdf', [[200, 200]]);
    const { loadingTask, loadingTaskDestroy } = createPdfJsLoadingTask([
      {
        width: 200,
        height: 200,
        items: [
          {
            str: 'TAX INVOICE',
            transform: [10, 0, 0, 10, 40, 150],
            height: 10,
          },
        ],
      },
    ]);
    getDocumentMock.mockReturnValueOnce(loadingTask);

    const result = await prepareShippingLabelPdf(file, {
      brand: 'meesho',
      outputPageSize: 'auto',
    });

    expect(result.pagesProcessed).toBe(1);
    expect(result.labelsPrepared).toBe(1);
    expect(result.pagesSkipped).toBe(0);
    expect(result.fileName).toMatch(
      /^meesho-meesho-labels-\d{4}-\d{2}-\d{2}\.pdf$/,
    );
    expect(loadingTaskDestroy).toHaveBeenCalledTimes(1);

    const outputDocument = await PDFDocument.load(
      await readBlobAsArrayBuffer(result.blob),
    );
    expect(outputDocument.getPageCount()).toBe(1);
    expect(outputDocument.getPage(0).getWidth()).toBeCloseTo(200, 4);
    expect(outputDocument.getPage(0).getHeight()).toBeCloseTo(49, 4);
  });

  it('prefers the top-most TAX INVOICE match on pages with duplicates', async () => {
    const file = await createPdfFile('duplicates.pdf', [[200, 200]]);
    const { loadingTask } = createPdfJsLoadingTask([
      {
        width: 200,
        height: 200,
        items: [
          { str: 'TAX INVOICE', transform: [10, 0, 0, 10, 40, 60], height: 10 },
          {
            str: 'TAX INVOICE',
            transform: [10, 0, 0, 10, 40, 150],
            height: 10,
          },
        ],
      },
    ]);
    getDocumentMock.mockReturnValueOnce(loadingTask);

    const result = await prepareShippingLabelPdf(file, {
      brand: 'meesho',
      outputPageSize: 'auto',
    });
    const outputDocument = await PDFDocument.load(
      await readBlobAsArrayBuffer(result.blob),
    );

    expect(outputDocument.getPage(0).getHeight()).toBeCloseTo(49, 4);
  });

  it('skips pages without a TAX INVOICE anchor and preserves matched page order', async () => {
    const file = await createPdfFile('mixed.pdf', [
      [200, 200],
      [150, 150],
    ]);
    const { loadingTask } = createPdfJsLoadingTask([
      {
        width: 200,
        height: 200,
        items: [
          {
            str: 'TAX INVOICE',
            transform: [10, 0, 0, 10, 40, 150],
            height: 10,
          },
        ],
      },
      {
        width: 150,
        height: 150,
        items: [
          {
            str: 'Order summary',
            transform: [10, 0, 0, 10, 20, 60],
            height: 10,
          },
        ],
      },
    ]);
    getDocumentMock.mockReturnValueOnce(loadingTask);

    const result = await prepareShippingLabelPdf(file, {
      brand: 'meesho',
      outputPageSize: 'auto',
    });
    const outputDocument = await PDFDocument.load(
      await readBlobAsArrayBuffer(result.blob),
    );

    expect(result.pagesProcessed).toBe(2);
    expect(result.labelsPrepared).toBe(1);
    expect(result.pagesSkipped).toBe(1);
    expect(outputDocument.getPageCount()).toBe(1);
    expect(outputDocument.getPage(0).getWidth()).toBeCloseTo(200, 4);
  });

  it('fits prepared label pages onto portrait A4 pages when A4 mode is selected', async () => {
    const file = await createPdfFile('a4.pdf', [[220, 200]]);
    const { loadingTask } = createPdfJsLoadingTask([
      {
        width: 220,
        height: 200,
        items: [
          {
            str: 'TAX INVOICE',
            transform: [10, 0, 0, 10, 40, 150],
            height: 10,
          },
        ],
      },
    ]);
    getDocumentMock.mockReturnValueOnce(loadingTask);

    const result = await prepareShippingLabelPdf(file, {
      brand: 'meesho',
      outputPageSize: 'a4',
    });
    const outputDocument = await PDFDocument.load(
      await readBlobAsArrayBuffer(result.blob),
    );

    expect(outputDocument.getPage(0).getWidth()).toBeCloseTo(595, 4);
    expect(outputDocument.getPage(0).getHeight()).toBeCloseTo(842, 4);
  });

  it('throws when no Meesho labels are found in the source PDF', async () => {
    const file = await createPdfFile('empty.pdf', [[200, 200]]);
    const { loadingTask } = createPdfJsLoadingTask([
      {
        width: 200,
        height: 200,
        items: [
          {
            str: 'Packing slip',
            transform: [10, 0, 0, 10, 20, 60],
            height: 10,
          },
        ],
      },
    ]);
    getDocumentMock.mockReturnValueOnce(loadingTask);

    await expect(
      prepareShippingLabelPdf(file, {
        brand: 'meesho',
        outputPageSize: 'auto',
      }),
    ).rejects.toThrow('No Meesho label pages were found in this PDF.');
  });

  it('sorts prepared label pages by SKU when SKU sorting is enabled', async () => {
    const file = await createPdfFile('sku-sort.pdf', [
      [120, 200],
      [180, 200],
    ]);
    const { loadingTask } = createPdfJsLoadingTask([
      {
        width: 120,
        height: 200,
        items: [
          {
            str: 'TAX INVOICE',
            transform: [10, 0, 0, 10, 40, 150],
            height: 10,
          },
          { str: 'SKU', transform: [10, 0, 0, 10, 19, 130], height: 10 },
          { str: 'Size', transform: [10, 0, 0, 10, 203, 130], height: 10 },
          { str: 'Zulu', transform: [10, 0, 0, 10, 19, 114], height: 10 },
        ],
      },
      {
        width: 180,
        height: 200,
        items: [
          {
            str: 'TAX INVOICE',
            transform: [10, 0, 0, 10, 40, 150],
            height: 10,
          },
          { str: 'SKU', transform: [10, 0, 0, 10, 19, 130], height: 10 },
          { str: 'Size', transform: [10, 0, 0, 10, 203, 130], height: 10 },
          { str: 'Alpha', transform: [10, 0, 0, 10, 19, 114], height: 10 },
        ],
      },
    ]);
    getDocumentMock.mockReturnValueOnce(loadingTask);

    const result = await prepareShippingLabelPdf(file, {
      brand: 'meesho',
      outputPageSize: 'auto',
      sort: {
        pickupPartnerDirection: null,
        skuDirection: 'asc',
      },
    });
    const outputDocument = await PDFDocument.load(
      await readBlobAsArrayBuffer(result.blob),
    );

    expect(outputDocument.getPageCount()).toBe(2);
    expect(outputDocument.getPage(0).getWidth()).toBeCloseTo(180, 4);
    expect(outputDocument.getPage(1).getWidth()).toBeCloseTo(120, 4);
  });

  it('sorts prepared label pages by pickup partner before SKU when both sorts are enabled', async () => {
    const file = await createPdfFile('combined-sort.pdf', [
      [110, 200],
      [140, 200],
      [170, 200],
    ]);
    const { loadingTask } = createPdfJsLoadingTask([
      {
        width: 110,
        height: 200,
        items: [
          {
            str: 'TAX INVOICE',
            transform: [10, 0, 0, 10, 40, 150],
            height: 10,
          },
          { str: 'Shadowfax', transform: [10, 0, 0, 10, 265, 182], height: 10 },
          { str: 'Pickup', transform: [10, 0, 0, 10, 269, 160], height: 10 },
          { str: 'SKU', transform: [10, 0, 0, 10, 19, 130], height: 10 },
          { str: 'Size', transform: [10, 0, 0, 10, 203, 130], height: 10 },
          { str: 'Zulu', transform: [10, 0, 0, 10, 19, 114], height: 10 },
        ],
      },
      {
        width: 140,
        height: 200,
        items: [
          {
            str: 'TAX INVOICE',
            transform: [10, 0, 0, 10, 40, 150],
            height: 10,
          },
          { str: 'Shadowfax', transform: [10, 0, 0, 10, 265, 182], height: 10 },
          { str: 'Pickup', transform: [10, 0, 0, 10, 269, 160], height: 10 },
          { str: 'SKU', transform: [10, 0, 0, 10, 19, 130], height: 10 },
          { str: 'Size', transform: [10, 0, 0, 10, 203, 130], height: 10 },
          { str: 'Alpha', transform: [10, 0, 0, 10, 19, 114], height: 10 },
        ],
      },
      {
        width: 170,
        height: 200,
        items: [
          {
            str: 'TAX INVOICE',
            transform: [10, 0, 0, 10, 40, 150],
            height: 10,
          },
          { str: 'Valmo', transform: [10, 0, 0, 10, 269, 160], height: 10 },
          { str: 'Pickup', transform: [10, 0, 0, 10, 327, 162], height: 10 },
          { str: 'SKU', transform: [10, 0, 0, 10, 19, 130], height: 10 },
          { str: 'Size', transform: [10, 0, 0, 10, 203, 130], height: 10 },
          { str: 'Bravo', transform: [10, 0, 0, 10, 19, 114], height: 10 },
        ],
      },
    ]);
    getDocumentMock.mockReturnValueOnce(loadingTask);

    const result = await prepareShippingLabelPdf(file, {
      brand: 'meesho',
      outputPageSize: 'auto',
      sort: {
        pickupPartnerDirection: 'desc',
        skuDirection: 'desc',
      },
    });
    const outputDocument = await PDFDocument.load(
      await readBlobAsArrayBuffer(result.blob),
    );

    expect(outputDocument.getPageCount()).toBe(3);
    expect(outputDocument.getPage(0).getWidth()).toBeCloseTo(170, 4);
    expect(outputDocument.getPage(1).getWidth()).toBeCloseTo(110, 4);
    expect(outputDocument.getPage(2).getWidth()).toBeCloseTo(140, 4);
  });
});
