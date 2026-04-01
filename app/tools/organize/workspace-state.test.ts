import { describe, expect, it } from 'vitest';

import type { QueuedFile } from '~/shared/tool-ui/file-queue-list';
import {
  buildOrganizePaginationItems,
  getOrganizeVisiblePageRangeLabel,
  initialOrganizeWorkspaceState,
  organizeWorkspaceReducer,
} from '~/tools/organize/workspace-state';

function createQueuedFile(overrides: Partial<QueuedFile> = {}): QueuedFile {
  return {
    id: 'file-1',
    file: new File(['pdf'], 'source.pdf', { type: 'application/pdf' }),
    pageCount: null,
    previewDataUrl: null,
    previewStatus: 'loading',
    ...overrides,
  };
}

function createPreviewSession(pageCount: number) {
  return {
    pageCount,
    getPageAspectRatio() {
      return Promise.resolve(3 / 4);
    },
    getPageThumbnail() {
      return Promise.resolve<string | null>(null);
    },
    destroy() {
      return Promise.resolve();
    },
  };
}

describe('organizeWorkspaceReducer', () => {
  it('creates page state when the preview session loads', () => {
    const selectingState = organizeWorkspaceReducer(
      initialOrganizeWorkspaceState,
      {
        type: 'fileSelectionStarted',
        file: new File(['pdf'], 'source.pdf', { type: 'application/pdf' }),
        entry: createQueuedFile(),
      },
    );

    const previewSession = createPreviewSession(3);

    const state = organizeWorkspaceReducer(selectingState, {
      type: 'previewSessionLoaded',
      entryId: 'file-1',
      previewSession,
    });

    expect(state.previewSession).toBe(previewSession);
    expect(state.pageStates.map((page) => page.sourcePageNumber)).toEqual([
      1, 2, 3,
    ]);
    expect(state.pageStates.map((page) => page.aspectRatio)).toEqual([
      3 / 4,
      3 / 4,
      3 / 4,
    ]);
    expect(state.selectedFileEntry?.pageCount).toBe(3);
    expect(state.isReadingPdf).toBe(false);
  });

  it('reorders and rotates pages through the workspace reducer', () => {
    const loadedState = organizeWorkspaceReducer(
      organizeWorkspaceReducer(initialOrganizeWorkspaceState, {
        type: 'fileSelectionStarted',
        file: new File(['pdf'], 'source.pdf', { type: 'application/pdf' }),
        entry: createQueuedFile(),
      }),
      {
        type: 'previewSessionLoaded',
        entryId: 'file-1',
        previewSession: createPreviewSession(3),
      },
    );

    const rotatedState = organizeWorkspaceReducer(loadedState, {
      type: 'pageRotated',
      pageId: 'page-1',
    });
    const reorderedState = organizeWorkspaceReducer(rotatedState, {
      type: 'pagesReordered',
      sourceId: 'page-1',
      targetId: 'page-3',
    });

    expect(rotatedState.pageStates[0]?.rotationQuarterTurns).toBe(1);
    expect(reorderedState.pageStates.map((page) => page.id)).toEqual([
      'page-2',
      'page-3',
      'page-1',
    ]);
  });

  it('deselects every page through the workspace reducer', () => {
    const loadedState = organizeWorkspaceReducer(
      organizeWorkspaceReducer(initialOrganizeWorkspaceState, {
        type: 'fileSelectionStarted',
        file: new File(['pdf'], 'source.pdf', { type: 'application/pdf' }),
        entry: createQueuedFile(),
      }),
      {
        type: 'previewSessionLoaded',
        entryId: 'file-1',
        previewSession: createPreviewSession(3),
      },
    );

    const partiallySelectedState = organizeWorkspaceReducer(loadedState, {
      type: 'pageSelectionToggled',
      pageId: 'page-2',
    });

    const deselectedState = organizeWorkspaceReducer(partiallySelectedState, {
      type: 'allPagesDeselected',
    });

    expect(deselectedState.pageStates.map((page) => page.isDeleted)).toEqual([
      true,
      true,
      true,
    ]);
  });
});

describe('organize workspace helpers', () => {
  it('builds condensed pagination tokens', () => {
    expect(buildOrganizePaginationItems(10, 5)).toEqual([
      1,
      'ellipsis',
      4,
      5,
      6,
      'ellipsis',
      10,
    ]);
  });

  it('formats the visible page range label', () => {
    expect(getOrganizeVisiblePageRangeLabel(2, 12, 26)).toBe(
      'Showing pages 13-24 of 26',
    );
  });
});
