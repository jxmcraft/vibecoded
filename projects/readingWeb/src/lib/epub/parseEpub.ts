import JSZip from "jszip";
import type { CleansedBlock, CleansedDocument } from "@/lib/pdf/types";

type ParseEpubOptions = {
  onProgress?: (value: { percent: number }) => void;
};

type EpubManifestItem = {
  href: string;
  mediaType: string;
};

export async function parseEpubDocument(
  file: File,
  options: ParseEpubOptions = {}
): Promise<CleansedDocument> {
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const opfPath = await resolveOpfPath(zip);
  const { manifest, spine } = await readPackageMetadata(zip, opfPath);

  if (!spine.length) {
    throw new Error("This EPUB has no readable chapters in its spine.");
  }

  const opfDir = dirname(opfPath);
  const mediaTypeByPath = buildMediaTypeByPath(manifest, opfDir);
  const blocks: CleansedBlock[] = [];

  for (let index = 0; index < spine.length; index += 1) {
    const idref = spine[index];
    const manifestItem = manifest.get(idref);
    if (!manifestItem) {
      continue;
    }

    if (!isDocumentMediaType(manifestItem.mediaType)) {
      continue;
    }

    const chapterPath = normalizePath(joinPath(opfDir, manifestItem.href));
    const chapterFile = zip.file(chapterPath);
    if (!chapterFile) {
      continue;
    }

    const chapterHtml = await chapterFile.async("string");
    const chapterBlocks = await extractBlocksFromChapter(
      zip,
      chapterPath,
      chapterHtml,
      index,
      mediaTypeByPath
    );
    blocks.push(...chapterBlocks);

    if (options.onProgress) {
      options.onProgress({ percent: ((index + 1) / spine.length) * 100 });
    }
  }

  const filteredBlocks = blocks.filter((block) => {
    if (block.kind === "paragraph" || block.kind === "heading") {
      return block.text.trim().length > 0;
    }

    return true;
  });

  if (!filteredBlocks.length) {
    throw new Error("No readable text was detected in this EPUB.");
  }

  return {
    defaultMode: "adaptive",
    modes: {
      adaptive: filteredBlocks,
      fallback: filteredBlocks
    },
    diagnostics: {
      confidence: "high",
      selectedStrategy: "strict",
      adaptiveScore: 1,
      fallbackScore: 1,
      strategyScores: {
        strict: 1,
        tolerant: 1
      },
      summary: "EPUB parsed from chapter HTML with semantic heading/paragraph detection and inline image extraction."
    }
  };
}

async function resolveOpfPath(zip: JSZip): Promise<string> {
  const containerFile = zip.file("META-INF/container.xml");
  if (!containerFile) {
    throw new Error("Invalid EPUB: META-INF/container.xml is missing.");
  }

  const containerXml = await containerFile.async("string");
  const containerDoc = parseXml(containerXml);
  const rootfile = containerDoc.querySelector("rootfile");
  const fullPath = rootfile?.getAttribute("full-path")?.trim();

  if (!fullPath) {
    throw new Error("Invalid EPUB: container.xml did not define an OPF package path.");
  }

  return normalizePath(fullPath);
}

async function readPackageMetadata(zip: JSZip, opfPath: string) {
  const opfFile = zip.file(opfPath);
  if (!opfFile) {
    throw new Error("Invalid EPUB: package metadata file is missing.");
  }

  const opfXml = await opfFile.async("string");
  const opfDoc = parseXml(opfXml);
  const manifest = new Map<string, EpubManifestItem>();

  opfDoc.querySelectorAll("manifest > item").forEach((itemNode) => {
    const id = itemNode.getAttribute("id")?.trim();
    const href = itemNode.getAttribute("href")?.trim();
    const mediaType = itemNode.getAttribute("media-type")?.trim();

    if (!id || !href || !mediaType) {
      return;
    }

    manifest.set(id, { href, mediaType });
  });

  const spine = Array.from(opfDoc.querySelectorAll("spine > itemref"))
    .map((itemRef) => itemRef.getAttribute("idref")?.trim())
    .filter((idRef): idRef is string => Boolean(idRef));

  return { manifest, spine };
}

async function extractBlocksFromChapter(
  zip: JSZip,
  chapterPath: string,
  chapterHtml: string,
  pageIndex: number,
  mediaTypeByPath: Map<string, string>
): Promise<CleansedBlock[]> {
  const doc = parseHtml(chapterHtml);
  const body = doc.body;
  if (!body) {
    return [];
  }

  const blocks: CleansedBlock[] = [];
  const chapterDir = dirname(chapterPath);
  const nodes = body.querySelectorAll("h1,h2,h3,p,blockquote,li,pre,img");

  for (const node of nodes) {
    if (node.tagName === "IMG") {
      const imageDataUrl = await resolveImageDataUrl(
        zip,
        chapterDir,
        node as HTMLImageElement,
        mediaTypeByPath
      );
      if (!imageDataUrl) {
        continue;
      }

      blocks.push({
        kind: "image",
        id: createId("image"),
        dataUrl: imageDataUrl,
        pageIndex
      });
      continue;
    }

    const text = normalizeText(node.textContent ?? "");
    if (!text) {
      continue;
    }

    if (node.tagName === "H1" || node.tagName === "H2" || node.tagName === "H3") {
      blocks.push({
        kind: "heading",
        id: createId("heading"),
        text,
        pageIndex,
        level: node.tagName === "H1" ? 1 : node.tagName === "H2" ? 2 : 3,
        align: "left"
      });
      continue;
    }

    blocks.push({
      kind: "paragraph",
      id: createId("paragraph"),
      text,
      pageIndex,
      indentLevel: 0
    });
  }

  return blocks;
}

function parseXml(value: string): Document {
  const doc = new DOMParser().parseFromString(value, "application/xml");
  if (doc.querySelector("parsererror")) {
    throw new Error("Invalid EPUB: malformed XML content.");
  }
  return doc;
}

function parseHtml(value: string): Document {
  return new DOMParser().parseFromString(value, "text/html");
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

async function resolveImageDataUrl(
  zip: JSZip,
  chapterDir: string,
  imageNode: HTMLImageElement,
  mediaTypeByPath: Map<string, string>
): Promise<string | undefined> {
  const rawSource = imageNode.getAttribute("src")?.trim();
  if (!rawSource) {
    return undefined;
  }

  if (rawSource.startsWith("data:image/")) {
    return rawSource;
  }

  if (rawSource.startsWith("http://") || rawSource.startsWith("https://")) {
    return undefined;
  }

  const cleanSource = stripUrlFragment(rawSource);
  const decodedSource = decodePathSafely(cleanSource);
  const imagePath = normalizePath(joinPath(chapterDir, decodedSource));
  if (!imagePath) {
    return undefined;
  }

  const imageFile = zip.file(imagePath);
  if (!imageFile) {
    return undefined;
  }

  const imageBytes = await imageFile.async("uint8array");
  if (!imageBytes.length) {
    return undefined;
  }

  const mimeType =
    mediaTypeByPath.get(imagePath) ?? inferImageMimeType(imagePath) ?? "image/jpeg";
  return `data:${mimeType};base64,${toBase64(imageBytes)}`;
}

function stripUrlFragment(value: string) {
  const hashIndex = value.indexOf("#");
  const queryIndex = value.indexOf("?");
  const cutoff =
    hashIndex >= 0 && queryIndex >= 0
      ? Math.min(hashIndex, queryIndex)
      : hashIndex >= 0
        ? hashIndex
        : queryIndex;

  if (cutoff < 0) {
    return value;
  }

  return value.slice(0, cutoff);
}

function decodePathSafely(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function toBase64(bytes: Uint8Array) {
  let binary = "";
  const chunkSize = 0x8000;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

function inferImageMimeType(path: string): string | undefined {
  const lowerPath = path.toLowerCase();
  if (lowerPath.endsWith(".png")) {
    return "image/png";
  }
  if (lowerPath.endsWith(".jpg") || lowerPath.endsWith(".jpeg")) {
    return "image/jpeg";
  }
  if (lowerPath.endsWith(".gif")) {
    return "image/gif";
  }
  if (lowerPath.endsWith(".webp")) {
    return "image/webp";
  }
  if (lowerPath.endsWith(".svg")) {
    return "image/svg+xml";
  }

  return undefined;
}

function buildMediaTypeByPath(manifest: Map<string, EpubManifestItem>, opfDir: string) {
  const map = new Map<string, string>();

  for (const item of manifest.values()) {
    const path = normalizePath(joinPath(opfDir, item.href));
    if (!path) {
      continue;
    }

    map.set(path, item.mediaType);
  }

  return map;
}

function isDocumentMediaType(mediaType: string): boolean {
  return (
    mediaType === "application/xhtml+xml" ||
    mediaType === "text/html" ||
    mediaType === "application/xml"
  );
}

function dirname(path: string): string {
  const normalized = normalizePath(path);
  const slashIndex = normalized.lastIndexOf("/");
  if (slashIndex <= 0) {
    return "";
  }
  return normalized.slice(0, slashIndex);
}

function joinPath(base: string, next: string): string {
  if (!base) {
    return next;
  }
  if (!next) {
    return base;
  }
  if (next.startsWith("/")) {
    return next.slice(1);
  }
  return `${base}/${next}`;
}

function normalizePath(path: string): string {
  const segments = path.replace(/\\/g, "/").split("/");
  const stack: string[] = [];

  for (const segment of segments) {
    if (!segment || segment === ".") {
      continue;
    }

    if (segment === "..") {
      stack.pop();
      continue;
    }

    stack.push(segment);
  }

  return stack.join("/");
}

function createId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 11)}`;
}
