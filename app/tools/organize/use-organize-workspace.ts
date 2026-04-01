import { useEffect, useReducer } from 'react';
import { useFetcher } from 'react-router';

import type { clientAction } from './route';
import { readPdfDetails } from '~/platform/pdf/read-pdf-details';
import type { QueuedFile } from '~/shared/tool-ui/file-queue-list';
import {
  applyPdfDetailsToQueuedFile,
  createLoadingPdfQueuedFile,
} from '~/shared/tool-ui/pdf-queued-file';
import { submitClientAction } from '~/shared/tool-ui/submit-client-action';
import {
  useDeferredDispatch,
  useLatestAsyncToken,
} from '~/shared/tool-ui/use-latest-async';
import type { OrganizePageState } from '~/tools/organize/models';
import { readOrganizePreview } from '~/tools/organize/service/read-organize-preview';
import {
  getOrganizeVisiblePageRangeLabel,
  initialOrganizeWorkspaceState,
  organizeWorkspaceReducer,
} from '~/tools/organize/workspace-state';

const PAGES_PER_VIEW = 12;

export function getOrganizePagesToLoadForThumbnailPrefetch(args: {
  pageStates: OrganizePageState[];
  currentPaginationPage: number;
  totalPaginationPages: number;
  pagesPerView?: number;
}): OrganizePageState[] {
  const {
    pageStates,
    currentPaginationPage,
    totalPaginationPages,
    pagesPerView = PAGES_PER_VIEW,
  } = args;

  const targetPageNumbers = new Set<number>();

  for (const pageOffset of [-1, 0, 1]) {
    const paginationPage = currentPaginationPage + pageOffset;
    if (paginationPage < 1 || paginationPage > totalPaginationPages) {
      continue;
    }

    const rangeStart = (paginationPage - 1) * pagesPerView;
    const rangeEnd = rangeStart + pagesPerView;
    const pagesInRange = pageStates.slice(rangeStart, rangeEnd);

    for (const page of pagesInRange) {
      targetPageNumbers.add(page.sourcePageNumber);
    }
  }

  return pageStates.filter(
    (page) =>
      targetPageNumbers.has(page.sourcePageNumber) &&
      page.thumbnailStatus === 'idle',
  );
}

export function buildOrganizeFileInfoEntry(args: {
  selectedFile: File;
  selectedFileEntry: QueuedFile | null;
  pageStates: OrganizePageState[];
  isReadingPdf: boolean;
}): QueuedFile {
  const { selectedFile, selectedFileEntry, pageStates, isReadingPdf } = args;

  return (
    selectedFileEntry ?? {
      id: 'organize-file-fallback',
      file: selectedFile,
      pageCount: pageStates.length > 0 ? pageStates.length : null,
      previewDataUrl: null,
      previewStatus: isReadingPdf ? 'loading' : 'unavailable',
    }
  );
}

export function useOrganizeWorkspace() {
  const fetcher = useFetcher<typeof clientAction>();
  const selection = useLatestAsyncToken();
  const [state, dispatch] = useReducer(
    organizeWorkspaceReducer,
    initialOrganizeWorkspaceState,
  );
  const isExporting = fetcher.state !== 'idle';

  const selectedPageCount = state.pageStates.filter(
    (page) => !page.isDeleted,
  ).length;
  const excludedPageCount = state.pageStates.length - selectedPageCount;
  const totalPaginationPages = Math.max(
    1,
    Math.ceil(state.pageStates.length / PAGES_PER_VIEW),
  );
  const startIndex = (state.currentPaginationPage - 1) * PAGES_PER_VIEW;
  const visiblePages = state.pageStates.slice(
    startIndex,
    startIndex + PAGES_PER_VIEW,
  );
  const canExport =
    !!state.selectedFile &&
    selectedPageCount > 0 &&
    state.pageStates.length > 0 &&
    !isExporting &&
    !state.isReadingPdf;
  const actionErrorMessage =
    fetcher.data && !fetcher.data.ok ? fetcher.data.message : null;
  const errorMessage = state.localErrorMessage ?? actionErrorMessage;
  const successMessage = fetcher.data?.ok ? fetcher.data.message : null;
  const fileInfoEntry = state.selectedFile
    ? buildOrganizeFileInfoEntry({
        selectedFile: state.selectedFile,
        selectedFileEntry: state.selectedFileEntry,
        pageStates: state.pageStates,
        isReadingPdf: state.isReadingPdf,
      })
    : null;
  const isLoadingPreview =
    state.isReadingPdf || !state.previewSession || state.pageStates.length < 1;
  const visibleRangeLabel = getOrganizeVisiblePageRangeLabel(
    state.currentPaginationPage,
    PAGES_PER_VIEW,
    state.pageStates.length,
  );

  const dispatchDeferred = useDeferredDispatch(dispatch);
  const dispatchDeferredFromEffect = useDeferredDispatch(dispatch);

  useEffect(() => {
    return () => {
      if (state.previewSession) {
        void state.previewSession.destroy();
      }
    };
  }, [state.previewSession]);

  useEffect(() => {
    if (!state.previewSession || state.pageStates.length < 1) {
      return;
    }

    const pagesToLoad = getOrganizePagesToLoadForThumbnailPrefetch({
      pageStates: state.pageStates,
      currentPaginationPage: state.currentPaginationPage,
      totalPaginationPages,
    });

    if (pagesToLoad.length < 1) {
      return;
    }

    const activeSelectionToken = selection.current();
    dispatchDeferredFromEffect({
      type: 'pagesMarkedLoading',
      pageIds: pagesToLoad.map((page) => page.id),
    });

    for (const page of pagesToLoad) {
      void state.previewSession
        .getPageAspectRatio(page.sourcePageNumber)
        .then((aspectRatio) => {
          if (!selection.isCurrent(activeSelectionToken)) {
            return;
          }

          dispatchDeferredFromEffect({
            type: 'pageAspectRatioLoaded',
            pageId: page.id,
            aspectRatio,
          });
        })
        .catch(() => {
          if (!selection.isCurrent(activeSelectionToken)) {
            return;
          }
        });

      void state.previewSession
        .getPageThumbnail(page.sourcePageNumber)
        .then((thumbnailDataUrl) => {
          if (!selection.isCurrent(activeSelectionToken)) {
            return;
          }

          dispatchDeferredFromEffect({
            type: 'pageThumbnailLoaded',
            pageId: page.id,
            thumbnailDataUrl,
          });
        })
        .catch(() => {
          if (!selection.isCurrent(activeSelectionToken)) {
            return;
          }

          dispatchDeferredFromEffect({
            type: 'pageThumbnailUnavailable',
            pageId: page.id,
          });
        });
    }
  }, [
    dispatchDeferredFromEffect,
    selection,
    state.currentPaginationPage,
    state.pageStates,
    state.previewSession,
    totalPaginationPages,
  ]);

  async function handleFileSelected(file: File) {
    const selectionToken = selection.begin();
    const entry = createLoadingPdfQueuedFile(file);
    const entryId = entry.id;

    dispatch({ type: 'fileSelectionStarted', file, entry });

    void readPdfDetails(file)
      .then((details) => {
        if (!selection.isCurrent(selectionToken)) {
          return;
        }

        if (details.pageCount === null) {
          dispatchDeferred({ type: 'fileDetailsFailed', entryId });
          return;
        }

        dispatchDeferred({
          type: 'fileDetailsLoaded',
          entryId,
          details: applyPdfDetailsToQueuedFile(entry, details),
        });
      })
      .catch(() => {
        if (!selection.isCurrent(selectionToken)) {
          return;
        }

        dispatchDeferred({ type: 'fileDetailsFailed', entryId });
      });

    try {
      const nextPreviewSession = await readOrganizePreview(file);

      if (!selection.isCurrent(selectionToken)) {
        await nextPreviewSession.destroy();
        return;
      }

      if (nextPreviewSession.pageCount < 1) {
        await nextPreviewSession.destroy();
        throw new Error('This PDF has no pages to organize.');
      }

      dispatchDeferred({
        type: 'previewSessionLoaded',
        entryId,
        previewSession: nextPreviewSession,
      });
    } catch (error: unknown) {
      if (!selection.isCurrent(selectionToken)) {
        return;
      }

      const fallback = 'Unable to read PDF pages.';
      dispatchDeferred({
        type: 'previewSessionFailed',
        message: error instanceof Error ? error.message : fallback,
      });
    }
  }

  function handleReplaceFile() {
    if (state.isReadingPdf || isExporting) {
      return;
    }

    selection.invalidate();
    dispatch({ type: 'replaceFile' });
  }

  function handleExport() {
    if (!state.selectedFile) {
      return;
    }

    dispatch({ type: 'localErrorCleared' });
    const selectedFile = state.selectedFile;

    submitClientAction({
      fetcher,
      payload: {
        file: selectedFile,
        pages: state.pageStates,
      },
      writeFormData(formData) {
        formData.set('file', selectedFile);
        formData.set('pages', JSON.stringify(state.pageStates));
      },
    });
  }

  return {
    canExport,
    currentPaginationPage: state.currentPaginationPage,
    dispatch,
    errorMessage,
    excludedPageCount,
    fileInfoEntry,
    handleExport,
    handleFileSelected,
    handleReplaceFile,
    isExporting,
    isLoadingPreview,
    isReadingPdf: state.isReadingPdf,
    selectedFile: state.selectedFile,
    selectedPageCount,
    startIndex,
    successMessage,
    totalPaginationPages,
    visiblePages,
    visibleRangeLabel,
    goToPage(page: number) {
      dispatchDeferred({ type: 'paginationPageSet', page });
    },
    goToPreviousPage() {
      dispatchDeferred({
        type: 'paginationOffset',
        offset: -1,
        totalPaginationPages,
      });
    },
    goToNextPage() {
      dispatchDeferred({
        type: 'paginationOffset',
        offset: 1,
        totalPaginationPages,
      });
    },
    reorderPages(sourceId: string, targetId: string) {
      dispatch({ type: 'pagesReordered', sourceId, targetId });
    },
    togglePageSelected(pageId: string) {
      dispatch({ type: 'pageSelectionToggled', pageId });
    },
    deselectAllPages() {
      dispatch({ type: 'allPagesDeselected' });
    },
    rotatePage(pageId: string) {
      dispatch({ type: 'pageRotated', pageId });
    },
    removePage(pageId: string) {
      dispatch({ type: 'pageRemoved', pageId });
    },
  };
}
