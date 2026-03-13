"use client";

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
    setParserMode
  } = useReader();

  return (
    <main className="reader-area">
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
        <article className="reader-column">
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
              <div className="reader-parser-actions">
                <button
                  type="button"
                  className={parserMode === "adaptive" ? "primary-button" : "secondary-button"}
                  onClick={() => setParserMode("adaptive")}
                >
                  Adaptive
                </button>
                <button
                  type="button"
                  className={parserMode === "fallback" ? "primary-button" : "secondary-button"}
                  onClick={() => setParserMode("fallback")}
                >
                  Conservative
                </button>
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

