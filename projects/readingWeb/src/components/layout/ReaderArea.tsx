"use client";

import { useCallback, useEffect, useRef, type CSSProperties } from "react";
import { useReader } from "../../context/ReaderContext";

export function ReaderArea() {
  const {
    status,
    error,
    blocks,
    fileName,
    parsed,
    parserMode,
    parserConfidence,
    parserSummary,
    fontSize,
    pendingSeekProgress,
    clearPendingSeekProgress,
    updateReadingProgress
  } = useReader();
  const scrollRef = useRef<HTMLElement | null>(null);
  const frameRef = useRef<number | null>(null);

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
    });
  }, [status, updateReadingProgress]);

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
          <h1>Drag &amp; Drop PDF</h1>
          <p>Or click the button above to upload a chapter and start reading.</p>
        </div>
      )}

      {status === "loading" && (
        <div className="reader-empty-state">
          <h1>Preparing your chapter…</h1>
          <p>We&apos;re cleansing headers, footers, and reflowing text.</p>
        </div>
      )}

      {status === "error" && (
        <div className="reader-empty-state">
          <h1>Sorry, something went wrong.</h1>
          <p>{error ?? "Unable to open this PDF."}</p>
        </div>
      )}

      {status === "ready" && (
        <article
          className="reader-column"
          style={{ "--reader-font-size": `${fontSize}px` } as CSSProperties}
        >
          {fileName && <h1 className="reader-title">{fileName}</h1>}
          {parsed && (
            <section
              className={`reader-parser-banner reader-parser-banner-${parserConfidence ?? "high"}`}
            >
              <div>
                <strong>
                  {parserMode === "adaptive" ? "Adaptive" : "Conservative"} mode
                </strong>
                {parserSummary && <p>{parserSummary}</p>}
              </div>
            </section>
          )}
          {blocks.map((block) => {
            if (block.kind === "paragraph") {
              return (
                <p
                  key={block.id}
                  className={`reader-paragraph indent-${block.indentLevel}`}
                >
                  {block.text}
                </p>
              );
            }

            if (block.kind === "heading") {
              const HeadingTag = block.level === 1 ? "h2" : block.level === 2 ? "h3" : "h4";
              return (
                <HeadingTag
                  key={block.id}
                  className={`reader-heading reader-heading-${block.level} align-${block.align}`}
                >
                  {block.text}
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

