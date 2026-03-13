"use client";

import { useReader } from "../../context/ReaderContext";

export function SideBar() {
  const {
    status,
    parserMode,
    setParserMode,
    checkpoints,
    bookmarks,
    jumpToCheckpoint,
    jumpToBookmark,
    addBookmark,
    removeBookmark,
    sidebarCollapsed,
    toggleSidebar
  } = useReader();

  if (sidebarCollapsed) {
    return (
      <aside className="sidebar sidebar-collapsed" aria-label="Collapsed sidebar">
        <button
          type="button"
          className="secondary-button mini-nav-button"
          onClick={() => setParserMode("adaptive")}
          aria-label="Use adaptive mode"
        >
          A
        </button>
        <button
          type="button"
          className="secondary-button mini-nav-button"
          onClick={() => setParserMode("fallback")}
          aria-label="Use conservative mode"
        >
          C
        </button>
        <button
          type="button"
          className="secondary-button mini-nav-button"
          onClick={addBookmark}
          disabled={status !== "ready"}
          aria-label="Add bookmark"
        >
          +
        </button>
        <button
          type="button"
          className="primary-button mini-nav-button"
          onClick={toggleSidebar}
          aria-label="Expand sidebar"
        >
          &gt;
        </button>
      </aside>
    );
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>Navigator</h2>
        <button
          type="button"
          className="icon-button"
          onClick={toggleSidebar}
          aria-label="Collapse sidebar"
        >
          &lt;
        </button>
      </div>
      <div className="sidebar-content">
        <section className="sidebar-section">
          <h3>Reading mode</h3>
          <div className="sidebar-actions">
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

        <section className="sidebar-section">
          <div className="sidebar-row">
            <h3>Bookmarks</h3>
            <button
              type="button"
              className="secondary-button"
              onClick={addBookmark}
              disabled={status !== "ready"}
            >
              Add
            </button>
          </div>
          {!bookmarks.length && <p className="sidebar-empty">No bookmarks yet.</p>}
          {!!bookmarks.length && (
            <ul className="sidebar-list">
              {bookmarks.map((bookmark) => (
                <li key={bookmark.id}>
                  <button
                    type="button"
                    className="sidebar-link"
                    onClick={() => jumpToBookmark(bookmark.id)}
                  >
                    <span>{bookmark.label}</span>
                    <small>{bookmark.progress.toFixed(1)}%</small>
                  </button>
                  <button
                    type="button"
                    className="sidebar-delete"
                    aria-label={`Remove ${bookmark.label}`}
                    onClick={() => removeBookmark(bookmark.id)}
                  >
                    x
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="sidebar-section">
          <h3>Checkpoints</h3>
          {!checkpoints.length && <p className="sidebar-empty">No chapter headings found.</p>}
          {!!checkpoints.length && (
            <ul className="sidebar-list sidebar-list-checkpoints">
              {checkpoints.map((checkpoint) => (
                <li key={checkpoint.id}>
                  <button
                    type="button"
                    className="sidebar-link"
                    onClick={() => jumpToCheckpoint(checkpoint.id)}
                  >
                    <span>{checkpoint.label}</span>
                    <small>{checkpoint.progress.toFixed(1)}%</small>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </aside>
  );
}

