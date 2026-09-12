import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMap
} from "react-leaflet";

import "leaflet/dist/leaflet.css";
import "./App.css";

const API_URL = "http://127.0.0.1:8000";

const STATES = [
  "All States",
  "Arunachal Pradesh",
  "Assam",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Sikkim",
  "Tripura"
];

function MapBounds({ locations }) {
  const map = useMap();

  useEffect(() => {
    if (!locations.length) return;

    const validLocations = locations.filter(
      (location) =>
        Number.isFinite(location.latitude) &&
        Number.isFinite(location.longitude)
    );

    if (!validLocations.length) return;

    const bounds = validLocations.map((location) => [
      location.latitude,
      location.longitude
    ]);

    map.fitBounds(bounds, {
      padding: [35, 35],
      maxZoom: 7
    });
  }, [locations, map]);

  return null;
}

function getRiskMarkerColor(location, selectedLocation, riskAnalysis) {
  if (!selectedLocation || location.sl_no !== selectedLocation.sl_no) {
    return "#2563eb";
  }

  const riskLevel = riskAnalysis?.prediction?.risk_level;

  if (riskLevel === "Low") return "#16a34a";
  if (riskLevel === "Medium") return "#eab308";
  if (riskLevel === "High") return "#f97316";
  if (riskLevel === "Critical") return "#dc2626";

  return "#2563eb";
}

function getCitizenReportColor(severity) {
  if (severity === "Low") return "#16a34a";
  if (severity === "Medium") return "#eab308";
  if (severity === "High") return "#f97316";
  if (severity === "Critical") return "#dc2626";

  return "#64748b";
}

function App() {
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [riskAnalysis, setRiskAnalysis] = useState(null);
  const [selectedState, setSelectedState] = useState("All States");
  const [loading, setLoading] = useState(true);
  const [riskLoading, setRiskLoading] = useState(false);
  const [error, setError] = useState("");
  const [riskError, setRiskError] = useState("");

  // Multilingual alert language
  const [alertLanguage, setAlertLanguage] = useState("English");

  // Citizen report state
  const [reportForm, setReportForm] = useState({
    latitude: "",
    longitude: "",
    description: "",
    severity: "Medium",
    language: "English"
  });

  const [reportMedia, setReportMedia] = useState(null);
  const [reportSubmitting, setReportSubmitting] = useState(false);

  // Citizen reports loaded from the backend
  const [citizenReports, setCitizenReports] = useState([]);
const [riskAlerts, setRiskAlerts] = useState([]);
const [riskAlertsLoading, setRiskAlertsLoading] = useState(false);
const [riskAlertsError, setRiskAlertsError] = useState("");
  const [reportSuccess, setReportSuccess] = useState(null);
  const [reportError, setReportError] = useState("");

  const emergencyCounts = {
    Critical: citizenReports.filter(
      (report) => report.severity === "Critical"
    ).length,
    High: citizenReports.filter(
      (report) => report.severity === "High"
    ).length,
    Medium: citizenReports.filter(
      (report) => report.severity === "Medium"
    ).length,
    Low: citizenReports.filter(
      (report) => report.severity === "Low"
    ).length
  };

  const emergencyTotal =
    emergencyCounts.Critical +
    emergencyCounts.High;

  useEffect(() => {
    async function fetchCitizenReports() {
      try {
        const response = await fetch(`${API_URL}/reports`);

        if (!response.ok) {
          throw new Error("Failed to fetch citizen reports");
        }

        const data = await response.json();

        setCitizenReports(data.reports || []);
      } catch (err) {
        console.error("Citizen reports error:", err);
      }
    }

    fetchCitizenReports();

    const interval = setInterval(
      fetchCitizenReports,
      30000
    );

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function fetchRiskAlerts() {
      try {
        setRiskAlertsLoading(true);
        setRiskAlertsError("");

        const stateQuery =
          selectedState === "All States"
            ? ""
            : `&state=${encodeURIComponent(selectedState)}`;

        const response = await fetch(
          `${API_URL}/risk/alerts?limit=5${stateQuery}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch risk alerts");
        }

        const data = await response.json();

        setRiskAlerts(data.alerts || []);
      } catch (err) {
        console.error("Risk alerts error:", err);
        setRiskAlertsError("Unable to load risk alerts");
      } finally {
        setRiskAlertsLoading(false);
      }
    }

    fetchRiskAlerts();

    const interval = setInterval(
      fetchRiskAlerts,
      60000
    );

    return () => clearInterval(interval);
  }, [selectedState]);

  useEffect(() => {
    async function fetchLocations() {
      try {
        setLoading(true);
        setError("");
        setSelectedLocation(null);
        setRiskAnalysis(null);
        setRiskError("");

        const stateQuery =
          selectedState === "All States"
            ? ""
            : `&state=${encodeURIComponent(selectedState)}`;

        const response = await fetch(
          `${API_URL}/locations?limit=1000&offset=0${stateQuery}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch GSI locations");
        }

        const data = await response.json();

        setLocations(data.locations || []);
      } catch (err) {
        console.error(err);
        setError(
          "Unable to load GSI locations. Please make sure the FastAPI backend is running."
        );
        setLocations([]);
      } finally {
        setLoading(false);
      }
    }

    fetchLocations();
  }, [selectedState]);

  useEffect(() => {
    if (!selectedLocation) {
      setRiskAnalysis(null);
      setRiskError("");
      return;
    }

    async function fetchRiskAnalysis() {
      try {
        setRiskLoading(true);
        setRiskError("");
        setRiskAnalysis(null);

        const response = await fetch(
          `${API_URL}/risk/analyze-location?sl_no=${selectedLocation.sl_no}&language=${encodeURIComponent(alertLanguage)}`
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(
            errorData?.detail || "Failed to calculate AI risk"
          );
        }

        const data = await response.json();

        setRiskAnalysis(data);
      } catch (err) {
        console.error(err);
        setRiskError(
          "Unable to calculate AI risk. Please check the FastAPI backend and weather service."
        );
      } finally {
        setRiskLoading(false);
      }
    }

    fetchRiskAnalysis();
  }, [selectedLocation, alertLanguage]);

  function handleReportChange(event) {
    const { name, value } = event.target;

    setReportForm((previous) => ({
      ...previous,
      [name]: value
    }));
  }

  function useCurrentLocation() {
    setReportError("");
    setReportSuccess(null);

    if (!navigator.geolocation) {
      setReportError(
        "Geolocation is not supported by this browser."
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setReportForm((previous) => ({
          ...previous,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6)
        }));
      },
      (error) => {
        console.error(error);

        setReportError(
          "Unable to get your location. Please allow location access or enter coordinates manually."
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }

  async function handleReportSubmit(event) {
    event.preventDefault();

    setReportSubmitting(true);
    setReportError("");
    setReportSuccess(null);

    try {
      const latitude = Number(reportForm.latitude);
      const longitude = Number(reportForm.longitude);

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        throw new Error(
          "Please enter valid latitude and longitude."
        );
      }

      const formData = new FormData();

      formData.append("latitude", String(latitude));
      formData.append("longitude", String(longitude));
      formData.append(
        "description",
        reportForm.description.trim()
      );
      formData.append("severity", reportForm.severity);
      formData.append("language", reportForm.language);

      if (reportMedia) {
        formData.append("media", reportMedia);
      }

      const response = await fetch(
        `${API_URL}/reports`,
        {
          method: "POST",
          body: formData
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.detail || "Failed to submit citizen report."
        );
      }

      setReportSuccess(data.report);

      setCitizenReports((previous) => [
        data.report,
        ...previous.filter(
          (report) => report.report_id !== data.report.report_id
        )
      ]);

      setReportForm({
        latitude: "",
        longitude: "",
        description: "",
        severity: "Medium",
        language: "English"
      });

      setReportMedia(null);

      const fileInput =
        document.getElementById("report-media");

      if (fileInput) {
        fileInput.value = "";
      }
    } catch (err) {
      console.error(err);
      setReportError(
        err.message || "Unable to submit report."
      );
    } finally {
      setReportSubmitting(false);
    }
  }

  const riskLevel =
    riskAnalysis?.prediction?.risk_level || "";

  const riskLevelClass = riskLevel.toLowerCase();

  return (
    <div className="dashboard">

      <header className="header">
        <div>
          <h1>🏔️ ParvatRakshak AI</h1>
          <p>
            AI-Based Early Warning & Landslide Risk Monitoring System
          </p>
        </div>

        <div className="header-status">
          <span className="status-dot"></span>
          System Online
        </div>
      </header>

      <main className="main-content">

  <section className="kpi-section">

          <div className="kpi-card">
            <span className="kpi-icon">📍</span>
            <div>
              <span className="kpi-label">GSI Locations</span>
              <strong className="kpi-value">
                {loading ? "—" : locations.length.toLocaleString()}
              </strong>
              <span className="kpi-description">
                Historical Records
              </span>
            </div>
          </div>

          <div className="kpi-card">
            <span className="kpi-icon">🤖</span>
            <div>
              <span className="kpi-label">AI Risk</span>
              <strong
                className={`kpi-value risk-${riskLevelClass || "none"}`}
              >
                {riskAnalysis?.prediction?.risk_level || "—"}
              </strong>
              <span className="kpi-description">
                Current Prototype Risk
              </span>
            </div>
          </div>

          <div className="kpi-card">
            <span className="kpi-icon">🌧️</span>
            <div>
              <span className="kpi-label">7-Day Rainfall</span>
              <strong className="kpi-value">
                {riskAnalysis?.weather?.rainfall_7d != null
                  ? `${riskAnalysis.weather.rainfall_7d} mm`
                  : "—"}
              </strong>
              <span className="kpi-description">
                Recent Weather
              </span>
            </div>
          </div>

          <div className="kpi-card">
            <span className="kpi-icon">⛰️</span>
            <div>
              <span className="kpi-label">Slope</span>
              <strong className="kpi-value">
                {selectedLocation
                  ? `${selectedLocation.slope.toFixed(2)}°`
                  : "—"}
              </strong>
              <span className="kpi-description">
                Selected Location
              </span>
            </div>
          </div>

        </section>

  <aside className="sidebar">

  <div className="dashboard-column left-column">
    <div className="sidebar-card emergency-card">

            <div className="emergency-card-header">
              <div>
                <span className="emergency-label">
                  Emergency Monitoring
                </span>
                <h2>Active Citizen Alerts</h2>
              </div>

              <div className="emergency-total">
                {emergencyTotal}
              </div>
            </div>

            <p className="emergency-description">
              High and Critical citizen-reported incidents requiring
              immediate attention.
            </p>

            <div className="emergency-stats">

              <div className="emergency-stat critical">
                <div className="emergency-stat-number">
                  {emergencyCounts.Critical}
                </div>
                <span>Critical</span>
              </div>

              <div className="emergency-stat high">
                <div className="emergency-stat-number">
                  {emergencyCounts.High}
                </div>
                <span>High</span>
              </div>

            </div>

            <div className="emergency-status">
              {emergencyTotal > 0
                ? "⚠️ Immediate attention required"
                : "✅ No high-priority citizen alerts"}
            </div>

          </div>
    <div className="sidebar-card report-card">

            <div className="report-card-header">
              <div>
                <h2>🚨 Report Landslide</h2>
                <p>
                  Help authorities by submitting a geo-tagged report.
                </p>
              </div>
            </div>

            <form
              className="report-form"
              onSubmit={handleReportSubmit}
            >

              <div className="report-location-row">

                <div className="report-field">
                  <label htmlFor="report-latitude">
                    Latitude
                  </label>

                  <input
                    id="report-latitude"
                    name="latitude"
                    type="number"
                    step="any"
                    placeholder="e.g. 26.198"
                    value={reportForm.latitude}
                    onChange={handleReportChange}
                    required
                  />
                </div>

                <div className="report-field">
                  <label htmlFor="report-longitude">
                    Longitude
                  </label>

                  <input
                    id="report-longitude"
                    name="longitude"
                    type="number"
                    step="any"
                    placeholder="e.g. 90.298"
                    value={reportForm.longitude}
                    onChange={handleReportChange}
                    required
                  />
                </div>

              </div>

              <button
                type="button"
                className="location-button"
                onClick={useCurrentLocation}
              >
                📍 Use My Current Location
              </button>

              <div className="report-field">
                <label htmlFor="report-description">
                  Description
                </label>

                <textarea
                  id="report-description"
                  name="description"
                  rows="4"
                  placeholder="Describe the landslide, rainfall, road blockage, cracks, or other observations..."
                  value={reportForm.description}
                  onChange={handleReportChange}
                  required
                />
              </div>

              <div className="report-location-row">

                <div className="report-field">
                  <label htmlFor="report-severity">
                    Severity
                  </label>

                  <select
                    id="report-severity"
                    name="severity"
                    value={reportForm.severity}
                    onChange={handleReportChange}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                <div className="report-field">
                  <label htmlFor="report-language">
                    Language
                  </label>

                  <select
                    id="report-language"
                    name="language"
                    value={reportForm.language}
                    onChange={handleReportChange}
                  >
                    <option value="English">English</option>
                    <option value="Hindi">Hindi</option>
                    <option value="Assamese">Assamese</option>
                  </select>
                </div>

              </div>

              <div className="report-field">
                <label htmlFor="report-media">
                  Photo / Video
                </label>

                <input
                  id="report-media"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
                  onChange={(event) =>
                    setReportMedia(
                      event.target.files?.[0] || null
                    )
                  }
                />

                <small>
                  JPG, PNG, WEBP, MP4 or WEBM • Maximum 20 MB
                </small>
              </div>

              {reportError && (
                <div className="report-message report-error">
                  ❌ {reportError}
                </div>
              )}

              {reportSuccess && (
                <div className="report-message report-success">

                  <strong>
                    ✅ Report submitted successfully
                  </strong>

                  <p>
                    Report ID:{" "}
                    <strong>{reportSuccess.report_id}</strong>
                  </p>

                  <p>
                    Your report has been received by the system.
                  </p>

                </div>
              )}

              <button
                type="submit"
                className="submit-report-button"
                disabled={reportSubmitting}
              >
                {reportSubmitting
                  ? "Submitting Report..."
                  : "🚨 Submit Landslide Report"}
              </button>

            </form>

          </div>
  </div>

  <div className="dashboard-column center-column">
    <div className="sidebar-card ai-card">

            <div className="ai-card-header">

              <div>
                <h2>🤖 AI Risk Assessment</h2>
                <p>
                  Terrain + recent weather + XGBoost
                </p>
              </div>

              <div className="ai-model-badge">
                <strong>Model: XGBoost</strong>
                <span>v1.0 (Prototype)</span>
              </div>

            </div>

            {!selectedLocation ? (

              <div className="ai-empty">

                <div className="ai-preview">

  <div className="ai-preview-intro">

    <div className="ai-preview-icon">🤖</div>

    <strong>AI-Powered Landslide Risk Analysis</strong>

    <p>
      Select any blue location marker on the map
      to generate a location-specific risk assessment.
    </p>

  </div>

  <div className="ai-preview-grid">

    <div className="ai-preview-item">
      <span>⛰️ TERRAIN ANALYSIS</span>
      <strong>Elevation + Slope</strong>
    </div>

    <div className="ai-preview-item">
      <span>🌧️ WEATHER ANALYSIS</span>
      <strong>1 / 3 / 7 / 30 Day Rainfall</strong>
    </div>

    <div className="ai-preview-item">
      <span>🧠 AI MODEL</span>
      <strong>XGBoost Risk Engine</strong>
    </div>

    <div className="ai-preview-item">
      <span>🚨 EARLY WARNING</span>
      <strong>Multilingual Alert System</strong>
    </div>

  </div>

  <div className="ai-preview-action">

    <strong>📍 Ready for Location Analysis</strong>

    <span>
      Click a blue GSI marker to fetch recent weather,
      calculate the AI risk score, and generate an
      early-warning message.
    </span>

  </div>

  <div className="ai-preview-details">

    <div className="ai-preview-detail">
      <span>📊 CURRENT PROTOTYPE RISK</span>
      <strong>Risk score will appear after location selection</strong>
    </div>

    <div className="ai-preview-detail">
      <span>🚨 MULTILINGUAL EARLY WARNING</span>
      <strong>English / हिंदी / অসমীয়া</strong>
    </div>

    <div className="ai-preview-detail">
      <span>🌧️ RECENT WEATHER</span>
      <strong>NASA POWER · 1 / 3 / 7 / 30 Day Rainfall</strong>
    </div>

    <div className="ai-preview-detail">
      <span>⛰️ TERRAIN & MODEL INPUTS</span>
      <strong>Elevation · Slope · Weather Source · XGBoost</strong>
    </div>

  </div>

  <div className="ai-preview-summary">

    <strong>🔵 AI Analysis Summary</strong>

    <p>
      Select a GSI location to analyze terrain conditions,
      recent rainfall, XGBoost risk probability, and
      generate a multilingual early-warning message.
    </p>

  </div>

</div>

              </div>

            ) : riskLoading ? (

              <div className="ai-loading">
                <div className="loading-spinner"></div>
                <strong>Analyzing location...</strong>
                <p>
                  Fetching recent weather and running
                  the XGBoost model.
                </p>
              </div>

            ) : riskError ? (

              <div className="risk-error">
                {riskError}
              </div>

            ) : riskAnalysis ? (

              <div className="risk-analysis">

                <div className={`risk-result ${riskLevelClass}`}>

                  <span className="risk-label">
                    Current Prototype Risk
                  </span>

                  <strong className="risk-level">
                    {riskLevel}
                  </strong>

                  <div className="risk-score">
                    {riskAnalysis.prediction.risk_score}
                    <span>/100</span>
                  </div>

                  <span className="risk-probability">
                    Probability:{" "}
                    {(riskAnalysis.prediction.risk_probability * 100).toFixed(2)}%
                  </span>

                </div>

                <div className={`alert-panel ${riskAnalysis.alert?.severity || ""}`}>

                  <div className="alert-header">

                    <div>
                      <span className="alert-label">
                        🚨 Multilingual Early Warning
                      </span>

                      <h3>
                        {riskAnalysis.alert?.risk_level || riskLevel} Risk Alert
                      </h3>
                    </div>

                    <select
                      className="alert-language-select"
                      value={alertLanguage}
                      onChange={(event) =>
                        setAlertLanguage(event.target.value)
                      }
                    >
                      <option value="English">English</option>
                      <option value="Hindi">हिंदी</option>
                      <option value="Assamese">অসমীয়া</option>
                    </select>

                  </div>

                  <p className="alert-message">
                    {riskAnalysis.alert?.message ||
                      "Alert message unavailable."}
                  </p>

                  <div className="alert-meta">
                    <span>
                      Language: {riskAnalysis.alert?.language || alertLanguage}
                    </span>

                    <span>
                      Delivery: {riskAnalysis.alert?.delivery_status || "simulated"}
                    </span>
                  </div>

                </div>

                <div className="weather-section">

                  <h3>🌧️ Recent Weather</h3>

                  <div className="weather-grid">

                    <div className="weather-card">
                      <span>1 Day Rain</span>
                      <strong>
                        {riskAnalysis.weather.rainfall_1d} mm
                      </strong>
                    </div>

                    <div className="weather-card">
                      <span>3 Day Rain</span>
                      <strong>
                        {riskAnalysis.weather.rainfall_3d} mm
                      </strong>
                    </div>

                    <div className="weather-card">
                      <span>7 Day Rain</span>
                      <strong>
                        {riskAnalysis.weather.rainfall_7d} mm
                      </strong>
                    </div>

                    <div className="weather-card">
                      <span>30 Day Rain</span>
                      <strong>
                        {riskAnalysis.weather.rainfall_30d} mm
                      </strong>
                    </div>

                    <div className="weather-card">
                      <span>Temperature</span>
                      <strong>
                        {riskAnalysis.weather.temperature}°C
                      </strong>
                    </div>

                    <div className="weather-card">
                      <span>Humidity</span>
                      <strong>
                        {riskAnalysis.weather.humidity}%
                      </strong>
                    </div>

                    <div className="weather-card">
                      <span>Wind Speed</span>
                      <strong>
                        {riskAnalysis.weather.wind_speed} m/s
                      </strong>
                    </div>

                    <div className="weather-card">
                      <span>Latest Data</span>
                      <strong>
                        {riskAnalysis.weather.latest_date}
                      </strong>
                    </div>

                  </div>

                </div>

                <div className="model-features">

                  <h3>⛰️ Model Inputs</h3>

                  <div className="feature-row">
                    <span>Elevation</span>
                    <strong>
                      {riskAnalysis.location.elevation.toFixed(2)} m
                    </strong>
                  </div>

                  <div className="feature-row">
                    <span>Slope</span>
                    <strong>
                      {riskAnalysis.location.slope.toFixed(2)}°
                    </strong>
                  </div>

                  <div className="feature-row">
                    <span>Weather Source</span>
                    <strong>
                      {riskAnalysis.weather.source}
                    </strong>
                  </div>

                </div>

                <div className="risk-factors">

                  <h3>⚠️ Key Risk Factors</h3>

                  <div className="risk-factor-grid">

                    <div className="risk-factor">
                      <span>⛰️ Slope</span>
                      <strong>
                        {riskAnalysis.location.slope.toFixed(2)}°
                      </strong>
                      <small>
                        {riskAnalysis.location.slope >= 30
                          ? "High"
                          : riskAnalysis.location.slope >= 15
                          ? "Moderate"
                          : "Low"}
                      </small>
                    </div>

                    <div className="risk-factor">
                      <span>🌧️ 7-Day Rainfall</span>
                      <strong>
                        {riskAnalysis.weather.rainfall_7d} mm
                      </strong>
                      <small>
                        {riskAnalysis.weather.rainfall_7d >= 150
                          ? "High"
                          : riskAnalysis.weather.rainfall_7d >= 75
                          ? "Moderate"
                          : "Low"}
                      </small>
                    </div>

                    <div className="risk-factor">
                      <span>🌧️ 30-Day Rainfall</span>
                      <strong>
                        {riskAnalysis.weather.rainfall_30d} mm
                      </strong>
                      <small>
                        {riskAnalysis.weather.rainfall_30d >= 300
                          ? "High"
                          : riskAnalysis.weather.rainfall_30d >= 150
                          ? "Moderate"
                          : "Low"}
                      </small>
                    </div>

                    <div className="risk-factor">
                      <span>🏔️ Elevation</span>
                      <strong>
                        {riskAnalysis.location.elevation.toFixed(2)} m
                      </strong>
                      <small>Terrain Input</small>
                    </div>

                  </div>

                </div>


                <div className="risk-disclaimer">

                  <strong>⚠️ Prototype Notice</strong>

                  <p>
                    This is a prototype AI prediction based on
                    historical GSI inventory, terrain features,
                    and recent NASA POWER weather data.
                    It is not an official disaster warning.
                  </p>

                </div>

              </div>

            ) : null}

          </div>
  </div>

  <div className="dashboard-column right-column">

    <div className="sidebar-card risk-alert-card">

      <div className="risk-alert-header">
        <div>
          <h2>🚨 Risk Alert Monitor</h2>
          <p>Prototype terrain-based risk screening</p>
        </div>

        <span className="risk-alert-live">
          ● MONITORING
        </span>
      </div>

      {riskAlertsLoading ? (

        <div className="risk-alert-status">
          <span>⏳</span>
          <p>Loading risk alerts...</p>
        </div>

      ) : riskAlertsError ? (

        <div className="risk-alert-status error">
          <span>⚠️</span>
          <p>{riskAlertsError}</p>
        </div>

      ) : riskAlerts.length === 0 ? (

        <div className="risk-alert-status">
          <span>✅</span>
          <p>No high-risk locations detected.</p>
        </div>

      ) : (

        <div className="risk-alert-list">

          {riskAlerts.map((alert, index) => (

            <button
              key={`${alert.sl_no}-${index}`}
              className={`risk-alert-item ${alert.risk_level.toLowerCase()}`}
              onClick={() => {
                const location = locations.find(
                  (item) => Number(item.sl_no) === Number(alert.sl_no)
                );

                if (location) {
                  setSelectedLocation(location);
                  setRiskError("");
                  setRiskAnalysis(null);
                }
              }}
            >

              <div className="risk-alert-top">

                <span className="risk-alert-level">
                  {alert.risk_level === "Critical" ? "🔴" : "🟠"}
                  {" "}
                  {alert.risk_level}
                </span>

                <strong>
                  {alert.risk_score.toFixed(2)}%
                </strong>

              </div>

              <div className="risk-alert-location">
                📍 {alert.latitude.toFixed(4)}, {alert.longitude.toFixed(4)}
              </div>

              <div className="risk-alert-terrain">
                <span>⛰️ Slope: {alert.slope.toFixed(2)}°</span>
                <span>📏 Elevation: {alert.elevation.toFixed(2)} m</span>
              </div>

              <div className="risk-alert-action">
                View location →
              </div>

              {alert.weather && (
                <div className="risk-alert-weather">

                  <div>
                    <span>🌧️ 30D</span>
                    <strong>{alert.weather.rainfall_30d} mm</strong>
                  </div>

                  <div>
                    <span>💧 Humidity</span>
                    <strong>{alert.weather.humidity ?? "—"}%</strong>
                  </div>

                  <div>
                    <span>🌡️ Temp</span>
                    <strong>{alert.weather.temperature ?? "—"}°C</strong>
                  </div>

                  <div>
                    <span>💨 Wind</span>
                    <strong>{alert.weather.wind_speed ?? "—"} m/s</strong>
                  </div>

                </div>
              )}

              {alert.weather && (
                <div className="risk-alert-source">
                  {alert.weather.source} • {alert.weather.latest_date}
                </div>
              )}

            </button>

          ))}

        </div>

      )}

      <div className="risk-alert-note">
        <strong>ℹ️ Prototype Screening</strong>
        <span>
          Select an alert to view its location and run the
          detailed AI + weather analysis.
        </span>
      </div>

    </div>

    <div className="sidebar-card">

            <h2>Historical Landslide Details</h2>

            {!selectedLocation ? (

              <div className="empty-state">

                <div className="empty-icon">
                  📍
                </div>

                <h3>Select a location</h3>

                <p>
                  Click any blue marker on the map to view
                  historical GSI landslide information and
                  AI-based risk analysis.
                </p>

              </div>

            ) : (

              <div className="location-details">

                <span className="history-badge">
                  Historical GSI Record
                </span>

                <h3>
                  {selectedLocation.district}
                </h3>

                <p>
                  {selectedLocation.state}
                </p>

                <div className="detail-grid">

                  <div className="detail-card">
                    <span>GSI ID</span>
                    <strong>
                      {selectedLocation.sl_no}
                    </strong>
                  </div>

                  <div className="detail-card">
                    <span>Elevation</span>
                    <strong>
                      {selectedLocation.elevation.toFixed(2)} m
                    </strong>
                  </div>

                  <div className="detail-card">
                    <span>Slope</span>
                    <strong>
                      {selectedLocation.slope.toFixed(2)}°
                    </strong>
                  </div>

                  <div className="detail-card">
                    <span>Latitude</span>
                    <strong>
                      {selectedLocation.latitude.toFixed(4)}
                    </strong>
                  </div>

                  <div className="detail-card">
                    <span>Longitude</span>
                    <strong>
                      {selectedLocation.longitude.toFixed(4)}
                    </strong>
                  </div>

                  <div className="detail-card">
                    <span>Observed</span>
                    <strong>
                      Yes
                    </strong>
                  </div>

                </div>

                <div className="info-box">

                  <strong>
                    About this record
                  </strong>

                  <p>
                    This point represents a historical
                    landslide recorded in the GSI inventory.
                    It is not a current risk prediction.
                  </p>

                </div>

              </div>

            )}

          

            <div className="historical-extra">

              <div className="historical-status">
                <span className="status-dot"></span>
                <div>
                  <strong>GSI Historical Inventory</strong>
                  <p>Reference locations from the regional landslide inventory.</p>
                </div>
              </div>

              <div className="historical-info-grid">

                <div className="historical-info-item">
                  <span>📍 LOCATION</span>
                  <strong>
                    {selectedLocation
                      ? "Selected GSI Location"
                      : "Awaiting Selection"}
                  </strong>
                </div>

                <div className="historical-info-item">
                  <span>🗺️ MAP DATA</span>
                  <strong>GSI Historical Records</strong>
                </div>

                <div className="historical-info-item">
                  <span>🤖 AI ANALYSIS</span>
                  <strong>
                    {selectedLocation
                      ? "Available"
                      : "Select a Marker"}
                  </strong>
                </div>

                <div className="historical-info-item">
                  <span>🚨 WARNING</span>
                  <strong>Risk Assessment</strong>
                </div>

              </div>

              <div className="historical-help">

                <strong>💡 How to use</strong>

                <p>
                  Select any blue GSI marker on the map to view
                  historical location information and run the
                  AI-powered risk assessment.
                </p>

              </div>

            </div>
</div>
    <div className="sidebar-card coverage-card">

            <h2>Monitoring Coverage</h2>

            <div className="coverage-stats">

              <div className="coverage-stat">

                <div className="coverage-number">
                  {loading
                    ? "—"
                    : locations.length.toLocaleString()}
                </div>

                <span>
                  GSI Historical Locations
                </span>

              </div>

              <div className="coverage-stat citizen-stat">

                <div className="coverage-number">
                  {citizenReports.length}
                </div>

                <span>
                  Citizen Reports
                </span>

              </div>

            </div>

            <p className="coverage-description">
              {selectedState === "All States"
                ? "Historical GSI inventory + citizen-reported incidents"
                : `Historical locations in ${selectedState}`}
            </p>

            <div className="legend">

              <div className="legend-title">
                Map Legend
              </div>

              <div className="legend-item">

                <span className="legend-dot"></span>

                Historical Landslide

              </div>

              <div className="legend-item citizen-legend-item">
                <span
                  className="citizen-legend-dot"
                  style={{ background: "#16a34a" }}
                ></span>
                Citizen Report — Low
              </div>

              <div className="legend-item">
                <span
                  className="citizen-legend-dot"
                  style={{ background: "#eab308" }}
                ></span>
                Citizen Report — Medium
              </div>

              <div className="legend-item">
                <span
                  className="citizen-legend-dot"
                  style={{ background: "#f97316" }}
                ></span>
                Citizen Report — High
              </div>

              <div className="legend-item">
                <span
                  className="citizen-legend-dot"
                  style={{ background: "#dc2626" }}
                ></span>
                Citizen Report — Critical
              </div>

            </div>

          

            <div className="coverage-extra">

              <div className="coverage-source">

                <div className="coverage-source-icon">🛰️</div>

                <div>
                  <strong>Multi-Source Monitoring</strong>
                  <p>
                    Historical terrain inventory + citizen reports
                    + recent weather data.
                  </p>
                </div>

              </div>

              <div className="coverage-pipeline">

                <div className="coverage-pipeline-title">
                  MONITORING PIPELINE
                </div>

                <div className="coverage-step">
                  <span>01</span>
                  <div>
                    <strong>GSI Inventory</strong>
                    <small>Historical landslide locations</small>
                  </div>
                </div>

                <div className="coverage-step">
                  <span>02</span>
                  <div>
                    <strong>Citizen Reports</strong>
                    <small>Geo-tagged field observations</small>
                  </div>
                </div>

                <div className="coverage-step">
                  <span>03</span>
                  <div>
                    <strong>Weather Monitoring</strong>
                    <small>Recent NASA POWER weather</small>
                  </div>
                </div>

                <div className="coverage-step">
                  <span>04</span>
                  <div>
                    <strong>AI Risk Engine</strong>
                    <small>XGBoost-based prototype analysis</small>
                  </div>
                </div>

              </div>

              <div className="coverage-note">
                <strong>🛡️ Early Warning Ready</strong>
                <p>
                  The dashboard combines terrain, weather and
                  citizen observations to support faster
                  landslide risk assessment.
                </p>
              </div>

            </div>
</div>
  </div>

</aside>

  <section className="map-section">

          <div className="section-header">

            <div>
              <h2>NER Historical Landslide Map</h2>
              <p>GSI Historical Landslide Locations</p>
            </div>

            <div className="filter-container">

              <label htmlFor="state-filter">
                State
              </label>

              <select
                id="state-filter"
                value={selectedState}
                onChange={(event) =>
                  setSelectedState(event.target.value)
                }
              >
                {STATES.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>

              <div className="location-count">
                {loading
                  ? "Loading..."
                  : `${locations.length.toLocaleString()} locations`}
              </div>

            </div>

          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="map-card">

            <MapContainer
              center={[25.5, 92.5]}
              zoom={6}
              scrollWheelZoom={true}
              style={{
                height: "650px",
                width: "100%"
              }}
            >

              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <MapBounds locations={locations} />

              {locations.map((location) => (

                <CircleMarker
                  key={location.sl_no}
                  center={[
                    location.latitude,
                    location.longitude
                  ]}
                  radius={5}
                  pathOptions={{
                    fillColor: getRiskMarkerColor(
                      location,
                      selectedLocation,
                      riskAnalysis
                    ),
                    color: getRiskMarkerColor(
                      location,
                      selectedLocation,
                      riskAnalysis
                    ),
                    weight:
                      selectedLocation?.sl_no === location.sl_no
                        ? 3
                        : 1,
                    fillOpacity: 0.85
                  }}
                  eventHandlers={{
                    click: () => {
                      setSelectedLocation(location);
                    }
                  }}
                >

                  <Popup>

                    <div>

                      <strong>
                        📍 Historical Landslide
                      </strong>

                      <br />
                      <br />

                      <strong>State:</strong>{" "}
                      {location.state}

                      <br />

                      <strong>District:</strong>{" "}
                      {location.district}

                      <br />

                      <strong>GSI ID:</strong>{" "}
                      {location.sl_no}

                      <br />

                      <strong>Elevation:</strong>{" "}
                      {location.elevation.toFixed(2)} m

                      <br />

                      <strong>Slope:</strong>{" "}
                      {location.slope.toFixed(2)}°

                      <br />

                      <strong>Latitude:</strong>{" "}
                      {location.latitude.toFixed(5)}

                      <br />

                      <strong>Longitude:</strong>{" "}
                      {location.longitude.toFixed(5)}

                    </div>

                  </Popup>

                </CircleMarker>

              ))}

              {citizenReports.map((report) => {
                const latitude = Number(report.latitude);
                const longitude = Number(report.longitude);

                if (
                  !Number.isFinite(latitude) ||
                  !Number.isFinite(longitude)
                ) {
                  return null;
                }

                const markerColor =
                  getCitizenReportColor(report.severity);

                return (
                  <CircleMarker
                    key={`citizen-${report.report_id}`}
                    center={[latitude, longitude]}
                    radius={8}
                    pathOptions={{
                      fillColor: markerColor,
                      color: "#ffffff",
                      weight: 3,
                      fillOpacity: 0.95
                    }}
                  >
                    <Popup>
                      <div>
                        <strong>
                          🚨 Citizen Landslide Report
                        </strong>

                        <br />
                        <br />

                        <strong>Report ID:</strong>{" "}
                        {report.report_id}

                        <br />

                        <strong>Severity:</strong>{" "}
                        {report.severity}

                        <br />

                        <strong>Language:</strong>{" "}
                        {report.language}

                        <br />

                        <strong>Latitude:</strong>{" "}
                        {latitude.toFixed(5)}

                        <br />

                        <strong>Longitude:</strong>{" "}
                        {longitude.toFixed(5)}

                        <br />
                        <br />

                        <strong>Description:</strong>

                        <p style={{ margin: "5px 0" }}>
                          {report.description}
                        </p>

                        <strong>Status:</strong>{" "}
                        {report.status}

                        <br />

                        <strong>Reported:</strong>{" "}
                        {new Date(
                          report.created_at
                        ).toLocaleString()}
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}

            </MapContainer>

          </div>

        </section>

</main>

      <footer>
        ParvatRakshak AI • Smart India Hackathon 2026 • SIH26001
      </footer>

    </div>
  );
}

export default App;
