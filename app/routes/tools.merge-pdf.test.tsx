import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PDFDocument } from 'pdf-lib';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import MergePdfRoute from '~/routes/tools.merge-pdf';

async function createPdfFile(name: string, pageWidth = 200): Promise<File> {
  const doc = await PDFDocument.create();
  doc.addPage([pageWidth, 200]);
  const bytes = await doc.save();
  const normalizedBytes = new Uint8Array(bytes.byteLength);
  normalizedBytes.set(bytes);
  return new File([normalizedBytes.buffer], name, { type: 'application/pdf' });
}

function renderMergeRoute() {
  return render(
    <MemoryRouter initialEntries={['/merge']}>
      <Routes>
        <Route path="/merge" element={<MergePdfRoute />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('MergePdfRoute', () => {
  it('enables merge only when at least two files are selected', async () => {
    const user = userEvent.setup();
    renderMergeRoute();

    const mergeButton = screen.getByRole('button', {
      name: 'Merge and Download',
    });
    expect(mergeButton).toBeDisabled();

    const selectorInput = screen.getByLabelText('Select PDF files');
    const fileA = await createPdfFile('one.pdf');
    const fileB = await createPdfFile('two.pdf');

    await user.upload(selectorInput, [fileA, fileB]);

    expect(mergeButton).toBeEnabled();
  });

  it('supports reorder and remove actions', async () => {
    const user = userEvent.setup();
    renderMergeRoute();

    const selectorInput = screen.getByLabelText('Select PDF files');
    const firstFile = await createPdfFile('first.pdf', 111);
    const secondFile = await createPdfFile('second.pdf', 222);

    await user.upload(selectorInput, [firstFile, secondFile]);

    await user.click(
      screen.getByRole('button', { name: 'Move second.pdf up' }),
    );

    const itemsAfterMove = screen.getAllByTestId('merge-file-item');
    const firstItem = itemsAfterMove[0];
    expect(firstItem).toBeDefined();
    expect(within(firstItem).getByText(/second\.pdf/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Remove second.pdf' }));

    expect(screen.queryByText(/second\.pdf/)).not.toBeInTheDocument();
  });

  it('handles full merge workflow without network requests', async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const createObjectUrlSpy = vi.spyOn(URL, 'createObjectURL');

    renderMergeRoute();

    const selectorInput = screen.getByLabelText('Select PDF files');
    const alpha = await createPdfFile('alpha.pdf', 120);
    const beta = await createPdfFile('beta.pdf', 180);

    await user.upload(selectorInput, [alpha, beta]);
    await user.click(screen.getByRole('button', { name: 'Move beta.pdf up' }));
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
