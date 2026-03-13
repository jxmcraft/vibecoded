"use client";

import { useRef } from "react";
import { useReader } from "../../context/ReaderContext";

export function TopBar() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { loadFile } = useReader();

  function handleClickUpload() {
    inputRef.current?.click();
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      // Basic validation; a richer error surface lives in ReaderArea.
      alert("Please select a PDF file.");
      return;
    }
    await loadFile(file);
  }

  return (
    <header className="top-bar">
      <div className="top-bar-left">
        <span className="logo">NovelFlow</span>
        <button className="primary-button" type="button" onClick={handleClickUpload}>
          Upload PDF
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
      </div>
      <div className="top-bar-right">
        <button aria-label="Light theme" className="icon-button">
          ☀️
        </button>
        <button aria-label="Dark theme" className="icon-button">
          🌙
        </button>
        <button aria-label="Greyscale theme" className="icon-button">
          B/W
        </button>
      </div>
    </header>
  );
}

