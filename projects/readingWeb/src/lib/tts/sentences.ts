// Module-level regex constants — compiled once, reused on every call.
const SENTENCE_TAIL_RE = /[.!?"')\]]/;
const DIGIT_RE = /\d/;
const NORMALIZE_SPACE_RE = /\s+/g;
const WHITESPACE_CHAR_RE = /\s/;

export function splitTextIntoSentences(text: string): string[] {
  if (!text || text.trim().length === 0) {
    return [];
  }

  const { parts, lossless } = splitWithScanner(text);
  if (!lossless) {
    return [text];
  }

  return parts.filter((segment) => segment.trim().length > 0);
}

function splitWithScanner(text: string): { parts: string[]; lossless: boolean } {
  const parts: string[] = [];
  let start = 0;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (!isSentencePunctuation(char)) {
      continue;
    }

    // Avoid decimal splits like 2.1.
    if (char === "." && isDigit(text[index - 1]) && isDigit(text[index + 1])) {
      continue;
    }

    let end = index + 1;

    // Include trailing punctuation/closing quotes right after boundary char.
    while (end < text.length && isSentenceTailCharacter(text[end])) {
      end += 1;
    }

    // Keep original inter-sentence whitespace attached to this segment.
    while (end < text.length && WHITESPACE_CHAR_RE.test(text[end])) {
      end += 1;
    }

    parts.push(text.slice(start, end));
    start = end;
    index = end - 1;
  }

  if (start < text.length) {
    parts.push(text.slice(start));
  }

  // Verify the scanner covered the full input without character loss.
  const lossless = start >= text.length;

  return { parts: parts.length ? parts : [text], lossless };
}

function isSentencePunctuation(value: string | undefined) {
  return value === "." || value === "!" || value === "?";
}

function isSentenceTailCharacter(value: string | undefined) {
  if (!value) {
    return false;
  }

  return SENTENCE_TAIL_RE.test(value);
}

function isDigit(value: string | undefined) {
  if (!value) {
    return false;
  }

  return DIGIT_RE.test(value);
}

function normalizeSentenceForSpeech(text: string) {
  return text.replace(NORMALIZE_SPACE_RE, " ").trim();
}

export type TtsSentenceUnit = {
  id: string;
  text: string;
  progress: number;
};

export function buildTtsSentenceUnits(
  blocks: Array<{ kind: string; id: string; text?: string }>
): TtsSentenceUnit[] {
  const eligible = blocks.filter(
    (block) =>
      (block.kind === "paragraph" || block.kind === "heading") &&
      typeof block.text === "string" &&
      block.text.trim().length > 0
  );

  const total = eligible.reduce((sum, block) => {
    const sentences = splitTextIntoSentences(block.text ?? "").filter(
      (sentence) => normalizeSentenceForSpeech(sentence).length > 0
    );
    return sum + sentences.length;
  }, 0);

  if (total <= 0) {
    return [];
  }

  let cursor = 0;
  const units: TtsSentenceUnit[] = [];

  for (const block of eligible) {
    const sentences = splitTextIntoSentences(block.text ?? "");
    for (let sentenceIndex = 0; sentenceIndex < sentences.length; sentenceIndex += 1) {
      const sentence = normalizeSentenceForSpeech(sentences[sentenceIndex]);
      if (!sentence) {
        continue;
      }

      const progress = total <= 1 ? 0 : (cursor / (total - 1)) * 100;

      units.push({
        id: `sentence-${block.id}-${sentenceIndex}`,
        text: sentence,
        progress
      });

      cursor += 1;
    }
  }

  return units;
}
