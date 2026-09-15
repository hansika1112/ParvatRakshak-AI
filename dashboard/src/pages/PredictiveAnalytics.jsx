import { useEffect, useMemo, useState } from "react";
import AppShell from "../components/AppShell.jsx";

const API_URL = "http://127.0.0.1:8000";

const RISK_ORDER = ["Critical", "High", "Medium", "Low"];

function riskClass(level) {
  return String(level || "Low").toLowerCase();
}

function formatNumber(value, digits = 2) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "—";
  }

  return Number(value).toFixed(digits);
}

function AnalyticsBarChart({ data }) {
  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="analytics-bars">
      {data.map((item) => (
        <div className="analytics-bar-row" key={item.label}>
          <div className="analytics-bar-label">
            <span className={`risk-dot ${riskClass(item.label)}`}></span>
            <strong>{item.label}</strong>
            <span>{item.value}</span>
          </div>

          <div className="analytics-bar-track">
            <div
              className={`analytics-bar-fill ${riskClass(item.label)}`}
              style={{
                width: `${Math.max((item.value / max) * 100, item.value ? 4 : 0)}%`
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function WeatherTrend({ daily }) {
  const validRain = daily.filter(
    (item) => item.rainfall !== null && item.rainfall !== undefined
  );

  if (!validRain.length) {
    return (
      <div className="analytics-empty">
        No valid rainfall observations available from NASA POWER.
      </div>
    );
  }

  const maxRain = Math.max(...validRain.map((item) => Number(item.rainfall)), 1);

  return (
    <div className="weather-trend">
      {validRain.map((item) => (
        <div className="weather-trend-day" key={item.date}>
          <div
            className="weather-trend-bar"
            style={{
              height: `${Math.max((Number(item.rainfall) / maxRain) * 100, 4)}%`
            }}
            title={`${item.date}: ${formatNumber(item.rainfall)} mm`}
          />
          <span>
            {item.date.slice(6, 8)}/{item.date.slice(4, 6)}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function PredictiveAnalytics() {
  const [riskAlerts, setRiskAlerts] = useState([]);
  const [reports, setReports] = useState([]);
  const [weather, setWeather] = useState(null);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [error, setError] = useState("");
  const [weatherError, setWeatherError] = useState("");

  useEffect(() => {
    async function loadAnalytics() {
      try {
        setLoading(true);
        setError("");

        const [riskResponse, reportResponse] = await Promise.all([
          fetch(`${API_URL}/risk/alerts?limit=20`),
          fetch(`${API_URL}/reports`)
        ]);

        if (!riskResponse.ok) {
          throw new Error("Unable to load risk analytics");
        }

        const riskData = await riskResponse.json();
        const reportData = reportResponse.ok
          ? await reportResponse.json()
          : { reports: [] };

        const alerts = riskData.alerts || [];

        setRiskAlerts(alerts);
        setReports(reportData.reports || []);

        if (alerts.length > 0) {
          setSelectedAlert(alerts[0]);
        }
      } catch (err) {
        console.error(err);
        setError(err.message || "Unable to load analytics");
      } finally {
        setLoading(false);
      }
    }

    loadAnalytics();

    const interval = setInterval(loadAnalytics, 300000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function loadWeather() {
      if (!selectedAlert) {
        setWeather(null);
        return;
      }

      try {
        setWeatherLoading(true);
        setWeatherError("");

        const response = await fetch(
          `${API_URL}/weather?latitude=${selectedAlert.latitude}&longitude=${selectedAlert.longitude}`
        );

        if (!response.ok) {
          throw new Error("Unable to load weather trend");
        }

        const data = await response.json();
        setWeather(data);
      } catch (err) {
        console.error(err);
        setWeatherError("Weather trend unavailable");
        setWeather(null);
      } finally {
        setWeatherLoading(false);
      }
    }

    loadWeather();
  }, [selectedAlert]);

  const riskCounts = useMemo(() => {
    return RISK_ORDER.reduce((result, level) => {
      result[level] = riskAlerts.filter(
        (alert) => alert.risk_level === level
      ).length;
      return result;
    }, {});
  }, [riskAlerts]);

  const emergencyReports = reports.filter(
    (report) => report.severity === "Critical" || report.severity === "High"
  ).length;

  const highestRisk = riskAlerts[0] || null;

  const averageRisk = riskAlerts.length
    ? riskAlerts.reduce(
        (sum, alert) => sum + Number(alert.risk_score || 0),
        0
      ) / riskAlerts.length
    : 0;

  const maxRainfall24h = riskAlerts.reduce(
    (max, alert) =>
      Math.max(max, Number(alert.weather?.rainfall_1d || 0)),
    0
  );

  const trendDaily = weather?.daily || [];

  return (
    <AppShell>
      <div className="analytics-page">
        <div className="analytics-page-header">
          <div>
            <span className="page-eyebrow">PREDICTIVE INTELLIGENCE</span>
            <h1>Predictive Risk Analytics</h1>
            <p>
              Explainable landslide risk intelligence using GSI terrain,
              NASA POWER weather and the XGBoost risk engine.
            </p>
          </div>

          <div className="analytics-status-card">
            <span className="analytics-status-dot"></span>
            <div>
              <strong>ANALYTICS ACTIVE</strong>
              <span>Live prototype screening</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="analytics-error">
            ⚠️ {error}
          </div>
        )}

        <section className="analytics-kpi-grid">
          <div className="analytics-kpi-card critical">
            <span className="analytics-kpi-icon">🔴</span>
            <div>
              <span>Critical Risk</span>
              <strong>{loading ? "—" : riskCounts.Critical}</strong>
              <small>Screened locations</small>
            </div>
          </div>

          <div className="analytics-kpi-card high">
            <span className="analytics-kpi-icon">🟠</span>
            <div>
              <span>High Risk</span>
              <strong>{loading ? "—" : riskCounts.High}</strong>
              <small>Priority monitoring</small>
            </div>
          </div>

          <div className="analytics-kpi-card rainfall">
            <span className="analytics-kpi-icon">🌧️</span>
            <div>
              <span>Max 24h Rainfall</span>
              <strong>
                {loading ? "—" : `${formatNumber(maxRainfall24h)} mm`}
              </strong>
              <small>Among screened locations</small>
            </div>
          </div>

          <div className="analytics-kpi-card average">
            <span className="analytics-kpi-icon">📈</span>
            <div>
              <span>Average Risk Score</span>
              <strong>
                {loading ? "—" : `${formatNumber(averageRisk)}%`}
              </strong>
              <small>Current screened set</small>
            </div>
          </div>
        </section>

        <div className="analytics-main-grid">
          <section className="analytics-card risk-distribution-card">
            <div className="analytics-card-header">
              <div>
                <h2>📊 Risk Distribution</h2>
                <p>
                  Current weather-aware screening across the ranked candidate
                  locations.
                </p>
              </div>

              <span className="analytics-count-badge">
                {riskAlerts.length} screened
              </span>
            </div>

            <AnalyticsBarChart
              data={RISK_ORDER.map((level) => ({
                label: level,
                value: riskCounts[level]
              }))}
            />

            <div className="analytics-summary-row">
              <div>
                <span>Citizen reports</span>
                <strong>{reports.length}</strong>
              </div>

              <div>
                <span>High-priority reports</span>
                <strong>{emergencyReports}</strong>
              </div>

              <div>
                <span>Risk engine</span>
                <strong>XGBoost</strong>
              </div>
            </div>
          </section>

          <section className="analytics-card model-card">
            <div className="analytics-card-header">
              <div>
                <h2>🤖 Risk Engine</h2>
                <p>Features currently supplied to the model.</p>
              </div>
            </div>

            <div className="feature-grid">
              {[
                ["⛰️", "Elevation"],
                ["📐", "Slope"],
                ["🌧️", "Rainfall 1D"],
                ["🌧️", "Rainfall 3D"],
                ["🌧️", "Rainfall 7D"],
                ["🌧️", "Rainfall 30D"],
                ["🌡️", "Temperature"],
                ["💧", "Humidity"],
                ["💨", "Wind Speed"]
              ].map(([icon, label]) => (
                <div className="feature-item" key={label}>
                  <span>{icon}</span>
                  <strong>{label}</strong>
                </div>
              ))}
            </div>

            <div className="threshold-list">
              <div><span className="risk-dot low"></span> Low &lt; 25%</div>
              <div><span className="risk-dot medium"></span> Medium 25–49.99%</div>
              <div><span className="risk-dot high"></span> High 50–74.99%</div>
              <div><span className="risk-dot critical"></span> Critical ≥ 75%</div>
            </div>
          </section>

          <section className="analytics-card locations-card">
            <div className="analytics-card-header">
              <div>
                <h2>🎯 Highest-Risk Locations</h2>
                <p>Select a location to inspect its weather trend.</p>
              </div>
            </div>

            <div className="analytics-location-list">
              {riskAlerts.length === 0 && !loading ? (
                <div className="analytics-empty">
                  No screened locations available.
                </div>
              ) : (
                riskAlerts.slice(0, 8).map((alert) => (
                  <button
                    type="button"
                    key={alert.sl_no}
                    className={`analytics-location-row ${
                      selectedAlert?.sl_no === alert.sl_no ? "selected" : ""
                    }`}
                    onClick={() => setSelectedAlert(alert)}
                  >
                    <span className={`risk-dot ${riskClass(alert.risk_level)}`}></span>

                    <div className="analytics-location-main">
                      <strong>{alert.risk_level} Risk</strong>
                      <span>
                        Location ID: {alert.sl_no} •{" "}
                        {formatNumber(alert.latitude, 4)},{" "}
                        {formatNumber(alert.longitude, 4)}
                      </span>
                    </div>

                    <strong className="analytics-location-score">
                      {formatNumber(alert.risk_score)}%
                    </strong>
                  </button>
                ))
              )}
            </div>
          </section>

          <section className="analytics-card weather-card">
            <div className="analytics-card-header">
              <div>
                <h2>🌧️ 30-Day Rainfall Intelligence</h2>
                <p>
                  {selectedAlert
                    ? `NASA POWER trend for location ${selectedAlert.sl_no}`
                    : "Select a screened location"}
                </p>
              </div>

              {weather?.source && (
                <span className="analytics-source-badge">
                  {weather.source}
                </span>
              )}
            </div>

            {weatherLoading ? (
              <div className="analytics-empty">Loading weather trend...</div>
            ) : weatherError ? (
              <div className="analytics-empty">{weatherError}</div>
            ) : (
              <>
                <WeatherTrend daily={trendDaily} />

                {weather && (
                  <div className="weather-metric-grid">
                    <div>
                      <span>24h Rainfall</span>
                      <strong>{formatNumber(weather.rainfall_1d)} mm</strong>
                    </div>
                    <div>
                      <span>7d Rainfall</span>
                      <strong>{formatNumber(weather.rainfall_7d)} mm</strong>
                    </div>
                    <div>
                      <span>30d Rainfall</span>
                      <strong>{formatNumber(weather.rainfall_30d)} mm</strong>
                    </div>
                    <div>
                      <span>Humidity</span>
                      <strong>{formatNumber(weather.humidity)}%</strong>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>

          <section className="analytics-card top-location-card">
            <div className="analytics-card-header">
              <div>
                <h2>🚨 Current Highest Risk</h2>
                <p>Highest-ranked result from the screening engine.</p>
              </div>
            </div>

            {highestRisk ? (
              <div className={`top-risk-panel ${riskClass(highestRisk.risk_level)}`}>
                <div className="top-risk-title">
                  <span className={`risk-dot ${riskClass(highestRisk.risk_level)}`}></span>
                  <strong>{highestRisk.risk_level} Risk</strong>
                  <span>{formatNumber(highestRisk.risk_score)}%</span>
                </div>

                <div className="top-risk-details">
                  <span>📍 {formatNumber(highestRisk.latitude, 4)}, {formatNumber(highestRisk.longitude, 4)}</span>
                  <span>📐 Slope {formatNumber(highestRisk.slope)}°</span>
                  <span>⛰️ Elevation {formatNumber(highestRisk.elevation)} m</span>
                  <span>🌧️ 7D {formatNumber(highestRisk.weather?.rainfall_7d)} mm</span>
                </div>
              </div>
            ) : (
              <div className="analytics-empty">
                No current risk result available.
              </div>
            )}
          </section>
        </div>

        <div className="analytics-disclaimer">
          <strong>⚠️ Prototype / Validation Notice</strong>
          <p>
            Predictive analytics are generated from the existing GSI terrain
            inventory, recent NASA POWER weather observations and the
            XGBoost model. Risk thresholds are provisional and require
            further validation and calibration before operational use.
            Historical GSI records represent locations and do not confirm
            an active landslide.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
