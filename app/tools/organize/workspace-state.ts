import type { QueuedFile } from '~/shared/tool-ui/file-queue-list';
import { markPdfQueuedFileUnavailable } from '~/shared/tool-ui/pdf-queued-file';
import { reorderListByIndex } from '~/shared/tool-ui/reorder-list-by-index';
import type {
  OrganizePageState,
  OrganizePreviewSession,
} from '~/tools/organize/models';
import { normalizeQuarterTurns } from '~/tools/organize/models';

type PaginationToken = number | 'ellipsis';

export interface OrganizeWorkspaceState {
  selectedFile: File | null;
  selectedFileEntry: QueuedFile | null;
  previewSession: OrganizePreviewSession | null;
  pageStates: OrganizePageState[];
  currentPaginationPage: number;
  isReadingPdf: boolean;
  localErrorMessage: string | null;
}

export type OrganizeWorkspaceAction =
  | { type: 'fileSelectionStarted'; file: File; entry: QueuedFile }
  | { type: 'fileDetailsLoaded'; entryId: string; details: QueuedFile }
  | { type: 'fileDetailsFailed'; entryId: string }
  | {
      type: 'previewSessionLoaded';
      entryId: string;
      previewSession: OrganizePreviewSession;
    }
  | { type: 'previewSessionFailed'; message: string }
  | { type: 'replaceFile' }
  | { type: 'localErrorCleared' }
  | { type: 'paginationPageSet'; page: number }
  | { type: 'paginationOffset'; offset: number; totalPaginationPages: number }
  | { type: 'pageSelectionToggled'; pageId: string }
  | { type: 'allPagesDeselected' }
  | { type: 'pageRotated'; pageId: string }
  | { type: 'pageRemoved'; pageId: string }
  | { type: 'pagesReordered'; sourceId: string; targetId: string }
  | { type: 'pagesMarkedLoading'; pageIds: string[] }
  | {
      type: 'pageThumbnailLoaded';
      pageId: string;
      thumbnailDataUrl: string | null;
    }
  | { type: 'pageAspectRatioLoaded'; pageId: string; aspectRatio: number }
  | { type: 'pageThumbnailUnavailable'; pageId: string };

export const initialOrganizeWorkspaceState: OrganizeWorkspaceState = {
  selectedFile: null,
  selectedFileEntry: null,
  previewSession: null,
  pageStates: [],
  currentPaginationPage: 1,
  isReadingPdf: false,
  localErrorMessage: null,
};

function reorderPagesById(
  pages: OrganizePageState[],
  sourceId: string,
  targetId: string,
): OrganizePageState[] {
  const sourceIndex = pages.findIndex((page) => page.id === sourceId);
  const targetIndex = pages.findIndex((page) => page.id === targetId);

  if (sourceIndex === -1 || targetIndex === -1) {
    return pages;
  }

  return reorderListByIndex(pages, sourceIndex, targetIndex);
}

export function buildOrganizePaginationItems(
  totalPages: number,
  currentPage: number,
): PaginationToken[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set<number>([
    1,
    totalPages,
    currentPage - 1,
    currentPage,
    currentPage + 1,
  ]);

  if (currentPage <= 3) {
    pages.add(2);
    pages.add(3);
  }

  if (currentPage >= totalPages - 2) {
    pages.add(totalPages - 1);
    pages.add(totalPages - 2);
  }

  const sortedPages = [...pages]
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);

  const items: PaginationToken[] = [];

  for (const [index, page] of sortedPages.entries()) {
    const previous = sortedPages[index - 1];
    if (previous && page - previous > 1) {
      items.push('ellipsis');
    }

    items.push(page);
  }

  return items;
}

export function getOrganizeVisiblePageRangeLabel(
  currentPage: number,
  pageSize: number,
  totalPages: number,
): string {
  if (totalPages < 1) {
    return 'No pages available';
  }

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(start + pageSize - 1, totalPages);
  return `Showing pages ${String(start)}-${String(end)} of ${String(totalPages)}`;
}

function createOrganizePageStates(pageCount: number): OrganizePageState[] {
  return Array.from({ length: pageCount }, (_, index) => ({
    id: `page-${String(index + 1)}`,
    sourcePageNumber: index + 1,
    rotationQuarterTurns: 0,
    aspectRatio: 3 / 4,
    isDeleted: false,
    thumbnailDataUrl: null,
    thumbnailStatus: 'idle' as const,
  }));
}

export function organizeWorkspaceReducer(
  state: OrganizeWorkspaceState,
  action: OrganizeWorkspaceAction,
): OrganizeWorkspaceState {
  switch (action.type) {
    case 'fileSelectionStarted':
      return {
        ...state,
        selectedFile: action.file,
        selectedFileEntry: action.entry,
        previewSession: null,
        pageStates: [],
        currentPaginationPage: 1,
        isReadingPdf: true,
        localErrorMessage: null,
      };
    case 'fileDetailsLoaded':
      return {
        ...state,
        selectedFileEntry:
          state.selectedFileEntry?.id === action.entryId
            ? action.details
            : state.selectedFileEntry,
      };
    case 'fileDetailsFailed':
      return {
        ...state,
        selectedFileEntry:
          state.selectedFileEntry?.id === action.entryId
            ? markPdfQueuedFileUnavailable(state.selectedFileEntry)
            : state.selectedFileEntry,
      };
    case 'previewSessionLoaded':
      return {
        ...state,
        previewSession: action.previewSession,
        selectedFileEntry:
          state.selectedFileEntry?.id === action.entryId
            ? {
                ...state.selectedFileEntry,
                pageCount: action.previewSession.pageCount,
              }
            : state.selectedFileEntry,
        pageStates: createOrganizePageStates(action.previewSession.pageCount),
        currentPaginationPage: 1,
        isReadingPdf: false,
      };
    case 'previewSessionFailed':
      return {
        ...initialOrganizeWorkspaceState,
        localErrorMessage: action.message,
      };
    case 'replaceFile':
      return {
        ...initialOrganizeWorkspaceState,
      };
    case 'localErrorCleared':
      return {
        ...state,
        localErrorMessage: null,
      };
    case 'paginationPageSet':
      return {
        ...state,
        currentPaginationPage: action.page,
      };
    case 'paginationOffset': {
      const nextPage = Math.min(
        Math.max(state.currentPaginationPage + action.offset, 1),
        action.totalPaginationPages,
      );

      return {
        ...state,
        currentPaginationPage: nextPage,
      };
    }
    case 'pageSelectionToggled':
      return {
        ...state,
        localErrorMessage: null,
        pageStates: state.pageStates.map((page) =>
          page.id === action.pageId
            ? {
                ...page,
                isDeleted: !page.isDeleted,
              }
            : page,
        ),
      };
    case 'allPagesDeselected':
      return {
        ...state,
        localErrorMessage: null,
        pageStates: state.pageStates.map((page) => ({
          ...page,
          isDeleted: true,
        })),
      };
    case 'pageRotated':
      return {
        ...state,
        localErrorMessage: null,
        pageStates: state.pageStates.map((page) =>
          page.id === action.pageId
            ? {
                ...page,
                rotationQuarterTurns: normalizeQuarterTurns(
                  page.rotationQuarterTurns + 1,
                ),
              }
            : page,
        ),
      };
    case 'pageRemoved':
      return {
        ...state,
        localErrorMessage: null,
        pageStates: state.pageStates.map((page) =>
          page.id === action.pageId
            ? {
                ...page,
                isDeleted: true,
              }
            : page,
        ),
      };
    case 'pagesReordered':
      return {
        ...state,
        localErrorMessage: null,
        pageStates: reorderPagesById(
          state.pageStates,
          action.sourceId,
          action.targetId,
        ),
      };
    case 'pagesMarkedLoading': {
      const targetIds = new Set(action.pageIds);
      if (targetIds.size < 1) {
        return state;
      }

      return {
        ...state,
        pageStates: state.pageStates.map((page) =>
          targetIds.has(page.id)
            ? {
                ...page,
                thumbnailStatus: 'loading',
              }
            : page,
        ),
      };
    }
    case 'pageThumbnailLoaded':
      return {
        ...state,
        pageStates: state.pageStates.map((page) =>
          page.id === action.pageId
            ? {
                ...page,
                thumbnailStatus: action.thumbnailDataUrl
                  ? 'ready'
                  : 'unavailable',
                thumbnailDataUrl: action.thumbnailDataUrl,
              }
            : page,
        ),
      };
    case 'pageAspectRatioLoaded':
      return {
        ...state,
        pageStates: state.pageStates.map((page) =>
          page.id === action.pageId
            ? {
                ...page,
                aspectRatio: action.aspectRatio,
              }
            : page,
        ),
      };
    case 'pageThumbnailUnavailable':
      return {
        ...state,
        pageStates: state.pageStates.map((page) =>
          page.id === action.pageId
            ? {
                ...page,
                thumbnailStatus: 'unavailable',
                thumbnailDataUrl: null,
              }
            : page,
        ),
      };
    default:
      return state;
  }
}
