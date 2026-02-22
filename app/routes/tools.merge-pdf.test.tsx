import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PDFDocument } from 'pdf-lib';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import ToolDetailRoute, { loader as toolLoader } from '~/routes/tools.$toolSlug';

async function createPdfFile(name: string, pageWidth = 200): Promise<File> {
  const doc = await PDFDocument.create();
  doc.addPage([pageWidth, 200]);
  const bytes = await doc.save();
  const normalizedBytes = new Uint8Array(bytes.byteLength);
  normalizedBytes.set(bytes);
  return new File([normalizedBytes.buffer], name, { type: 'application/pdf' });
}

function renderMergeRoute() {
  const router = createMemoryRouter(
    [
      {
        path: '/:toolSlug',
        loader: toolLoader,
        element: <ToolDetailRoute />,
      },
    ],
    { initialEntries: ['/merge'] },
  );

  return render(
    <RouterProvider router={router} />,
  );
}

async function waitForMergeToolReady() {
  await screen.findByLabelText('Select PDF files', undefined, {
    timeout: 5000,
  });
}

describe('Merge tool route', () => {
  it('shows bottom actions after first file and enables merge at two files', async () => {
    const user = userEvent.setup();
    renderMergeRoute();
    await waitForMergeToolReady();

    expect(
      screen.queryByRole('button', { name: 'Merge and Download' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('No files selected yet.')).not.toBeInTheDocument();

    const selectorInput = await screen.findByLabelText('Select PDF files');
    const fileA = await createPdfFile('one.pdf');
    await user.upload(selectorInput, fileA);

    expect(await screen.findByRole('button', { name: 'Merge and Download' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Clear all' })).toBeEnabled();

    const inlineSelector = await screen.findByLabelText('Select PDF files');
    const fileB = await createPdfFile('two.pdf');
    await user.upload(inlineSelector, fileB);

    expect(
      await screen.findByRole('button', { name: 'Merge and Download' }),
    ).toBeEnabled();
  });

  it('renders selected files in rows with remove action and page details', async () => {
    const user = userEvent.setup();
    renderMergeRoute();
    await waitForMergeToolReady();

    const selectorInput = await screen.findByLabelText('Select PDF files');
    const firstFile = await createPdfFile('first.pdf', 111);
    const secondFile = await createPdfFile('second.pdf', 222);

    await user.upload(selectorInput, [firstFile, secondFile]);

    expect(screen.getByText(/first\.pdf/)).toBeInTheDocument();
    expect(screen.getByText(/second\.pdf/)).toBeInTheDocument();
    expect((await screen.findAllByText('1 page')).length).toBe(2);
    expect(
      screen.queryByRole('button', { name: 'Move second.pdf up' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Move second.pdf down' }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Remove second.pdf' }));

    expect(screen.queryByText(/second\.pdf/)).not.toBeInTheDocument();
  });

  it('handles full merge workflow without network requests', async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const createObjectUrlSpy = vi.spyOn(URL, 'createObjectURL');

    renderMergeRoute();
    await waitForMergeToolReady();

    const selectorInput = await screen.findByLabelText('Select PDF files');
    const alpha = await createPdfFile('alpha.pdf', 120);
    const beta = await createPdfFile('beta.pdf', 180);

    await user.upload(selectorInput, [alpha, beta]);
    await user.click(
      screen.getByRole('button', { name: 'Merge and Download' }),
    );

    expect(
      await screen.findByText('Merged PDF is ready and download has started.'),
    ).toBeInTheDocument();
    expect(createObjectUrlSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy).not.toHaveBeenCalled();

    fetchSpy.mockRestore();
    createObjectUrlSpy.mockRestore();
  });
});
