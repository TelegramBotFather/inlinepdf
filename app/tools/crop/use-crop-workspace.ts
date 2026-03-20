import { useFetcher } from 'react-router';
import { useReducer } from 'react';

import type { clientAction } from './route';
import { submitClientAction } from '~/shared/tool-ui/submit-client-action';
import { useLatestAsyncToken } from '~/shared/tool-ui/use-latest-async';
import { hasValidRect } from '~/tools/crop/domain/coordinate-math';
import type { NormalizedRect } from '~/tools/crop/models';
import {
  cropWorkspaceReducer,
  initialCropWorkspaceState,
  type CropWorkspaceState,
} from '~/tools/crop/workspace-state';

import { readPdfPages } from './use-cases/read-pdf-pages';

type CropExportMode = 'current' | 'allWithOriginalOthers';

export function getCropWorkspaceViewModel(args: {
  state: CropWorkspaceState;
  isExporting: boolean;
  actionErrorMessage: string | null;
  successMessage: string | null;
}) {
  const { state, isExporting, actionErrorMessage, successMessage } = args;

  const totalPages = state.documentPreview?.pageCount ?? 0;
  const activePageNumber = state.activePageNumber;
  const hasActivePage = activePageNumber !== null && activePageNumber >= 1;
  const activeCropRect =
    activePageNumber === null
      ? null
      : (state.pageCrops[activePageNumber] ?? null);
  const canGoPrevious = activePageNumber !== null && activePageNumber > 1;
  const canGoNext = activePageNumber !== null && activePageNumber < totalPages;
  const canExport =
    !!state.selectedFile &&
    hasActivePage &&
    hasValidRect(activeCropRect) &&
    !state.isReadingPdf &&
    !isExporting;
  const canOpenExportDialog =
    !!state.selectedFile &&
    hasActivePage &&
    !state.isReadingPdf &&
    !isExporting;
  const errorMessage = state.localErrorMessage ?? actionErrorMessage;
  const isBusy = state.isReadingPdf || isExporting;

  return {
    activeCropRect,
    activePageNumber,
    canExport,
    canGoNext,
    canGoPrevious,
    canOpenExportDialog,
    errorMessage,
    hasActivePage,
    isBusy,
    isExporting,
    isReadingPdf: state.isReadingPdf,
    successMessage,
    totalPages,
  };
}

export function useCropWorkspace() {
  const fetcher = useFetcher<typeof clientAction>();
  const selection = useLatestAsyncToken();
  const [state, dispatch] = useReducer(
    cropWorkspaceReducer,
    initialCropWorkspaceState,
  );
  const isExporting = fetcher.state !== 'idle';
  const actionErrorMessage =
    fetcher.data && !fetcher.data.ok ? fetcher.data.message : null;
  const successMessage = fetcher.data?.ok ? fetcher.data.message : null;
  const viewModel = getCropWorkspaceViewModel({
    state,
    isExporting,
    actionErrorMessage,
    successMessage,
  });

  const handleFileSelected = async (file: File) => {
    const selectionToken = selection.begin();
    dispatch({ type: 'fileSelectionStarted', file });

    try {
      const preview = await readPdfPages(file);
      if (!selection.isCurrent(selectionToken)) {
        return;
      }

      if (preview.pageCount < 1) {
        throw new Error('This PDF has no pages to crop.');
      }

      dispatch({ type: 'fileSelectionSucceeded', preview });
    } catch (error: unknown) {
      if (!selection.isCurrent(selectionToken)) {
        return;
      }

      const fallback = 'Unable to read PDF pages.';
      dispatch({
        type: 'fileSelectionFailed',
        message: error instanceof Error ? error.message : fallback,
      });
    }
  };

  const submitPageJump = () => {
    const next = Number.parseInt(state.pageInputValue, 10);
    if (!Number.isFinite(next)) {
      dispatch({
        type: 'pageInputChanged',
        value: state.activePageNumber ? String(state.activePageNumber) : '1',
      });
      return;
    }

    dispatch({ type: 'pageSelected', pageNumber: next });
  };

  const handleExport = (mode: CropExportMode) => {
    if (
      !state.selectedFile ||
      !state.activePageNumber ||
      !state.documentPreview
    ) {
      return;
    }

    const cropRect = state.pageCrops[state.activePageNumber];
    if (!cropRect || !hasValidRect(cropRect)) {
      dispatch({
        type: 'localErrorSet',
        message: 'Set a valid crop area before exporting the PDF.',
      });
      return;
    }

    dispatch({ type: 'exportDialogChanged', open: false });
    dispatch({ type: 'localErrorCleared' });

    const activeCrop: NormalizedRect = cropRect;
    const payload = {
      file: state.selectedFile,
      pageNumber: state.activePageNumber,
      totalPages: state.documentPreview.pageCount,
      mode,
      cropRect: activeCrop,
    };
    const selectedFile = state.selectedFile;
    const documentPreview = state.documentPreview;
    const activePageNumber = state.activePageNumber;

    submitClientAction({
      fetcher,
      payload,
      writeFormData(formData) {
        formData.set('file', selectedFile);
        formData.set('pageNumber', String(activePageNumber));
        formData.set('totalPages', String(documentPreview.pageCount));
        formData.set('mode', mode);
        formData.set('cropRect', JSON.stringify(activeCrop));
      },
    });
  };

  return {
    ...viewModel,
    documentPreview: state.documentPreview,
    isExportDialogOpen: state.isExportDialogOpen,
    pageCrops: state.pageCrops,
    pageInputValue: state.pageInputValue,
    preset: state.preset,
    selectedFile: state.selectedFile,
    changeCrop(pageNumber: number, cropRect: NormalizedRect | null) {
      dispatch({ type: 'cropChanged', pageNumber, cropRect });
    },
    changePreset(preset: CropWorkspaceState['preset']) {
      dispatch({ type: 'presetChanged', preset });
    },
    closeOrSetExportDialog(open: boolean) {
      if (isExporting) {
        return;
      }

      dispatch({ type: 'exportDialogChanged', open });
    },
    goToNextPage() {
      if (!state.activePageNumber) {
        return;
      }

      dispatch({ type: 'pageOffsetRequested', offset: 1 });
    },
    goToPreviousPage() {
      if (!state.activePageNumber) {
        return;
      }

      dispatch({ type: 'pageOffsetRequested', offset: -1 });
    },
    handleExport,
    handleFileSelected,
    openExportDialog() {
      dispatch({ type: 'exportDialogChanged', open: true });
    },
    resetCrop() {
      dispatch({ type: 'cropReset' });
    },
    submitPageJump,
    updatePageInput(value: string) {
      dispatch({
        type: 'pageInputChanged',
        value: value.replace(/\D/g, ''),
      });
    },
  };
}
