import { useEffect, useRef, useState } from 'react';

import { reorderListByIndex } from './reorder-list-by-index';

interface IdentifiableEntry {
  id: string;
}

export function appendFileQueueEntries<T>(current: T[], entries: T[]): T[] {
  return [...current, ...entries];
}

export function updateFileQueueEntryById<T extends IdentifiableEntry>(
  current: T[],
  entryId: string,
  updater: (entry: T) => T,
): T[] {
  return current.map((entry) =>
    entry.id === entryId ? updater(entry) : entry,
  );
}

export function reorderFileQueueEntriesById<T extends IdentifiableEntry>(
  current: T[],
  activeId: string,
  overId: string,
): T[] {
  const sourceIndex = current.findIndex((entry) => entry.id === activeId);
  const targetIndex = current.findIndex((entry) => entry.id === overId);

  if (sourceIndex === -1 || targetIndex === -1) {
    return current;
  }

  return reorderListByIndex(current, sourceIndex, targetIndex);
}

export function removeFileQueueEntryById<T extends IdentifiableEntry>(
  current: T[],
  entryId: string,
): { nextEntries: T[]; removedEntry: T | null } {
  const removedEntry = current.find((entry) => entry.id === entryId) ?? null;

  return {
    nextEntries: current.filter((entry) => entry.id !== entryId),
    removedEntry,
  };
}

export function useFileQueueState<T extends IdentifiableEntry>(options?: {
  cleanupEntry?: (entry: T) => void;
}) {
  const cleanupEntry = options?.cleanupEntry;
  const [entries, setEntries] = useState<T[]>([]);
  const entriesRef = useRef<T[]>([]);

  useEffect(() => {
    entriesRef.current = entries;
  }, [entries]);

  useEffect(
    () => () => {
      if (!cleanupEntry) {
        return;
      }

      entriesRef.current.forEach((entry) => {
        cleanupEntry(entry);
      });
    },
    [cleanupEntry],
  );

  return {
    entries,
    appendEntries(entriesToAdd: T[]) {
      setEntries((current) => appendFileQueueEntries(current, entriesToAdd));
    },
    clearEntries() {
      setEntries((current) => {
        if (cleanupEntry) {
          current.forEach((entry) => {
            cleanupEntry(entry);
          });
        }

        return [];
      });
    },
    removeEntry(entryId: string) {
      setEntries((current) => {
        const { nextEntries, removedEntry } = removeFileQueueEntryById(
          current,
          entryId,
        );

        if (removedEntry && cleanupEntry) {
          cleanupEntry(removedEntry);
        }

        return nextEntries;
      });
    },
    reorderEntries(activeId: string, overId: string) {
      setEntries((current) =>
        reorderFileQueueEntriesById(current, activeId, overId),
      );
    },
    setEntries,
    updateEntry(entryId: string, updater: (entry: T) => T) {
      setEntries((current) =>
        updateFileQueueEntryById(current, entryId, updater),
      );
    },
  };
}
