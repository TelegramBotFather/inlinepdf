import { useState } from 'react';
import { useFetcher } from 'react-router';

import type { ToolActionResult } from './action-result';
import { useSinglePdfQueuedFileSelection } from './pdf-queued-file';
import { submitClientAction } from './submit-client-action';

interface SubmitOnSelectConfig<TPayload> {
  buildPayload: (file: File) => TPayload;
  writeFormData: (formData: FormData, file: File) => void;
}

export function useSinglePdfActionWorkspace<
  TResult,
  TPayload = never,
>(options?: { submitOnSelect?: SubmitOnSelectConfig<TPayload> }) {
  const fetcher = useFetcher<ToolActionResult<TResult>>();
  const [localErrorMessage, setLocalErrorMessage] = useState<string | null>(
    null,
  );
  const { selectedFileEntry, selectFile, clearSelection } =
    useSinglePdfQueuedFileSelection();

  const isBusy = fetcher.state !== 'idle';
  const actionErrorMessage =
    fetcher.data && !fetcher.data.ok ? fetcher.data.message : null;
  const errorMessage = localErrorMessage ?? actionErrorMessage;
  const result =
    selectedFileEntry && fetcher.data?.ok
      ? (fetcher.data.result ?? null)
      : null;
  const successMessage = fetcher.data?.ok ? fetcher.data.message : null;

  function handleFileSelection(file: File) {
    selectFile(file);
    setLocalErrorMessage(null);

    if (!options?.submitOnSelect) {
      return;
    }

    submitClientAction({
      fetcher,
      payload: options.submitOnSelect.buildPayload(file),
      writeFormData(formData) {
        options.submitOnSelect?.writeFormData(formData, file);
      },
    });
  }

  function handleClearSelection() {
    if (isBusy) {
      return;
    }

    clearSelection();
    setLocalErrorMessage(null);
  }

  return {
    actionErrorMessage,
    errorMessage,
    fetcher,
    handleClearSelection,
    handleFileSelection,
    isBusy,
    localErrorMessage,
    result,
    selectedFileEntry,
    setLocalErrorMessage,
    successMessage,
  };
}
