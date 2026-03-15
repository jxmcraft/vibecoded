"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LibraryGrid } from "@/components/library/LibraryGrid";
import { useLibrary } from "@/context/LibraryContext";
import { useReader } from "@/context/ReaderContext";

type SortMode = "recent" | "name" | "size";

export default function LibraryPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { entries, loading, deleteEntry, refreshLibrary, storage } = useLibrary();
  const {
    loadFile,
    setTheme,
    theme,
    loadingPhase,
    loadingProgress,
    error: readerError,
    persistUploadsToLibrary,
    setPersistUploadsToLibrary
  } = useReader();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | undefined>();
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("recent");

  useEffect(() => {
    void refreshLibrary();
  }, [refreshLibrary]);

  function handleUploadClick() {
    inputRef.current?.click();
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.target;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    try {
      setUploading(true);
      setUploadError(undefined);
      const docId = await loadFile(file);
      if (docId) {
        router.push(`/reader/${encodeURIComponent(docId)}`);
      } else {
        setUploadError(readerError ?? "Unable to open this file. Please try another file.");
      }
    } finally {
      setUploading(false);
      input.value = "";
    }
  }

  function handleOpen(docId: string) {
    router.push(`/reader/${encodeURIComponent(docId)}`);
  }

  async function handleDelete(docId: string) {
    const confirmed = window.confirm("Delete this document from your local library?");
    if (!confirmed) {
      return;
    }

    await deleteEntry(docId);
  }

  const quotaPercent =
    storage.quotaBytes > 0 ? (storage.usedBytes / storage.quotaBytes) * 100 : 0;
  const quotaHigh = quotaPercent >= 80;

  const visibleEntries = useMemo(() => {
    const lowered = query.trim().toLowerCase();
    const filtered = lowered
      ? entries.filter((entry) => entry.fileName.toLowerCase().includes(lowered))
      : entries;

    const sorted = [...filtered];
    if (sortMode === "name") {
      sorted.sort((left, right) => left.fileName.localeCompare(right.fileName));
      return sorted;
    }

    if (sortMode === "size") {
      sorted.sort((left, right) => right.fileSize - left.fileSize);
      return sorted;
    }

    sorted.sort((left, right) => {
      const leftRank = left.lastOpenedAt ?? left.uploadedAt;
      const rightRank = right.lastOpenedAt ?? right.uploadedAt;
      return rightRank - leftRank;
    });
    return sorted;
  }, [entries, query, sortMode]);

  return (
    <main className="library-page">
      <header className="library-header">
        <div>
          <p className="library-kicker">NovelFlow</p>
          <h1>Library</h1>
          <p>Saved files stay on this device only.</p>
        </div>
        <div className="library-actions">
          <button
            type="button"
            className="primary-button"
            onClick={handleUploadClick}
            disabled={uploading}
          >
            {uploading ? "Preparing..." : "Upload File"}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,application/epub+zip,.pdf,.epub"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
          <div className="library-theme-group" role="group" aria-label="Theme selection">
            <button
              aria-label="Light theme"
              className={`icon-button ${theme === "light" ? "is-active" : ""}`}
              type="button"
              onClick={() => setTheme("light")}
            >
              Light
            </button>
            <button
              aria-label="Dark theme"
              className={`icon-button ${theme === "dark" ? "is-active" : ""}`}
              type="button"
              onClick={() => setTheme("dark")}
            >
              Dark
            </button>
            <button
              aria-label="Greyscale theme"
              className={`icon-button ${theme === "greyscale" ? "is-active" : ""}`}
              type="button"
              onClick={() => setTheme("greyscale")}
            >
              B/W
            </button>
          </div>
        </div>
      </header>

      {uploading && (
        <section className="library-upload-status" aria-live="polite">
          <span>
            {getLibraryUploadPhaseMessage(loadingPhase)}
            {typeof loadingProgress === "number" ? ` (${loadingProgress}%)` : ""}
          </span>
        </section>
      )}

      {uploadError && (
        <section className="library-upload-status is-error" aria-live="polite">
          <span>{uploadError}</span>
        </section>
      )}

      <section className="library-toolbar">
        <input
          className="library-search"
          type="search"
          placeholder="Search by filename"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Search library"
        />
        <select
          className="library-sort"
          value={sortMode}
          onChange={(event) => setSortMode(event.target.value as SortMode)}
          aria-label="Sort library"
        >
          <option value="recent">Sort: Recently opened</option>
          <option value="name">Sort: Name</option>
          <option value="size">Sort: File size</option>
        </select>
        <label className="label" htmlFor="library-save-toggle">
          <input
            id="library-save-toggle"
            type="checkbox"
            checked={persistUploadsToLibrary}
            onChange={(event) => setPersistUploadsToLibrary(event.target.checked)}
          />{" "}
          Save new uploads to library
        </label>
      </section>

      <section className={`library-storage ${quotaHigh ? "is-warning" : ""}`}>
        <span>
          {storage.quotaBytes > 0
            ? `Using ${(storage.usedBytes / (1024 * 1024)).toFixed(1)} MB of ${(storage.quotaBytes / (1024 * 1024)).toFixed(1)} MB`
            : "Storage estimate unavailable"}
        </span>
        {quotaHigh && <strong>Storage is getting full. Consider deleting older files.</strong>}
      </section>

      {loading ? (
        <div className="library-empty">
          <h2>Loading library…</h2>
        </div>
      ) : (
        <LibraryGrid entries={visibleEntries} onOpen={handleOpen} onDelete={handleDelete} />
      )}
    </main>
  );
}

function getLibraryUploadPhaseMessage(phase: string | undefined) {
  if (phase === "loading-document") {
    return "Loading file…";
  }
  if (phase === "using-cache") {
    return "Using cached parse…";
  }
  if (phase === "reading-text") {
    return "Extracting text…";
  }
  if (phase === "cleansing") {
    return "Cleansing and reflowing…";
  }
  if (phase === "extracting-images") {
    return "Extracting images…";
  }
  if (phase === "saving-library") {
    return "Saving to local library…";
  }
  return "Opening reader…";
}
