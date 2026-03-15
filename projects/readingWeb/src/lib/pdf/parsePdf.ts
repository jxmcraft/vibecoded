"use client";

import type { ImageBlock, TextBlock } from "./types";

function uuid(): string {
  return crypto.randomUUID();
}

let workerConfigured = false;
let pdfJsLoadPromise: Promise<any> | null = null;

const PDFJS_VERSION = "3.11.174";
const PDFJS_CDN_BASES = [
  `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}`,
  `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}`,
];

declare global {
  interface Window {
    pdfjsLib: any;
  }
}

async function initPdfJs() {
  // Ensure we're in browser environment
  if (typeof window === 'undefined') {
    throw new Error('PDF.js can only be used in browser environment');
  }

  // If already loaded, return it
  if (window.pdfjsLib) {
    if (!workerConfigured) {
      workerConfigured = true;
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        `${PDFJS_CDN_BASES[0]}/build/pdf.worker.min.js`;
    }
    return window.pdfjsLib;
  }

  if (!pdfJsLoadPromise) {
    pdfJsLoadPromise = loadPdfJsWithFallback();
  }

  return pdfJsLoadPromise;
}

async function loadPdfJsWithFallback() {
  let lastError: Error | undefined;

  for (const baseUrl of PDFJS_CDN_BASES) {
    try {
      await loadPdfJsFromBase(baseUrl);
      return window.pdfjsLib;
    } catch (error) {
      lastError =
        error instanceof Error
          ? error
          : new Error("Failed to load PDF.js runtime.");
    }
  }

  throw (
    lastError ??
    new Error("Failed to load PDF.js from all configured CDNs.")
  );
}

async function loadPdfJsFromBase(baseUrl: string): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `${baseUrl}/build/pdf.min.js`;
    script.async = true;
    script.onload = () => {
      if (!window.pdfjsLib) {
        reject(new Error("PDF.js library not loaded correctly."));
        return;
      }

      if (!workerConfigured) {
        workerConfigured = true;
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          `${baseUrl}/build/pdf.worker.min.js`;
      }

      resolve();
    };
    script.onerror = () => {
      reject(new Error(`Failed to load PDF.js from ${baseUrl}.`));
    };
    document.head.appendChild(script);
  });
}

export async function loadPdfFromFile(file: File): Promise<any> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfjs = await initPdfJs();
  
  const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
  return loadingTask.promise;
}

export async function extractTextBlocks(
  pdf: any,
  options?: {
    onProgress?: (progress: { pageIndex: number; pageCount: number; percent: number }) => void;
  }
): Promise<TextBlock[]> {
  const blocks: TextBlock[] = [];

  const pageCount = pdf.numPages;
  options?.onProgress?.({ pageIndex: 0, pageCount, percent: 0 });
  for (let pageIndex = 1; pageIndex <= pageCount; pageIndex += 1) {
    const page = await pdf.getPage(pageIndex);
    const textContent = await page.getTextContent();

    for (const item of textContent.items as any[]) {
      if (!("str" in item) || typeof item.str !== "string") continue;

      const [a, , , d, e, f] = item.transform as number[];
      const fontHeight = Math.abs(d);
      const x = e;
      const y = f - fontHeight;

      blocks.push({
        id: uuid(),
        pageIndex: pageIndex - 1,
        x,
        y,
        width: (item.width as number) ?? 0,
        height: fontHeight,
        text: item.str,
        fontName:
          "fontName" in item && typeof item.fontName === "string"
            ? item.fontName
            : undefined
      });
    }

    options?.onProgress?.({
      pageIndex,
      pageCount,
      percent: Math.round((pageIndex / Math.max(1, pageCount)) * 100)
    });
  }

  return blocks;
}

export async function extractImageBlocks(pdf: any): Promise<ImageBlock[]> {
  const imageBlocks: ImageBlock[] = [];
  const pageCount = pdf.numPages;

  for (let pageIndex = 1; pageIndex <= pageCount; pageIndex += 1) {
    const page = await pdf.getPage(pageIndex);
    const textContent = await page.getTextContent();
    const textItems = textContent.items as any[];

    const visibleText = textItems
      .map((item) => (typeof item?.str === "string" ? item.str.trim() : ""))
      .filter(Boolean)
      .join(" ");

    // Heuristic: full-page illustrations in light novels usually have very little text.
    const lowTextPage = visibleText.length <= 80;
    if (!lowTextPage) {
      continue;
    }

    const viewport = page.getViewport({ scale: 1.25 });
    const maxWidth = 1200;
    const scale = viewport.width > maxWidth ? maxWidth / viewport.width : 1;
    const finalViewport = page.getViewport({ scale: 1.25 * scale });

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) {
      continue;
    }

    canvas.width = Math.max(1, Math.floor(finalViewport.width));
    canvas.height = Math.max(1, Math.floor(finalViewport.height));

    await page.render({
      canvasContext: context,
      viewport: finalViewport
    }).promise;

    imageBlocks.push({
      id: uuid(),
      pageIndex: pageIndex - 1,
      dataUrl: canvas.toDataURL("image/jpeg", 0.88),
      x: 0,
      y: 0,
      width: finalViewport.width,
      height: finalViewport.height
    });
  }

  return imageBlocks;
}

