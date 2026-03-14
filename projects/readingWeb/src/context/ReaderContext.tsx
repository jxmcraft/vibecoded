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
  loadPdfFromFile,
  extractImageBlocks,
  extractTextBlocks
} from "../lib/pdf/parsePdf";
import { cleanseDocument } from "@/lib/pdf/cleanse";
import { computeDocumentId } from "@/lib/pdf/documentId";
import { generatePdfThumbnail } from "@/lib/pdf/thumbnail";
import { getStoredPdf, saveStoredPdf, touchStoredPdf } from "@/lib/storage/pdfIndexedDB";
import type {
  CleansedBlock,
  CleansedDocument,
  ImageBlock,
  ParserConfidence,
  ParserMode,
  ThemeMode
} from "../lib/pdf/types";

type ReaderStatus = "idle" | "loading" | "ready" | "error";

type StoredProgress = {
  percent: number;
  updatedAt: number;
  fileName?: string;
};

type ReaderBookmark = {
  id: string;
  label: string;
  progress: number;
  pageIndex: number;
  createdAt: number;
};

type ChapterCheckpoint = {
  id: string;
  label: string;
  progress: number;
  pageIndex: number;
};

type ReaderState = {
  status: ReaderStatus;
  error?: string;
  documentId?: string;
  fileName?: string;
  blocks: CleansedBlock[];
  parsed?: CleansedDocument;
  parserMode: ParserMode;
  parserConfidence?: ParserConfidence;
  parserSummary?: string;
  theme: ThemeMode;
  fontSize: number;
  readingProgress: number;
  pendingSeekProgress?: number;
  checkpoints: ChapterCheckpoint[];
  bookmarks: ReaderBookmark[];
  sidebarCollapsed: boolean;
};

type ReaderContextValue = ReaderState & {
  loadFile: (file: File) => Promise<string | undefined>;
  loadDocumentById: (documentId: string) => Promise<boolean>;
  setParserMode: (mode: ParserMode) => void;
  setTheme: (theme: ThemeMode) => void;
  setFontSize: (fontSize: number) => void;
  updateReadingProgress: (progress: number) => void;
  seekToProgress: (progress: number) => void;
  clearPendingSeekProgress: () => void;
  addBookmark: () => void;
  removeBookmark: (bookmarkId: string) => void;
  jumpToBookmark: (bookmarkId: string) => void;
  jumpToCheckpoint: (checkpointId: string) => void;
  toggleSidebar: () => void;
};

const ReaderContext = createContext<ReaderContextValue | undefined>(undefined);

const READER_PREFERENCES_KEY = "novelflow.preferences";
const READER_PROGRESS_KEY = "novelflow.progress";
const READER_BOOKMARKS_KEY = "novelflow.bookmarks";
const MIN_FONT_SIZE = 14;
const MAX_FONT_SIZE = 28;

export function ReaderProvider({ children }: { children: ReactNode }) {
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [state, setState] = useState<ReaderState>({
    status: "idle",
    blocks: [],
    parserMode: "adaptive",
    theme: "light",
    fontSize: 18,
    readingProgress: 0,
    checkpoints: [],
    bookmarks: [],
    sidebarCollapsed: false
  });

  useEffect(() => {
    const preferences = readReaderPreferences();

    setState((prev) => ({
      ...prev,
      theme: preferences.theme ?? prev.theme,
      fontSize: preferences.fontSize ?? prev.fontSize,
      // Avoid clobbering sidebar state if the user already started loading/reading.
      sidebarCollapsed:
        prev.status === "idle"
          ? (preferences.sidebarCollapsed ?? prev.sidebarCollapsed)
          : prev.sidebarCollapsed
    }));

    setPreferencesLoaded(true);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = state.theme;
  }, [state.theme]);

  useEffect(() => {
    if (!preferencesLoaded) {
      return;
    }

    writeReaderPreferences({
      theme: state.theme,
      fontSize: state.fontSize,
      sidebarCollapsed: state.sidebarCollapsed
    });
  }, [preferencesLoaded, state.fontSize, state.sidebarCollapsed, state.theme]);

  const openFileInReader = useCallback(async (file: File, stableDocId?: string) => {
    try {
      setState((prev) => ({
        ...prev,
        status: "loading",
        error: undefined,
        pendingSeekProgress: undefined
      }));

      const pdf = await loadPdfFromFile(file);
      const textBlocks = await extractTextBlocks(pdf);
      const imageBlocks = await extractImageBlocks(pdf);
      const parsed = cleanseDocument(textBlocks);
      const parsedWithImages = injectImageBlocks(parsed, imageBlocks);

      const docId = stableDocId ?? (await computeDocumentId(file));
      const savedProgress = readStoredProgress(docId);
      const activeBlocks = parsedWithImages.modes[parsedWithImages.defaultMode];
      const savedBookmarks = readStoredBookmarks(docId);

      try {
        const thumbnailDataUrl = await generatePdfThumbnail(pdf);
        await saveStoredPdf({
          docId,
          fileName: file.name,
          fileSize: file.size,
          uploadedAt: Date.now(),
          thumbnailDataUrl,
          lastOpenedAt: Date.now(),
          blob: file
        });
      } catch {
        // Keep reader flow working even if local persistence fails.
      }

      setState((prev) => ({
        ...prev,
        status: "ready",
        error: undefined,
        documentId: docId,
        fileName: file.name,
        blocks: activeBlocks,
        parsed: parsedWithImages,
        parserMode: parsedWithImages.defaultMode,
        parserConfidence: parsedWithImages.diagnostics.confidence,
        parserSummary: parsedWithImages.diagnostics.summary,
        readingProgress: savedProgress?.percent ?? 0,
        pendingSeekProgress: savedProgress?.percent ?? 0,
        checkpoints: deriveChapterCheckpoints(activeBlocks),
        bookmarks: savedBookmarks,
        // Always show navigation controls once a document is ready.
        sidebarCollapsed: false
      }));

      return docId;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load PDF document.";
      setState((prev) => ({
        ...prev,
        status: "error",
        error: message,
        documentId: undefined,
        fileName: undefined,
        blocks: [],
        parsed: undefined,
        parserMode: "adaptive",
        parserConfidence: undefined,
        parserSummary: undefined,
        readingProgress: 0,
        pendingSeekProgress: undefined,
        checkpoints: [],
        bookmarks: []
      }));

      return undefined;
    }
  }, []);

  const loadFile = useCallback(async (file: File) => {
    return openFileInReader(file);
  }, [openFileInReader]);

  const loadDocumentById = useCallback(
    async (documentId: string) => {
      try {
        const stored = await getStoredPdf(documentId);
        if (!stored) {
          setState((prev) => ({
            ...prev,
            status: "error",
            error: "That document is no longer in your local library.",
            documentId: undefined,
            fileName: undefined,
            blocks: [],
            parsed: undefined,
            parserMode: "adaptive",
            parserConfidence: undefined,
            parserSummary: undefined,
            readingProgress: 0,
            pendingSeekProgress: undefined,
            checkpoints: [],
            bookmarks: []
          }));
          return false;
        }

        const mimeType = stored.blob.type || "application/pdf";
        const file = new File([stored.blob], stored.fileName, { type: mimeType });
        await touchStoredPdf(documentId);
        const loadedDocId = await openFileInReader(file, documentId);
        return Boolean(loadedDocId);
      } catch {
        setState((prev) => ({
          ...prev,
          status: "error",
          error: "Failed to open this document from your local library.",
          documentId: undefined,
          fileName: undefined,
          blocks: [],
          parsed: undefined,
          parserMode: "adaptive",
          parserConfidence: undefined,
          parserSummary: undefined,
          readingProgress: 0,
          pendingSeekProgress: undefined,
          checkpoints: [],
          bookmarks: []
        }));
        return false;
      }
    },
    [openFileInReader]
  );

  const setParserMode = useCallback((mode: ParserMode) => {
    setState((prev) => {
      if (!prev.parsed) {
        return prev;
      }

      return {
        ...prev,
        parserMode: mode,
        blocks: prev.parsed.modes[mode],
        pendingSeekProgress: prev.readingProgress,
        checkpoints: deriveChapterCheckpoints(prev.parsed.modes[mode])
      };
    });
  }, []);

  const setTheme = useCallback((theme: ThemeMode) => {
    setState((prev) => {
      if (prev.theme === theme) {
        return prev;
      }

      return {
        ...prev,
        theme
      };
    });
  }, []);

  const setFontSize = useCallback((fontSize: number) => {
    const nextFontSize = clamp(fontSize, MIN_FONT_SIZE, MAX_FONT_SIZE);

    setState((prev) => {
      if (prev.fontSize === nextFontSize) {
        return prev;
      }

      return {
        ...prev,
        fontSize: nextFontSize
      };
    });
  }, []);

  const updateReadingProgress = useCallback((progress: number) => {
    const nextProgress = clamp(progress, 0, 100);

    setState((prev) => {
      if (!prev.documentId) {
        if (Math.abs(prev.readingProgress - nextProgress) < 0.01) {
          return prev;
        }

        return {
          ...prev,
          readingProgress: nextProgress
        };
      }

      if (Math.abs(prev.readingProgress - nextProgress) < 0.01) {
        return prev;
      }

      persistStoredProgress(prev.documentId, {
        percent: nextProgress,
        updatedAt: Date.now(),
        fileName: prev.fileName
      });

      return {
        ...prev,
        readingProgress: nextProgress
      };
    });
  }, []);

  const seekToProgress = useCallback((progress: number) => {
    const nextProgress = clamp(progress, 0, 100);

    setState((prev) => {
      if (prev.documentId) {
        persistStoredProgress(prev.documentId, {
          percent: nextProgress,
          updatedAt: Date.now(),
          fileName: prev.fileName
        });
      }

      return {
        ...prev,
        readingProgress: nextProgress,
        pendingSeekProgress: nextProgress
      };
    });
  }, []);

  const clearPendingSeekProgress = useCallback(() => {
    setState((prev) => {
      if (prev.pendingSeekProgress === undefined) {
        return prev;
      }

      return {
        ...prev,
        pendingSeekProgress: undefined
      };
    });
  }, []);

  const addBookmark = useCallback(() => {
    setState((prev) => {
      if (!prev.documentId || prev.status !== "ready") {
        return prev;
      }

      const pageIndex = estimatePageIndexFromProgress(prev.blocks, prev.readingProgress);
      const label = `Bookmark ${prev.bookmarks.length + 1}`;
      const nextBookmark: ReaderBookmark = {
        id: createBookmarkId(),
        label,
        progress: prev.readingProgress,
        pageIndex,
        createdAt: Date.now()
      };

      const previousBookmark = prev.bookmarks[prev.bookmarks.length - 1];
      if (
        previousBookmark &&
        Math.abs(previousBookmark.progress - nextBookmark.progress) < 0.2
      ) {
        return prev;
      }

      const nextBookmarks = [...prev.bookmarks, nextBookmark];
      persistStoredBookmarks(prev.documentId, nextBookmarks);

      return {
        ...prev,
        bookmarks: nextBookmarks
      };
    });
  }, []);

  const removeBookmark = useCallback((bookmarkId: string) => {
    setState((prev) => {
      if (!prev.documentId) {
        return prev;
      }

      const nextBookmarks = prev.bookmarks.filter((item) => item.id !== bookmarkId);
      if (nextBookmarks.length === prev.bookmarks.length) {
        return prev;
      }

      persistStoredBookmarks(prev.documentId, nextBookmarks);
      return {
        ...prev,
        bookmarks: nextBookmarks
      };
    });
  }, []);

  const jumpToBookmark = useCallback((bookmarkId: string) => {
    setState((prev) => {
      const bookmark = prev.bookmarks.find((item) => item.id === bookmarkId);
      if (!bookmark) {
        return prev;
      }

      if (prev.documentId) {
        persistStoredProgress(prev.documentId, {
          percent: bookmark.progress,
          updatedAt: Date.now(),
          fileName: prev.fileName
        });
      }

      return {
        ...prev,
        readingProgress: bookmark.progress,
        pendingSeekProgress: bookmark.progress
      };
    });
  }, []);

  const jumpToCheckpoint = useCallback((checkpointId: string) => {
    setState((prev) => {
      const checkpoint = prev.checkpoints.find((item) => item.id === checkpointId);
      if (!checkpoint) {
        return prev;
      }

      if (prev.documentId) {
        persistStoredProgress(prev.documentId, {
          percent: checkpoint.progress,
          updatedAt: Date.now(),
          fileName: prev.fileName
        });
      }

      return {
        ...prev,
        readingProgress: checkpoint.progress,
        pendingSeekProgress: checkpoint.progress
      };
    });
  }, []);

  const toggleSidebar = useCallback(() => {
    setState((prev) => ({
      ...prev,
      sidebarCollapsed: !prev.sidebarCollapsed
    }));
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      loadFile,
      loadDocumentById,
      setParserMode,
      setTheme,
      setFontSize,
      updateReadingProgress,
      seekToProgress,
      clearPendingSeekProgress,
      addBookmark,
      removeBookmark,
      jumpToBookmark,
      jumpToCheckpoint,
      toggleSidebar
    }),
    [
      state,
      addBookmark,
      clearPendingSeekProgress,
      jumpToBookmark,
      jumpToCheckpoint,
      loadDocumentById,
      loadFile,
      removeBookmark,
      seekToProgress,
      setFontSize,
      setParserMode,
      setTheme,
      toggleSidebar,
      updateReadingProgress
    ]
  );

  return (
    <ReaderContext.Provider value={value}>{children}</ReaderContext.Provider>
  );
}

export function useReader() {
  const ctx = useContext(ReaderContext);
  if (!ctx) {
    throw new Error("useReader must be used within ReaderProvider");
  }
  return ctx;
}

function injectImageBlocks(
  parsed: CleansedDocument,
  imageBlocks: ImageBlock[]
): CleansedDocument {
  if (!imageBlocks.length) {
    return parsed;
  }

  const imageByPage = new Map<number, ImageBlock[]>();
  for (const image of imageBlocks) {
    const current = imageByPage.get(image.pageIndex);
    if (current) {
      current.push(image);
    } else {
      imageByPage.set(image.pageIndex, [image]);
    }
  }

  const merge = (blocks: CleansedBlock[]): CleansedBlock[] => {
    const blocksByPage = new Map<number, CleansedBlock[]>();
    let maxPageIndex = 0;

    for (const block of blocks) {
      const pageIndex =
        block.kind === "paragraph" ||
        block.kind === "heading" ||
        block.kind === "page-marker" ||
        block.kind === "image"
          ? block.pageIndex
          : 0;
      maxPageIndex = Math.max(maxPageIndex, pageIndex);
      const current = blocksByPage.get(pageIndex);
      if (current) {
        current.push(block);
      } else {
        blocksByPage.set(pageIndex, [block]);
      }
    }

    for (const pageIndex of imageByPage.keys()) {
      maxPageIndex = Math.max(maxPageIndex, pageIndex);
    }

    const merged: CleansedBlock[] = [];
    for (let pageIndex = 0; pageIndex <= maxPageIndex; pageIndex += 1) {
      for (const image of imageByPage.get(pageIndex) ?? []) {
        merged.push({
          kind: "image",
          id: image.id,
          dataUrl: image.dataUrl,
          pageIndex: image.pageIndex
        });
      }

      for (const block of blocksByPage.get(pageIndex) ?? []) {
        merged.push(block);
      }
    }

    return merged;
  };

  return {
    ...parsed,
    modes: {
      adaptive: merge(parsed.modes.adaptive),
      fallback: merge(parsed.modes.fallback)
    }
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function readReaderPreferences(): Partial<{
  theme: ThemeMode;
  fontSize: number;
  sidebarCollapsed: boolean;
}> {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(READER_PREFERENCES_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw) as {
      theme?: ThemeMode;
      fontSize?: number;
      sidebarCollapsed?: boolean;
    };

    return {
      theme: isThemeMode(parsed.theme) ? parsed.theme : undefined,
      fontSize:
        typeof parsed.fontSize === "number"
          ? clamp(parsed.fontSize, MIN_FONT_SIZE, MAX_FONT_SIZE)
          : undefined,
      sidebarCollapsed:
        typeof parsed.sidebarCollapsed === "boolean"
          ? parsed.sidebarCollapsed
          : undefined
    };
  } catch {
    return {};
  }
}

function writeReaderPreferences(preferences: {
  theme: ThemeMode;
  fontSize: number;
  sidebarCollapsed: boolean;
}) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(READER_PREFERENCES_KEY, JSON.stringify(preferences));
}

function readStoredProgress(documentId: string): StoredProgress | undefined {
  return readProgressStore()[documentId];
}

function persistStoredProgress(documentId: string, progress: StoredProgress) {
  if (typeof window === "undefined") {
    return;
  }

  const store = readProgressStore();
  store[documentId] = progress;
  window.localStorage.setItem(READER_PROGRESS_KEY, JSON.stringify(store));
}

function readProgressStore(): Record<string, StoredProgress> {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(READER_PROGRESS_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw) as Record<string, StoredProgress>;
    return parsed ?? {};
  } catch {
    return {};
  }
}

function isThemeMode(value: unknown): value is ThemeMode {
  return value === "light" || value === "dark" || value === "greyscale";
}

function deriveChapterCheckpoints(blocks: CleansedBlock[]): ChapterCheckpoint[] {
  const level1 = collectHeadingCheckpoints(blocks, 1);
  if (level1.length) {
    return sanitizeCheckpoints(level1);
  }

  const level2 = collectHeadingCheckpoints(blocks, 2);
  if (level2.length) {
    return sanitizeCheckpoints(level2);
  }

  const pageMarkerFallback = collectPageMarkerCheckpoints(blocks);
  return sanitizeCheckpoints(pageMarkerFallback);
}

function collectHeadingCheckpoints(
  blocks: CleansedBlock[],
  headingLevel: 1 | 2 | 3
): ChapterCheckpoint[] {
  const checkpoints: ChapterCheckpoint[] = [];

  for (let index = 0; index < blocks.length; index += 1) {
    const block = blocks[index];
    if (block.kind !== "heading" || block.level !== headingLevel) {
      continue;
    }

    if (!isLikelyChapterHeading(block.text)) {
      continue;
    }

    checkpoints.push({
      id: `chapter-${block.id}`,
      label: shortenLabel(block.text),
      progress: getProgressForBlockIndex(index, blocks.length),
      pageIndex: block.pageIndex
    });
  }

  return checkpoints;
}

function collectPageMarkerCheckpoints(blocks: CleansedBlock[]): ChapterCheckpoint[] {
  const checkpoints: ChapterCheckpoint[] = [];
  const seenPages = new Set<number>();

  for (let index = 0; index < blocks.length; index += 1) {
    const block = blocks[index];
    if (block.kind !== "page-marker") {
      continue;
    }

    if (seenPages.has(block.pageIndex)) {
      continue;
    }

    seenPages.add(block.pageIndex);
    checkpoints.push({
      id: `marker-${block.id}`,
      label: shortenLabel(block.label),
      progress: getProgressForBlockIndex(index, blocks.length),
      pageIndex: block.pageIndex
    });
  }

  return checkpoints;
}

function sanitizeCheckpoints(input: ChapterCheckpoint[]): ChapterCheckpoint[] {
  if (!input.length) {
    return [];
  }

  const unique: ChapterCheckpoint[] = [];
  for (const checkpoint of input) {
    const prev = unique[unique.length - 1];
    if (
      prev &&
      (prev.label.toLowerCase() === checkpoint.label.toLowerCase() ||
        Math.abs(prev.progress - checkpoint.progress) < 1)
    ) {
      continue;
    }

    unique.push(checkpoint);
    if (unique.length >= 120) {
      break;
    }
  }

  return unique;
}

function isLikelyChapterHeading(text: string) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return false;
  }

  if (normalized.length > 90) {
    return false;
  }

  const low = normalized.toLowerCase();
  if (/^(chapter|prologue|epilogue|interlude|part|volume)\b/.test(low)) {
    return true;
  }

  if (/^\d+\b/.test(low)) {
    return normalized.length <= 50;
  }

  const punctuationCount = (normalized.match(/[.,;:!?]/g) ?? []).length;
  return punctuationCount <= 2;
}

function getProgressForBlockIndex(index: number, total: number) {
  if (total <= 1) {
    return 0;
  }

  return clamp((index / (total - 1)) * 100, 0, 100);
}

function estimatePageIndexFromProgress(blocks: CleansedBlock[], progress: number) {
  if (!blocks.length) {
    return 0;
  }

  const targetIndex = Math.floor((clamp(progress, 0, 100) / 100) * (blocks.length - 1));
  const block = blocks[targetIndex];
  return getBlockPageIndex(block);
}

function getBlockPageIndex(block: CleansedBlock) {
  if (block.kind === "paragraph") {
    return block.pageIndex;
  }
  if (block.kind === "heading") {
    return block.pageIndex;
  }
  if (block.kind === "page-marker") {
    return block.pageIndex;
  }
  return block.pageIndex;
}

function shortenLabel(input: string) {
  const normalized = input.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return "Chapter";
  }

  if (normalized.length <= 52) {
    return normalized;
  }

  return `${normalized.slice(0, 49)}...`;
}

function createBookmarkId() {
  return `bm-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function readStoredBookmarks(documentId: string): ReaderBookmark[] {
  return readBookmarkStore()[documentId] ?? [];
}

function persistStoredBookmarks(documentId: string, bookmarks: ReaderBookmark[]) {
  if (typeof window === "undefined") {
    return;
  }

  const store = readBookmarkStore();
  store[documentId] = bookmarks;
  window.localStorage.setItem(READER_BOOKMARKS_KEY, JSON.stringify(store));
}

function readBookmarkStore(): Record<string, ReaderBookmark[]> {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(READER_BOOKMARKS_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw) as Record<string, ReaderBookmark[]>;
    return parsed ?? {};
  } catch {
    return {};
  }
}

