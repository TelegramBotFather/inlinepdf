import type { ReactNode } from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  lastDragEnd:
    null as
      | ((event: { canceled?: boolean; operation: unknown }) => void)
      | null,
}));

vi.mock('~/components/dnd/csp-drag-drop-provider', () => ({
  CspDragDropProvider({
    children,
    onDragEnd,
  }: {
    children: ReactNode;
    onDragEnd?: (event: { canceled?: boolean; operation: unknown }) => void;
  }) {
    state.lastDragEnd = onDragEnd ?? null;
    return children;
  },
}));

vi.mock('@dnd-kit/react/sortable', () => ({
  useSortable: () => ({
    ref: vi.fn(),
    isDragging: false,
  }),
}));

import { FileQueueList } from './file-queue-list';

describe('FileQueueList', () => {
  it('reorders files when drag end only exposes the projected sortable index', () => {
    const onReorder = vi.fn();

    render(
      <FileQueueList
        files={[
          {
            id: 'a',
            file: new File(['a'], 'a.pdf', { type: 'application/pdf' }),
            pageCount: 1,
            previewDataUrl: null,
            previewStatus: 'ready',
          },
          {
            id: 'b',
            file: new File(['b'], 'b.pdf', { type: 'application/pdf' }),
            pageCount: 1,
            previewDataUrl: null,
            previewStatus: 'ready',
          },
        ]}
        onReorder={onReorder}
      />,
    );

    state.lastDragEnd?.({
      canceled: false,
      operation: {
        source: {
          id: 'a',
          sortable: {
            index: 1,
          },
        },
      },
    });

    expect(onReorder).toHaveBeenCalledWith('a', 'b');
  });
});
