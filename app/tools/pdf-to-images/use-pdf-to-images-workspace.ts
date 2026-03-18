import { useReducer } from 'react';
import { useFetcher } from 'react-router';

import type { clientAction } from './route';
import { readPdfDetails } from '~/platform/pdf/read-pdf-details';
import {
  applyPdfDetailsToQueuedFile,
  createLoadingPdfQueuedFile,
} from '~/shared/tool-ui/pdf-queued-file';
import { submitClientAction } from '~/shared/tool-ui/submit-client-action';
import {
  useDeferredDispatch,
  useLatestAsyncId,
} from '~/shared/tool-ui/use-latest-async';
import type { PdfToImagesState } from '~/tools/pdf-to-images/workspace-state';
import {
  initialPdfToImagesState,
  pdfToImagesReducer,
} from '~/tools/pdf-to-images/workspace-state';
import { readPdfImageBaseResolution } from '~/tools/pdf-to-images/service/render-pdf-to-images';

import {
  calculateResolutionInfo,
  parsePageRangeInput,
} from './use-cases/convert-pdf-to-images';

export function getPdfToImagesViewModel(args: {
  state: PdfToImagesState;
  isConverting: boolean;
  actionErrorMessage: string | null;
  successMessage: string | null;
}) {
  const { state, isConverting, actionErrorMessage, successMessage } = args;

  const hasSelectedFile = !!state.selectedFileEntry;
  const resolutionInfo = state.baseResolution
    ? calculateResolutionInfo(state.baseResolution, state.maxDimensionCap)
    : null;
  const selectedPageCount = (() => {
    if (!state.baseResolution) {
      return null;
    }

    if (state.pageRangeMode === 'all') {
      return state.baseResolution.pageCount;
    }

    try {
      return parsePageRangeInput(
        state.pageRangeInput,
        state.baseResolution.pageCount,
      ).length;
    } catch {
      return null;
    }
  })();
  const hasValidPageRange =
    state.pageRangeMode === 'all' || selectedPageCount !== null;
  const canConvert =
    hasSelectedFile &&
    !!state.baseResolution &&
    hasValidPageRange &&
    !isConverting;
  const errorMessage = state.localErrorMessage ?? actionErrorMessage;

  return {
    canConvert,
    errorMessage,
    hasSelectedFile,
    resolutionInfo,
    selectedPageCount,
    successMessage,
  };
}

export function usePdfToImagesWorkspace() {
  const fetcher = useFetcher<typeof clientAction>();
  const activeSelection = useLatestAsyncId<string>();
  const [state, dispatch] = useReducer(
    pdfToImagesReducer,
    initialPdfToImagesState,
  );
  const dispatchDeferred = useDeferredDispatch(dispatch);
  const isConverting = fetcher.state !== 'idle';
  const actionErrorMessage =
    fetcher.data && !fetcher.data.ok ? fetcher.data.message : null;
  const successMessage = fetcher.data?.ok ? fetcher.data.message : null;
  const viewModel = getPdfToImagesViewModel({
    state,
    isConverting,
    actionErrorMessage,
    successMessage,
  });

  const handleFileSelection = (file: File) => {
    const entry = createLoadingPdfQueuedFile(file);
    const entryId = entry.id;
    activeSelection.activate(entryId);

    dispatch({
      type: 'fileSelected',
      entry,
    });

    void readPdfDetails(file)
      .then((details) => {
        if (!activeSelection.isActive(entryId)) {
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
        if (!activeSelection.isActive(entryId)) {
          return;
        }

        dispatchDeferred({ type: 'fileDetailsFailed', entryId });
      });

    void readPdfImageBaseResolution(file)
      .then((baseResolution) => {
        if (!activeSelection.isActive(entryId)) {
          return;
        }

        dispatchDeferred({
          type: 'baseResolutionLoaded',
          entryId,
          baseResolution,
        });
      })
      .catch((error: unknown) => {
        if (!activeSelection.isActive(entryId)) {
          return;
        }

        const fallback = 'Unable to read PDF resolution.';
        dispatchDeferred({
          type: 'baseResolutionFailed',
          message: error instanceof Error ? error.message : fallback,
        });
      })
      .finally(() => {
        if (activeSelection.isActive(entryId)) {
          dispatchDeferred({ type: 'readingFinished' });
        }
      });
  };

  const handleClearSelection = () => {
    if (isConverting) {
      return;
    }

    activeSelection.clear();
    dispatch({ type: 'selectionCleared' });
  };

  const handleConvert = () => {
    if (!state.selectedFileEntry || !state.baseResolution) {
      return;
    }

    dispatch({ type: 'localErrorCleared' });

    const selectedPageNumbers =
      state.pageRangeMode === 'all'
        ? undefined
        : parsePageRangeInput(
            state.pageRangeInput,
            state.baseResolution.pageCount,
          );

    const payload = {
      file: state.selectedFileEntry.file,
      format: state.format,
      maxDimensionCap: state.maxDimensionCap,
      pageNumbers: selectedPageNumbers,
    };
    const selectedFile = state.selectedFileEntry.file;

    submitClientAction({
      fetcher,
      payload,
      writeFormData(formData) {
        formData.set('file', selectedFile);
        formData.set('format', state.format);
        formData.set('maxDimensionCap', String(state.maxDimensionCap));
        if (selectedPageNumbers) {
          formData.set('pageNumbers', JSON.stringify(selectedPageNumbers));
        }
      },
    });
  };

  return {
    ...viewModel,
    format: state.format,
    isConverting,
    isReadingResolution: state.isReadingResolution,
    maxDimensionCap: state.maxDimensionCap,
    pageRangeInput: state.pageRangeInput,
    pageRangeMode: state.pageRangeMode,
    selectedFileEntry: state.selectedFileEntry,
    changeFormat(format: PdfToImagesState['format']) {
      dispatch({ type: 'formatChanged', format });
    },
    changeMaxDimensionCap(maxDimensionCap: PdfToImagesState['maxDimensionCap']) {
      dispatch({ type: 'maxDimensionCapChanged', maxDimensionCap });
    },
    changePageRangeInput(value: string) {
      dispatch({ type: 'pageRangeInputChanged', value });
    },
    changePageRangeMode(pageRangeMode: PdfToImagesState['pageRangeMode']) {
      dispatch({ type: 'pageRangeModeChanged', pageRangeMode });
    },
    handleClearSelection,
    handleConvert,
    handleFileSelection,
  };
}
