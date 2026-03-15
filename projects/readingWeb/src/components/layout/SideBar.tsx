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
    renameBookmark,
    removeBookmark,
    sidebarCollapsed,
    toggleSidebar,
    ttsSupported,
    ttsStatus,
    ttsRate,
    ttsVoices,
    ttsVoiceURI,
    ttsStartMode,
    ttsAutoScroll,
    ttsHighlightColor,
    ttsError,
    restartTtsFromBeginning,
    setTtsRate,
    setTtsVoice,
    setTtsStartMode,
    setTtsAutoScroll,
    setTtsHighlightColor
  } = useReader();

  const canConfigureTts = status === "ready" && ttsSupported;

  if (sidebarCollapsed) {
    return (
      <aside className="sidebar sidebar-collapsed" aria-label="Collapsed sidebar">
        <button
          type="button"
          className="secondary-button mini-nav-button"
          onClick={() => setParserMode("adaptive")}
          aria-label="Use Smart mode"
        >
          S
        </button>
        <button
          type="button"
          className="secondary-button mini-nav-button"
          onClick={() => setParserMode("fallback")}
          aria-label="Use Exact mode"
        >
          E
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
        <details className="sidebar-section sidebar-collapsible" open>
          <summary className="sidebar-summary">
            <h3>Reading mode</h3>
          </summary>
          <div className="sidebar-actions">
            <button
              type="button"
              className={parserMode === "adaptive" ? "primary-button" : "secondary-button"}
              onClick={() => setParserMode("adaptive")}
              title="Smart mode: detects headings and reflows text for a clean reading experience"
            >
              Smart
            </button>
            <button
              type="button"
              className={parserMode === "fallback" ? "primary-button" : "secondary-button"}
              onClick={() => setParserMode("fallback")}
              title="Exact mode: preserves original PDF text order with indentation — closest to copy/paste"
            >
              Exact
            </button>
          </div>
        </details>

        <details className="sidebar-section sidebar-collapsible" open>
          <summary className="sidebar-summary">
            <h3>Bookmarks</h3>
          </summary>
          <div className="sidebar-row">
            <span className="label">Saved positions</span>
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
                    aria-label={`Rename ${bookmark.label}`}
                    onClick={() => {
                      const nextLabel = window.prompt("Rename bookmark", bookmark.label);
                      if (!nextLabel) {
                        return;
                      }
                      renameBookmark(bookmark.id, nextLabel);
                    }}
                  >
                    Edit
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
        </details>

        <details className="sidebar-section sidebar-collapsible" open>
          <summary className="sidebar-summary">
            <h3>Auto-Reader</h3>
          </summary>
          {!ttsSupported && <p className="sidebar-empty">Speech is unavailable in this browser.</p>}
          {ttsSupported && (
            <div className="auto-reader-panel">
              <div className="auto-reader-header-row">
                <span className="label">Status</span>
                <strong className={`tts-status auto-reader-status status-${ttsStatus}`}>{ttsStatus}</strong>
              </div>
              <button
                type="button"
                className="secondary-button"
                onClick={restartTtsFromBeginning}
                disabled={!canConfigureTts}
              >
                Restart from beginning
              </button>

              <div className="sidebar-settings-grid">
                <div className="sidebar-setting-row">
                <label className="label" htmlFor="sidebar-tts-voice">
                  Voice
                </label>
                <select
                  id="sidebar-tts-voice"
                  value={ttsVoiceURI ?? ""}
                  onChange={(event) => setTtsVoice(event.target.value || undefined)}
                  disabled={!canConfigureTts || ttsVoices.length === 0}
                >
                  <option value="">System default</option>
                  {ttsVoices.map((voice) => (
                    <option key={voice.voiceURI} value={voice.voiceURI}>
                      {voice.name} ({voice.lang})
                    </option>
                  ))}
                </select>
                </div>
                <div className="sidebar-setting-row">
                <label className="label" htmlFor="sidebar-tts-rate">
                  Speed {ttsRate.toFixed(1)}x
                </label>
                <input
                  id="sidebar-tts-rate"
                  aria-label="Auto-Reader speed"
                  type="range"
                  min={0.5}
                  max={3}
                  step={0.1}
                  value={ttsRate}
                  onChange={(event) => setTtsRate(Number(event.target.value))}
                  disabled={!canConfigureTts}
                />
                </div>
                <div className="sidebar-setting-row">
                <label className="label" htmlFor="sidebar-tts-start-mode">
                  Start from
                </label>
                <select
                  id="sidebar-tts-start-mode"
                  value={ttsStartMode}
                  onChange={(event) => setTtsStartMode(event.target.value as "visible" | "selected")}
                  disabled={!canConfigureTts}
                >
                  <option value="visible">Current visible sentence</option>
                  <option value="selected">Selected sentence</option>
                </select>
                </div>
                <div className="sidebar-setting-row">
                <label className="label" htmlFor="sidebar-tts-autoscroll">
                  Auto-scroll
                </label>
                <label className="tts-toggle" htmlFor="sidebar-tts-autoscroll">
                  <input
                    id="sidebar-tts-autoscroll"
                    type="checkbox"
                    checked={ttsAutoScroll}
                    onChange={(event) => setTtsAutoScroll(event.target.checked)}
                    disabled={!canConfigureTts}
                  />
                  <span>{ttsAutoScroll ? "On" : "Off"}</span>
                </label>
                </div>
                <div className="sidebar-setting-row">
                <label className="label" htmlFor="sidebar-tts-highlight">
                  Highlight
                </label>
                <input
                  id="sidebar-tts-highlight"
                  aria-label="Highlight color"
                  className="tts-color"
                  type="color"
                  value={ttsHighlightColor}
                  onChange={(event) => setTtsHighlightColor(event.target.value)}
                  disabled={!ttsSupported}
                />
                </div>
              </div>
              {ttsError && <span className="tts-error">{ttsError}</span>}
            </div>
          )}
        </details>

        <details className="sidebar-section sidebar-collapsible" open>
          <summary className="sidebar-summary">
            <h3>Checkpoints</h3>
          </summary>
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
        </details>
      </div>
    </aside>
  );
}

