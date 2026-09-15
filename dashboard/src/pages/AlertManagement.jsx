import { useEffect, useMemo, useState } from "react";
import AppShell from "../components/AppShell.jsx";
import "../App.css";

const API_URL = "http://127.0.0.1:8000";

const LEVELS = ["All", "Critical", "High", "Medium", "Low"];

function formatValue(value, suffix = "") {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  return `${value}${suffix}`;
}

function getLevelIcon(level) {
  if (level === "Critical") return "🔴";
  if (level === "High") return "🟠";
  if (level === "Medium") return "🟡";
  return "🟢";
}

export default function AlertManagement() {
  const [riskAlerts, setRiskAlerts] = useState([]);
  const [citizenReports, setCitizenReports] = useState([]);

  const [selectedLevel, setSelectedLevel] = useState("All");
  const [selectedAlert, setSelectedAlert] = useState(null);

  const [riskLoading, setRiskLoading] = useState(true);
  const [reportsLoading, setReportsLoading] = useState(true);

  const [riskError, setRiskError] = useState("");
  const [reportsError, setReportsError] = useState("");

  async function fetchRiskAlerts() {
    try {
      setRiskLoading(true);
      setRiskError("");

      const response = await fetch(
        `${API_URL}/risk/alerts?limit=20`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch risk alerts");
      }

      const data = await response.json();
      setRiskAlerts(data.alerts || []);
    } catch (error) {
      console.error("Risk alerts error:", error);
      setRiskError("Unable to load live risk alerts.");
    } finally {
      setRiskLoading(false);
    }
  }

  async function fetchCitizenReports() {
    try {
      setReportsLoading(true);
      setReportsError("");

      const response = await fetch(`${API_URL}/reports`);

      if (!response.ok) {
        throw new Error("Failed to fetch citizen reports");
      }

      const data = await response.json();
      setCitizenReports(data.reports || []);
    } catch (error) {
      console.error("Citizen reports error:", error);
      setReportsError("Unable to load citizen reports.");
    } finally {
      setReportsLoading(false);
    }
  }

  useEffect(() => {
    fetchRiskAlerts();
    fetchCitizenReports();

    const interval = setInterval(() => {
      fetchRiskAlerts();
      fetchCitizenReports();
    }, 300000);

    return () => clearInterval(interval);
  }, []);

  const counts = useMemo(() => {
    return {
      Critical: riskAlerts.filter(
        (alert) => alert.risk_level === "Critical"
      ).length,

      High: riskAlerts.filter(
        (alert) => alert.risk_level === "High"
      ).length,

      Medium: riskAlerts.filter(
        (alert) => alert.risk_level === "Medium"
      ).length,

      Low: riskAlerts.filter(
        (alert) => alert.risk_level === "Low"
      ).length,
    };
  }, [riskAlerts]);

  const emergencyReports = citizenReports.filter(
    (report) =>
      report.severity === "Critical" ||
      report.severity === "High"
  );

  const filteredAlerts =
    selectedLevel === "All"
      ? riskAlerts
      : riskAlerts.filter(
          (alert) => alert.risk_level === selectedLevel
        );

  const maxRainfall24h = riskAlerts.reduce(
    (maximum, alert) =>
      Math.max(
        maximum,
        Number(alert.weather?.rainfall_1d || 0)
      ),
    0
  );

  return (
    <AppShell>
      <div className="alert-management-page">

        <section className="alert-management-header">
          <div>
            <span className="page-eyebrow">
              EARLY WARNING SYSTEM
            </span>

            <h1>Early Warning Incident Control Center</h1>

            <p>
              Live weather-aware risk screening and citizen
              hazard reports across the North Eastern Region.
            </p>
          </div>

          <div className="alert-management-status">
            <span className="status-dot"></span>
            <div>
              <strong>MONITORING ACTIVE</strong>
              <span>NASA POWER + AI Risk Engine</span>
            </div>
          </div>
        </section>

        <section className="alert-kpi-grid">

          <div className="alert-kpi-card critical">
            <div className="alert-kpi-icon">🔴</div>
            <div>
              <span>CRITICAL ALERTS</span>
              <strong>{counts.Critical}</strong>
              <small>Immediate attention</small>
            </div>
          </div>

          <div className="alert-kpi-card high">
            <div className="alert-kpi-icon">🟠</div>
            <div>
              <span>HIGH RISK ALERTS</span>
              <strong>{counts.High}</strong>
              <small>Priority monitoring</small>
            </div>
          </div>

          <div className="alert-kpi-card rainfall">
            <div className="alert-kpi-icon">🌧️</div>
            <div>
              <span>MAX 24H RAINFALL</span>
              <strong>
                {riskLoading ? "…" : `${maxRainfall24h.toFixed(2)} mm`}
              </strong>
              <small>Among screened locations</small>
            </div>
          </div>

          <div className="alert-kpi-card reports">
            <div className="alert-kpi-icon">📍</div>
            <div>
              <span>EMERGENCY REPORTS</span>
              <strong>{emergencyReports.length}</strong>
              <small>Citizen-submitted</small>
            </div>
          </div>

        </section>

        <section className="alert-management-toolbar">

          <div>
            <strong>Risk Alert Queue</strong>
            <span>
              {filteredAlerts.length} screened locations
            </span>
          </div>

          <div className="alert-level-filters">
            {LEVELS.map((level) => (
              <button
                key={level}
                type="button"
                className={
                  selectedLevel === level
                    ? "active"
                    : ""
                }
                onClick={() => setSelectedLevel(level)}
              >
                {level !== "All" && getLevelIcon(level)}{" "}
                {level}
                {level !== "All" && (
                  <span>
                    {counts[level]}
                  </span>
                )}
              </button>
            ))}
          </div>

        </section>

        <div className="alert-management-layout">

          <section className="alert-queue-card">

            <div className="alert-section-heading">
              <div>
                <h2>🚨 Live Risk Alerts</h2>
                <p>
                  Ranked using terrain features, recent rainfall
                  and the XGBoost risk engine.
                </p>
              </div>

              <span className="live-badge">
                ● LIVE
              </span>
            </div>

            {riskLoading ? (
              <div className="alert-empty-state">
                <span>⏳</span>
                <strong>Loading risk alerts...</strong>
                <p>
                  Screening prioritized GSI locations with
                  recent NASA POWER weather data.
                </p>
              </div>
            ) : riskError ? (
              <div className="alert-empty-state error">
                <span>⚠️</span>
                <strong>{riskError}</strong>
                <button
                  type="button"
                  onClick={fetchRiskAlerts}
                >
                  Retry
                </button>
              </div>
            ) : filteredAlerts.length === 0 ? (
              <div className="alert-empty-state">
                <span>✅</span>
                <strong>No alerts in this category</strong>
                <p>
                  No screened locations currently match
                  the selected severity.
                </p>
              </div>
            ) : (
              <div className="alert-queue-list">

                {filteredAlerts.map((alert, index) => (
                  <button
                    type="button"
                    key={`${alert.sl_no}-${index}`}
                    className={`alert-queue-item ${String(
                      alert.risk_level
                    ).toLowerCase()}`}
                    onClick={() =>
                      setSelectedAlert(alert)
                    }
                  >

                    <div className="alert-queue-main">

                      <div className="alert-queue-title">
                        <span>
                          {getLevelIcon(alert.risk_level)}
                        </span>

                        <div>
                          <strong>
                            {alert.risk_level} Risk
                          </strong>

                          <small>
                            Location ID: {alert.sl_no}
                          </small>
                        </div>
                      </div>

                      <div className="alert-risk-score">
                        <strong>
                          {Number(
                            alert.risk_score || 0
                          ).toFixed(2)}%
                        </strong>
                        <span>AI risk score</span>
                      </div>

                    </div>

                    <div className="alert-location-row">
                      <span>
                        📍 {formatValue(
                          alert.latitude?.toFixed?.(4)
                        )},{" "}
                        {formatValue(
                          alert.longitude?.toFixed?.(4)
                        )}
                      </span>

                      <span>
                        ⛰️ Slope{" "}
                        {formatValue(
                          alert.slope?.toFixed?.(2),
                          "°"
                        )}
                      </span>

                      <span>
                        📏 Elevation{" "}
                        {formatValue(
                          alert.elevation?.toFixed?.(2),
                          " m"
                        )}
                      </span>
                    </div>

                    {alert.weather && (
                      <div className="alert-weather-row">

                        <span>
                          🌧️ 24h{" "}
                          <strong>
                            {formatValue(
                              alert.weather.rainfall_1d,
                              " mm"
                            )}
                          </strong>
                        </span>

                        <span>
                          🌧️ 7d{" "}
                          <strong>
                            {formatValue(
                              alert.weather.rainfall_7d,
                              " mm"
                            )}
                          </strong>
                        </span>

                        <span>
                          💧{" "}
                          {formatValue(
                            alert.weather.humidity,
                            "%"
                          )}
                        </span>

                        <span>
                          🌡️{" "}
                          {formatValue(
                            alert.weather.temperature,
                            "°C"
                          )}
                        </span>

                        <span>
                          💨{" "}
                          {formatValue(
                            alert.weather.wind_speed,
                            " m/s"
                          )}
                        </span>

                      </div>
                    )}

                    <div className="alert-queue-footer">
                      <span>
                        {alert.weather?.source || "Weather data"}
                        {" • "}
                        {alert.weather?.latest_date || "—"}
                      </span>

                      <strong>
                        View details →
                      </strong>
                    </div>

                  </button>
                ))}

              </div>
            )}

          </section>

          <aside className="alert-detail-column">

            <section className="alert-detail-card">

              <div className="alert-section-heading">
                <div>
                  <h2>Alert Details</h2>
                  <p>
                    Select a risk alert from the queue.
                  </p>
                </div>
              </div>

              {!selectedAlert ? (
                <div className="alert-detail-empty">
                  <span>🎯</span>
                  <strong>No alert selected</strong>
                  <p>
                    Select a location to inspect its AI risk
                    score, terrain and weather conditions.
                  </p>
                </div>
              ) : (
                <div className="selected-alert-details">

                  <div
                    className={`selected-alert-banner ${String(
                      selectedAlert.risk_level
                    ).toLowerCase()}`}
                  >
                    <div>
                      <span>
                        {getLevelIcon(
                          selectedAlert.risk_level
                        )}
                      </span>

                      <div>
                        <small>RISK LEVEL</small>
                        <strong>
                          {selectedAlert.risk_level}
                        </strong>
                      </div>
                    </div>

                    <div>
                      <small>AI SCORE</small>
                      <strong>
                        {Number(
                          selectedAlert.risk_score || 0
                        ).toFixed(2)}%
                      </strong>
                    </div>
                  </div>

                  <div className="detail-group">
                    <span>LOCATION</span>

                    <strong>
                      📍{" "}
                      {selectedAlert.latitude?.toFixed?.(4)}
                      {" , "}
                      {selectedAlert.longitude?.toFixed?.(4)}
                    </strong>
                  </div>

                  <div className="detail-metric-grid">

                    <div>
                      <span>⛰️ Slope</span>
                      <strong>
                        {formatValue(
                          selectedAlert.slope?.toFixed?.(2),
                          "°"
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>📏 Elevation</span>
                      <strong>
                        {formatValue(
                          selectedAlert.elevation?.toFixed?.(2),
                          " m"
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>🌧️ 24h Rain</span>
                      <strong>
                        {formatValue(
                          selectedAlert.weather?.rainfall_1d,
                          " mm"
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>🌧️ 30d Rain</span>
                      <strong>
                        {formatValue(
                          selectedAlert.weather?.rainfall_30d,
                          " mm"
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>💧 Humidity</span>
                      <strong>
                        {formatValue(
                          selectedAlert.weather?.humidity,
                          "%"
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>🌡️ Temperature</span>
                      <strong>
                        {formatValue(
                          selectedAlert.weather?.temperature,
                          "°C"
                        )}
                      </strong>
                    </div>

                  </div>

                  <div className="alert-detail-source">
                    <strong>Weather Source</strong>
                    <span>
                      {selectedAlert.weather?.source ||
                        "NASA POWER"}
                      {" • "}
                      {selectedAlert.weather?.latest_date ||
                        "Latest available"}
                    </span>
                  </div>

                  <div className="alert-prototype-notice">
                    <strong>⚠️ Prototype Screening</strong>
                    <p>
                      This AI-generated risk assessment combines
                      historical GSI terrain information with
                      recent NASA POWER weather data. It is not
                      an official disaster warning.
                    </p>
                  </div>

                </div>
              )}

            </section>

            <section className="citizen-alert-card">

              <div className="alert-section-heading">
                <div>
                  <h2>📍 Citizen Emergency Reports</h2>
                  <p>
                    High-priority field reports received by
                    the system.
                  </p>
                </div>

                <span className="report-count">
                  {emergencyReports.length}
                </span>
              </div>

              {reportsLoading ? (
                <div className="mini-alert-status">
                  Loading reports...
                </div>
              ) : reportsError ? (
                <div className="mini-alert-status error">
                  {reportsError}
                </div>
              ) : emergencyReports.length === 0 ? (
                <div className="mini-alert-status">
                  <span>✅</span>
                  No high-priority citizen reports.
                </div>
              ) : (
                <div className="citizen-alert-list">

                  {emergencyReports
                    .slice()
                    .reverse()
                    .slice(0, 6)
                    .map((report) => (
                      <div
                        className={`citizen-alert-item ${String(
                          report.severity
                        ).toLowerCase()}`}
                        key={report.report_id}
                      >
                        <div>
                          <strong>
                            {getLevelIcon(
                              report.severity
                            )}{" "}
                            {report.severity}
                          </strong>

                          <span>
                            {report.report_id}
                          </span>
                        </div>

                        <p>
                          {report.description}
                        </p>

                        <small>
                          📍{" "}
                          {Number(
                            report.latitude
                          ).toFixed(4)}
                          ,{" "}
                          {Number(
                            report.longitude
                          ).toFixed(4)}
                        </small>
                      </div>
                    ))}

                </div>
              )}

            </section>

          </aside>

        </div>

        <section className="alert-management-footer">

          <div>
            <strong>System Coverage</strong>
            <span>
              GSI terrain inventory • NASA POWER weather •
              XGBoost risk engine
            </span>
          </div>

          <div>
            <strong>
              {riskAlerts.length}
            </strong>
            <span>Active screened locations</span>
          </div>

          <div>
            <strong>
              {citizenReports.length}
            </strong>
            <span>Total citizen reports</span>
          </div>

        </section>

      </div>
    </AppShell>
  );
}
