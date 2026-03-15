"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { useReader } from "../../context/ReaderContext";

export function TopBar() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const {
    loadFile,
    setTheme,
    theme,
    toggleSidebar,
    sidebarCollapsed,
    persistUploadsToLibrary,
    setPersistUploadsToLibrary
  } = useReader();

  function handleClickUpload() {
    inputRef.current?.click();
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.target;
    const file = input.files?.[0];
    if (!file) return;

    try {
      const lowerName = file.name.toLowerCase();
      const isPdf = file.type === "application/pdf" || lowerName.endsWith(".pdf");
      const isEpub = file.type === "application/epub+zip" || lowerName.endsWith(".epub");
      if (!isPdf && !isEpub) {
        alert("Please select a PDF or EPUB file.");
        return;
      }

      const docId = await loadFile(file);
      if (docId) {
        router.push(`/reader/${encodeURIComponent(docId)}`);
      }
    } finally {
      input.value = "";
    }
  }

  return (
    <header className="top-bar">
      <div className="top-bar-left">
        <button
          className={`secondary-button topbar-collapse-button ${sidebarCollapsed ? "is-active" : ""}`}
          type="button"
          onClick={toggleSidebar}
          aria-label={sidebarCollapsed ? "Expand left sidebar" : "Collapse left sidebar"}
        >
          {sidebarCollapsed ? "Show" : "Hide"}
        </button>
        <span className="logo">NovelFlow</span>
        <button className="primary-button" type="button" onClick={handleClickUpload}>
          Upload File
        </button>
        <button className="secondary-button" type="button" onClick={() => router.push("/library")}>
          Library
        </button>
        <button
          className={`secondary-button ${persistUploadsToLibrary ? "is-active" : ""}`}
          type="button"
          onClick={() => setPersistUploadsToLibrary(!persistUploadsToLibrary)}
          aria-label="Toggle save uploads to local library"
          title="Control whether uploaded files are saved to this device"
        >
          Save: {persistUploadsToLibrary ? "On" : "Off"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,application/epub+zip,.pdf,.epub"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
      </div>
      <div className="top-bar-right" role="group" aria-label="Theme selection">
        <button
          aria-label="Light theme"
          className={`icon-button ${theme === "light" ? "is-active" : ""}`}
          type="button"
          onClick={() => setTheme("light")}
        >
          Light
        </button>
        <button
          aria-label="Dark theme"
          className={`icon-button ${theme === "dark" ? "is-active" : ""}`}
          type="button"
          onClick={() => setTheme("dark")}
        >
          Dark
        </button>
        <button
          aria-label="Greyscale theme"
          className={`icon-button ${theme === "greyscale" ? "is-active" : ""}`}
          type="button"
          onClick={() => setTheme("greyscale")}
        >
          B/W
        </button>
      </div>
    </header>
  );
}

