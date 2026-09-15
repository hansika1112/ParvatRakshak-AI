import { useEffect, useState } from "react";
import AppShell from "../components/AppShell.jsx";

const API_URL = "http://127.0.0.1:8000";

const systemItems = [
  {
    icon: "🌦️",
    title: "Weather Data",
    value: "NASA POWER",
    description: "Daily precipitation, temperature, humidity and wind observations",
    status: "Connected",
  },
  {
    icon: "🗺️",
    title: "Terrain Data",
    value: "GSI Terrain Inventory",
    description: "Elevation and slope based terrain records for NER",
    status: "Available",
  },
  {
    icon: "🤖",
    title: "Risk Engine",
    value: "XGBoost",
    description: "Current prototype landslide risk prediction engine",
    status: "Active",
  },
  {
    icon: "📍",
    title: "Citizen Reports",
    value: "Field Reporting API",
    description: "Location, severity, description and optional media reports",
    status: "Active",
  },
];

const modelFeatures = [
  "Elevation",
  "Slope",
  "Rainfall 1D",
  "Rainfall 3D",
  "Rainfall 7D",
  "Rainfall 30D",
  "Temperature",
  "Humidity",
  "Wind Speed",
];

const riskThresholds = [
  {
    label: "Low",
    range: "< 25%",
    description: "Lower predicted risk",
    className: "settings-risk-low",
  },
  {
    label: "Medium",
    range: "25% – 49.99%",
    description: "Moderate monitoring required",
    className: "settings-risk-medium",
  },
  {
    label: "High",
    range: "50% – 74.99%",
    description: "Priority monitoring",
    className: "settings-risk-high",
  },
  {
    label: "Critical",
    range: "≥ 75%",
    description: "Emergency attention",
    className: "settings-risk-critical",
  },
];

export default function Settings() {
  const [apiStatus, setApiStatus] = useState("Checking...");
  const [apiDetail, setApiDetail] = useState("Checking backend connection");

  useEffect(() => {
    let mounted = true;

    const checkHealth = async () => {
      try {
        const response = await fetch(`${API_URL}/health`);

        if (!response.ok) {
          throw new Error("Backend health check failed");
        }

        const data = await response.json();

        if (!mounted) return;

        if (data.status === "healthy") {
          setApiStatus("Healthy");
          setApiDetail("FastAPI backend is responding normally");
        } else {
          setApiStatus("Attention");
          setApiDetail("Backend responded with an unexpected status");
        }
      } catch {
        if (!mounted) return;

        setApiStatus("Offline");
        setApiDetail("Start the FastAPI backend to restore connectivity");
      }
    };

    checkHealth();

    const interval = setInterval(checkHealth, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <AppShell>
      <div className="settings-page">
        <div className="settings-page-header">
          <div>
            <div className="settings-eyebrow">SYSTEM CONFIGURATION</div>
            <h1>Command System Settings</h1>
            <p>
              Monitor data sources, AI configuration and operational system
              readiness.
            </p>
          </div>

          <div className="settings-status-card">
            <span className="settings-status-dot"></span>
            <div>
              <strong>SYSTEM {apiStatus.toUpperCase()}</strong>
              <span>{apiDetail}</span>
            </div>
          </div>
        </div>

        <section className="settings-section">
          <div className="settings-section-heading">
            <div>
              <h2>⚙️ System Configuration</h2>
              <p>Current services and data sources connected to ParvatRakshak AI.</p>
            </div>
            <span className="settings-badge">READ ONLY</span>
          </div>

          <div className="settings-service-grid">
            {systemItems.map((item) => (
              <div className="settings-service-card" key={item.title}>
                <div className="settings-service-top">
                  <div className="settings-service-icon">{item.icon}</div>
                  <span className="settings-service-status">
                    ● {item.status}
                  </span>
                </div>

                <h3>{item.title}</h3>
                <strong>{item.value}</strong>
                <p>{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="settings-main-grid">
          <section className="settings-section settings-model-section">
            <div className="settings-section-heading">
              <div>
                <h2>🤖 AI Risk Engine</h2>
                <p>Features currently supplied to the XGBoost prediction engine.</p>
              </div>
              <span className="settings-engine-badge">XGBoost</span>
            </div>

            <div className="settings-feature-grid">
              {modelFeatures.map((feature, index) => (
                <div className="settings-feature" key={feature}>
                  <span>{index + 1}</span>
                  <strong>{feature}</strong>
                </div>
              ))}
            </div>

            <div className="settings-engine-note">
              <span>🧠</span>
              <div>
                <strong>Prototype prediction engine</strong>
                <p>
                  Risk scores are generated from the current terrain,
                  weather and trained XGBoost pipeline.
                </p>
              </div>
            </div>
          </section>

          <section className="settings-section">
            <div className="settings-section-heading">
              <div>
                <h2>🎯 Risk Thresholds</h2>
                <p>Current provisional classification bands.</p>
              </div>
              <span className="settings-badge">PROVISIONAL</span>
            </div>

            <div className="settings-threshold-list">
              {riskThresholds.map((item) => (
                <div
                  className={`settings-threshold ${item.className}`}
                  key={item.label}
                >
                  <div className="settings-threshold-marker"></div>

                  <div className="settings-threshold-content">
                    <strong>{item.label}</strong>
                    <span>{item.range}</span>
                    <small>{item.description}</small>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="settings-main-grid">
          <section className="settings-section">
            <div className="settings-section-heading">
              <div>
                <h2>🌐 Supported Languages</h2>
                <p>Languages currently supported by the alert engine.</p>
              </div>
            </div>

            <div className="settings-language-grid">
              <div className="settings-language-card">
                <strong>English</strong>
                <span>English</span>
                <small>Alert generation available</small>
              </div>

              <div className="settings-language-card">
                <strong>हिन्दी</strong>
                <span>Hindi</span>
                <small>Alert generation available</small>
              </div>

              <div className="settings-language-card">
                <strong>অসমীয়া</strong>
                <span>Assamese</span>
                <small>Alert generation available</small>
              </div>
            </div>
          </section>

          <section className="settings-section">
            <div className="settings-section-heading">
              <div>
                <h2>🔄 Monitoring Status</h2>
                <p>Current application monitoring behavior.</p>
              </div>
            </div>

            <div className="settings-monitor-list">
              <div>
                <span>Risk Alert Screening</span>
                <strong>Active</strong>
              </div>

              <div>
                <span>Citizen Report Monitoring</span>
                <strong>Active</strong>
              </div>

              <div>
                <span>Weather Source</span>
                <strong>NASA POWER</strong>
              </div>

              <div>
                <span>Backend Health Check</span>
                <strong>{apiStatus}</strong>
              </div>
            </div>
          </section>
        </div>

        <section className="settings-disclaimer">
          <div className="settings-disclaimer-icon">⚠️</div>
          <div>
            <strong>Prototype / Validation Notice</strong>
            <p>
              These settings describe the currently implemented prototype
              configuration. Risk thresholds are provisional and require
              further validation and calibration before operational deployment.
              The Settings page does not modify the trained model or backend
              configuration.
            </p>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
