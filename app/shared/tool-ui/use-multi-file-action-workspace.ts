import { useState } from 'react';
import { useFetcher } from 'react-router';

import type { ToolActionResult } from './action-result';
import { submitClientAction } from './submit-client-action';
import { useFileQueueState } from './file-queue-state';

interface MultiFileActionEntry {
  id: string;
  file: File;
}

interface SubmitMultiFileActionOptions<TPayload> {
  payload: TPayload;
  writeFormData: (formData: FormData) => void;
}

export function useMultiFileActionWorkspace<
  TEntry extends MultiFileActionEntry,
  TResult = undefined,
>(options?: { cleanupEntry?: (entry: TEntry) => void }) {
  const fetcher = useFetcher<ToolActionResult<TResult>>();
  const queue = useFileQueueState<TEntry>({
    cleanupEntry: options?.cleanupEntry,
  });
  const [localErrorMessage, setLocalErrorMessage] = useState<string | null>(
    null,
  );

  const isBusy = fetcher.state !== 'idle';
  const actionErrorMessage =
    fetcher.data && !fetcher.data.ok ? fetcher.data.message : null;
  const errorMessage = localErrorMessage ?? actionErrorMessage;
  const successMessage = fetcher.data?.ok ? fetcher.data.message : null;

  function clearEntries() {
    if (isBusy) {
      return;
    }

    queue.clearEntries();
    setLocalErrorMessage(null);
  }

  function removeEntry(entryId: string) {
    queue.removeEntry(entryId);
    setLocalErrorMessage(null);
  }

  function reorderEntries(activeId: string, overId: string) {
    queue.reorderEntries(activeId, overId);
    setLocalErrorMessage(null);
  }

  function submitAction<TPayload>({
    payload,
    writeFormData,
  }: SubmitMultiFileActionOptions<TPayload>) {
    setLocalErrorMessage(null);
    submitClientAction({
      fetcher,
      payload,
      writeFormData,
    });
  }

  function appendEntries(entries: TEntry[]) {
    queue.appendEntries(entries);
  }

  function setEntries(entries: TEntry[]) {
    queue.setEntries(entries);
  }

  function updateEntry(entryId: string, updater: (entry: TEntry) => TEntry) {
    queue.updateEntry(entryId, updater);
  }

  return {
    actionErrorMessage,
    appendEntries,
    clearEntries,
    entries: queue.entries,
    errorMessage,
    fetcher,
    isBusy,
    localErrorMessage,
    removeEntry,
    reorderEntries,
    setEntries,
    setLocalErrorMessage,
    submitAction,
    successMessage,
    updateEntry,
  };
}
