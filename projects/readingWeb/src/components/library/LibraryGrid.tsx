"use client";

import type { StoredPdfMeta } from "@/lib/storage/pdfIndexedDB";
import { LibraryCard } from "./LibraryCard";

type LibraryGridProps = {
  entries: StoredPdfMeta[];
  onOpen: (docId: string) => void;
  onDelete: (docId: string) => void;
};

export function LibraryGrid({ entries, onOpen, onDelete }: LibraryGridProps) {
  if (!entries.length) {
    return (
      <div className="library-empty">
        <h2>Your library is empty</h2>
        <p>Upload a PDF or EPUB to save it locally.</p>
      </div>
    );
  }

  return (
    <section className="library-grid" aria-label="Saved documents">
      {entries.map((entry) => (
        <LibraryCard key={entry.docId} entry={entry} onOpen={onOpen} onDelete={onDelete} />
      ))}
    </section>
  );
}
