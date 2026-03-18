import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const { readPdfDetailsMock } = vi.hoisted(() => ({
  readPdfDetailsMock: vi.fn(),
}));

vi.mock('~/platform/pdf/read-pdf-details', () => ({
  readPdfDetails: readPdfDetailsMock,
}));

import {
  applyPdfDetailsToQueuedFile,
  createLoadingPdfQueuedFile,
  markPdfQueuedFileUnavailable,
  useSinglePdfQueuedFileSelection,
} from './pdf-queued-file';

describe('pdf queued file helpers', () => {
  it('creates a loading queued file entry', () => {
    const file = new File(['pdf'], 'sample.pdf', { type: 'application/pdf' });

    expect(createLoadingPdfQueuedFile(file)).toMatchObject({
      file,
      pageCount: null,
      previewDataUrl: null,
      previewStatus: 'loading',
    });
  });

  it('applies PDF details to a queued file entry', () => {
    const entry = createLoadingPdfQueuedFile(
      new File(['pdf'], 'sample.pdf', { type: 'application/pdf' }),
    );

    expect(
      applyPdfDetailsToQueuedFile(entry, {
        pageCount: 4,
        previewDataUrl: 'data:image/png;base64,preview',
      }),
    ).toMatchObject({
      pageCount: 4,
      previewDataUrl: 'data:image/png;base64,preview',
      previewStatus: 'ready',
    });
  });

  it('marks a queued file entry as unavailable', () => {
    const entry = createLoadingPdfQueuedFile(
      new File(['pdf'], 'sample.pdf', { type: 'application/pdf' }),
    );

    expect(markPdfQueuedFileUnavailable(entry)).toMatchObject({
      previewStatus: 'unavailable',
    });
  });
});

describe('useSinglePdfQueuedFileSelection', () => {
  it('loads details for the latest selected file only', async () => {
    let resolveFirst:
      | ((value: {
          pageCount: number | null;
          previewDataUrl: string | null;
        }) => void)
      | undefined;
    let resolveSecond:
      | ((value: {
          pageCount: number | null;
          previewDataUrl: string | null;
        }) => void)
      | undefined;

    readPdfDetailsMock
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveFirst = resolve;
          }),
      )
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveSecond = resolve;
          }),
      );

    const { result } = renderHook(() => useSinglePdfQueuedFileSelection());
    const firstFile = new File(['a'], 'first.pdf', { type: 'application/pdf' });
    const secondFile = new File(['b'], 'second.pdf', {
      type: 'application/pdf',
    });

    result.current.selectFile(firstFile);
    result.current.selectFile(secondFile);

    resolveFirst?.({ pageCount: 1, previewDataUrl: 'data:first' });
    resolveSecond?.({ pageCount: 2, previewDataUrl: 'data:second' });

    await waitFor(() => {
      expect(result.current.selectedFileEntry).toMatchObject({
        file: secondFile,
        pageCount: 2,
        previewDataUrl: 'data:second',
        previewStatus: 'ready',
      });
    });
  });
});
