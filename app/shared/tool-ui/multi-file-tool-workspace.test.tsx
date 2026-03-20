import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { MultiFileToolWorkspace } from '~/shared/tool-ui/multi-file-tool-workspace';

describe('MultiFileToolWorkspace', () => {
  it('renders the empty state when there are no files', () => {
    render(
      <MultiFileToolWorkspace
        title="Merge PDF"
        description="Combine files."
        files={[]}
        isBusy={false}
        emptyState={<div>Empty selector</div>}
      />,
    );

    expect(screen.getByText('Empty selector')).toBeInTheDocument();
  });

  it('renders the file queue and clear-all control when files are present', () => {
    render(
      <MultiFileToolWorkspace
        title="Merge PDF"
        description="Combine files."
        files={[
          {
            id: 'file-1',
            file: new File(['pdf'], 'one.pdf', { type: 'application/pdf' }),
            pageCount: 2,
            previewDataUrl: null,
            previewStatus: 'ready',
          },
        ]}
        isBusy={false}
        emptyState={<div>Empty selector</div>}
        onClearAll={vi.fn()}
      />,
    );

    expect(screen.getByText('one.pdf')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Clear Files' }),
    ).toBeInTheDocument();
  });
});
