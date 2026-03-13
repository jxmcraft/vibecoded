export type TextBlock = {
  id: string;
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  fontName?: string;
};

export type ImageBlock = {
  id: string;
  pageIndex: number;
  dataUrl: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type CleansedBlock =
  | {
      kind: "paragraph";
      id: string;
      text: string;
      pageIndex: number;
      indentLevel: number;
    }
  | {
      kind: "heading";
      id: string;
      text: string;
      pageIndex: number;
      level: 1 | 2 | 3;
      align: "center" | "left";
    }
  | {
      kind: "page-marker";
      id: string;
      pageIndex: number;
      label: string;
    }
  | { kind: "image"; id: string; dataUrl: string; pageIndex: number };

export type ParserMode = "adaptive" | "fallback";

export type ParserConfidence = "high" | "medium" | "low";

export type ThemeMode = "light" | "dark" | "greyscale";

export type ParserStrategy = "strict" | "tolerant" | "fallback";

export type CleansedDocument = {
  defaultMode: ParserMode;
  modes: Record<ParserMode, CleansedBlock[]>;
  diagnostics: {
    confidence: ParserConfidence;
    selectedStrategy: Exclude<ParserStrategy, "fallback">;
    adaptiveScore: number;
    fallbackScore: number;
    strategyScores: {
      strict: number;
      tolerant: number;
    };
    summary: string;
  };
};

