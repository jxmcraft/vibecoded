export function BottomBar() {
  return (
    <footer className="bottom-bar">
      <div className="mode-controls">
        <button className="secondary-button">
          Standard Read
        </button>
        <button className="secondary-button">
          Auto-Reader
        </button>
        <button className="secondary-button">
          Fast Reader
        </button>
      </div>
      <div className="font-controls">
        <span className="label">Font size</span>
        <input type="range" min={14} max={24} defaultValue={18} />
      </div>
    </footer>
  );
}

