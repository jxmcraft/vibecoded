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
import { parseEpubDocument } from "@/lib/epub/parseEpub";
import { cleanseDocument } from "@/lib/pdf/cleanse";
import { computeDocumentId } from "@/lib/pdf/documentId";
import { generatePdfThumbnail } from "@/lib/pdf/thumbnail";
import { getStoredPdf, saveStoredPdf, touchStoredPdf } from "@/lib/storage/pdfIndexedDB";
import {
  getCachedParse,
  saveCachedParse,
  getStoredDocMode,
  setStoredDocMode
} from "@/lib/storage/parseCache";
import {
  isSpeechSupported,
  listSpeechVoices,
  speakSentences,
  stopSpeech,
  subscribeVoicesChanged,
  type TtsVoiceOption
} from "@/lib/tts/speechEngine";
import { buildTtsSentenceUnits, type TtsSentenceUnit } from "@/lib/tts/sentences";
import type {
  CleansedBlock,
  CleansedDocument,
  ImageBlock,
  ParserConfidence,
  ParserMode,
  ThemeMode
} from "../lib/pdf/types";

type ReaderStatus = "idle" | "loading" | "ready" | "error";
type ReaderLoadingPhase =
  | "loading-document"
  | "using-cache"
  | "reading-text"
  | "cleansing"
  | "extracting-images"
  | "saving-library";

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

type TtsStatus = "idle" | "playing" | "paused" | "stopped";
type TtsStartMode = "visible" | "selected";
type ReaderFontFamily = "serif" | "sans" | "mono" | "dyslexic";

type TtsWordWindow = {
  sentenceId: string;
  startWordIndex: number;
  endWordIndex: number;
};

type ResumePrompt = {
  progress: number;
  fileName?: string;
  updatedAt?: number;
};

type ReaderState = {
  status: ReaderStatus;
  loadingPhase?: ReaderLoadingPhase;
  loadingProgress?: number;
  error?: string;
  documentId?: string;
  fileName?: string;
  blocks: CleansedBlock[];
  parsed?: CleansedDocument;
  parserMode: ParserMode;
  parserConfidence?: ParserConfidence;
  parserSummary?: string;
  theme: ThemeMode;
  fontFamily: ReaderFontFamily;
  fontSize: number;
  readingProgress: number;
  pendingSeekProgress?: number;
  checkpoints: ChapterCheckpoint[];
  bookmarks: ReaderBookmark[];
  sidebarCollapsed: boolean;
  persistUploadsToLibrary: boolean;
  ttsSupported: boolean;
  ttsStatus: TtsStatus;
  ttsRate: number;
  ttsVoiceURI?: string;
  ttsVoices: TtsVoiceOption[];
  ttsStartMode: TtsStartMode;
  ttsSelectedSentenceId?: string;
  ttsVisibleSentenceId?: string;
  ttsCurrentSentenceId?: string;
  ttsWordWindow?: TtsWordWindow;
  ttsResumeWordIndex?: number;
  ttsAutoScroll: boolean;
  ttsHighlightColor: string;
  ttsError?: string;
  resumePrompt?: ResumePrompt;
};

type ReaderContextValue = ReaderState & {
  loadFile: (
    file: File,
    options?: {
      persistToLibrary?: boolean;
    }
  ) => Promise<string | undefined>;
  loadDocumentById: (documentId: string) => Promise<boolean>;
  setParserMode: (mode: ParserMode) => void;
  setTheme: (theme: ThemeMode) => void;
  setFontFamily: (fontFamily: ReaderFontFamily) => void;
  setFontSize: (fontSize: number) => void;
  updateReadingProgress: (progress: number) => void;
  seekToProgress: (progress: number) => void;
  clearPendingSeekProgress: () => void;
  addBookmark: () => void;
  renameBookmark: (bookmarkId: string, label: string) => void;
  removeBookmark: (bookmarkId: string) => void;
  jumpToBookmark: (bookmarkId: string) => void;
  jumpToCheckpoint: (checkpointId: string) => void;
  toggleSidebar: () => void;
  setPersistUploadsToLibrary: (enabled: boolean) => void;
  playTts: () => void;
  pauseTts: () => void;
  resumeTts: () => void;
  stopTts: () => void;
  restartTtsFromBeginning: () => void;
  setTtsRate: (rate: number) => void;
  setTtsVoice: (voiceURI: string | undefined) => void;
  setTtsStartMode: (mode: TtsStartMode) => void;
  selectTtsSentence: (sentenceId: string | undefined) => void;
  setTtsVisibleSentence: (sentenceId: string | undefined) => void;
  setTtsAutoScroll: (enabled: boolean) => void;
  setTtsHighlightColor: (color: string) => void;
  resumeFromLastPosition: () => void;
  dismissResumePrompt: (startOver: boolean) => void;
};

const ReaderContext = createContext<ReaderContextValue | undefined>(undefined);

const READER_PREFERENCES_KEY = "novelflow.preferences";
const READER_PROGRESS_KEY = "novelflow.progress";
const READER_BOOKMARKS_KEY = "novelflow.bookmarks";
const MIN_FONT_SIZE = 14;
const MAX_FONT_SIZE = 28;
const MIN_TTS_RATE = 0.5;
const MAX_TTS_RATE = 3;
const DEFAULT_TTS_HIGHLIGHT_COLOR = "#ffd54a";
const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;
const MAX_PARSE_CACHE_BYTES = 12 * 1024 * 1024;
const PDF_MIME_TYPE = "application/pdf";
const EPUB_MIME_TYPE = "application/epub+zip";

export function ReaderProvider({ children }: { children: ReactNode }) {
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [state, setState] = useState<ReaderState>({
    status: "idle",
    blocks: [],
    parserMode: "adaptive",
    theme: "light",
    fontFamily: "serif",
    fontSize: 18,
    readingProgress: 0,
    checkpoints: [],
    bookmarks: [],
    sidebarCollapsed: false,
    persistUploadsToLibrary: false,
    ttsSupported: false,
    ttsStatus: "idle",
    ttsRate: 1,
    ttsVoices: [],
    ttsStartMode: "visible",
    ttsAutoScroll: false,
    ttsHighlightColor: DEFAULT_TTS_HIGHLIGHT_COLOR
  });
  const [ttsSentences, setTtsSentences] = useState<TtsSentenceUnit[]>([]);

  useEffect(() => {
    const preferences = readReaderPreferences();
    const supported = isSpeechSupported();
    const voices = supported ? listSpeechVoices() : [];

    setState((prev) => ({
      ...prev,
      theme: preferences.theme ?? prev.theme,
      fontFamily: preferences.fontFamily ?? prev.fontFamily,
      fontSize: preferences.fontSize ?? prev.fontSize,
      // Avoid clobbering sidebar state if the user already started loading/reading.
      sidebarCollapsed:
        prev.status === "idle"
          ? (preferences.sidebarCollapsed ?? prev.sidebarCollapsed)
          : prev.sidebarCollapsed,
      persistUploadsToLibrary:
        typeof preferences.persistUploadsToLibrary === "boolean"
          ? preferences.persistUploadsToLibrary
          : prev.persistUploadsToLibrary,
      ttsSupported: supported,
      ttsRate: preferences.ttsRate ?? prev.ttsRate,
      ttsVoiceURI: preferences.ttsVoiceURI,
      ttsVoices: voices,
      ttsStartMode: preferences.ttsStartMode ?? prev.ttsStartMode,
      ttsAutoScroll: preferences.ttsAutoScroll ?? prev.ttsAutoScroll,
      ttsHighlightColor: preferences.ttsHighlightColor ?? prev.ttsHighlightColor
    }));

    setPreferencesLoaded(true);

    if (supported) {
      const unsubscribe = subscribeVoicesChanged(() => {
        setState((prev) => ({
          ...prev,
          ttsVoices: listSpeechVoices()
        }));
      });

      return () => {
        unsubscribe();
        stopSpeech();
      };
    }

    return () => {
      stopSpeech();
    };
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
      fontFamily: state.fontFamily,
      fontSize: state.fontSize,
      sidebarCollapsed: state.sidebarCollapsed,
      persistUploadsToLibrary: state.persistUploadsToLibrary,
      ttsRate: state.ttsRate,
      ttsVoiceURI: state.ttsVoiceURI,
      ttsStartMode: state.ttsStartMode,
      ttsAutoScroll: state.ttsAutoScroll,
      ttsHighlightColor: state.ttsHighlightColor
    });
  }, [
    preferencesLoaded,
    state.fontFamily,
    state.fontSize,
    state.sidebarCollapsed,
    state.persistUploadsToLibrary,
    state.theme,
    state.ttsRate,
    state.ttsVoiceURI,
    state.ttsStartMode,
    state.ttsAutoScroll,
    state.ttsHighlightColor
  ]);

  const openFileInReader = useCallback(async (
    file: File,
    stableDocId?: string,
    options?: {
      persistToLibrary?: boolean;
    }
  ) => {
    try {
      const extension = getFileExtension(file.name);
      const isPdf = file.type === PDF_MIME_TYPE || extension === "pdf";
      const isEpub = file.type === EPUB_MIME_TYPE || extension === "epub";

      if (!isPdf && !isEpub) {
        throw new Error("Please select a PDF or EPUB file.");
      }

      stopSpeech();
      setState((prev) => ({
        ...prev,
        status: "loading",
        loadingPhase: "loading-document",
        loadingProgress: 0,
        error: undefined,
        pendingSeekProgress: undefined,
        ttsStatus: "idle",
        ttsSelectedSentenceId: undefined,
        ttsVisibleSentenceId: undefined,
        ttsCurrentSentenceId: undefined,
        ttsWordWindow: undefined,
        ttsError: undefined
      }));

      if (file.size > MAX_UPLOAD_BYTES) {
        throw new Error(
          `This file is ${(file.size / (1024 * 1024)).toFixed(1)} MB. Please choose a file under 100 MB.`
        );
      }

      const pdfLoadPromise = isPdf ? loadPdfFromFile(file) : undefined;

      const docId = stableDocId ?? (await computeDocumentId(file));
      const shouldPersistToLibrary = options?.persistToLibrary ?? state.persistUploadsToLibrary;
      const shouldUseParseCache = isPdf && file.size <= MAX_PARSE_CACHE_BYTES;

      // Use cached parse result when available to skip expensive cleanseDocument().
      let parsed: CleansedDocument;
      const cachedParse = shouldUseParseCache ? await getCachedParse(docId) : undefined;
      if (cachedParse) {
        setState((prev) => ({ ...prev, loadingPhase: "using-cache", loadingProgress: 100 }));
        parsed = cachedParse;
      } else {
        setState((prev) => ({ ...prev, loadingPhase: "reading-text", loadingProgress: 0 }));
        if (isEpub) {
          parsed = await parseEpubDocument(file, {
            onProgress: ({ percent }) => {
              setState((prev) => {
                if (prev.loadingPhase !== "reading-text") {
                  return prev;
                }

                const nextPercent = clamp(Math.round(percent), 0, 100);
                if (prev.loadingProgress === nextPercent) {
                  return prev;
                }

                return {
                  ...prev,
                  loadingProgress: nextPercent
                };
              });
            }
          });
        } else {
          const pdf = await pdfLoadPromise;
          if (!pdf) {
            throw new Error("Failed to load PDF document.");
          }

          const textBlocks = await extractTextBlocks(pdf, {
            onProgress: ({ percent }) => {
              setState((prev) => {
                if (prev.loadingPhase !== "reading-text") {
                  return prev;
                }

                const nextPercent = clamp(Math.round(percent), 0, 100);
                if (prev.loadingProgress === nextPercent) {
                  return prev;
                }

                return {
                  ...prev,
                  loadingProgress: nextPercent
                };
              });
            }
          });
          if (!textBlocks.length) {
            throw new Error("No readable text was detected in this PDF.");
          }
          setState((prev) => ({ ...prev, loadingPhase: "cleansing", loadingProgress: undefined }));
          parsed = cleanseDocument(textBlocks);
          if (!parsed.modes.adaptive.length && !parsed.modes.fallback.length) {
            throw new Error("No readable text was detected in this PDF.");
          }
        }

        // Cache only smaller PDFs. EPUBs with inline images and large files duplicate too much data.
        if (shouldUseParseCache) {
          saveCachedParse(docId, parsed).catch(() => {});
        }
      }

      // Apply user's stored mode preference for this document if set.
      const storedMode = getStoredDocMode(docId);
      if (storedMode && parsed.modes[storedMode]) {
        parsed = { ...parsed, defaultMode: storedMode };
      }

      let parsedWithImages = parsed;
      if (isPdf) {
        const pdf = await pdfLoadPromise;
        if (!pdf) {
          throw new Error("Failed to load PDF document.");
        }

        setState((prev) => ({
          ...prev,
          loadingPhase: "extracting-images",
          loadingProgress: undefined
        }));
        const imageBlocks = await extractImageBlocks(pdf);
        parsedWithImages = injectImageBlocks(parsed, imageBlocks);
      }

      const savedProgress = readStoredProgress(docId);
      const savedPercent = savedProgress?.percent ?? 0;
      const shouldPromptResume = savedPercent > 1 && savedPercent < 99;
      const activeBlocks = parsedWithImages.modes[parsedWithImages.defaultMode];
      const nextTtsSentences = buildTtsSentenceUnits(activeBlocks);
      const savedBookmarks = readStoredBookmarks(docId);

      if (shouldPersistToLibrary) {
        try {
          setState((prev) => ({ ...prev, loadingPhase: "saving-library" }));
          let thumbnailDataUrl: string | undefined;
          if (isPdf) {
            const pdf = await pdfLoadPromise;
            if (!pdf) {
              throw new Error("Failed to load PDF document.");
            }

            thumbnailDataUrl = await generatePdfThumbnail(pdf);
          }

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
      }

      setTtsSentences(nextTtsSentences);

      setState((prev) => ({
        ...prev,
        status: "ready",
        loadingPhase: undefined,
        loadingProgress: undefined,
        error: undefined,
        documentId: docId,
        fileName: file.name,
        blocks: activeBlocks,
        parsed: parsedWithImages,
        parserMode: parsedWithImages.defaultMode,
        parserConfidence: parsedWithImages.diagnostics.confidence,
        parserSummary: parsedWithImages.diagnostics.summary,
        readingProgress: savedPercent,
        pendingSeekProgress: shouldPromptResume ? 0 : savedPercent,
        checkpoints: deriveChapterCheckpoints(activeBlocks),
        bookmarks: savedBookmarks,
        // Always show navigation controls once a document is ready.
        sidebarCollapsed: false,
        ttsStatus: "idle",
        ttsSelectedSentenceId: undefined,
        ttsVisibleSentenceId: undefined,
        ttsCurrentSentenceId: undefined,
        ttsWordWindow: undefined,
        resumePrompt: shouldPromptResume
          ? {
              progress: savedPercent,
              fileName: file.name,
              updatedAt: savedProgress?.updatedAt
            }
          : undefined,
        ttsError: undefined
      }));

      return docId;
    } catch (err) {
      const rawMessage =
        err instanceof Error ? err.message : "Failed to load document.";
      const message = normalizeLoadErrorMessage(rawMessage);
      stopSpeech();
      setTtsSentences([]);
      setState((prev) => ({
        ...prev,
        status: "error",
        loadingPhase: undefined,
        loadingProgress: undefined,
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
        bookmarks: [],
        ttsStatus: "stopped",
        ttsSelectedSentenceId: undefined,
        ttsVisibleSentenceId: undefined,
        ttsCurrentSentenceId: undefined,
        ttsWordWindow: undefined,
        resumePrompt: undefined,
        ttsError: undefined
      }));

      return undefined;
    }
  }, [state.persistUploadsToLibrary]);

  const loadFile = useCallback(async (
    file: File,
    options?: {
      persistToLibrary?: boolean;
    }
  ) => {
    return openFileInReader(file, undefined, options);
  }, [openFileInReader]);

  const loadDocumentById = useCallback(
    async (documentId: string) => {
      try {
        const stored = await getStoredPdf(documentId);
        if (!stored) {
          stopSpeech();
          setTtsSentences([]);
          setState((prev) => ({
            ...prev,
            status: "error",
            loadingPhase: undefined,
            loadingProgress: undefined,
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
            bookmarks: [],
            ttsStatus: "stopped",
            ttsSelectedSentenceId: undefined,
            ttsVisibleSentenceId: undefined,
            ttsCurrentSentenceId: undefined,
            ttsWordWindow: undefined,
            resumePrompt: undefined,
            ttsError: undefined
          }));
          return false;
        }

        const mimeType = stored.blob.type || PDF_MIME_TYPE;
        const file = new File([stored.blob], stored.fileName, { type: mimeType });
        await touchStoredPdf(documentId);
        const loadedDocId = await openFileInReader(file, documentId, {
          persistToLibrary: false
        });
        return Boolean(loadedDocId);
      } catch {
        stopSpeech();
        setTtsSentences([]);
        setState((prev) => ({
          ...prev,
          status: "error",
          loadingPhase: undefined,
            loadingProgress: undefined,
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
          bookmarks: [],
          ttsStatus: "stopped",
          ttsSelectedSentenceId: undefined,
          ttsVisibleSentenceId: undefined,
          ttsCurrentSentenceId: undefined,
          ttsWordWindow: undefined,
          resumePrompt: undefined,
          ttsError: undefined
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

      // Persist so the same mode is restored next time this document is opened.
      if (prev.documentId) {
        setStoredDocMode(prev.documentId, mode);
      }

      const nextBlocks = prev.parsed.modes[mode];
      setTtsSentences(buildTtsSentenceUnits(nextBlocks));
      stopSpeech();

      return {
        ...prev,
        parserMode: mode,
        blocks: nextBlocks,
        pendingSeekProgress: prev.readingProgress,
        checkpoints: deriveChapterCheckpoints(nextBlocks),
        ttsStatus: "stopped",
        ttsSelectedSentenceId: undefined,
        ttsVisibleSentenceId: undefined,
        ttsCurrentSentenceId: undefined,
        ttsWordWindow: undefined,
        ttsError: undefined
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

  const setFontFamily = useCallback((fontFamily: ReaderFontFamily) => {
    setState((prev) => {
      if (prev.fontFamily === fontFamily) {
        return prev;
      }

      return {
        ...prev,
        fontFamily
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
      // Ignore transient viewport reads while a programmatic seek is still pending.
      if (
        prev.pendingSeekProgress !== undefined &&
        Math.abs(prev.pendingSeekProgress - nextProgress) > 1
      ) {
        return prev;
      }

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

  const renameBookmark = useCallback((bookmarkId: string, label: string) => {
    const nextLabel = label.trim();
    if (!nextLabel) {
      return;
    }

    setState((prev) => {
      if (!prev.documentId) {
        return prev;
      }

      let changed = false;
      const nextBookmarks = prev.bookmarks.map((item) => {
        if (item.id !== bookmarkId) {
          return item;
        }

        changed = true;
        return {
          ...item,
          label: nextLabel.slice(0, 60)
        };
      });

      if (!changed) {
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

  const startSpeechAtIndex = useCallback(
    (startIndex: number, rateOverride?: number, resumeWordIndex?: number) => {
      if (!ttsSentences.length) {
        setState((prev) => ({
          ...prev,
          ttsError: "No readable text found for Auto-Reader."
        }));
        return;
      }

      const safeStartIndex = clamp(startIndex, 0, ttsSentences.length - 1);
      const playbackRate = rateOverride ?? state.ttsRate;

      setState((prev) => ({
        ...prev,
        ttsStatus: "playing",
        ttsCurrentSentenceId: ttsSentences[safeStartIndex]?.id,
        ttsWordWindow: undefined,
        ttsResumeWordIndex: Math.max(0, resumeWordIndex ?? 0),
        ttsError: undefined
      }));

      speakSentences({
        sentences: ttsSentences,
        startIndex: safeStartIndex,
        startWordIndex: Math.max(0, resumeWordIndex ?? 0),
        rate: playbackRate,
        voiceURI: state.ttsVoiceURI,
        onSentenceStart: (sentenceId, progress) => {
          setState((prev) => ({
            ...prev,
            ttsStatus: "playing",
            ttsCurrentSentenceId: sentenceId,
            ttsWordWindow: undefined,
            ttsResumeWordIndex: 0,
            ttsError: undefined
          }));
          updateReadingProgress(progress);
        },
        onWordBoundary: (sentenceId, startWordIndex, endWordIndex) => {
          setState((prev) => ({
            ...prev,
            ttsWordWindow: {
              sentenceId,
              startWordIndex,
              endWordIndex
            },
            ttsResumeWordIndex: endWordIndex
          }));
        },
        onDone: () => {
          setState((prev) => ({
            ...prev,
            ttsStatus: "stopped",
            ttsCurrentSentenceId: undefined,
            ttsWordWindow: undefined,
            ttsResumeWordIndex: undefined
          }));
        },
        onError: (message) => {
          setState((prev) => ({
            ...prev,
            ttsStatus: "stopped",
            ttsCurrentSentenceId: undefined,
            ttsWordWindow: undefined,
            ttsResumeWordIndex: undefined,
            ttsError: message
          }));
        }
      });
    },
    [state.ttsRate, state.ttsVoiceURI, ttsSentences, updateReadingProgress]
  );

  const playTts = useCallback(() => {
    if (state.status !== "ready") {
      return;
    }

    if (!state.ttsSupported) {
      setState((prev) => ({
        ...prev,
        ttsError: "Auto-Reader is unavailable in this browser."
      }));
      return;
    }

    if (!ttsSentences.length) {
      setState((prev) => ({
        ...prev,
        ttsError: "No readable text found for Auto-Reader."
      }));
      return;
    }

    const startIndex = resolveTtsStartIndex(
      ttsSentences,
      state.ttsStartMode,
      state.ttsVisibleSentenceId,
      state.ttsSelectedSentenceId
    );

    startSpeechAtIndex(startIndex);
  }, [
    state.status,
    state.ttsStartMode,
    state.ttsVisibleSentenceId,
    state.ttsSelectedSentenceId,
    state.ttsSupported,
    startSpeechAtIndex,
    ttsSentences,
  ]);

  const pauseTts = useCallback(() => {
    stopSpeech();
    setState((prev) =>
      prev.ttsStatus === "playing"
        ? {
            ...prev,
            ttsStatus: "paused"
          }
        : prev
    );
  }, []);

  const resumeTts = useCallback(() => {
    if (state.ttsStatus !== "paused" || !ttsSentences.length) {
      return;
    }

    const currentIndex = findSentenceIndex(ttsSentences, state.ttsCurrentSentenceId);
    const fallbackIndex = resolveTtsStartIndex(
      ttsSentences,
      state.ttsStartMode,
      state.ttsVisibleSentenceId,
      state.ttsSelectedSentenceId
    );

    const resumeWordIndex = currentIndex !== null ? state.ttsResumeWordIndex : undefined;
    startSpeechAtIndex(currentIndex ?? fallbackIndex, undefined, resumeWordIndex);
  }, [
    state.ttsCurrentSentenceId,
    state.ttsResumeWordIndex,
    state.ttsSelectedSentenceId,
    state.ttsStartMode,
    state.ttsStatus,
    state.ttsVisibleSentenceId,
    startSpeechAtIndex,
    ttsSentences
  ]);

  const stopTts = useCallback(() => {
    stopSpeech();
    setState((prev) => ({
      ...prev,
      ttsStatus: "stopped",
      ttsCurrentSentenceId: undefined,
      ttsWordWindow: undefined,
      ttsResumeWordIndex: undefined
    }));
  }, []);

  const restartTtsFromBeginning = useCallback(() => {
    if (state.status !== "ready") {
      return;
    }

    if (!state.ttsSupported) {
      setState((prev) => ({
        ...prev,
        ttsError: "Auto-Reader is unavailable in this browser."
      }));
      return;
    }

    setState((prev) => ({
      ...prev,
      ttsSelectedSentenceId: undefined,
      ttsVisibleSentenceId: undefined
    }));
    startSpeechAtIndex(0);
  }, [state.status, state.ttsSupported, startSpeechAtIndex]);

  const setTtsRate = useCallback((rate: number) => {
    const nextRate = clamp(rate, MIN_TTS_RATE, MAX_TTS_RATE);

    setState((prev) => {
      if (Math.abs(prev.ttsRate - nextRate) < 0.001) {
        return prev;
      }

      return {
        ...prev,
        ttsRate: nextRate
      };
    });

    if (state.ttsStatus !== "playing" || !ttsSentences.length) {
      return;
    }

    const currentIndex = findSentenceIndex(ttsSentences, state.ttsCurrentSentenceId);
    const fallbackIndex = resolveTtsStartIndex(
      ttsSentences,
      state.ttsStartMode,
      state.ttsVisibleSentenceId,
      state.ttsSelectedSentenceId
    );

    const resumeWordIndex = currentIndex !== null ? state.ttsResumeWordIndex : undefined;
    startSpeechAtIndex(currentIndex ?? fallbackIndex, nextRate, resumeWordIndex);
  }, [
    state.ttsCurrentSentenceId,
    state.ttsResumeWordIndex,
    state.ttsSelectedSentenceId,
    state.ttsStartMode,
    state.ttsStatus,
    state.ttsVisibleSentenceId,
    startSpeechAtIndex,
    ttsSentences
  ]);

  const setTtsVoice = useCallback((voiceURI: string | undefined) => {
    setState((prev) => ({
      ...prev,
      ttsVoiceURI: voiceURI,
      ttsError: undefined
    }));
  }, []);

  const setTtsStartMode = useCallback((mode: TtsStartMode) => {
    setState((prev) => ({
      ...prev,
      ttsStartMode: mode
    }));
  }, []);

  const selectTtsSentence = useCallback((sentenceId: string | undefined) => {
    setState((prev) => ({
      ...prev,
      ttsSelectedSentenceId: sentenceId
    }));
  }, []);

  const setTtsVisibleSentence = useCallback((sentenceId: string | undefined) => {
    setState((prev) =>
      prev.ttsVisibleSentenceId === sentenceId
        ? prev
        : {
            ...prev,
            ttsVisibleSentenceId: sentenceId
          }
    );
  }, []);

  const setTtsAutoScroll = useCallback((enabled: boolean) => {
    setState((prev) => ({
      ...prev,
      ttsAutoScroll: enabled
    }));
  }, []);

  const setTtsHighlightColor = useCallback((color: string) => {
    const nextColor = sanitizeHighlightColor(color);
    setState((prev) => ({
      ...prev,
      ttsHighlightColor: nextColor
    }));
  }, []);

  const resumeFromLastPosition = useCallback(() => {
    setState((prev) => {
      if (!prev.resumePrompt) {
        return prev;
      }

      const nextProgress = clamp(prev.resumePrompt.progress, 0, 100);
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
        pendingSeekProgress: nextProgress,
        resumePrompt: undefined
      };
    });
  }, []);

  const dismissResumePrompt = useCallback((startOver: boolean) => {
    setState((prev) => {
      if (!prev.resumePrompt) {
        return prev;
      }

      if (!startOver) {
        const keepProgress = clamp(prev.pendingSeekProgress ?? prev.readingProgress, 0, 100);
        if (prev.documentId) {
          persistStoredProgress(prev.documentId, {
            percent: keepProgress,
            updatedAt: Date.now(),
            fileName: prev.fileName
          });
        }

        return {
          ...prev,
          readingProgress: keepProgress,
          pendingSeekProgress: keepProgress,
          resumePrompt: undefined
        };
      }

      if (prev.documentId) {
        persistStoredProgress(prev.documentId, {
          percent: 0,
          updatedAt: Date.now(),
          fileName: prev.fileName
        });
      }

      return {
        ...prev,
        readingProgress: 0,
        pendingSeekProgress: 0,
        resumePrompt: undefined
      };
    });
  }, []);

  const toggleSidebar = useCallback(() => {
    setState((prev) => ({
      ...prev,
      sidebarCollapsed: !prev.sidebarCollapsed
    }));
  }, []);

  const setPersistUploadsToLibrary = useCallback((enabled: boolean) => {
    setState((prev) => (
      prev.persistUploadsToLibrary === enabled
        ? prev
        : {
            ...prev,
            persistUploadsToLibrary: enabled
          }
    ));
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      loadFile,
      loadDocumentById,
      setParserMode,
      setTheme,
      setFontFamily,
      setFontSize,
      updateReadingProgress,
      seekToProgress,
      clearPendingSeekProgress,
      addBookmark,
      renameBookmark,
      removeBookmark,
      jumpToBookmark,
      jumpToCheckpoint,
      toggleSidebar,
      setPersistUploadsToLibrary,
      playTts,
      pauseTts,
      resumeTts,
      stopTts,
      restartTtsFromBeginning,
      setTtsRate,
      setTtsVoice,
      setTtsStartMode,
      selectTtsSentence,
      setTtsVisibleSentence,
      setTtsAutoScroll,
      setTtsHighlightColor,
      resumeFromLastPosition,
      dismissResumePrompt
    }),
    [
      state,
      addBookmark,
      clearPendingSeekProgress,
      jumpToBookmark,
      jumpToCheckpoint,
      loadDocumentById,
      loadFile,
      setPersistUploadsToLibrary,
      pauseTts,
      playTts,
      renameBookmark,
      removeBookmark,
      resumeTts,
      restartTtsFromBeginning,
      seekToProgress,
      setFontSize,
      setFontFamily,
      setParserMode,
      setTtsRate,
      setTtsStartMode,
      setTtsVoice,
      selectTtsSentence,
      setTtsAutoScroll,
      setTtsHighlightColor,
      setTtsVisibleSentence,
      setTheme,
      stopTts,
      toggleSidebar,
      updateReadingProgress,
      resumeFromLastPosition,
      dismissResumePrompt
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

function resolveTtsStartIndex(
  sentences: TtsSentenceUnit[],
  mode: TtsStartMode,
  visibleSentenceId: string | undefined,
  selectedSentenceId: string | undefined
) {
  const visibleIndex = findSentenceIndex(sentences, visibleSentenceId);
  const selectedIndex = findSentenceIndex(sentences, selectedSentenceId);

  if (mode === "visible") {
    return visibleIndex ?? selectedIndex ?? 0;
  }

  return selectedIndex ?? visibleIndex ?? 0;
}

function findSentenceIndex(sentences: TtsSentenceUnit[], sentenceId: string | undefined) {
  if (!sentenceId) {
    return undefined;
  }

  const index = sentences.findIndex((sentence) => sentence.id === sentenceId);
  return index >= 0 ? index : undefined;
}

function sanitizeHighlightColor(value: unknown) {
  if (typeof value !== "string") {
    return DEFAULT_TTS_HIGHLIGHT_COLOR;
  }

  const trimmed = value.trim();
  if (!/^#[0-9a-fA-F]{6}$/.test(trimmed)) {
    return DEFAULT_TTS_HIGHLIGHT_COLOR;
  }

  return trimmed.toLowerCase();
}

function getFileExtension(fileName: string) {
  const dotIndex = fileName.lastIndexOf(".");
  if (dotIndex < 0) {
    return "";
  }

  return fileName.slice(dotIndex + 1).toLowerCase();
}

function normalizeLoadErrorMessage(rawMessage: string) {
  const message = rawMessage.trim();
  const lower = message.toLowerCase();

  if (lower.includes("under 100 mb")) {
    return message;
  }

  if (lower.includes("invalid pdf") || lower.includes("corrupt") || lower.includes("malformed")) {
    return "This PDF appears to be corrupted or unsupported. Please try another file.";
  }

  if (lower.includes("invalid epub") || lower.includes("opf") || lower.includes("container.xml")) {
    return "This EPUB appears to be corrupted or unsupported. Please try another file.";
  }

  if (lower.includes("no readable text")) {
    return "No readable text was found in this document. It may be image-only or use an unsupported text encoding.";
  }

  if (lower.includes("password") || lower.includes("encrypted")) {
    return "This PDF is encrypted/password-protected and cannot be opened in NovelFlow yet.";
  }

  if (lower.includes("failed to load pdf.js") || lower.includes("worker")) {
    return "PDF processing resources failed to load. Refresh the page and try again.";
  }

  if (lower.includes("unexpected response") || lower.includes("formaterror")) {
    return "This PDF has an invalid internal structure and could not be parsed.";
  }

  if (lower.includes("network") || lower.includes("fetch")) {
    return "Failed to load document resources. Check your connection and try again.";
  }

  return message || "Failed to load document.";
}

function readReaderPreferences(): Partial<{
  theme: ThemeMode;
  fontFamily: ReaderFontFamily;
  fontSize: number;
  sidebarCollapsed: boolean;
  persistUploadsToLibrary: boolean;
  ttsRate: number;
  ttsVoiceURI: string;
  ttsStartMode: TtsStartMode;
  ttsAutoScroll: boolean;
  ttsHighlightColor: string;
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
      fontFamily?: ReaderFontFamily;
      fontSize?: number;
      sidebarCollapsed?: boolean;
      persistUploadsToLibrary?: boolean;
      ttsRate?: number;
      ttsVoiceURI?: string;
      ttsStartMode?: TtsStartMode;
      ttsAutoScroll?: boolean;
      ttsHighlightColor?: string;
    };

    return {
      theme: isThemeMode(parsed.theme) ? parsed.theme : undefined,
      fontFamily: isReaderFontFamily(parsed.fontFamily) ? parsed.fontFamily : undefined,
      fontSize:
        typeof parsed.fontSize === "number"
          ? clamp(parsed.fontSize, MIN_FONT_SIZE, MAX_FONT_SIZE)
          : undefined,
      sidebarCollapsed:
        typeof parsed.sidebarCollapsed === "boolean"
          ? parsed.sidebarCollapsed
          : undefined,
      persistUploadsToLibrary:
        typeof parsed.persistUploadsToLibrary === "boolean"
          ? parsed.persistUploadsToLibrary
          : undefined,
      ttsRate:
        typeof parsed.ttsRate === "number"
          ? clamp(parsed.ttsRate, MIN_TTS_RATE, MAX_TTS_RATE)
          : undefined,
      ttsVoiceURI:
        typeof parsed.ttsVoiceURI === "string" && parsed.ttsVoiceURI.length > 0
          ? parsed.ttsVoiceURI
          : undefined,
      ttsStartMode: isTtsStartMode(parsed.ttsStartMode) ? parsed.ttsStartMode : undefined,
      ttsAutoScroll:
        typeof parsed.ttsAutoScroll === "boolean" ? parsed.ttsAutoScroll : undefined,
      ttsHighlightColor: sanitizeHighlightColor(parsed.ttsHighlightColor)
    };
  } catch {
    return {};
  }
}

function writeReaderPreferences(preferences: {
  theme: ThemeMode;
  fontFamily: ReaderFontFamily;
  fontSize: number;
  sidebarCollapsed: boolean;
  persistUploadsToLibrary: boolean;
  ttsRate: number;
  ttsVoiceURI?: string;
  ttsStartMode: TtsStartMode;
  ttsAutoScroll: boolean;
  ttsHighlightColor: string;
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

function isReaderFontFamily(value: unknown): value is ReaderFontFamily {
  return value === "serif" || value === "sans" || value === "mono" || value === "dyslexic";
}

function isTtsStartMode(value: unknown): value is TtsStartMode {
  return value === "visible" || value === "selected";
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

