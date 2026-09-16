import { useEffect, useMemo, useState } from "react";
import AppShell from "../components/AppShell.jsx";

const API_URL = "http://127.0.0.1:8000";

const riskOrder = {
  Critical: 4,
  High: 3,
  Medium: 2,
  Low: 1,
};

export default function RoadMonitoring() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [stateFilter, setStateFilter] = useState("All States");
  const [highwayFilter, setHighwayFilter] = useState("All Types");
  const [riskFilter, setRiskFilter] = useState("All Levels");
  const [selectedRoad, setSelectedRoad] = useState(null);

  const loadRoads = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/roads/monitor?limit=100&state=${encodeURIComponent(
          stateFilter
        )}&highway=${encodeURIComponent(
          highwayFilter
        )}&risk_level=${encodeURIComponent(
          riskFilter
        )}`
      );

      if (!response.ok) {
        throw new Error(`Road API returned ${response.status}`);
      }

      const result = await response.json();

      if (result.status !== "success") {
        throw new Error("Road monitoring API returned an unsuccessful response");
      }

      setData(result);

      if (result.roads?.length) {
        const existingSelected = result.roads.find(
          (road) => road.osm_id === selectedRoad?.osm_id
        );

        setSelectedRoad(existingSelected || result.roads[0]);
      } else {
        setSelectedRoad(null);
      }
    } catch (err) {
      setError(err.message || "Unable to load road monitoring data.");
      setData(null);
      setSelectedRoad(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoads();
    const interval = setInterval(loadRoads, 300000);

    return () => clearInterval(interval);
  }, [stateFilter, highwayFilter, riskFilter]);

  const summary = data?.summary || {
    total_segments: 0,
    screened_segments: 0,
    weather_unavailable: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };

  const states = useMemo(() => {
    if (!data?.roads) return [];

    return [...new Set(data.roads.map((road) => road.state))]
      .filter(Boolean)
      .sort();
  }, [data]);

  const highwayTypes = useMemo(() => {
    if (!data?.roads) return [];

    return [...new Set(data.roads.map((road) => road.highway))]
      .filter(Boolean)
      .sort();
  }, [data]);

  const visibleRoads = useMemo(() => {
    const roads = data?.roads || [];

    return [...roads].sort(
      (a, b) =>
        (riskOrder[b.risk_level] || 0) -
        (riskOrder[a.risk_level] || 0)
    );
  }, [data]);

  const getRiskClass = (level) => {
    if (level === "Critical") return "road-risk-critical";
    if (level === "High") return "road-risk-high";
    if (level === "Medium") return "road-risk-medium";
    return "road-risk-low";
  };

  return (
    <AppShell>
      <div className="road-live-page">
        <section className="road-live-header">
          <div>
            <span className="page-eyebrow">
              TRANSPORTATION RISK SYSTEM
            </span>

            <h1>Highway Corridor Vulnerability Monitoring</h1>

            <p>
              Real road-segment screening using OSM road geometry,
              GSI terrain, NASA POWER weather and the XGBoost risk engine.
            </p>
          </div>

          <div className="road-live-status">
            <span className="road-live-status-dot"></span>
            <div>
              <strong>LIVE SCREENING</strong>
              <span>
                {loading
                  ? "Refreshing road intelligence..."
                  : "Road monitoring data connected"}
              </span>
            </div>
          </div>
        </section>

        {error && (
          <div className="road-live-error">
            <strong>Road monitoring unavailable</strong>
            <span>{error}</span>
          </div>
        )}

        <section className="road-live-kpis">
          <div className="road-live-kpi">
            <div className="road-live-kpi-icon">🛣️</div>
            <div>
              <span>HIGHWAY SEGMENTS</span>
              <strong>{summary.total_segments.toLocaleString()}</strong>
              <small>OSM major-road segments</small>
            </div>
          </div>

          <div className="road-live-kpi">
            <div className="road-live-kpi-icon">📡</div>
            <div>
              <span>SCREENED SEGMENTS</span>
              <strong>{summary.screened_segments.toLocaleString()}</strong>
              <small>Weather-aware ML screening</small>
            </div>
          </div>

          <div className="road-live-kpi road-live-kpi-danger">
            <div className="road-live-kpi-icon">🚨</div>
            <div>
              <span>CRITICAL SEGMENTS</span>
              <strong>{summary.critical.toLocaleString()}</strong>
              <small>Highest current screening level</small>
            </div>
          </div>

          <div className="road-live-kpi">
            <div className="road-live-kpi-icon">⚠️</div>
            <div>
              <span>HIGH-RISK SEGMENTS</span>
              <strong>{summary.high.toLocaleString()}</strong>
              <small>Priority monitoring</small>
            </div>
          </div>
        </section>

        <section className="road-live-filter-card">
          <div>
            <strong>ROAD NETWORK FILTERS</strong>
            <span>Refine the screened corridor list</span>
          </div>

          <div className="road-live-filters">
            <label>
              State
              <select
                value={stateFilter}
                onChange={(event) =>
                  setStateFilter(event.target.value)
                }
              >
                <option value="All States">All States</option>
                {states.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Highway Type
              <select
                value={highwayFilter}
                onChange={(event) =>
                  setHighwayFilter(event.target.value)
                }
              >
                <option value="All Types">All Types</option>
                {highwayTypes.map((highway) => (
                  <option key={highway} value={highway}>
                    {highway}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Risk Level
              <select
                value={riskFilter}
                onChange={(event) =>
                  setRiskFilter(event.target.value)
                }
              >
                <option value="All Levels">All Levels</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </label>
          </div>
        </section>

        <section className="road-live-main-grid">
          <div className="road-live-table-card">
            <div className="road-live-section-heading">
              <div>
                <h2>🛣️ Screened Road Segments</h2>
                <p>
                  Ranked road segments from the weather-aware screening dataset
                </p>
              </div>

              <span className="road-live-count">
                {data?.filtered_count ?? 0} shown
              </span>
            </div>

            {loading ? (
              <div className="road-live-loading">
                <div className="road-live-spinner"></div>
                <strong>Loading road intelligence...</strong>
                <span>
                  Fetching screened corridor data from the backend.
                </span>
              </div>
            ) : visibleRoads.length === 0 ? (
              <div className="road-live-empty">
                <div>🛣️</div>
                <h3>No road segments found</h3>
                <p>
                  No screened road matches the selected filters.
                </p>
              </div>
            ) : (
              <div className="road-live-table-wrap">
                <table className="road-live-table">
                  <thead>
                    <tr>
                      <th>Road</th>
                      <th>Location</th>
                      <th>Type</th>
                      <th>Slope</th>
                      <th>Rain 7D</th>
                      <th>Risk</th>
                    </tr>
                  </thead>

                  <tbody>
                    {visibleRoads.map((road) => (
                      <tr
                        key={road.osm_id}
                        className={
                          selectedRoad?.osm_id === road.osm_id
                            ? "selected"
                            : ""
                        }
                        onClick={() => setSelectedRoad(road)}
                      >
                        <td>
                          <div className="road-table-road">
                            <strong>
                              {road.road_name || `OSM ${road.osm_id}`}
                            </strong>
                            <small>OSM {road.osm_id}</small>
                          </div>
                        </td>

                        <td>
                          <strong>{road.district}</strong>
                          <small>{road.state}</small>
                        </td>

                        <td>
                          <span className="road-type-badge">
                            {road.highway}
                          </span>
                        </td>

                        <td>{road.slope.toFixed(1)}°</td>

                        <td>{road.rainfall_7d.toFixed(2)} mm</td>

                        <td>
                          <span
                            className={`road-risk-badge ${getRiskClass(
                              road.risk_level
                            )}`}
                          >
                            {road.risk_score?.toFixed(2)} ·{" "}
                            {road.risk_level}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <aside className="road-live-detail-column">
            <section className="road-live-detail-card">
              <div className="road-live-section-heading compact">
                <div>
                  <h2>Selected Road</h2>
                  <p>Current screened corridor details</p>
                </div>
              </div>

              {selectedRoad ? (
                <div className="road-live-detail-content">
                  <div className="road-live-detail-title">
                    <span className="road-type-badge">
                      {selectedRoad.highway}
                    </span>

                    <h3>
                      {selectedRoad.road_name ||
                        `OSM ${selectedRoad.osm_id}`}
                    </h3>

                    <p>
                      {selectedRoad.district},{" "}
                      {selectedRoad.state}
                    </p>
                  </div>

                  <div
                    className={`road-live-risk-panel ${getRiskClass(
                      selectedRoad.risk_level
                    )}`}
                  >
                    <span>AI RISK SCREENING</span>
                    <strong>
                      {selectedRoad.risk_score?.toFixed(2)}
                    </strong>
                    <b>{selectedRoad.risk_level}</b>
                  </div>

                  <div className="road-live-metric-grid">
                    <div>
                      <span>SLOPE</span>
                      <strong>
                        {selectedRoad.slope.toFixed(2)}°
                      </strong>
                    </div>

                    <div>
                      <span>MAX SLOPE</span>
                      <strong>
                        {selectedRoad.max_slope.toFixed(2)}°
                      </strong>
                    </div>

                    <div>
                      <span>ELEVATION</span>
                      <strong>
                        {selectedRoad.elevation.toFixed(0)} m
                      </strong>
                    </div>

                    <div>
                      <span>RAIN 1D</span>
                      <strong>
                        {selectedRoad.rainfall_1d.toFixed(2)} mm
                      </strong>
                    </div>

                    <div>
                      <span>RAIN 7D</span>
                      <strong>
                        {selectedRoad.rainfall_7d.toFixed(2)} mm
                      </strong>
                    </div>

                    <div>
                      <span>RAIN 30D</span>
                      <strong>
                        {selectedRoad.rainfall_30d.toFixed(2)} mm
                      </strong>
                    </div>

                    <div>
                      <span>TEMP</span>
                      <strong>
                        {selectedRoad.temperature.toFixed(2)}°C
                      </strong>
                    </div>

                    <div>
                      <span>HUMIDITY</span>
                      <strong>
                        {selectedRoad.humidity.toFixed(2)}%
                      </strong>
                    </div>
                  </div>

                  <div className="road-live-detail-meta">
                    <div>
                      <span>Latest Weather</span>
                      <strong>{selectedRoad.latest_date}</strong>
                    </div>

                    <div>
                      <span>GSI Distance</span>
                      <strong>
                        {selectedRoad.representative_distance_m.toFixed(
                          1
                        )}{" "}
                        m
                      </strong>
                    </div>
                  </div>

                  <div className="road-live-note">
                    <strong>Prototype screening</strong>
                    <p>
                      Risk values combine the current GSI terrain point
                      and recent NASA POWER weather features through the
                      existing XGBoost model. They are not official road
                      closure or disaster-warning decisions.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="road-live-empty compact">
                  <div>📍</div>
                  <h3>Select a road</h3>
                  <p>
                    Choose a segment from the table to view details.
                  </p>
                </div>
              )}
            </section>

            <section className="road-live-summary-card">
              <div className="road-live-section-heading compact">
                <div>
                  <h2>Screening Summary</h2>
                  <p>Regional road intelligence</p>
                </div>
              </div>

              <div className="road-live-summary-list">
                <div>
                  <span>Critical</span>
                  <strong>{summary.critical}</strong>
                </div>
                <div>
                  <span>High</span>
                  <strong>{summary.high}</strong>
                </div>
                <div>
                  <span>Medium</span>
                  <strong>{summary.medium}</strong>
                </div>
                <div>
                  <span>Low</span>
                  <strong>{summary.low}</strong>
                </div>
                <div>
                  <span>Weather unavailable</span>
                  <strong>{summary.weather_unavailable}</strong>
                </div>
              </div>
            </section>
          </aside>
        </section>

        <section className="road-live-data-note">
          <strong>Data & methodology</strong>
          <p>
            This module uses OpenStreetMap major-road geometry, spatially
            matched GSI terrain observations, recent NASA POWER weather
            observations and the existing XGBoost risk engine. The current
            screening dataset contains 1,883 road segments, of which 1,656
            have valid weather-aware ML screening results.
          </p>
        </section>
      </div>
    </AppShell>
  );
}
