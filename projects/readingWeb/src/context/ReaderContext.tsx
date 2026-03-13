"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode
} from "react";
import {
  loadPdfFromFile,
  extractImageBlocks,
  extractTextBlocks
} from "../lib/pdf/parsePdf";
import { cleanseDocument } from "../lib/pdf/cleanse";
import type {
  CleansedBlock,
  CleansedDocument,
  ImageBlock,
  ParserConfidence,
  ParserMode
} from "../lib/pdf/types";

type ReaderStatus = "idle" | "loading" | "ready" | "error";

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
};

type ReaderContextValue = ReaderState & {
  loadFile: (file: File) => Promise<void>;
  setParserMode: (mode: ParserMode) => void;
};

const ReaderContext = createContext<ReaderContextValue | undefined>(undefined);

export function ReaderProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ReaderState>({
    status: "idle",
    blocks: [],
    parserMode: "adaptive"
  });

  const loadFile = useCallback(async (file: File) => {
    try {
      setState((prev) => ({
        ...prev,
        status: "loading",
        error: undefined
      }));

      const pdf = await loadPdfFromFile(file);
      const textBlocks = await extractTextBlocks(pdf);
      const imageBlocks = await extractImageBlocks(pdf);
      const parsed = cleanseDocument(textBlocks);
      const parsedWithImages = injectImageBlocks(parsed, imageBlocks);

      const docId = await computeDocumentId(file);

      setState({
        status: "ready",
        error: undefined,
        documentId: docId,
        fileName: file.name,
        blocks: parsedWithImages.modes[parsedWithImages.defaultMode],
        parsed: parsedWithImages,
        parserMode: parsedWithImages.defaultMode,
        parserConfidence: parsedWithImages.diagnostics.confidence,
        parserSummary: parsedWithImages.diagnostics.summary
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load PDF document.";
      setState({
        status: "error",
        error: message,
        documentId: undefined,
        fileName: undefined,
        blocks: [],
        parsed: undefined,
        parserMode: "adaptive",
        parserConfidence: undefined,
        parserSummary: undefined
      });
    }
  }, []);

  const setParserMode = useCallback((mode: ParserMode) => {
    setState((prev) => {
      if (!prev.parsed) {
        return prev;
      }

      return {
        ...prev,
        parserMode: mode,
        blocks: prev.parsed.modes[mode]
      };
    });
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      loadFile,
      setParserMode
    }),
    [state, loadFile, setParserMode]
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

async function computeDocumentId(file: File): Promise<string> {
  const data = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${file.name}-${hashHex.slice(0, 16)}`;
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

