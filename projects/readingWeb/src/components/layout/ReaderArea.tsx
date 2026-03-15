"use client";

import { useCallback, useEffect, useMemo, useRef, type CSSProperties } from "react";
import { useReader } from "../../context/ReaderContext";
import { splitTextIntoSentences } from "@/lib/tts/sentences";

export function ReaderArea() {
  const {
    status,
    loadingPhase,
    loadingProgress,
    error,
    blocks,
    fileName,
    parsed,
    parserMode,
    parserConfidence,
    parserSummary,
    fontFamily,
    fontSize,
    pendingSeekProgress,
    clearPendingSeekProgress,
    updateReadingProgress,
    ttsCurrentSentenceId,
    ttsWordWindow,
    ttsAutoScroll,
    ttsStatus,
    ttsSelectedSentenceId,
    ttsHighlightColor,
    setTtsVisibleSentence,
    selectTtsSentence,
  } = useReader();
  const scrollRef = useRef<HTMLElement | null>(null);
  const frameRef = useRef<number | null>(null);

  // Pre-compute sentences once per blocks array — avoids re-splitting on every TTS highlight update.
  const sentencesByBlockId = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const block of blocks) {
      if (block.kind === "paragraph" || block.kind === "heading") {
        map.set(block.id, splitTextIntoSentences(block.text ?? ""));
      }
    }
    return map;
  }, [blocks]);

  useEffect(() => {
    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  const scheduleProgressRead = useCallback(() => {
    if (status !== "ready") {
      return;
    }

    if (frameRef.current !== null) {
      return;
    }

    frameRef.current = window.requestAnimationFrame(() => {
      const container = scrollRef.current;
      frameRef.current = null;

      if (!container) {
        return;
      }

      updateReadingProgress(readProgressFromViewport(container));
      setTtsVisibleSentence(findVisibleSentenceId(container));
    });
  }, [setTtsVisibleSentence, status, updateReadingProgress]);

  useEffect(() => {
    if (status !== "ready") {
      return;
    }

    const container = scrollRef.current;
    if (!container) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      setTtsVisibleSentence(findVisibleSentenceId(container));
    });

    return () => window.cancelAnimationFrame(frame);
  }, [blocks.length, setTtsVisibleSentence, status]);

  useEffect(() => {
    if (status !== "ready" || ttsStatus !== "playing" || !ttsAutoScroll || !ttsCurrentSentenceId) {
      return;
    }

    const container = scrollRef.current;
    if (!container) {
      return;
    }

    let cancelled = false;
    let frame = 0;
    let attempts = 0;
    const maxAttempts = 6;

    const scrollToCurrentSentence = () => {
      if (cancelled) {
        return;
      }

      const sentenceElement = findSentenceElement(container, ttsCurrentSentenceId);
      if (sentenceElement) {
        centerSentence(container, sentenceElement);
        return;
      }

      attempts += 1;
      if (attempts >= maxAttempts) {
        return;
      }

      frame = window.requestAnimationFrame(scrollToCurrentSentence);
    };

    frame = window.requestAnimationFrame(scrollToCurrentSentence);

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
    };
  }, [status, ttsAutoScroll, ttsCurrentSentenceId, ttsStatus]);

  useEffect(() => {
    if (status !== "ready") {
      return;
    }

    function onWindowScroll() {
      const container = scrollRef.current;
      if (!container || isContainerScrollable(container)) {
        return;
      }

      scheduleProgressRead();
    }

    window.addEventListener("scroll", onWindowScroll, { passive: true });
    return () => window.removeEventListener("scroll", onWindowScroll);
  }, [scheduleProgressRead, status]);

  useEffect(() => {
    if (status !== "ready" || pendingSeekProgress === undefined) {
      return;
    }

    const container = scrollRef.current;
    if (!container) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      if (isContainerScrollable(container)) {
        container.scrollTop = getScrollTopForProgress(container, pendingSeekProgress);
      } else {
        const target = getWindowScrollTopForProgress(pendingSeekProgress);
        window.scrollTo({ top: target, behavior: "auto" });
      }

      clearPendingSeekProgress();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [blocks.length, clearPendingSeekProgress, pendingSeekProgress, status]);

  function handleScroll() {
    scheduleProgressRead();
  }

  return (
    <main ref={scrollRef} className="reader-area" onScroll={handleScroll}>
      {status === "idle" && (
        <div className="reader-empty-state">
          <h1>Drag &amp; Drop File</h1>
          <p>Or click the button above to upload a chapter and start reading.</p>
        </div>
      )}

      {status === "loading" && (
        <div className="reader-empty-state">
          <h1>Preparing your chapter…</h1>
          <p>{getLoadingPhaseMessage(loadingPhase)}</p>
          {typeof loadingProgress === "number" && (
            <div className="loading-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={loadingProgress}>
              <div className="loading-progress-fill" style={{ width: `${Math.min(100, Math.max(0, loadingProgress))}%` }} />
              <span>{loadingProgress}%</span>
            </div>
          )}
        </div>
      )}

      {status === "error" && (
        <div className="reader-empty-state">
          <h1>Sorry, something went wrong.</h1>
          <p>{error ?? "Unable to open this file."}</p>
        </div>
      )}

      {status === "ready" && (
        <article
          className="reader-column"
          style={{
            "--reader-font-size": `${fontSize}px`,
            "--reader-font-family": mapFontFamily(fontFamily),
            "--tts-highlight-color": ttsHighlightColor
          } as CSSProperties}
        >
          {fileName && <h1 className="reader-title">{fileName}</h1>}
          {parsed && (
            <section
              className={`reader-parser-banner reader-parser-banner-${parserConfidence ?? "high"}`}
            >
              <div>
                <strong>
                  {parserMode === "adaptive" ? "Smart" : "Exact"} mode
                </strong>
                {parserSummary && <p>{parserSummary}</p>}
              </div>
            </section>
          )}
          {blocks.map((block) => {
            if (block.kind === "paragraph") {
              const sentences = sentencesByBlockId.get(block.id) ?? [];
              return (
                <p
                  key={block.id}
                  className={`reader-paragraph indent-${block.indentLevel}`}
                >
                  {sentences.length > 0
                    ? sentences.map((sentence, sentenceIndex) => {
                        const sentenceId = `sentence-${block.id}-${sentenceIndex}`;
                        const isActive = ttsCurrentSentenceId === sentenceId;
                        const isSelected = ttsSelectedSentenceId === sentenceId;
                        return (
                          <span
                            key={sentenceId}
                            id={sentenceId}
                            data-sentence-id={sentenceId}
                            className={[
                              "reader-sentence",
                              isActive ? "is-active" : "",
                              isSelected ? "is-selected" : ""
                            ]
                              .filter(Boolean)
                              .join(" ")}
                            onClick={() => selectTtsSentence(sentenceId)}
                          >
                            {renderSentenceTokens(sentence, sentenceId, ttsWordWindow)}
                          </span>
                        );
                      })
                    : block.text}
                </p>
              );
            }

            if (block.kind === "heading") {
              const HeadingTag = block.level === 1 ? "h2" : block.level === 2 ? "h3" : "h4";
              const sentences = sentencesByBlockId.get(block.id) ?? [];
              return (
                <HeadingTag
                  key={block.id}
                  className={`reader-heading reader-heading-${block.level} align-${block.align}`}
                >
                  {sentences.length > 0
                    ? sentences.map((sentence, sentenceIndex) => {
                        const sentenceId = `sentence-${block.id}-${sentenceIndex}`;
                        const isActive = ttsCurrentSentenceId === sentenceId;
                        const isSelected = ttsSelectedSentenceId === sentenceId;
                        return (
                          <span
                            key={sentenceId}
                            id={sentenceId}
                            data-sentence-id={sentenceId}
                            className={[
                              "reader-sentence",
                              isActive ? "is-active" : "",
                              isSelected ? "is-selected" : ""
                            ]
                              .filter(Boolean)
                              .join(" ")}
                            onClick={() => selectTtsSentence(sentenceId)}
                          >
                            {renderSentenceTokens(sentence, sentenceId, ttsWordWindow)}
                          </span>
                        );
                      })
                    : block.text}
                </HeadingTag>
              );
            }

            if (block.kind === "page-marker") {
              return (
                <div key={block.id} className="reader-page-marker" aria-label={block.label}>
                  <span>{block.label}</span>
                </div>
              );
            }

            return (
              <figure key={block.id}>
                <img src={block.dataUrl} alt="" className="reader-image" />
              </figure>
            );
          })}
        </article>
      )}
    </main>
  );
}

function readProgressFromViewport(container: HTMLElement) {
  if (isContainerScrollable(container)) {
    return getContainerProgress(container);
  }

  const root = document.documentElement;
  const maxScrollTop = Math.max(root.scrollHeight - window.innerHeight, 0);
  if (maxScrollTop <= 0) {
    return 0;
  }

  return (window.scrollY / maxScrollTop) * 100;
}

function isContainerScrollable(container: HTMLElement) {
  return container.scrollHeight - container.clientHeight > 8;
}

function getContainerProgress(container: HTMLElement) {
  const maxScrollTop = Math.max(container.scrollHeight - container.clientHeight, 0);
  if (maxScrollTop <= 0) {
    return 0;
  }

  return (container.scrollTop / maxScrollTop) * 100;
}

function getScrollTopForProgress(container: HTMLElement, progress: number) {
  const maxScrollTop = Math.max(container.scrollHeight - container.clientHeight, 0);
  if (maxScrollTop <= 0) {
    return 0;
  }

  return (progress / 100) * maxScrollTop;
}

function getWindowScrollTopForProgress(progress: number) {
  const root = document.documentElement;
  const maxScrollTop = Math.max(root.scrollHeight - window.innerHeight, 0);
  if (maxScrollTop <= 0) {
    return 0;
  }

  return (progress / 100) * maxScrollTop;
}

function tokenizeSentence(sentence: string): string[] {
  const parts = sentence.split(/(\s+)/).filter((part) => part.length > 0);
  return parts;
}

function renderSentenceTokens(
  sentence: string,
  sentenceId: string,
  wordWindow:
    | {
        sentenceId: string;
        startWordIndex: number;
        endWordIndex: number;
      }
    | undefined
) {
  const tokens = tokenizeSentence(sentence);
  let wordIndex = -1;

  return tokens.map((token, tokenIndex) => {
    const isWhitespace = /^\s+$/.test(token);
    if (!isWhitespace) {
      wordIndex += 1;
    }

    const windowForSentence = wordWindow?.sentenceId === sentenceId ? wordWindow : undefined;
    const tokenWordIndex = isWhitespace ? wordIndex : wordIndex;

    const inWindow =
      tokenWordIndex >= 0 &&
      Boolean(windowForSentence) &&
      (windowForSentence?.startWordIndex ?? 0) <= tokenWordIndex &&
      (windowForSentence?.endWordIndex ?? -1) >= tokenWordIndex;

    return (
      <span
        key={`${sentenceId}-word-${tokenIndex}`}
        className={inWindow ? "reader-word is-hot" : "reader-word"}
      >
        {token}
      </span>
    );
  });
}

function getLoadingPhaseMessage(phase: string | undefined) {
  if (phase === "loading-document") {
    return "Loading file…";
  }
  if (phase === "using-cache") {
    return "Using cached parse for faster startup…";
  }
  if (phase === "reading-text") {
    return "Extracting text blocks from pages…";
  }
  if (phase === "cleansing") {
    return "Cleansing headers/footers and reflowing text…";
  }
  if (phase === "extracting-images") {
    return "Collecting inline images…";
  }
  if (phase === "saving-library") {
    return "Saving this file to your local library…";
  }
  return "Preparing your chapter…";
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


function findVisibleSentenceId(container: HTMLElement) {
  const sentences = container.querySelectorAll<HTMLElement>("[data-sentence-id]");
  if (!sentences.length) {
    return undefined;
  }

  const viewportCenter = getViewportCenterY(container);
  let bestId: string | undefined;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const sentence of sentences) {
    const rect = sentence.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > window.innerHeight) {
      continue;
    }

    const center = rect.top + rect.height / 2;
    const distance = Math.abs(center - viewportCenter);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestId = sentence.dataset.sentenceId;
    }
  }

  return bestId;
}

function getViewportCenterY(container: HTMLElement) {
  if (isContainerScrollable(container)) {
    const rect = container.getBoundingClientRect();
    return rect.top + rect.height / 2;
  }

  return window.innerHeight / 2;
}

function centerSentence(container: HTMLElement, sentenceElement: HTMLElement) {
  if (isContainerScrollable(container)) {
    const containerRect = container.getBoundingClientRect();
    const sentenceRect = sentenceElement.getBoundingClientRect();
    const offsetWithinContainer =
      sentenceRect.top - containerRect.top + container.scrollTop + sentenceRect.height / 2;
    const target = Math.max(0, offsetWithinContainer - container.clientHeight / 2);
    container.scrollTo({ top: target, behavior: "auto" });
    return;
  }

  const sentenceRect = sentenceElement.getBoundingClientRect();
  const target = window.scrollY + sentenceRect.top + sentenceRect.height / 2 - window.innerHeight / 2;
  window.scrollTo({ top: Math.max(0, target), behavior: "auto" });
}

function findSentenceElement(container: HTMLElement, sentenceId: string) {
  const sentences = container.querySelectorAll<HTMLElement>("[data-sentence-id]");
  for (const sentence of sentences) {
    if (sentence.dataset.sentenceId === sentenceId) {
      return sentence;
    }
  }

  return undefined;
}

