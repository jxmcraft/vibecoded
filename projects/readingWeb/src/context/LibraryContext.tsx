"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import {
  deleteStoredPdf,
  estimateLibraryStorage,
  listStoredPdfs,
  type StoredPdfMeta
} from "@/lib/storage/pdfIndexedDB";

type LibraryContextValue = {
  entries: StoredPdfMeta[];
  loading: boolean;
  storage: {
    usedBytes: number;
    quotaBytes: number;
  };
  refreshLibrary: () => Promise<void>;
  deleteEntry: (docId: string) => Promise<void>;
};

const LibraryContext = createContext<LibraryContextValue | undefined>(undefined);

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<StoredPdfMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [storage, setStorage] = useState({ usedBytes: 0, quotaBytes: 0 });

  const refreshLibrary = useCallback(async () => {
    setLoading(true);

    try {
      const [storedEntries, estimate] = await Promise.all([
        listStoredPdfs(),
        estimateLibraryStorage()
      ]);
      setEntries(storedEntries);
      setStorage(estimate);
    } catch {
      setEntries([]);
      setStorage({ usedBytes: 0, quotaBytes: 0 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshLibrary();
  }, [refreshLibrary]);

  const deleteEntry = useCallback(
    async (docId: string) => {
      await deleteStoredPdf(docId);
      await refreshLibrary();
    },
    [refreshLibrary]
  );

  const value = useMemo(
    () => ({
      entries,
      loading,
      storage,
      refreshLibrary,
      deleteEntry
    }),
    [deleteEntry, entries, loading, refreshLibrary, storage]
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary() {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error("useLibrary must be used within LibraryProvider");
  }

  return context;
}
