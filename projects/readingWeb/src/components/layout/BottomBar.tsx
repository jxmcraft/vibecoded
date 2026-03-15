"use client";

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { useReader } from "../../context/ReaderContext";

type FastReaderWordUnit = {
  kind: "word";
  value: string;
  progress: number;
  isSentenceEnd: boolean;
  wordIndex: number;
};

type FastReaderImageUnit = {
  kind: "image";
  dataUrl: string;
  progress: number;
};

type FastReaderUnit = FastReaderWordUnit | FastReaderImageUnit;

type FastReaderSequence = {
  units: FastReaderUnit[];
  totalWords: number;
};

const DEFAULT_FAST_WPM = 280;
const MIN_FAST_WPM = 100;
const MAX_FAST_WPM = 800;
const SLOW_MODE_FACTOR = 0.5;

export function BottomBar() {
  const {
    fileName,
    blocks,
    fontFamily,
    fontSize,
    readingProgress,
    resumePrompt,
    resumeFromLastPosition,
    dismissResumePrompt,
    seekToProgress,
    setFontFamily,
    setFontSize,
    status,
    ttsSupported,
    ttsStatus,
    ttsRate,
    ttsError,
    playTts,
    pauseTts,
    resumeTts,
    setTtsRate,
    stopTts
  } = useReader();

  const readerReady = status === "ready";
  const canPlay = readerReady && ttsSupported;
  const playLabel = ttsStatus === "playing" ? "Pause" : "Play";
  const fastSequence = useMemo(() => buildFastSequence(blocks), [blocks]);
  const fastUnits = fastSequence.units;
  const fastWordsTotal = fastSequence.totalWords;

  const [fastReaderOpen, setFastReaderOpen] = useState(false);
  const [fastReaderPlaying, setFastReaderPlaying] = useState(false);
  const [fastReaderWpm, setFastReaderWpm] = useState(DEFAULT_FAST_WPM);
  const [fastReaderSentencePauseMs, setFastReaderSentencePauseMs] = useState(0);
  const [fastReaderIndex, setFastReaderIndex] = useState(0);
  const [fastReaderLastWordProgress, setFastReaderLastWordProgress] = useState(0);
  const [fastReaderSlowMode, setFastReaderSlowMode] = useState(false);
  const [fastReaderImagePaused, setFastReaderImagePaused] = useState(false);

  const effectiveFastWpm = useMemo(
    () =>
      Math.max(
        MIN_FAST_WPM,
        Math.round(fastReaderWpm * (fastReaderSlowMode ? SLOW_MODE_FACTOR : 1))
      ),
    [fastReaderSlowMode, fastReaderWpm]
  );

  const closeFastReader = useCallback(() => {
    const currentUnit = fastUnits[Math.min(fastReaderIndex, Math.max(0, fastUnits.length - 1))];
    const targetProgress =
      currentUnit?.kind === "word"
        ? currentUnit.progress
        : Math.max(fastReaderLastWordProgress, currentUnit?.progress ?? 0);
    if (currentUnit) {
      // On exit, jump reader view to the last RSVP position.
      seekToProgress(targetProgress);
    }
    setFastReaderPlaying(false);
    setFastReaderSlowMode(false);
    setFastReaderImagePaused(false);
    setFastReaderOpen(false);
  }, [fastReaderIndex, fastReaderLastWordProgress, fastUnits, seekToProgress]);

  useEffect(() => {
    const currentUnit = fastUnits[Math.min(fastReaderIndex, Math.max(0, fastUnits.length - 1))];
    if (currentUnit?.kind === "word") {
      setFastReaderLastWordProgress(currentUnit.progress);
    }
  }, [fastReaderIndex, fastUnits]);

  const fastReaderEtaMs = useMemo(() => {
    if (!fastUnits.length) {
      return 0;
    }

    const msPerWord = Math.max(30, Math.round(60000 / effectiveFastWpm));
    const startIndex = Math.min(Math.max(fastReaderIndex, 0), fastUnits.length - 1);
    const transitionCount = Math.max(0, fastUnits.length - startIndex - 1);
    if (transitionCount <= 0) {
      return 0;
    }

    let pauseCount = 0;
    for (let index = startIndex; index < fastUnits.length - 1; index += 1) {
      const unit = fastUnits[index];
      if (unit?.kind === "word" && unit.isSentenceEnd) {
        pauseCount += 1;
      }
    }

    return transitionCount * msPerWord + pauseCount * fastReaderSentencePauseMs;
  }, [effectiveFastWpm, fastReaderIndex, fastReaderSentencePauseMs, fastUnits]);

  useEffect(() => {
    if (!fastReaderOpen || !fastReaderPlaying || fastUnits.length === 0) {
      return;
    }

    const current = fastUnits[Math.min(fastReaderIndex, fastUnits.length - 1)];
    if (!current) {
      return;
    }

    if (current.kind === "image") {
      setFastReaderImagePaused(true);
      setFastReaderPlaying(false);
      return;
    }

    setFastReaderImagePaused(false);
    const msPerWord = Math.max(30, Math.round(60000 / effectiveFastWpm));
    const extraPause = current.isSentenceEnd ? fastReaderSentencePauseMs : 0;
    const timer = window.setTimeout(() => {
      const atEnd = fastReaderIndex >= fastUnits.length - 1;
      if (atEnd) {
        closeFastReader();
        return;
      }

      const nextIndex = Math.min(fastReaderIndex + 1, fastUnits.length - 1);
      setFastReaderIndex(nextIndex);
    }, msPerWord + extraPause);

    return () => window.clearTimeout(timer);
  }, [
    closeFastReader,
    effectiveFastWpm,
    fastReaderIndex,
    fastUnits,
    fastReaderOpen,
    fastReaderPlaying,
    fastReaderSentencePauseMs,
  ]);

  useEffect(() => {
    if (!fastReaderOpen) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeFastReader();
        return;
      }

      if (event.key === " ") {
        event.preventDefault();
        if (event.repeat) {
          return;
        }
        setFastReaderPlaying((prev) => !prev);
        return;
      }

      if (event.key === "Shift") {
        setFastReaderSlowMode(true);
      }
    }

    function onKeyUp(event: KeyboardEvent) {
      if (event.key === "Shift") {
        setFastReaderSlowMode(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [closeFastReader, fastReaderOpen]);

  function handlePlayToggle() {
    if (!canPlay) {
      return;
    }

    if (ttsStatus === "playing") {
      pauseTts();
      return;
    }

    if (ttsStatus === "paused") {
      resumeTts();
      return;
    }

    playTts();
  }

  function openFastReader() {
    if (!readerReady || fastUnits.length === 0) {
      return;
    }

    stopTts();
    const startIndex = findFastWordIndexForProgress(fastUnits, readingProgress);
    setFastReaderIndex(startIndex);
    setFastReaderLastWordProgress(readingProgress);
    setFastReaderImagePaused(false);
    setFastReaderSlowMode(false);
    setFastReaderOpen(true);
    // Open paused by default so playback only starts on explicit user action.
    setFastReaderPlaying(false);
  }

  function continueAfterImage() {
    const atEnd = fastReaderIndex >= fastUnits.length - 1;
    if (atEnd) {
      closeFastReader();
      return;
    }

    setFastReaderImagePaused(false);
    setFastReaderIndex((prev) => Math.min(prev + 1, fastUnits.length - 1));
    setFastReaderPlaying(true);
  }

  function handleStopTts() {
    stopTts();
  }

  const currentFastUnit = fastUnits[fastReaderIndex];
  const currentFastWord = currentFastUnit?.kind === "word" ? currentFastUnit.value : "";
  const currentFastImage = currentFastUnit?.kind === "image" ? currentFastUnit.dataUrl : undefined;
  const currentWordIndex =
    currentFastUnit?.kind === "word"
      ? currentFastUnit.wordIndex + 1
      : findPreviousWordIndex(fastUnits, fastReaderIndex) + 1;
  const fastReaderPercent =
    fastUnits.length > 0 ? ((fastReaderIndex + 1) / fastUnits.length) * 100 : 0;

  return (
    <>
      {fastReaderOpen && (
        <section className="fast-reader-overlay" aria-live="polite">
          <div
            className="fast-reader-stage"
            role="dialog"
            aria-label="Fast Reader mode"
            style={{ "--reader-font-family": mapFontFamily(fontFamily) } as CSSProperties}
          >
            <div className="fast-reader-word-wrap">
              {currentFastImage ? (
                <figure className="fast-reader-image-wrap">
                  <img className="fast-reader-image" src={currentFastImage} alt="Inline novel illustration" />
                  <figcaption>
                    Image pause. Continue when you are ready.
                  </figcaption>
                </figure>
              ) : (
                <span className="fast-reader-word">{currentFastWord || "-"}</span>
              )}
            </div>
            <div className="fast-reader-controls">
              <button
                type="button"
                className="primary-button"
                onClick={() => setFastReaderPlaying((prev) => !prev)}
                disabled={fastUnits.length === 0 || Boolean(currentFastImage)}
              >
                {fastReaderPlaying ? "Pause" : "Play"}
              </button>
              {currentFastImage && (
                <button type="button" className="primary-button" onClick={continueAfterImage}>
                  Continue
                </button>
              )}
              <button type="button" className="secondary-button" onClick={closeFastReader}>
                Close
              </button>
              <label className="fast-reader-wpm" htmlFor="fast-reader-wpm">
                WPM {fastReaderWpm}{fastReaderSlowMode ? ` (slow ${effectiveFastWpm})` : ""}
              </label>
              <input
                id="fast-reader-wpm"
                type="range"
                min={MIN_FAST_WPM}
                max={MAX_FAST_WPM}
                step={10}
                value={fastReaderWpm}
                onChange={(event) => setFastReaderWpm(Number(event.target.value))}
                aria-label="Fast Reader speed"
              />
              <label className="fast-reader-sentence-pause" htmlFor="fast-reader-sentence-pause">
                Sentence pause {fastReaderSentencePauseMs}ms
              </label>
              <input
                id="fast-reader-sentence-pause"
                className="fast-reader-pause-slider"
                type="range"
                min={0}
                max={1000}
                step={50}
                value={fastReaderSentencePauseMs}
                onChange={(event) => setFastReaderSentencePauseMs(Number(event.target.value))}
                aria-label="Pause after sentence"
              />
              <span className={`fast-reader-slow-indicator ${fastReaderSlowMode ? "is-active" : ""}`}>
                Hold Shift to slow down
              </span>
              {fastReaderImagePaused && (
                <span className="fast-reader-image-indicator">Paused on image</span>
              )}
              <span className="fast-reader-counter">
                {fastWordsTotal > 0 ? `${currentWordIndex}/${fastWordsTotal} words` : "0 words"}
              </span>
              <div
                className="fast-reader-progress"
                role="progressbar"
                aria-label="Fast Reader progress"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(fastReaderPercent)}
              >
                <div
                  className="fast-reader-progress-fill"
                  style={{ width: `${Math.min(100, Math.max(0, fastReaderPercent))}%` }}
                />
              </div>
              <span className="fast-reader-eta">Est. time left: {formatEta(fastReaderEtaMs)}</span>
            </div>
          </div>
        </section>
      )}

      <footer className="bottom-bar">
        {resumePrompt && (
          <section className="bottom-resume-prompt" aria-live="polite">
            <p className="bottom-resume-title">
              Continue where you left off{resumePrompt.fileName ? ` in ${resumePrompt.fileName}` : ""}?
            </p>
            <p className="bottom-resume-meta">
              Saved at {resumePrompt.progress.toFixed(1)}%
              {resumePrompt.updatedAt ? ` • ${formatResumeTimestamp(resumePrompt.updatedAt)}` : ""}
            </p>
            <div className="bottom-resume-actions">
              <button className="primary-button" type="button" onClick={resumeFromLastPosition}>
                Resume from {resumePrompt.progress.toFixed(1)}%
              </button>
              <button
                className="secondary-button"
                type="button"
                onClick={() => dismissResumePrompt(true)}
              >
                Start from beginning
              </button>
              <button
                className="secondary-button"
                type="button"
                onClick={() => dismissResumePrompt(false)}
              >
                Stay at current position
              </button>
            </div>
          </section>
        )}

        <div className="progress-controls">
          <div className="progress-meta">
            <span className="label">Reading progress</span>
            <strong>{readerReady ? `${readingProgress.toFixed(1)}%` : "No document"}</strong>
            <span className="progress-caption">
              {fileName ? `Resume is automatic for ${fileName}.` : "Open a file to track your place."}
            </span>
          </div>
          <input
            aria-label="Reading progress"
            className="progress-slider"
            type="range"
            min={0}
            max={100}
            step={0.1}
            value={readingProgress}
            onChange={(event) => seekToProgress(Number(event.target.value))}
            disabled={!readerReady}
          />
          <div className="progress-player-row">
            <button
              className={`player-play-button ${ttsStatus === "playing" ? "is-playing" : ""}`}
              type="button"
              onClick={handlePlayToggle}
              disabled={!canPlay}
            >
              {playLabel}
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={handleStopTts}
              disabled={!canPlay || ttsStatus === "stopped" || ttsStatus === "idle"}
            >
              Stop
            </button>
            <label className="tts-rate-inline" htmlFor="tts-rate-inline">
              {ttsRate.toFixed(1)}x
            </label>
            <input
              id="tts-rate-inline"
              className="tts-rate-slider"
              type="range"
              min={0.5}
              max={3}
              step={0.1}
              value={ttsRate}
              onChange={(event) => setTtsRate(Number(event.target.value))}
              aria-label="Auto-Reader speed"
              disabled={!canPlay}
            />
            <button
              className="secondary-button"
              type="button"
              onClick={openFastReader}
              disabled={!readerReady || fastUnits.length === 0}
            >
              Fast Reader
            </button>
            <span className="tts-status">{canPlay ? ttsStatus : "Unavailable"}</span>
          </div>
          {ttsError && <span className="tts-error">{ttsError}</span>}
        </div>
        <div className="font-controls">
          <span className="label">Font</span>
          <select
            aria-label="Reading font"
            value={fontFamily}
            onChange={(event) => setFontFamily(event.target.value as typeof fontFamily)}
          >
            <option value="serif">Serif</option>
            <option value="sans">Sans</option>
            <option value="mono">Monospace</option>
            <option value="dyslexic">Readable</option>
          </select>
          <span className="label">Font size</span>
          <strong>{fontSize}px</strong>
          <input
            aria-label="Font size"
            type="range"
            min={14}
            max={28}
            step={1}
            value={fontSize}
            onChange={(event) => setFontSize(Number(event.target.value))}
          />
        </div>
      </footer>
    </>
  );
}

function buildFastSequence(
  blocks: Array<{ kind: string; text?: string; dataUrl?: string }>
): FastReaderSequence {
  const draftUnits: Array<
    | { kind: "word"; value: string; isSentenceEnd: boolean; wordIndex: number }
    | { kind: "image"; dataUrl: string; wordOffsetBefore: number }
  > = [];

  let wordCount = 0;
  for (const block of blocks) {
    if ((block.kind === "paragraph" || block.kind === "heading") && block.text) {
      const words = block.text
        .split(/\s+/)
        .map((word) => word.trim())
        .filter(Boolean);

      for (const word of words) {
        draftUnits.push({
          kind: "word",
          value: word,
          isSentenceEnd: /[.!?]["')\]]*$/.test(word),
          wordIndex: wordCount
        });
        wordCount += 1;
      }
      continue;
    }

    if (block.kind === "image" && block.dataUrl) {
      draftUnits.push({
        kind: "image",
        dataUrl: block.dataUrl,
        wordOffsetBefore: wordCount
      });
    }
  }

  if (!draftUnits.length) {
    return { units: [], totalWords: 0 };
  }

  const totalImages = draftUnits.filter((unit) => unit.kind === "image").length;
  let imageIndex = 0;

  const units: FastReaderUnit[] = draftUnits.map((unit) => {
    if (unit.kind === "word") {
      const progress =
        wordCount <= 1 ? 0 : (unit.wordIndex / (wordCount - 1)) * 100;

      return {
        kind: "word",
        value: unit.value,
        progress,
        isSentenceEnd: unit.isSentenceEnd,
        wordIndex: unit.wordIndex
      };
    }

    imageIndex += 1;
    const progress =
      wordCount > 0
        ? clamp((unit.wordOffsetBefore / Math.max(1, wordCount - 1)) * 100, 0, 100)
        : totalImages <= 1
          ? 0
          : ((imageIndex - 1) / (totalImages - 1)) * 100;

    return {
      kind: "image",
      dataUrl: unit.dataUrl,
      progress
    };
  });

  return {
    units,
    totalWords: wordCount
  };
}

function findFastWordIndexForProgress(units: FastReaderUnit[], progress: number) {
  if (!units.length) {
    return 0;
  }

  const clampedProgress = Math.min(Math.max(progress, 0), 100);
  let closestIndex = 0;
  let closestDelta = Math.abs(units[0].progress - clampedProgress);

  for (let index = 1; index < units.length; index += 1) {
    const delta = Math.abs(units[index].progress - clampedProgress);
    if (delta < closestDelta) {
      closestDelta = delta;
      closestIndex = index;
    }
  }

  return closestIndex;
}

function formatEta(ms: number) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, "0")}h ${minutes
    .toString()
    .padStart(2, "0")}m ${seconds.toString().padStart(2, "0")}s`;
}

function formatResumeTimestamp(updatedAt: number) {
  const date = new Date(updatedAt);
  if (Number.isNaN(date.getTime())) {
    return "saved earlier";
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    day: "numeric"
  }).format(date);
}

function mapFontFamily(fontFamily: "serif" | "sans" | "mono" | "dyslexic") {
  if (fontFamily === "sans") {
    return '"Avenir Next", "Segoe UI", Helvetica, Arial, sans-serif';
  }
  if (fontFamily === "mono") {
    return '"Iosevka", "SF Mono", Menlo, Monaco, Consolas, "Liberation Mono", monospace';
  }
  if (fontFamily === "dyslexic") {
    return '"Atkinson Hyperlegible", "Trebuchet MS", Verdana, sans-serif';
  }
  return '"Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", serif';
}

function findPreviousWordIndex(units: FastReaderUnit[], index: number) {
  for (let cursor = Math.min(index, units.length - 1); cursor >= 0; cursor -= 1) {
    const unit = units[cursor];
    if (unit?.kind === "word") {
      return unit.wordIndex;
    }
  }

  return 0;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

