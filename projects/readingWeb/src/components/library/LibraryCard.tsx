"use client";

import type { StoredPdfMeta } from "@/lib/storage/pdfIndexedDB";

type LibraryCardProps = {
  entry: StoredPdfMeta;
  onOpen: (docId: string) => void;
  onDelete: (docId: string) => void;
};

export function LibraryCard({ entry, onOpen, onDelete }: LibraryCardProps) {
  return (
    <article className="library-card">
      <button
        type="button"
        className="library-cover-button"
        onClick={() => onOpen(entry.docId)}
        aria-label={`Open ${entry.fileName}`}
      >
        {entry.thumbnailDataUrl ? (
          <img src={entry.thumbnailDataUrl} alt="" className="library-cover" />
        ) : (
          <div className="library-cover-placeholder">No Cover</div>
        )}
      </button>

      <div className="library-card-body">
        <h3 title={entry.fileName}>{entry.fileName}</h3>
        <p>
          {formatMegabytes(entry.fileSize)} MB • {formatRelativeDate(entry.lastOpenedAt ?? entry.uploadedAt)}
        </p>
      </div>

      <div className="library-card-actions">
        <button type="button" className="primary-button" onClick={() => onOpen(entry.docId)}>
          Open
        </button>
        <button type="button" className="secondary-button" onClick={() => onDelete(entry.docId)}>
          Delete
        </button>
      </div>
    </article>
  );
}

function formatMegabytes(bytes: number): string {
  return (bytes / (1024 * 1024)).toFixed(1);
}

function formatRelativeDate(timestamp: number): string {
  const delta = Date.now() - timestamp;
  const hour = 60 * 60 * 1000;
  const day = 24 * hour;

  if (delta < hour) {
    return "Updated just now";
  }

  if (delta < day) {
    const hours = Math.floor(delta / hour);
    return `Updated ${hours}h ago`;
  }

  const days = Math.floor(delta / day);
  return `Updated ${days}d ago`;
}
