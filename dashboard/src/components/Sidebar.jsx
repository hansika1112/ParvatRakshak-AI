import { NavLink } from "react-router-dom";

const navigationItems = [
  {
    path: "/dashboard",
    icon: "📊",
    label: "Dashboard"
  },
  {
    path: "/risk-map",
    icon: "🗺️",
    label: "Risk Map"
  },
  {
    path: "/alerts",
    icon: "🚨",
    label: "Alerts"
  },
  {
    path: "/roads",
    icon: "🛣️",
    label: "Road Monitoring"
  },
  {
    path: "/reports",
    icon: "📍",
    label: "Citizen Reports"
  },
  {
    path: "/analytics",
    icon: "📈",
    label: "Predictive Analytics"
  },
  {
    path: "/settings",
    icon: "⚙️",
    label: "Settings"
  }
];

export default function Sidebar() {
  return (
    <aside className="app-navigation">
      <div className="app-navigation-brand">
        <div className="app-navigation-logo">🏔️</div>

        <div>
          <strong>ParvatRakshak AI</strong>
          <span>Command Center</span>
        </div>
      </div>

      <nav className="app-navigation-menu" aria-label="Main navigation">
        <div className="app-navigation-section-title">
          COMMAND CENTER
        </div>

        {navigationItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `app-navigation-link ${
                isActive ? "active" : ""
              }`
            }
          >
            <span className="app-navigation-icon">
              {item.icon}
            </span>

            <span className="app-navigation-label">
              {item.label}
            </span>
          </NavLink>
        ))}
      </nav>

      <div className="app-navigation-footer">
        <div className="app-navigation-status">
          <span className="app-navigation-status-dot"></span>

          <div>
            <strong>System Online</strong>
            <span>AI monitoring active</span>
          </div>
        </div>

        <small>
          SIH26001 • NER
        </small>
      </div>
    </aside>
  );
}
