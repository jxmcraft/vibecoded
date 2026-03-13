"use client";

import { useReader } from "../../context/ReaderContext";

export function BottomBar() {
  const {
    fileName,
    fontSize,
    readingProgress,
    seekToProgress,
    setFontSize,
    status
  } = useReader();

  return (
    <footer className="bottom-bar">
      <div className="progress-controls">
        <div className="progress-meta">
          <span className="label">Reading progress</span>
          <strong>{status === "ready" ? `${readingProgress.toFixed(1)}%` : "No document"}</strong>
          <span className="progress-caption">
            {fileName ? `Resume is automatic for ${fileName}.` : "Open a PDF to track your place."}
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
          disabled={status !== "ready"}
        />
      </div>
      <div className="font-controls">
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
  );
}

