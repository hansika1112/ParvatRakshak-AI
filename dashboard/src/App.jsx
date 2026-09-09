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
      padding: [30, 30],
      maxZoom: 8
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

function App() {
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [riskAnalysis, setRiskAnalysis] = useState(null);
  const [selectedState, setSelectedState] = useState("All States");
  const [loading, setLoading] = useState(true);
  const [riskLoading, setRiskLoading] = useState(false);
  const [error, setError] = useState("");
  const [riskError, setRiskError] = useState("");

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
          `${API_URL}/risk/analyze-location?sl_no=${selectedLocation.sl_no}`
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
  }, [selectedLocation]);

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
                <strong className={`kpi-value risk-${riskLevelClass || "none"}`}>
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

            </MapContainer>

          </div>

        </section>

        <aside className="sidebar">

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

          </div>

          <div className="sidebar-card ai-card">

            <div className="ai-card-header">

              <div>
                <h2>🤖 AI Risk Assessment</h2>
                <p>
                  Terrain + recent weather + XGBoost
                </p>
              </div>

            </div>

            {!selectedLocation ? (

              <div className="ai-empty">
                Select a map location to calculate
                AI-based risk.
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

          <div className="sidebar-card coverage-card">

            <h2>Monitoring Coverage</h2>

            <div className="coverage-number">

              {loading
                ? "—"
                : locations.length.toLocaleString()}

            </div>

            <p>
              {selectedState === "All States"
                ? "GSI historical landslide locations loaded"
                : `Historical locations in ${selectedState}`}
            </p>

            <div className="legend">

              <div className="legend-item">

                <span className="legend-dot"></span>

                Historical Landslide

              </div>

            </div>

          </div>

        </aside>

      </main>

      <footer>
        ParvatRakshak AI • Smart India Hackathon 2026 • SIH26001
      </footer>

    </div>
  );
}

export default App;
