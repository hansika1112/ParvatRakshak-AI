import { useLocation } from "react-router-dom";

const pageHeaders = {
  "/dashboard": {
    title: "Regional Risk Command Overview",
    subtitle:
      "AI-Powered Landslide Risk Monitoring for North Eastern Region",
  },

  "/risk-map": {
    title: "GIS Landslide Surveillance Map",
    subtitle:
      "Geospatial monitoring of terrain, weather-aware risk and hazard locations",
  },

  "/alerts": {
    title: "Early Warning Incident Control Center",
    subtitle:
      "Live weather-aware risk monitoring and emergency alerts across NER",
  },

  "/roads": {
    title: "Highway Corridor Vulnerability Monitoring",
    subtitle:
      "Monitor landslide vulnerability along critical highway corridors",
  },

  "/reports": {
    title: "Field Hazard Reporting System",
    subtitle:
      "Citizen-submitted landslide and field hazard intelligence",
  },

  "/analytics": {
    title: "Predictive Risk Analytics",
    subtitle:
      "AI-driven analysis of terrain, rainfall and landslide risk patterns",
  },

  "/settings": {
    title: "Command System Settings",
    subtitle:
      "Configure monitoring, alert and command-center preferences",
  },
};

export default function TopHeader() {
  const location = useLocation();

  const currentPage =
    pageHeaders[location.pathname] || pageHeaders["/dashboard"];

  return (
    <header className="command-header">
      <div className="command-header-title">
        <h1>{currentPage.title}</h1>

        <p>{currentPage.subtitle}</p>
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
