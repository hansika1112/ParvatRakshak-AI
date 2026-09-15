import { useEffect, useState } from "react";

import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMap
} from "react-leaflet";

import "leaflet/dist/leaflet.css";
import "../App.css";
import AppShell from "../components/AppShell.jsx";

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
        Number.isFinite(Number(location.latitude)) &&
        Number.isFinite(Number(location.longitude))
    );

    if (!validLocations.length) return;

    const bounds = validLocations.map((location) => [
      Number(location.latitude),
      Number(location.longitude)
    ]);

    map.fitBounds(bounds, {
      padding: [35, 35],
      maxZoom: 7
    });
  }, [locations, map]);

  return null;
}

function getRiskColor(level) {
  if (level === "Critical") return "#dc2626";
  if (level === "High") return "#f97316";
  if (level === "Medium") return "#eab308";
  if (level === "Low") return "#16a34a";

  return "#2563eb";
}

function getCitizenColor(severity) {
  if (severity === "Critical") return "#dc2626";
  if (severity === "High") return "#f97316";
  if (severity === "Medium") return "#eab308";
  if (severity === "Low") return "#16a34a";

  return "#64748b";
}

export default function RiskMap() {
  const [locations, setLocations] = useState([]);
  const [riskAlerts, setRiskAlerts] = useState([]);
  const [citizenReports, setCitizenReports] = useState([]);

  const [selectedState, setSelectedState] =
    useState("All States");

  const [selectedLocation, setSelectedLocation] =
    useState(null);

  const [riskAnalysis, setRiskAnalysis] =
    useState(null);

  const [showRiskAlerts, setShowRiskAlerts] =
    useState(true);

  const [showCitizenReports, setShowCitizenReports] =
    useState(true);

  const [loading, setLoading] = useState(true);
  const [riskLoading, setRiskLoading] = useState(true);

  const [error, setError] = useState("");
  const [riskError, setRiskError] = useState("");

  useEffect(() => {
    async function fetchLocations() {
      try {
        setLoading(true);
        setError("");

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
        console.error("GSI location error:", err);

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
    async function fetchRiskAlerts() {
      try {
        setRiskLoading(true);
        setRiskError("");

        const stateQuery =
          selectedState === "All States"
            ? ""
            : `&state=${encodeURIComponent(selectedState)}`;

        const response = await fetch(
          `${API_URL}/risk/alerts?limit=20${stateQuery}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch risk alerts");
        }

        const data = await response.json();

        setRiskAlerts(data.alerts || []);
      } catch (err) {
        console.error("Risk alert error:", err);

        setRiskError(
          "Unable to load weather-aware risk alerts."
        );

        setRiskAlerts([]);
      } finally {
        setRiskLoading(false);
      }
    }

    fetchRiskAlerts();
  }, [selectedState]);

  useEffect(() => {
    async function fetchCitizenReports() {
      try {
        const response = await fetch(
          `${API_URL}/reports`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch citizen reports");
        }

        const data = await response.json();

        setCitizenReports(
          Array.isArray(data)
            ? data
            : data.reports || []
        );
      } catch (err) {
        console.error("Citizen report error:", err);

        setCitizenReports([]);
      }
    }

    fetchCitizenReports();

    const interval = setInterval(
      fetchCitizenReports,
      30000
    );

    return () => clearInterval(interval);
  }, []);

  async function analyzeLocation(location) {
    if (!location) return;

    setSelectedLocation(location);
    setRiskAnalysis(null);
    setRiskError("");

    try {
      const response = await fetch(
        `${API_URL}/risk/analyze-location?sl_no=${location.sl_no}&language=English`
      );

      if (!response.ok) {
        throw new Error("Risk analysis failed");
      }

      const data = await response.json();

      setRiskAnalysis(data);
    } catch (err) {
      console.error("Location analysis error:", err);

      setRiskError(
        "Unable to generate risk analysis for this location."
      );
    }
  }

  function selectRiskAlert(alert) {
    if (!alert) return;

    const location = {
      sl_no: alert.sl_no,
      latitude: Number(alert.latitude),
      longitude: Number(alert.longitude),
      district: alert.district,
      state: alert.state,
      elevation: Number(alert.elevation),
      slope: Number(alert.slope)
    };

    analyzeLocation(location);
  }

  const criticalCount = riskAlerts.filter(
    (alert) => alert.risk_level === "Critical"
  ).length;

  const highCount = riskAlerts.filter(
    (alert) => alert.risk_level === "High"
  ).length;

  return (
    <AppShell>

      <div className="risk-map-page">

        <section className="risk-map-page-header">

          <div>
            <span className="page-eyebrow">
              GIS SURVEILLANCE
            </span>

            <h1>
              🗺️ GIS Landslide Risk Map
            </h1>

            <p>
              North Eastern Region • GSI locations +
              weather-aware AI screening + citizen reports
            </p>
          </div>

          <div className="risk-map-page-status">
            <span className="status-dot"></span>
            Live Monitoring
          </div>

        </section>

        <section className="risk-map-toolbar">

          <div className="risk-map-filter">

            <label htmlFor="risk-map-state">
              State
            </label>

            <select
              id="risk-map-state"
              value={selectedState}
              onChange={(event) =>
                setSelectedState(event.target.value)
              }
            >
              {STATES.map((state) => (
                <option
                  key={state}
                  value={state}
                >
                  {state}
                </option>
              ))}
            </select>

          </div>

          <div className="risk-map-toolbar-stats">

            <span>
              📍{" "}
              {loading
                ? "Loading..."
                : `${locations.length.toLocaleString()} GSI locations`}
            </span>

            <span>
              🚨 {criticalCount} Critical
            </span>

            <span>
              🟠 {highCount} High
            </span>

          </div>

          <div className="risk-map-toggles">

            <button
              type="button"
              className={
                showRiskAlerts
                  ? "map-toggle active"
                  : "map-toggle"
              }
              onClick={() =>
                setShowRiskAlerts(
                  (current) => !current
                )
              }
            >
              🚨 Risk Alerts
            </button>

            <button
              type="button"
              className={
                showCitizenReports
                  ? "map-toggle active"
                  : "map-toggle"
              }
              onClick={() =>
                setShowCitizenReports(
                  (current) => !current
                )
              }
            >
              📍 Citizen Reports
            </button>

          </div>

        </section>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <section className="risk-map-main-card">

          <div className="risk-map-map-container">

            <MapContainer
              center={[25.5, 92.5]}
              zoom={6}
              scrollWheelZoom={true}
            >

              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <MapBounds
                locations={locations}
              />

              {showRiskAlerts &&
                riskAlerts.map((alert, index) => (
                  <CircleMarker
                    key={`risk-${alert.sl_no}-${index}`}
                    center={[
                      Number(alert.latitude),
                      Number(alert.longitude)
                    ]}
                    radius={
                      alert.risk_level === "Critical"
                        ? 11
                        : 9
                    }
                    pathOptions={{
                      color: getRiskColor(
                        alert.risk_level
                      ),
                      fillColor: getRiskColor(
                        alert.risk_level
                      ),
                      fillOpacity: 0.75,
                      weight: 2
                    }}
                    eventHandlers={{
                      click: () =>
                        selectRiskAlert(alert)
                    }}
                  >
                    <Popup>

                      <div className="map-popup">

                        <strong>
                          🚨{" "}
                          {alert.risk_level} Risk
                        </strong>

                        <p>
                          📍{" "}
                          {alert.latitude.toFixed(4)},{" "}
                          {alert.longitude.toFixed(4)}
                        </p>

                        <p>
                          🏔️ Slope:{" "}
                          {Number(alert.slope).toFixed(2)}°
                        </p>

                        <p>
                          ⛰️ Elevation:{" "}
                          {Number(
                            alert.elevation
                          ).toFixed(2)} m
                        </p>

                        <p>
                          🤖 Risk Score:{" "}
                          {Number(
                            alert.risk_score
                          ).toFixed(2)}%
                        </p>

                        <button
                          type="button"
                          onClick={() =>
                            selectRiskAlert(alert)
                          }
                        >
                          Analyze Location →
                        </button>

                      </div>

                    </Popup>

                  </CircleMarker>
                ))}

              {locations.map(
                (location, index) => (
                  <CircleMarker
                    key={`gsi-${location.sl_no}-${index}`}
                    center={[
                      Number(location.latitude),
                      Number(location.longitude)
                    ]}
                    radius={
                      selectedLocation?.sl_no ===
                      location.sl_no
                        ? 8
                        : 4
                    }
                    pathOptions={{
                      color:
                        selectedLocation?.sl_no ===
                        location.sl_no
                          ? "#dc2626"
                          : "#2563eb",
                      fillColor:
                        selectedLocation?.sl_no ===
                        location.sl_no
                          ? "#dc2626"
                          : "#2563eb",
                      fillOpacity:
                        selectedLocation?.sl_no ===
                        location.sl_no
                          ? 0.9
                          : 0.55,
                      weight: 1
                    }}
                    eventHandlers={{
                      click: () =>
                        analyzeLocation(location)
                    }}
                  >
                    <Popup>

                      <div className="map-popup">

                        <strong>
                          📍 GSI Historical Location
                        </strong>

                        <p>
                          {location.district},{" "}
                          {location.state}
                        </p>

                        <p>
                          ⛰️ Elevation:{" "}
                          {Number(
                            location.elevation
                          ).toFixed(2)} m
                        </p>

                        <p>
                          🏔️ Slope:{" "}
                          {Number(
                            location.slope
                          ).toFixed(2)}°
                        </p>

                        <button
                          type="button"
                          onClick={() =>
                            analyzeLocation(location)
                          }
                        >
                          Run AI Analysis →
                        </button>

                      </div>

                    </Popup>

                  </CircleMarker>
                )
              )}

              {showCitizenReports &&
                citizenReports.map(
                  (report, index) => {

                    const latitude = Number(
                      report.latitude
                    );

                    const longitude = Number(
                      report.longitude
                    );

                    if (
                      !Number.isFinite(latitude) ||
                      !Number.isFinite(longitude)
                    ) {
                      return null;
                    }

                    const color =
                      getCitizenColor(
                        report.severity
                      );

                    return (
                      <CircleMarker
                        key={`citizen-${report.id || index}`}
                        center={[
                          latitude,
                          longitude
                        ]}
                        radius={8}
                        pathOptions={{
                          color,
                          fillColor: color,
                          fillOpacity: 0.8,
                          weight: 2
                        }}
                      >
                        <Popup>

                          <div className="map-popup">

                            <strong>
                              📍 Citizen Report
                            </strong>

                            <p>
                              Severity:{" "}
                              {report.severity ||
                                "Unknown"}
                            </p>

                            <p>
                              {report.description ||
                                "No description provided."}
                            </p>

                            <p>
                              Status:{" "}
                              {report.status ||
                                "Received"}
                            </p>

                          </div>

                        </Popup>

                      </CircleMarker>
                    );
                  }
                )}

            </MapContainer>

          </div>

          <aside className="risk-map-side-panel">

            <div className="risk-map-panel-header">

              <div>
                <span className="page-eyebrow">
                  LOCATION ANALYSIS
                </span>

                <h2>
                  Selected Location
                </h2>
              </div>

              {selectedLocation && (
                <span className="selected-location-badge">
                  ACTIVE
                </span>
              )}

            </div>

            {!selectedLocation ? (
              <div className="risk-map-empty">

                <div className="risk-map-empty-icon">
                  📍
                </div>

                <h3>
                  Select a location
                </h3>

                <p>
                  Click any blue GSI marker or
                  risk alert marker on the map
                  to run the AI risk analysis.
                </p>

              </div>
            ) : (
              <div className="selected-location-details">

                <div className="selected-location-title">
                  <h3>
                    {selectedLocation.district ||
                      "Unknown District"}
                  </h3>

                  <span>
                    {selectedLocation.state ||
                      "Unknown State"}
                  </span>
                </div>

                <div className="location-metrics">

                  <div>
                    <span>Elevation</span>
                    <strong>
                      {Number(
                        selectedLocation.elevation
                      ).toFixed(2)} m
                    </strong>
                  </div>

                  <div>
                    <span>Slope</span>
                    <strong>
                      {Number(
                        selectedLocation.slope
                      ).toFixed(2)}°
                    </strong>
                  </div>

                  <div>
                    <span>Latitude</span>
                    <strong>
                      {Number(
                        selectedLocation.latitude
                      ).toFixed(4)}
                    </strong>
                  </div>

                  <div>
                    <span>Longitude</span>
                    <strong>
                      {Number(
                        selectedLocation.longitude
                      ).toFixed(4)}
                    </strong>
                  </div>

                </div>

                {riskAnalysis ? (
                  <div className="map-analysis-result">

                    <div className="map-analysis-risk">

                      <span>
                        AI Risk Level
                      </span>

                      <strong
                        className={
                          `risk-level-${(
                            riskAnalysis.prediction
                              ?.risk_level || ""
                          ).toLowerCase()}`
                        }
                      >
                        {riskAnalysis.prediction
                          ?.risk_level || "Unknown"}
                      </strong>

                      <b>
                        {Number(
                          riskAnalysis.prediction
                            ?.risk_score || 0
                        ).toFixed(2)}%
                      </b>

                    </div>

                    <div className="map-analysis-weather">

                      <h4>
                        🌧️ Recent Weather
                      </h4>

                      <div className="weather-mini-grid">

                        <div>
                          <span>1 Day</span>
                          <strong>
                            {riskAnalysis.weather
                              ?.rainfall_1d ?? "—"} mm
                          </strong>
                        </div>

                        <div>
                          <span>3 Days</span>
                          <strong>
                            {riskAnalysis.weather
                              ?.rainfall_3d ?? "—"} mm
                          </strong>
                        </div>

                        <div>
                          <span>7 Days</span>
                          <strong>
                            {riskAnalysis.weather
                              ?.rainfall_7d ?? "—"} mm
                          </strong>
                        </div>

                        <div>
                          <span>30 Days</span>
                          <strong>
                            {riskAnalysis.weather
                              ?.rainfall_30d ?? "—"} mm
                          </strong>
                        </div>

                      </div>

                      <p>
                        Source:{" "}
                        {riskAnalysis.weather
                          ?.source || "NASA POWER"}
                      </p>

                    </div>

                    {riskAnalysis.alert?.message && (
                      <div className="map-analysis-alert">

                        <strong>
                          🚨 Early Warning
                        </strong>

                        <p>
                          {riskAnalysis.alert.message}
                        </p>

                      </div>
                    )}

                  </div>
                ) : (
                  <div className="map-analysis-loading">

                    <span>
                      {riskError ||
                        "⏳ Generating AI risk analysis..."}
                    </span>

                  </div>
                )}

              </div>
            )}

          </aside>

        </section>

        <section className="risk-map-legend-card">

          <div>
            <strong>
              Map Legend
            </strong>
            <span>
              Blue markers = GSI historical locations
            </span>
          </div>

          <div className="risk-map-legend-items">

            <span>
              <i className="legend-dot critical"></i>
              Critical
            </span>

            <span>
              <i className="legend-dot high"></i>
              High
            </span>

            <span>
              <i className="legend-dot medium"></i>
              Medium
            </span>

            <span>
              <i className="legend-dot low"></i>
              Low
            </span>

            <span>
              <i className="legend-dot citizen"></i>
              Citizen Report
            </span>

          </div>

        </section>

        {riskLoading && (
          <div className="risk-map-info">
            ⏳ Loading weather-aware AI risk screening...
          </div>
        )}

      </div>

    </AppShell>
  );
}
