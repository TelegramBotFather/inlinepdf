import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  appendFileQueueEntries,
  removeFileQueueEntryById,
  reorderFileQueueEntriesById,
  updateFileQueueEntryById,
  useFileQueueState,
} from '~/shared/tool-ui/file-queue-state';

describe('file queue state helpers', () => {
  it('appends and updates entries by id', () => {
    const appended = appendFileQueueEntries(
      [{ id: 'a', value: 1 }],
      [{ id: 'b', value: 2 }],
    );

    const updated = updateFileQueueEntryById(appended, 'b', (entry) => ({
      ...entry,
      value: 3,
    }));

    expect(updated).toEqual([
      { id: 'a', value: 1 },
      { id: 'b', value: 3 },
    ]);
  });

  it('reorders and removes entries by id', () => {
    const reordered = reorderFileQueueEntriesById(
      [
        { id: 'a', value: 1 },
        { id: 'b', value: 2 },
        { id: 'c', value: 3 },
      ],
      'a',
      'c',
    );

    expect(reordered.map((entry) => entry.id)).toEqual(['b', 'c', 'a']);

    const removed = removeFileQueueEntryById(reordered, 'c');

    expect(removed.removedEntry?.id).toBe('c');
    expect(removed.nextEntries.map((entry) => entry.id)).toEqual(['b', 'a']);
  });

  it('updates the queue snapshot immediately for same-tick submits', () => {
    const { result } = renderHook(() =>
      useFileQueueState<{ id: string; value: number }>(),
    );

    act(() => {
      result.current.appendEntries([
        { id: 'a', value: 1 },
        { id: 'b', value: 2 },
        { id: 'c', value: 3 },
      ]);

      result.current.reorderEntries('a', 'c');

      expect(result.current.getEntriesSnapshot().map((entry) => entry.id)).toEqual(
        ['b', 'c', 'a'],
      );
    });

    expect(result.current.entries.map((entry) => entry.id)).toEqual([
      'b',
      'c',
      'a',
    ]);
  });
});
