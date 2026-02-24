import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import ToolDetailRoute, { loader as toolLoader } from '~/routes/tools.$toolSlug';

const readPdfDetailsMock = vi.hoisted(() => vi.fn());
const readPdfImageBaseResolutionMock = vi.hoisted(() => vi.fn());
const renderPdfToImagesMock = vi.hoisted(() => vi.fn());
const zipImagesMock = vi.hoisted(() => vi.fn());

vi.mock('~/features/pdf/service/read-pdf-details', () => ({
  readPdfDetails: readPdfDetailsMock,
}));

vi.mock('~/features/pdf-to-images/service/render-pdf-to-images', () => ({
  MAX_QUALITY_LONG_EDGE_TARGET_PX: 8000,
  readPdfImageBaseResolution: readPdfImageBaseResolutionMock,
  renderPdfToImages: renderPdfToImagesMock,
}));

vi.mock('~/features/pdf-to-images/service/zip-images', () => ({
  createImagesArchiveName: vi.fn(() => 'sample-images-jpeg-max.zip'),
  zipImages: zipImagesMock,
}));

function renderRoute() {
  const router = createMemoryRouter(
    [
      {
        path: '/:toolSlug',
        loader: toolLoader,
        element: <ToolDetailRoute />,
      },
    ],
    { initialEntries: ['/pdf-to-images'] },
  );

  return render(<RouterProvider router={router} />);
}

function createFile() {
  return new File(['%PDF-1.4'], 'sample.pdf', { type: 'application/pdf' });
}

afterEach(() => {
  readPdfDetailsMock.mockReset();
  readPdfImageBaseResolutionMock.mockReset();
  renderPdfToImagesMock.mockReset();
  zipImagesMock.mockReset();
});

describe('PDF to images tool route', () => {
  it('renders conversion controls, resolution preview, and downloads ZIP', async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const createObjectUrlSpy = vi.spyOn(URL, 'createObjectURL');

    readPdfDetailsMock.mockResolvedValue({
      pageCount: 2,
      previewDataUrl: null,
    });
    readPdfImageBaseResolutionMock.mockResolvedValue({
      pageCount: 2,
      baseWidthPx: 600,
      baseHeightPx: 900,
    });
    renderPdfToImagesMock.mockResolvedValue([
      {
        fileName: 'page-001.jpeg',
        bytes: new Uint8Array([1, 2, 3]),
        mimeType: 'image/jpeg',
        width: 2400,
        height: 3600,
      },
      {
        fileName: 'page-002.jpeg',
        bytes: new Uint8Array([4, 5, 6]),
        mimeType: 'image/jpeg',
        width: 2400,
        height: 3600,
      },
    ]);
    zipImagesMock.mockResolvedValue(new Blob(['zip'], { type: 'application/zip' }));

    renderRoute();
    await screen.findByText('Drag and drop a PDF file', undefined, {
      timeout: 5000,
    });

    await user.upload(
      await screen.findByLabelText('Select PDF file'),
      createFile(),
    );

    expect(await screen.findByText('Output resolution preview')).toBeInTheDocument();
    expect(screen.getByText('Base PDF (72 DPI points)')).toBeInTheDocument();
    expect(screen.getByText('Selected (Maximum quality)')).toBeInTheDocument();
    expect(screen.getByText('600 x 900 px')).toBeInTheDocument();
    expect(screen.getByText('3333 x 5000 px')).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Output format'), 'jpeg');
    await user.selectOptions(screen.getByLabelText('Max dimension cap'), '3000');
    await user.selectOptions(screen.getByLabelText('Pages to convert'), 'custom');
    await user.clear(screen.getByLabelText('Custom page range'));
    await user.type(screen.getByLabelText('Custom page range'), '1');

    expect(await screen.findByText('2000 x 3000 px')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Convert and Download ZIP' }));

    const renderInput = renderPdfToImagesMock.mock.calls[0]?.[0] as
      | {
          format: string;
          maxDimensionCap: number;
          pageNumbers?: number[];
          file: File;
          onProgress?: unknown;
        }
      | undefined;

    expect(renderInput?.format).toBe('jpeg');
    expect(renderInput?.maxDimensionCap).toBe(3000);
    expect(renderInput?.pageNumbers).toEqual([1]);
    expect(renderInput?.file).toBeInstanceOf(File);
    expect(typeof renderInput?.onProgress).toBe('function');
    expect(zipImagesMock).toHaveBeenCalledTimes(1);
    expect(
      await screen.findByText('ZIP download started with 2 images.'),
    ).toBeInTheDocument();
    expect(createObjectUrlSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy).not.toHaveBeenCalled();

    createObjectUrlSpy.mockRestore();
    fetchSpy.mockRestore();
  });
});
