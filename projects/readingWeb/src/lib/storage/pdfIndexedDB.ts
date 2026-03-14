const DB_NAME = "novelflow-library";
const DB_VERSION = 1;
const STORE_NAME = "documents";

export type StoredPdfMeta = {
  docId: string;
  fileName: string;
  fileSize: number;
  uploadedAt: number;
  thumbnailDataUrl?: string;
  lastOpenedAt?: number;
};

type StoredPdfRow = StoredPdfMeta & {
  blob: Blob;
};

function ensureBrowserApi(): IDBFactory {
  if (typeof indexedDB === "undefined") {
    throw new Error("IndexedDB is unavailable in this environment.");
  }

  return indexedDB;
}

function openDatabase(): Promise<IDBDatabase> {
  const idb = ensureBrowserApi();

  return new Promise((resolve, reject) => {
    const request = idb.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: "docId" });
        store.createIndex("uploadedAt", "uploadedAt", { unique: false });
        store.createIndex("lastOpenedAt", "lastOpenedAt", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Failed to open library database."));
  });
}

async function runTransaction<T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore, resolve: (value: T) => void, reject: (error: Error) => void) => void
): Promise<T> {
  const database = await openDatabase();

  return new Promise<T>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);

    operation(store, resolve, reject);

    transaction.oncomplete = () => {
      database.close();
    };

    transaction.onerror = () => {
      const message = transaction.error?.message ?? "Library transaction failed.";
      reject(new Error(message));
    };

    transaction.onabort = () => {
      const message = transaction.error?.message ?? "Library transaction aborted.";
      reject(new Error(message));
    };
  });
}

export async function saveStoredPdf(input: StoredPdfMeta & { blob: Blob }): Promise<void> {
  await runTransaction<void>("readwrite", (store, resolve, reject) => {
    const request = store.put({ ...input } satisfies StoredPdfRow);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error ?? new Error("Failed to save PDF."));
  });
}

export async function listStoredPdfs(): Promise<StoredPdfMeta[]> {
  return runTransaction<StoredPdfMeta[]>("readonly", (store, resolve, reject) => {
    const request = store.getAll();

    request.onsuccess = () => {
      const rows = (request.result as StoredPdfRow[]) ?? [];
      const metadata = rows
        .map((item) => ({
          docId: item.docId,
          fileName: item.fileName,
          fileSize: item.fileSize,
          uploadedAt: item.uploadedAt,
          thumbnailDataUrl: item.thumbnailDataUrl,
          lastOpenedAt: item.lastOpenedAt
        }))
        .sort((left, right) => {
          const leftRank = left.lastOpenedAt ?? left.uploadedAt;
          const rightRank = right.lastOpenedAt ?? right.uploadedAt;
          return rightRank - leftRank;
        });

      resolve(metadata);
    };

    request.onerror = () => reject(request.error ?? new Error("Failed to list stored PDFs."));
  });
}

export async function getStoredPdf(docId: string): Promise<(StoredPdfMeta & { blob: Blob }) | undefined> {
  return runTransaction<(StoredPdfMeta & { blob: Blob }) | undefined>(
    "readonly",
    (store, resolve, reject) => {
      const request = store.get(docId);

      request.onsuccess = () => {
        const result = request.result as StoredPdfRow | undefined;
        if (!result) {
          resolve(undefined);
          return;
        }

        resolve({
          docId: result.docId,
          fileName: result.fileName,
          fileSize: result.fileSize,
          uploadedAt: result.uploadedAt,
          thumbnailDataUrl: result.thumbnailDataUrl,
          lastOpenedAt: result.lastOpenedAt,
          blob: result.blob
        });
      };

      request.onerror = () => reject(request.error ?? new Error("Failed to read stored PDF."));
    }
  );
}

export async function deleteStoredPdf(docId: string): Promise<void> {
  await runTransaction<void>("readwrite", (store, resolve, reject) => {
    const request = store.delete(docId);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error ?? new Error("Failed to delete stored PDF."));
  });
}

export async function touchStoredPdf(docId: string): Promise<void> {
  const current = await getStoredPdf(docId);
  if (!current) {
    return;
  }

  await saveStoredPdf({
    ...current,
    lastOpenedAt: Date.now()
  });
}

export async function estimateLibraryStorage(): Promise<{ usedBytes: number; quotaBytes: number }> {
  if (typeof navigator === "undefined" || !navigator.storage?.estimate) {
    return {
      usedBytes: 0,
      quotaBytes: 0
    };
  }

  const estimate = await navigator.storage.estimate();
  return {
    usedBytes: estimate.usage ?? 0,
    quotaBytes: estimate.quota ?? 0
  };
}
