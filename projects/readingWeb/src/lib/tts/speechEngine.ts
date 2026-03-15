import type { TtsSentenceUnit } from "./sentences";

export type TtsVoiceOption = {
  name: string;
  lang: string;
  voiceURI: string;
  isDefault: boolean;
};

type SpeakOptions = {
  sentences: TtsSentenceUnit[];
  rate: number;
  startIndex?: number;
  startWordIndex?: number;
  voiceURI?: string;
  onSentenceStart: (sentenceId: string, progress: number) => void;
  onWordBoundary?: (
    sentenceId: string,
    startWordIndex: number,
    endWordIndex: number
  ) => void;
  onDone: () => void;
  onError: (message: string) => void;
};

let activeToken = 0;
const FIRST_UTTERANCE_MAX_CHARS = 120;
const FIRST_UTTERANCE_MIN_CHARS = 60;
const MAX_UTTERANCE_CHARS = 180;
const MIN_UTTERANCE_CHARS = 90;
const BOUNDARY_FALLBACK_DELAY_MS = 420;

// Module-level regex constants — compiled once.
const WORD_RE = /\S+/g;
const SPLIT_PUNCT_RE = /[.!?;,:]/;
const SPLIT_SPACE_RE = /\s/;
const LEADING_SPACE_RE = /^\s*/;

// Cached synthesis instance — resolved once per session.
let _synthesis: SpeechSynthesis | false | undefined;

function getSpeechSynthesisSafe(): SpeechSynthesis | undefined {
  if (_synthesis !== undefined) {
    return _synthesis || undefined;
  }
  if (typeof window === "undefined" || typeof window.speechSynthesis === "undefined") {
    _synthesis = false;
    return undefined;
  }
  _synthesis = window.speechSynthesis;
  return _synthesis;
}

export function isSpeechSupported() {
  return typeof window !== "undefined" && typeof window.speechSynthesis !== "undefined";
}

export function listSpeechVoices(): TtsVoiceOption[] {
  const synthesis = getSpeechSynthesisSafe();
  if (!synthesis) {
    return [];
  }

  return synthesis.getVoices().map((voice) => ({
    name: voice.name,
    lang: voice.lang,
    voiceURI: voice.voiceURI,
    isDefault: voice.default
  }));
}

export function subscribeVoicesChanged(onChange: () => void) {
  const synthesis = getSpeechSynthesisSafe();
  if (!synthesis) {
    return () => {};
  }

  synthesis.addEventListener("voiceschanged", onChange);
  return () => synthesis.removeEventListener("voiceschanged", onChange);
}

export function pauseSpeech() {
  const synthesis = getSpeechSynthesisSafe();
  synthesis?.pause();
}

export function resumeSpeech() {
  const synthesis = getSpeechSynthesisSafe();
  synthesis?.resume();
}

export function stopSpeech() {
  activeToken += 1;
  const synthesis = getSpeechSynthesisSafe();
  synthesis?.cancel();
}

function getWordRanges(text: string): Array<{ start: number; end: number }> {
  const ranges: Array<{ start: number; end: number }> = [];
  WORD_RE.lastIndex = 0;
  let match: RegExpExecArray | null;

  match = WORD_RE.exec(text);
  while (match) {
    ranges.push({
      start: match.index,
      end: match.index + match[0].length
    });
    match = WORD_RE.exec(text);
  }

  return ranges;
}

function getWordIndexAtCharIndex(
  ranges: Array<{ start: number; end: number }>,
  charIndex: number,
  startHint = 0
) {
  if (!ranges.length) {
    return -1;
  }

  const startIndex = Math.min(Math.max(startHint, 0), ranges.length - 1);
  for (let index = startIndex; index < ranges.length; index += 1) {
    const range = ranges[index];
    if (charIndex >= range.start && charIndex < range.end) {
      return index;
    }
    if (charIndex < range.start) {
      return index;
    }
  }

  return ranges.length - 1;
}

type SentenceChunk = {
  text: string;
  sourceOffset: number;
};

function splitSentenceIntoChunks(sentenceText: string): SentenceChunk[] {
  const chunks: SentenceChunk[] = [];
  let cursor = 0;

  while (cursor < sentenceText.length) {
    const isFirstChunk = chunks.length === 0;
    const chunkMax = isFirstChunk ? FIRST_UTTERANCE_MAX_CHARS : MAX_UTTERANCE_CHARS;
    const chunkMin = isFirstChunk ? FIRST_UTTERANCE_MIN_CHARS : MIN_UTTERANCE_CHARS;
    const chunkLimit = Math.min(cursor + chunkMax, sentenceText.length);
    const minBreak = Math.min(cursor + chunkMin, chunkLimit);
    let splitIndex = chunkLimit;

    if (chunkLimit < sentenceText.length) {
      splitIndex = findPreferredSplitIndex(sentenceText, minBreak, chunkLimit);
    }

    const slice = sentenceText.slice(cursor, splitIndex);
    const leadingWhitespace = (LEADING_SPACE_RE.exec(slice) ?? [""])[0].length;
    const trimmedText = slice.trim();

    if (trimmedText.length > 0) {
      chunks.push({
        text: trimmedText,
        sourceOffset: cursor + leadingWhitespace
      });
    }

    cursor = splitIndex;
  }

  if (!chunks.length) {
    chunks.push({
      text: sentenceText.trim(),
      sourceOffset: 0
    });
  }

  return chunks;
}

function findPreferredSplitIndex(text: string, minBreak: number, maxBreak: number) {
  for (let index = maxBreak; index > minBreak; index -= 1) {
    if (SPLIT_PUNCT_RE.test(text[index - 1])) {
      return index;
    }
  }

  for (let index = maxBreak; index > minBreak; index -= 1) {
    if (SPLIT_SPACE_RE.test(text[index - 1])) {
      return index;
    }
  }

  return maxBreak;
}

export function speakSentences(options: SpeakOptions) {
  const synthesis = getSpeechSynthesisSafe();
  if (!synthesis) {
    options.onError("Speech synthesis is not available in this browser.");
    return;
  }

  if (!options.sentences.length) {
    options.onError("No readable text found for Auto-Reader.");
    return;
  }

  activeToken += 1;
  const token = activeToken;
  if (synthesis.speaking || synthesis.pending) {
    synthesis.cancel();
  }

  const voices = synthesis.getVoices();
  const selectedVoice = options.voiceURI
    ? voices.find((voice) => voice.voiceURI === options.voiceURI)
    : undefined;
  const startSentenceIndex = clampIndex(options.startIndex ?? 0, options.sentences.length);
  const requestedStartWord = Math.max(0, options.startWordIndex ?? 0);
  synthesis.resume();

  const playAtIndex = (index: number) => {
    if (token !== activeToken) {
      return;
    }

    if (index >= options.sentences.length) {
      options.onDone();
      return;
    }

    const sentence = options.sentences[index];
    const originalWordRanges = getWordRanges(sentence.text);
    let sentenceText = sentence.text;
    let wordOffset = 0;

    // Resume from a word boundary only for the first sentence of this play session.
    if (
      index === startSentenceIndex &&
      requestedStartWord > 0 &&
      requestedStartWord < originalWordRanges.length
    ) {
      const startCharIndex = originalWordRanges[requestedStartWord].start;
      sentenceText = sentence.text.slice(startCharIndex).trimStart();
      wordOffset = requestedStartWord;
    }

    if (!sentenceText) {
      playAtIndex(index + 1);
      return;
    }

    const wordRanges = getWordRanges(sentenceText);
    const chunks = splitSentenceIntoChunks(sentenceText);
    let chunkIndex = 0;
    let currentWordHint = 0;

    const speakChunk = () => {
      if (token !== activeToken) {
        return;
      }

      if (chunkIndex >= chunks.length) {
        playAtIndex(index + 1);
        return;
      }

      const chunk = chunks[chunkIndex];
      const utterance = new SpeechSynthesisUtterance(chunk.text);
      utterance.rate = options.rate;
      if (selectedVoice) {
        utterance.voice = selectedVoice;
        utterance.lang = selectedVoice.lang;
      }

      let boundarySeen = false;
      let boundaryFallbackTimer: number | undefined;

      const clearBoundaryFallback = () => {
        if (boundaryFallbackTimer !== undefined) {
          window.clearTimeout(boundaryFallbackTimer);
          boundaryFallbackTimer = undefined;
        }
      };

      utterance.onstart = () => {
        if (token !== activeToken) {
          return;
        }
        if (chunkIndex === 0) {
          options.onSentenceStart(sentence.id, sentence.progress);
        }

        if (!options.onWordBoundary || !wordRanges.length) {
          return;
        }

        const onWordBoundary = options.onWordBoundary;

        boundaryFallbackTimer = window.setTimeout(() => {
          if (token !== activeToken || boundarySeen) {
            return;
          }

          const fallbackWordIndex = getWordIndexAtCharIndex(
            wordRanges,
            chunk.sourceOffset,
            currentWordHint
          );
          if (fallbackWordIndex < 0) {
            return;
          }

          currentWordHint = fallbackWordIndex;
          const startWordIndex = Math.max(0, fallbackWordIndex - 1) + wordOffset;
          const endWordIndex = Math.min(wordRanges.length - 1, fallbackWordIndex + 1) + wordOffset;
          onWordBoundary(sentence.id, startWordIndex, endWordIndex);
        }, BOUNDARY_FALLBACK_DELAY_MS);
      };

      utterance.onboundary = (event) => {
        if (token !== activeToken || !options.onWordBoundary) {
          return;
        }
        boundarySeen = true;
        clearBoundaryFallback();

        const globalCharIndex = chunk.sourceOffset + (event.charIndex ?? 0);
        const currentWordIndex = getWordIndexAtCharIndex(wordRanges, globalCharIndex, currentWordHint);
        if (currentWordIndex < 0) {
          return;
        }

        currentWordHint = currentWordIndex;
        const startWordIndex = Math.max(0, currentWordIndex - 2) + wordOffset;
        const endWordIndex = Math.min(wordRanges.length - 1, currentWordIndex + 2) + wordOffset;
        options.onWordBoundary(sentence.id, startWordIndex, endWordIndex);
      };

      utterance.onend = () => {
        if (token !== activeToken) {
          return;
        }
        clearBoundaryFallback();
        chunkIndex += 1;
        speakChunk();
      };

      utterance.onerror = () => {
        if (token !== activeToken) {
          return;
        }

        clearBoundaryFallback();

        options.onError("The browser failed while speaking this text.");
      };

      synthesis.speak(utterance);
    };

    speakChunk();
  };

  playAtIndex(startSentenceIndex);
}

function clampIndex(index: number, length: number) {
  if (length <= 0) {
    return 0;
  }

  return Math.min(Math.max(index, 0), length - 1);
}
