export default function TopHeader() {
  return (
    <header className="command-header">
      <div className="command-header-title">
        <h1>Regional Risk Command Overview</h1>
        <p>
          AI-Powered Landslide Risk Monitoring for North Eastern Region
        </p>
      </div>

      <div className="command-header-actions">
        <button
          type="button"
          className="header-mode-button mock"
        >
          MOCK DATA
        </button>

        <button
          type="button"
          className="header-mode-button live"
        >
          <span className="live-indicator">◉</span>
          LIVE API
        </button>

        <button
          type="button"
          className="weather-ai-button"
        >
          🤖 Weather AI Chat
        </button>

        <div className="header-officer">
          <div className="header-officer-icon">
            ◯
          </div>

          <div>
            <strong>Control Officer</strong>
            <span>MDoNER Command</span>
          </div>
        </div>
      </div>
    </header>
  );
}
