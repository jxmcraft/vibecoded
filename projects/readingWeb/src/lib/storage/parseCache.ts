/**
 * Parse cache — stores the result of cleanseDocument() in IndexedDB keyed by docId.
 * Avoids re-parsing the same PDF on subsequent opens.
 *
 * Mode memory — stores per-document parser mode preference in localStorage.
 */

import type { CleansedDocument, ParserMode } from "../pdf/types";

// Bump this constant when the parser logic changes to invalidate stale caches.
const CACHE_SCHEMA_VERSION = 2;
const MAX_CACHE_ENTRIES = 12;
const MAX_CACHE_AGE_MS = 14 * 24 * 60 * 60 * 1000;

const CACHE_DB_NAME = "novelflow-parse-cache";
const CACHE_STORE = "parsed-documents";

// ─── IndexedDB parse cache ────────────────────────────────────────────────────

type CacheRow = {
  docId: string;
  schemaVersion: number;
  document: CleansedDocument;
  cachedAt: number;
};

function openCacheDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(CACHE_DB_NAME, 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(CACHE_STORE)) {
        db.createObjectStore(CACHE_STORE, { keyPath: "docId" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("Failed to open parse cache."));
  });
}

/**
 * Returns a cached CleansedDocument for the given docId, or undefined on miss/error.
 * Automatically discards rows with a stale schema version.
 */
export async function getCachedParse(
  docId: string
): Promise<CleansedDocument | undefined> {
  if (typeof indexedDB === "undefined") {
    return undefined;
  }

  try {
    const db = await openCacheDb();
    return new Promise<CleansedDocument | undefined>((resolve) => {
      const tx = db.transaction(CACHE_STORE, "readonly");
      const store = tx.objectStore(CACHE_STORE);
      const req = store.get(docId);

      req.onsuccess = () => {
        db.close();
        const row = req.result as CacheRow | undefined;
        if (row && row.schemaVersion === CACHE_SCHEMA_VERSION) {
          resolve(row.document);
        } else {
          resolve(undefined);
        }
      };

      req.onerror = () => {
        db.close();
        resolve(undefined);
      };
    });
  } catch {
    return undefined;
  }
}

/**
 * Persists a CleansedDocument in the parse cache. Non-fatal on failure.
 */
export async function saveCachedParse(
  docId: string,
  document: CleansedDocument
): Promise<void> {
  if (typeof indexedDB === "undefined") {
    return;
  }

  try {
    const db = await openCacheDb();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(CACHE_STORE, "readwrite");
      const store = tx.objectStore(CACHE_STORE);
      const row: CacheRow = {
        docId,
        schemaVersion: CACHE_SCHEMA_VERSION,
        document,
        cachedAt: Date.now()
      };
      store.put(row);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        resolve();
      };
    });

    // Keep the cache bounded so old/rarely used entries do not grow indefinitely.
    await pruneParseCache(db);
    db.close();
  } catch {
    // Cache failures are non-fatal.
  }
}

async function pruneParseCache(db: IDBDatabase): Promise<void> {
  await new Promise<void>((resolve) => {
    const tx = db.transaction(CACHE_STORE, "readwrite");
    const store = tx.objectStore(CACHE_STORE);
    const req = store.getAll();

    req.onsuccess = () => {
      const rows = (req.result as CacheRow[]) ?? [];
      const now = Date.now();
      const toDelete = new Set<string>();

      const validRows: CacheRow[] = [];
      for (const row of rows) {
        const isSchemaValid = row.schemaVersion === CACHE_SCHEMA_VERSION;
        const isFresh = now - row.cachedAt <= MAX_CACHE_AGE_MS;
        if (isSchemaValid && isFresh) {
          validRows.push(row);
          continue;
        }

        toDelete.add(row.docId);
      }

      validRows.sort((left, right) => right.cachedAt - left.cachedAt);
      for (const row of validRows.slice(MAX_CACHE_ENTRIES)) {
        toDelete.add(row.docId);
      }

      for (const key of toDelete) {
        store.delete(key);
      }
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
    tx.onabort = () => resolve();
  });
}

// ─── Per-document mode preference (localStorage) ──────────────────────────────

const DOC_MODES_KEY = "novelflow.doc-modes";
const MAX_STORED_MODES = 50;

/**
 * Returns the parser mode the user last chose for this document, or undefined.
 */
export function getStoredDocMode(docId: string): ParserMode | undefined {
  if (typeof localStorage === "undefined") {
    return undefined;
  }

  try {
    const raw = localStorage.getItem(DOC_MODES_KEY);
    if (!raw) {
      return undefined;
    }
    const map = JSON.parse(raw) as Record<string, string>;
    const mode = map[docId];
    if (mode === "adaptive" || mode === "fallback") {
      return mode;
    }
    return undefined;
  } catch {
    return undefined;
  }
}

/**
 * Saves the parser mode preference for a document. Trims oldest entries beyond the cap.
 */
export function setStoredDocMode(docId: string, mode: ParserMode): void {
  if (typeof localStorage === "undefined") {
    return;
  }

  try {
    const raw = localStorage.getItem(DOC_MODES_KEY);
    const map: Record<string, string> = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    map[docId] = mode;
    const keys = Object.keys(map);
    if (keys.length > MAX_STORED_MODES) {
      for (const key of keys.slice(0, keys.length - MAX_STORED_MODES)) {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete map[key];
      }
    }
    localStorage.setItem(DOC_MODES_KEY, JSON.stringify(map));
  } catch {
    // Non-fatal.
  }
}
