import { v4 as uuid } from "uuid";
import type {
  CleansedBlock,
  CleansedDocument,
  ParserConfidence,
  TextBlock
} from "./types";

type PageBounds = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

type LineGroup = {
  pageIndex: number;
  blocks: TextBlock[];
  baseline: number;
  centerY: number;
  avgHeight: number;
  left: number;
  right: number;
  text: string;
};

type FurnitureSignature = {
  text: string;
  pageIndexes: Set<number>;
};

type ParseStrategy = "strict" | "tolerant";

type DocumentProfile = {
  bodyHeight: number;
  bodyLeft: number;
  lineGap: number;
  averageLineWidth: number;
  averagePageWidth: number;
};

type StrategyConfig = {
  name: ParseStrategy;
  baselineToleranceMultiplier: number;
  centerToleranceMultiplier: number;
  shortLeadToleranceMultiplier: number;
  headingHeightMultiplier: number;
  headingIsolationMultiplier: number;
  paragraphGapMultiplier: number;
  indentThresholdMultiplier: number;
};

type ScoredBlocks = {
  blocks: CleansedBlock[];
  score: number;
};

type AdaptiveChoice = {
  result: ScoredBlocks;
  strategy: ParseStrategy;
  strategyScores: {
    strict: number;
    tolerant: number;
  };
};

const STRATEGY_CONFIGS: Record<ParseStrategy, StrategyConfig> = {
  strict: {
    name: "strict",
    baselineToleranceMultiplier: 0.34,
    centerToleranceMultiplier: 0.26,
    shortLeadToleranceMultiplier: 0.85,
    headingHeightMultiplier: 1.14,
    headingIsolationMultiplier: 1.2,
    paragraphGapMultiplier: 1.5,
    indentThresholdMultiplier: 1.1
  },
  tolerant: {
    name: "tolerant",
    baselineToleranceMultiplier: 0.5,
    centerToleranceMultiplier: 0.36,
    shortLeadToleranceMultiplier: 1.15,
    headingHeightMultiplier: 1.08,
    headingIsolationMultiplier: 1.05,
    paragraphGapMultiplier: 1.75,
    indentThresholdMultiplier: 0.95
  }
};

function buildPageBounds(blocks: TextBlock[]) {
  const bounds = new Map<number, PageBounds>();

  for (const block of blocks) {
    let pageBounds = bounds.get(block.pageIndex);
    if (!pageBounds) {
      pageBounds = {
        minX: block.x,
        maxX: block.x + block.width,
        minY: block.y,
        maxY: block.y
      };
      bounds.set(block.pageIndex, pageBounds);
      continue;
    }

    pageBounds.minX = Math.min(pageBounds.minX, block.x);
    pageBounds.maxX = Math.max(pageBounds.maxX, block.x + block.width);
    pageBounds.minY = Math.min(pageBounds.minY, block.y);
    pageBounds.maxY = Math.max(pageBounds.maxY, block.y);
  }

  return bounds;
}

function normalizeSignature(text: string) {
  return text.trim().replace(/\s+/g, " ").replace(/\d+/g, "#").toLowerCase();
}

function extractPageNumber(text: string) {
  const normalized = text.replace(/[|]/g, " ").replace(/\s+/g, " ").trim();

  let match = normalized.match(/^page\s*[:\-]?\s*(\d{1,4})$/i);
  if (match?.[1]) {
    return match[1];
  }

  match = normalized.match(/^(\d{1,4})\s*[:\-]?\s*page$/i);
  if (match?.[1]) {
    return match[1];
  }

  match = normalized.match(/^p\.?\s*(\d{1,4})$/i);
  if (match?.[1]) {
    return match[1];
  }

  if (/^\d{1,4}$/.test(normalized)) {
    return normalized;
  }

  return undefined;
}

function normalizePageLabel(text: string) {
  const normalized = text.replace(/[|]/g, " ").replace(/\s+/g, " ").trim();
  const pageNumber = extractPageNumber(normalized);
  return pageNumber ? `Page ${pageNumber}` : normalized;
}

function isPageLabelText(text: string) {
  return Boolean(extractPageNumber(text));
}

function isLikelyPageFurniture(block: TextBlock, bounds: PageBounds) {
  const pageHeight = Math.max(1, bounds.maxY - bounds.minY);
  const topThreshold = bounds.maxY - pageHeight * 0.16;
  const bottomThreshold = bounds.minY + pageHeight * 0.14;
  return block.y >= topThreshold || block.y <= bottomThreshold;
}

function buildFurnitureCandidates(blocks: TextBlock[], bounds: Map<number, PageBounds>) {
  const map = new Map<string, FurnitureSignature>();

  for (const block of blocks) {
    const text = block.text.trim();
    const pageBounds = bounds.get(block.pageIndex);
    if (!text || !pageBounds || !isLikelyPageFurniture(block, pageBounds)) {
      continue;
    }

    const key = normalizeSignature(text);
    let entry = map.get(key);
    if (!entry) {
      entry = { text: key, pageIndexes: new Set() };
      map.set(key, entry);
    }
    entry.pageIndexes.add(block.pageIndex);
  }

  return map;
}

function median(values: number[]) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function quantile(values: number[], ratio: number) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.max(
    0,
    Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * ratio))
  );
  return sorted[index];
}

function baselineForBlock(block: TextBlock) {
  return block.y + block.height;
}

function centerYForBlock(block: TextBlock) {
  return block.y + block.height / 2;
}

function makeLine(pageIndex: number, block: TextBlock): LineGroup {
  return {
    pageIndex,
    blocks: [block],
    baseline: baselineForBlock(block),
    centerY: centerYForBlock(block),
    avgHeight: block.height,
    left: block.x,
    right: block.x + block.width,
    text: ""
  };
}

function updateLine(line: LineGroup) {
  line.blocks.sort((a, b) => a.x - b.x);
  line.baseline =
    line.blocks.reduce((sum, block) => sum + baselineForBlock(block), 0) /
    line.blocks.length;
  line.centerY =
    line.blocks.reduce((sum, block) => sum + centerYForBlock(block), 0) /
    line.blocks.length;
  line.avgHeight =
    line.blocks.reduce((sum, block) => sum + block.height, 0) / line.blocks.length;
  line.left = Math.min(...line.blocks.map((block) => block.x));
  line.right = Math.max(...line.blocks.map((block) => block.x + block.width));
  line.text = assembleLineText(line.blocks);
}

function assembleLineText(blocks: TextBlock[]) {
  let result = "";
  let previous: TextBlock | undefined;

  for (const block of blocks) {
    const rawText = block.text.replace(/\u0000/g, "");
    if (!rawText) continue;

    if (/^\s+$/.test(rawText)) {
      if (result && !result.endsWith(" ")) {
        result += " ";
      }
      previous = block;
      continue;
    }

    const segment = rawText.trim();
    if (!segment) {
      previous = block;
      continue;
    }

    if (!result) {
      result = segment;
      previous = block;
      continue;
    }

    const previousChars = Math.max(1, (previous?.text ?? "").replace(/\s+/g, "").length);
    const previousWidth = previous?.width ?? 0;
    const previousEnd = (previous?.x ?? 0) + previousWidth;
    const gap = block.x - previousEnd;
    const estimatedCharWidth = Math.max(1, previousWidth / previousChars);
    const needsSpaceByGap = gap > estimatedCharWidth * 0.28;
    const previousEndsSpace = /\s$/.test(result);
    const previousEndsHyphen = /[-\u2010\u2011\u2012\u2013\u2014]$/.test(result);
    const previousEndsOpenQuote = /[“"(\[]$/.test(result);
    const nextStartsPunctuation = /^[,.;:!?%'"”)\]]/.test(segment);

    if (
      !previousEndsSpace &&
      !previousEndsHyphen &&
      !previousEndsOpenQuote &&
      !nextStartsPunctuation &&
      needsSpaceByGap
    ) {
      result += " ";
    }

    result += segment;
    previous = block;
  }

  return result.replace(/\s+/g, " ").trim();
}

function appendParagraphLine(current: string, lineText: string) {
  const next = lineText.trim();
  if (!next) return current;
  if (!current) return next;
  if (current.endsWith("-")) {
    return `${current.slice(0, -1)}${next}`;
  }
  if (/^[,.;:!?%'"”)\]]/.test(next)) {
    return `${current}${next}`;
  }
  return `${current} ${next}`;
}

function minHeadingLevel(current: 1 | 2 | 3, next: 1 | 2 | 3): 1 | 2 | 3 {
  if (current === 1 || next === 1) return 1;
  if (current === 2 || next === 2) return 2;
  return 3;
}

function headingLevelFor(line: LineGroup, profile: DocumentProfile): 1 | 2 | 3 {
  if (/^chapter\b/i.test(line.text) || line.avgHeight >= profile.bodyHeight * 1.28) {
    return 1;
  }
  if (line.avgHeight >= profile.bodyHeight * 1.14) {
    return 2;
  }
  return 3;
}

function shouldJoinLine(
  line: LineGroup,
  block: TextBlock,
  config: StrategyConfig,
  profile: DocumentProfile
) {
  const blockBaseline = baselineForBlock(block);
  const referenceHeight = Math.max(line.avgHeight, block.height, profile.bodyHeight);
  const baselineTolerance = referenceHeight * config.baselineToleranceMultiplier;
  const baselineClose = Math.abs(blockBaseline - line.baseline) <= baselineTolerance;

  const centerTolerance = referenceHeight * config.centerToleranceMultiplier;
  const centerClose = Math.abs(centerYForBlock(block) - line.centerY) <= centerTolerance;

  const shortLead = block.text.trim().length <= 2 || line.blocks[0]?.text.trim().length <= 2;
  const shortLeadTolerance = referenceHeight * config.shortLeadToleranceMultiplier;
  const shortLeadClose = Math.abs(blockBaseline - line.baseline) <= shortLeadTolerance;

  return baselineClose || centerClose || (shortLead && shortLeadClose);
}

function buildLinesForPage(
  pageIndex: number,
  pageBlocks: TextBlock[],
  config: StrategyConfig,
  profile?: DocumentProfile
) {
  const sortedBlocks = [...pageBlocks].sort((a, b) => {
    if (a.y !== b.y) {
      return b.y - a.y;
    }
    return a.x - b.x;
  });

  const lines: LineGroup[] = [];
  const fallbackProfile: DocumentProfile =
    profile ?? {
      bodyHeight: median(pageBlocks.map((block) => block.height)) || 12,
      bodyLeft: quantile(pageBlocks.map((block) => block.x), 0.15),
      lineGap: 16,
      averageLineWidth: median(pageBlocks.map((block) => block.width)) || 300,
      averagePageWidth: 600
    };

  for (const block of sortedBlocks) {
    const text = block.text.trim();
    if (!text && !/^\s+$/.test(block.text)) {
      continue;
    }

    const currentLine = lines.at(-1);
    if (currentLine && shouldJoinLine(currentLine, block, config, fallbackProfile)) {
      currentLine.blocks.push(block);
      updateLine(currentLine);
      continue;
    }

    const line = makeLine(pageIndex, block);
    updateLine(line);
    lines.push(line);
  }

  return lines.filter((line) => line.text.length > 0);
}

function buildDocumentProfile(blocks: TextBlock[], bounds: Map<number, PageBounds>): DocumentProfile {
  const heights = blocks.map((block) => block.height).filter((height) => height > 0);
  const temporaryConfig: StrategyConfig = {
    ...STRATEGY_CONFIGS.strict,
    baselineToleranceMultiplier: 0.4,
    centerToleranceMultiplier: 0.3,
    shortLeadToleranceMultiplier: 0.9
  };

  const roughLines = Array.from(bounds.keys()).flatMap((pageIndex) => {
    const pageBlocks = blocks.filter((block) => block.pageIndex === pageIndex);
    if (!pageBlocks.length) {
      return [] as LineGroup[];
    }
    return buildLinesForPage(pageIndex, pageBlocks, temporaryConfig);
  });

  const bodyLineCandidates = roughLines.filter((line) => line.text.length >= 24);
  const bodyLineHeights = bodyLineCandidates.map((line) => line.avgHeight);
  const bodyHeight = median(bodyLineHeights.length ? bodyLineHeights : heights) || 12;
  const bodyLeft =
    quantile(
      bodyLineCandidates.length
        ? bodyLineCandidates.map((line) => line.left)
        : blocks.map((block) => block.x),
      0.18
    ) || 0;

  const gaps: number[] = [];
  const linesByPage = new Map<number, LineGroup[]>();
  for (const line of roughLines) {
    const pageLines = linesByPage.get(line.pageIndex);
    if (pageLines) {
      pageLines.push(line);
    } else {
      linesByPage.set(line.pageIndex, [line]);
    }
  }

  for (const pageLines of linesByPage.values()) {
    for (let index = 1; index < pageLines.length; index += 1) {
      const gap = pageLines[index - 1].baseline - pageLines[index].baseline;
      if (gap > 0 && gap < bodyHeight * 4) {
        gaps.push(gap);
      }
    }
  }

  const averageLineWidth =
    median(bodyLineCandidates.map((line) => line.right - line.left)) || 0;
  const averagePageWidth =
    median(Array.from(bounds.values()).map((page) => page.maxX - page.minX)) || 600;

  return {
    bodyHeight,
    bodyLeft,
    lineGap: median(gaps) || bodyHeight * 1.2,
    averageLineWidth: averageLineWidth || averagePageWidth * 0.7,
    averagePageWidth
  };
}

function isHeadingLine(
  line: LineGroup,
  profile: DocumentProfile,
  pageBounds: PageBounds,
  config: StrategyConfig,
  previousLine?: LineGroup,
  nextLine?: LineGroup
) {
  const pageWidth = Math.max(1, pageBounds.maxX - pageBounds.minX);
  const pageCenter = pageBounds.minX + pageWidth / 2;
  const lineCenter = line.left + (line.right - line.left) / 2;
  const isCentered = Math.abs(lineCenter - pageCenter) <= pageWidth * 0.12;
  const isShort =
    line.text.length <= 110 &&
    line.right - line.left <= Math.max(profile.averageLineWidth * 0.78, pageWidth * 0.72);
  const isTall = line.avgHeight >= profile.bodyHeight * config.headingHeightMultiplier;
  const previousGap = previousLine ? previousLine.baseline - line.baseline : profile.lineGap * 2;
  const nextGap = nextLine ? line.baseline - nextLine.baseline : profile.lineGap * 2;
  const isIsolated =
    previousGap >= profile.lineGap * config.headingIsolationMultiplier ||
    nextGap >= profile.lineGap * config.headingIsolationMultiplier;

  return Boolean(line.text) && isCentered && isShort && isTall && isIsolated;
}

function scoreOutput(blocks: CleansedBlock[]) {
  let score = 0;
  let previousWasHeading = false;

  for (const block of blocks) {
    if (block.kind === "paragraph") {
      if (/\bpage\s+\d+\b/i.test(block.text)) {
        score += 20;
      }
      if (/^\S$/.test(block.text)) {
        score += 24;
      }
      if (block.text.length < 18) {
        score += 5;
      }
      if (/\b[A-Za-z]\s+[A-Za-z]{4,}/.test(block.text) && !/\b(I|A)\s+[a-z]/.test(block.text)) {
        score += 4;
      }
      if (previousWasHeading && /^[a-z]/.test(block.text)) {
        score += 3;
      }
      previousWasHeading = false;
      continue;
    }

    if (block.kind === "heading") {
      if (block.text.length > 140) {
        score += 10;
      }
      previousWasHeading = true;
      continue;
    }

    if (block.kind === "page-marker") {
      score += 0.2;
      previousWasHeading = false;
      continue;
    }

    previousWasHeading = false;
  }

  return score;
}

function parseWithStrategy(
  blocks: TextBlock[],
  totalPages: number,
  pageBounds: Map<number, PageBounds>,
  pageLabels: Map<number, string>,
  profile: DocumentProfile,
  config: StrategyConfig
): ScoredBlocks {
  const blocksByPage = new Map<number, TextBlock[]>();
  for (const block of blocks) {
    const pageBlocks = blocksByPage.get(block.pageIndex);
    if (pageBlocks) {
      pageBlocks.push(block);
    } else {
      blocksByPage.set(block.pageIndex, [block]);
    }
  }

  const output: CleansedBlock[] = [];

  for (let pageIndex = 0; pageIndex < totalPages; pageIndex += 1) {
    const pageBlocks = blocksByPage.get(pageIndex) ?? [];
    const bounds = pageBounds.get(pageIndex);
    if (!pageBlocks.length || !bounds) {
      if (pageLabels.has(pageIndex)) {
        output.push({
          kind: "page-marker",
          id: uuid(),
          pageIndex,
          label: pageLabels.get(pageIndex) as string
        });
      }
      continue;
    }

    const lines = buildLinesForPage(pageIndex, pageBlocks, config, profile);
    const bodyLineCandidates = lines.filter((line) => line.text.length >= 24);
    const pageBodyHeight =
      median(
        bodyLineCandidates.length
          ? bodyLineCandidates.map((line) => line.avgHeight)
          : lines.map((line) => line.avgHeight)
      ) || profile.bodyHeight;
    const bodyLeft =
      quantile(
        bodyLineCandidates.length
          ? bodyLineCandidates.map((line) => line.left)
          : lines.map((line) => line.left),
        0.18
      ) || profile.bodyLeft;

    let paragraphText = "";
    let paragraphIndentLevel = 0;
    let previousBodyLine: LineGroup | undefined;

    const flushParagraph = () => {
      const text = paragraphText.trim();
      if (!text) {
        paragraphText = "";
        paragraphIndentLevel = 0;
        return;
      }
      output.push({
        kind: "paragraph",
        id: uuid(),
        text,
        pageIndex,
        indentLevel: paragraphIndentLevel
      });
      paragraphText = "";
      paragraphIndentLevel = 0;
    };

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      const previousLine = lines[index - 1];
      const nextLine = lines[index + 1];

      if (isHeadingLine(line, profile, bounds, config, previousLine, nextLine)) {
        flushParagraph();

        const headingLines = [line.text];
        let headingLevel = headingLevelFor(line, profile);
        while (index + 1 < lines.length) {
          const candidate = lines[index + 1];
          if (!isHeadingLine(candidate, profile, bounds, config, line, lines[index + 2])) {
            break;
          }
          const gap = line.baseline - candidate.baseline;
          if (gap > profile.lineGap * 2.1) {
            break;
          }
          headingLines.push(candidate.text);
          headingLevel = minHeadingLevel(headingLevel, headingLevelFor(candidate, profile));
          index += 1;
        }

        output.push({
          kind: "heading",
          id: uuid(),
          text: headingLines.join("\n"),
          pageIndex,
          level: headingLevel,
          align: "center"
        });
        previousBodyLine = undefined;
        continue;
      }

      const baselineGap = previousBodyLine
        ? previousBodyLine.baseline - line.baseline
        : profile.lineGap * 2;
      const lineIndentRaw = Math.max(0, line.left - bodyLeft);
      const lineIndentLevel =
        lineIndentRaw >= profile.bodyHeight * config.indentThresholdMultiplier
          ? Math.min(3, Math.round(lineIndentRaw / Math.max(profile.bodyHeight, 1)))
          : 0;
      const isNewParagraph =
        !paragraphText ||
        baselineGap >
          Math.max(previousBodyLine?.avgHeight ?? pageBodyHeight, pageBodyHeight) *
            config.paragraphGapMultiplier ||
        (lineIndentLevel > 0 && paragraphText.length > 0 && paragraphIndentLevel === 0);

      if (isNewParagraph) {
        flushParagraph();
        paragraphIndentLevel = lineIndentLevel;
      }

      paragraphText = appendParagraphLine(paragraphText, line.text);
      previousBodyLine = line;
    }

    flushParagraph();

    if (pageLabels.has(pageIndex)) {
      output.push({
        kind: "page-marker",
        id: uuid(),
        pageIndex,
        label: pageLabels.get(pageIndex) as string
      });
    }
  }

  return {
    blocks: output,
    score: scoreOutput(output)
  };
}

function parseFallback(
  blocks: TextBlock[],
  totalPages: number,
  pageBounds: Map<number, PageBounds>,
  pageLabels: Map<number, string>,
  profile: DocumentProfile
): ScoredBlocks {
  const blocksByPage = new Map<number, TextBlock[]>();
  for (const block of blocks) {
    const pageBlocks = blocksByPage.get(block.pageIndex);
    if (pageBlocks) {
      pageBlocks.push(block);
    } else {
      blocksByPage.set(block.pageIndex, [block]);
    }
  }

  const output: CleansedBlock[] = [];

  for (let pageIndex = 0; pageIndex < totalPages; pageIndex += 1) {
    const pageBlocks = blocksByPage.get(pageIndex) ?? [];
    const bounds = pageBounds.get(pageIndex);
    if (!pageBlocks.length || !bounds) {
      if (pageLabels.has(pageIndex)) {
        output.push({
          kind: "page-marker",
          id: uuid(),
          pageIndex,
          label: pageLabels.get(pageIndex) as string
        });
      }
      continue;
    }

    const lines = buildLinesForPage(pageIndex, pageBlocks, STRATEGY_CONFIGS.strict, profile);
    const bodyLeft = quantile(lines.map((line) => line.left), 0.18) || profile.bodyLeft;
    let paragraphText = "";
    let paragraphIndentLevel = 0;
    let previousLine: LineGroup | undefined;

    const flushParagraph = () => {
      const text = paragraphText.trim();
      if (!text) {
        paragraphText = "";
        paragraphIndentLevel = 0;
        return;
      }
      output.push({
        kind: "paragraph",
        id: uuid(),
        text,
        pageIndex,
        indentLevel: paragraphIndentLevel
      });
      paragraphText = "";
      paragraphIndentLevel = 0;
    };

    for (const line of lines) {
      const baselineGap = previousLine
        ? previousLine.baseline - line.baseline
        : profile.lineGap * 2;
      const lineIndentRaw = Math.max(0, line.left - bodyLeft);
      const lineIndentLevel =
        lineIndentRaw >= profile.bodyHeight * 1.2
          ? Math.min(3, Math.round(lineIndentRaw / Math.max(profile.bodyHeight, 1)))
          : 0;
      const startsNewParagraph =
        !paragraphText ||
        baselineGap > Math.max(profile.lineGap * 1.9, profile.bodyHeight * 1.65) ||
        (lineIndentLevel > 0 && paragraphText.length > 0 && paragraphIndentLevel === 0);

      if (startsNewParagraph) {
        flushParagraph();
        paragraphIndentLevel = lineIndentLevel;
      }

      paragraphText = appendParagraphLine(paragraphText, line.text);
      previousLine = line;
    }

    flushParagraph();

    if (pageLabels.has(pageIndex)) {
      output.push({
        kind: "page-marker",
        id: uuid(),
        pageIndex,
        label: pageLabels.get(pageIndex) as string
      });
    }
  }

  return {
    blocks: output,
    score: scoreOutput(output) + 6
  };
}

function chooseAdaptiveResult(strictResult: ScoredBlocks, tolerantResult: ScoredBlocks): AdaptiveChoice {
  const strategyScores = {
    strict: strictResult.score,
    tolerant: tolerantResult.score
  };

  if (strictResult.score <= tolerantResult.score) {
    return {
      result: strictResult,
      strategy: "strict",
      strategyScores
    };
  }

  return {
    result: tolerantResult,
    strategy: "tolerant",
    strategyScores
  };
}

function resolveConfidence(adaptiveScore: number, fallbackScore: number): ParserConfidence {
  if (adaptiveScore <= 16 && adaptiveScore <= fallbackScore + 2) {
    return "high";
  }
  if (adaptiveScore <= 34 && adaptiveScore <= fallbackScore + 10) {
    return "medium";
  }
  return "low";
}

function confidenceSummary(
  confidence: ParserConfidence,
  selectedStrategy: Exclude<ParseStrategy, "fallback">,
  defaultMode: "adaptive" | "fallback"
) {
  if (defaultMode === "fallback") {
    return "This PDF has an irregular layout. Conservative mode is selected to reduce formatting errors.";
  }
  if (confidence === "medium") {
    return `Adaptive cleanup is active using the ${selectedStrategy} parser. If formatting looks off, switch to Conservative mode.`;
  }
  return `Adaptive cleanup is active using the ${selectedStrategy} parser.`;
}

export function cleanseDocument(blocks: TextBlock[]): CleansedDocument {
  if (blocks.length === 0) {
    return {
      defaultMode: "adaptive",
      modes: {
        adaptive: [],
        fallback: []
      },
      diagnostics: {
        confidence: "high",
        selectedStrategy: "strict",
        adaptiveScore: 0,
        fallbackScore: 0,
        strategyScores: {
          strict: 0,
          tolerant: 0
        },
        summary: ""
      }
    };
  }

  const totalPages = blocks.reduce((max, block) => Math.max(max, block.pageIndex), 0) + 1;
  const pageBounds = buildPageBounds(blocks);
  const furnitureCandidates = buildFurnitureCandidates(blocks, pageBounds);

  const repeatedFurniture = new Set<string>();
  for (const entry of furnitureCandidates.values()) {
    if (entry.pageIndexes.size >= Math.max(3, Math.floor(totalPages * 0.18))) {
      repeatedFurniture.add(entry.text);
    }
  }

  const pageLabels = new Map<number, string>();
  const bodyBlocks = blocks.filter((block) => {
    const text = block.text.trim();
    const bounds = pageBounds.get(block.pageIndex);
    const inFurnitureZone = bounds ? isLikelyPageFurniture(block, bounds) : false;

    if (!text || block.width <= 0) {
      return false;
    }

    if (inFurnitureZone && isPageLabelText(text)) {
      pageLabels.set(block.pageIndex, normalizePageLabel(text));
      return false;
    }

    const normalized = normalizeSignature(text);
    if (repeatedFurniture.has(normalized)) {
      return false;
    }

    return true;
  });

  if (bodyBlocks.length === 0) {
    return {
      defaultMode: "adaptive",
      modes: {
        adaptive: [],
        fallback: []
      },
      diagnostics: {
        confidence: "high",
        selectedStrategy: "strict",
        adaptiveScore: 0,
        fallbackScore: 0,
        strategyScores: {
          strict: 0,
          tolerant: 0
        },
        summary: ""
      }
    };
  }

  const profile = buildDocumentProfile(bodyBlocks, pageBounds);
  const strictResult = parseWithStrategy(
    bodyBlocks,
    totalPages,
    pageBounds,
    pageLabels,
    profile,
    STRATEGY_CONFIGS.strict
  );
  const tolerantResult = parseWithStrategy(
    bodyBlocks,
    totalPages,
    pageBounds,
    pageLabels,
    profile,
    STRATEGY_CONFIGS.tolerant
  );
  const adaptiveChoice = chooseAdaptiveResult(strictResult, tolerantResult);
  const fallbackResult = parseFallback(
    bodyBlocks,
    totalPages,
    pageBounds,
    pageLabels,
    profile
  );
  const confidence = resolveConfidence(adaptiveChoice.result.score, fallbackResult.score);
  const defaultMode =
    confidence === "low" && fallbackResult.score + 2 < adaptiveChoice.result.score
      ? "fallback"
      : "adaptive";

  return {
    defaultMode,
    modes: {
      adaptive: adaptiveChoice.result.blocks,
      fallback: fallbackResult.blocks
    },
    diagnostics: {
      confidence,
      selectedStrategy: adaptiveChoice.strategy,
      adaptiveScore: adaptiveChoice.result.score,
      fallbackScore: fallbackResult.score,
      strategyScores: adaptiveChoice.strategyScores,
      summary: confidenceSummary(confidence, adaptiveChoice.strategy, defaultMode)
    }
  };
}

export function cleanseBlocks(blocks: TextBlock[]): CleansedBlock[] {
  return cleanseDocument(blocks).modes.adaptive;
}
