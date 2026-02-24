import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import ToolDetailRoute, { loader as toolLoader } from '~/routes/tools.$toolSlug';

const convertImagesToPdfMock = vi.hoisted(() => vi.fn());
const readImageDimensionsMock = vi.hoisted(() => vi.fn());
const isSupportedImageFileMock = vi.hoisted(() => vi.fn(() => true));

vi.mock('~/features/image-to-pdf/service/convert-images-to-pdf', () => ({
  convertImagesToPdf: convertImagesToPdfMock,
  readImageDimensions: readImageDimensionsMock,
  isSupportedImageFile: isSupportedImageFileMock,
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
    { initialEntries: ['/image-to-pdf'] },
  );

  return render(<RouterProvider router={router} />);
}

afterEach(() => {
  convertImagesToPdfMock.mockReset();
  readImageDimensionsMock.mockReset();
  isSupportedImageFileMock.mockReset();
  isSupportedImageFileMock.mockImplementation(() => true);
});

describe('image to PDF tool route', () => {
  it('renders previews, quality options, compression note, and downloads output', async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const createObjectUrlSpy = vi.spyOn(URL, 'createObjectURL');

    readImageDimensionsMock
      .mockResolvedValueOnce({ width: 1200, height: 800 })
      .mockResolvedValueOnce({ width: 800, height: 1200 });
    convertImagesToPdfMock.mockImplementation(
      ({
        files,
        onProgress,
      }: {
        files: File[];
        onProgress?: (value: {
          currentFile: number;
          totalFiles: number;
          fileName: string;
        }) => void;
      }) => {
        onProgress?.({
          currentFile: 1,
          totalFiles: files.length,
          fileName: files[0]?.name ?? 'image.jpg',
        });

        return Promise.resolve({
          blob: new Blob(['%PDF-1.4'], { type: 'application/pdf' }),
          fileName: 'images.pdf',
          pagesExported: files.length,
        });
      },
    );

    renderRoute();
    await screen.findByText('Drag and drop image files', undefined, {
      timeout: 5000,
    });

    const first = new File(['a'], 'first.jpg', { type: 'image/jpeg' });
    const second = new File(['b'], 'second.png', { type: 'image/png' });
    await user.upload(await screen.findByLabelText('Select image files'), [
      first,
      second,
    ]);

    expect(await screen.findByText('first.jpg')).toBeInTheDocument();
    expect(screen.getByText('second.png')).toBeInTheDocument();
    expect(screen.getByText('1200 x 800 px')).toBeInTheDocument();
    expect(screen.getByText('800 x 1200 px')).toBeInTheDocument();
    expect(screen.getByLabelText('PDF quality')).toHaveValue('medium');
    expect(
      screen.getByText(/PNG files stay PNG in the PDF \(lossless format\)/),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Convert and Download' }));

    const runInput = convertImagesToPdfMock.mock.calls[0]?.[0] as
      | {
          files: File[];
          quality: string;
          onProgress?: unknown;
        }
      | undefined;

    expect(runInput?.quality).toBe('medium');
    expect(runInput?.files).toHaveLength(2);
    expect(runInput?.files.map((file) => file.name)).toEqual([
      'first.jpg',
      'second.png',
    ]);
    expect(typeof runInput?.onProgress).toBe('function');
    expect(
      await screen.findByText('PDF download started with 2 pages.'),
    ).toBeInTheDocument();
    expect(createObjectUrlSpy).toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();

    fetchSpy.mockRestore();
    createObjectUrlSpy.mockRestore();
  });
});
