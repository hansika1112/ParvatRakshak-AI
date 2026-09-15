import AppShell from "../components/AppShell.jsx";
import "../App.css";

const integrationItems = [
  {
    icon: "🛣️",
    title: "Highway Network",
    status: "DATA PENDING",
    description:
      "Road and highway geometry is not currently connected to the system.",
  },
  {
    icon: "📍",
    title: "Corridor Segmentation",
    status: "DATA PENDING",
    description:
      "Road corridors require network data before segment-level monitoring can be enabled.",
  },
  {
    icon: "⚠️",
    title: "Road Vulnerability",
    status: "READY FOR INTEGRATION",
    description:
      "Terrain, rainfall and AI risk outputs can be combined with road segments once road data is available.",
  },
];

export default function RoadMonitoring() {
  return (
    <AppShell>
      <div className="road-monitoring-page">

        <section className="road-page-header">
          <div>
            <span className="page-eyebrow">
              TRANSPORTATION RISK SYSTEM
            </span>

            <h1>Highway Corridor Vulnerability Monitoring</h1>

            <p>
              Monitor landslide vulnerability along critical
              highway corridors across the North Eastern Region.
            </p>
          </div>

          <div className="road-system-status">
            <span className="road-status-dot"></span>

            <div>
              <strong>MODULE ACTIVE</strong>
              <span>Road network integration pending</span>
            </div>
          </div>
        </section>

        <section className="road-kpi-grid">

          <div className="road-kpi-card">
            <div className="road-kpi-icon">🛣️</div>

            <div>
              <span>HIGHWAY CORRIDORS</span>
              <strong>—</strong>
              <small>Road network data pending</small>
            </div>
          </div>

          <div className="road-kpi-card">
            <div className="road-kpi-icon">⚠️</div>

            <div>
              <span>VULNERABLE SEGMENTS</span>
              <strong>—</strong>
              <small>Requires road segmentation</small>
            </div>
          </div>

          <div className="road-kpi-card">
            <div className="road-kpi-icon">🚧</div>

            <div>
              <span>ROAD INCIDENTS</span>
              <strong>—</strong>
              <small>Road incident feed not connected</small>
            </div>
          </div>

          <div className="road-kpi-card">
            <div className="road-kpi-icon">📡</div>

            <div>
              <span>MONITORING STATUS</span>
              <strong>READY</strong>
              <small>Awaiting highway network data</small>
            </div>
          </div>

        </section>

        <section className="road-main-grid">

          <div className="road-readiness-card">

            <div className="road-section-heading">
              <div>
                <h2>🛣️ Highway Corridor Monitor</h2>

                <p>
                  Road-level landslide vulnerability monitoring
                  will activate after highway network integration.
                </p>
              </div>

              <span className="road-pending-badge">
                DATA PENDING
              </span>
            </div>

            <div className="road-empty-state">

              <div className="road-empty-icon">
                🛣️
              </div>

              <h3>Highway Network Data Not Connected</h3>

              <p>
                The current ParvatRakshak AI dataset contains
                GSI terrain locations, district boundaries,
                rainfall and weather features, but does not
                contain a road or highway network layer.
              </p>

              <div className="road-data-requirements">

                <strong>
                  Required for road-level monitoring
                </strong>

                <div className="road-requirement-grid">

                  <span>✓ Highway / road geometry</span>
                  <span>✓ Corridor or route identifier</span>
                  <span>✓ Road segment coordinates</span>
                  <span>✓ Road incident / blockage data</span>

                </div>

              </div>

            </div>

          </div>

          <aside className="road-side-column">

            <section className="road-info-card">

              <div className="road-section-heading compact">
                <div>
                  <h2>AI Integration</h2>
                  <p>Available ParvatRakshak components</p>
                </div>
              </div>

              <div className="road-component-list">

                <div>
                  <span className="component-icon">⛰️</span>

                  <div>
                    <strong>GSI Terrain</strong>
                    <small>
                      Elevation and slope features available
                    </small>
                  </div>

                  <b className="component-ready">
                    READY
                  </b>
                </div>

                <div>
                  <span className="component-icon">🌧️</span>

                  <div>
                    <strong>NASA POWER</strong>
                    <small>
                      Recent rainfall and weather available
                    </small>
                  </div>

                  <b className="component-ready">
                    READY
                  </b>
                </div>

                <div>
                  <span className="component-icon">🤖</span>

                  <div>
                    <strong>XGBoost Risk Engine</strong>
                    <small>
                      Weather-aware risk prediction available
                    </small>
                  </div>

                  <b className="component-ready">
                    READY
                  </b>
                </div>

                <div>
                  <span className="component-icon">🛣️</span>

                  <div>
                    <strong>Road Network</strong>
                    <small>
                      Highway geometry not connected
                    </small>
                  </div>

                  <b className="component-pending">
                    PENDING
                  </b>
                </div>

              </div>

            </section>

            <section className="road-method-card">

              <h2>How Road Risk Will Work</h2>

              <div className="road-method-step">
                <span>01</span>
                <div>
                  <strong>Map road segments</strong>
                  <small>
                    Connect highway network geometry.
                  </small>
                </div>
              </div>

              <div className="road-method-step">
                <span>02</span>
                <div>
                  <strong>Join terrain risk</strong>
                  <small>
                    Match road segments with slope and elevation.
                  </small>
                </div>
              </div>

              <div className="road-method-step">
                <span>03</span>
                <div>
                  <strong>Add weather risk</strong>
                  <small>
                    Combine recent rainfall with terrain factors.
                  </small>
                </div>
              </div>

              <div className="road-method-step">
                <span>04</span>
                <div>
                  <strong>Generate corridor risk</strong>
                  <small>
                    Produce segment-level vulnerability scores.
                  </small>
                </div>
              </div>

            </section>

          </aside>

        </section>

        <section className="road-integration-grid">

          {integrationItems.map((item) => (
            <div className="road-integration-card" key={item.title}>

              <div className="road-integration-icon">
                {item.icon}
              </div>

              <div>
                <div className="road-integration-title">
                  <strong>{item.title}</strong>

                  <span
                    className={
                      item.status === "DATA PENDING"
                        ? "pending"
                        : "ready"
                    }
                  >
                    {item.status}
                  </span>
                </div>

                <p>{item.description}</p>
              </div>

            </div>
          ))}

        </section>

        <div className="road-prototype-notice">
          <strong>⚠️ Road Monitoring Prototype Status</strong>

          <p>
            Road-level vulnerability values are intentionally
            not fabricated. The current prototype requires an
            authoritative highway/road network dataset before
            corridor-level risk can be calculated.
          </p>
        </div>

      </div>
    </AppShell>
  );
}
