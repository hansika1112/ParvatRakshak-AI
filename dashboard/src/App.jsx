import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import Dashboard from "./pages/Dashboard.jsx";
import RiskMap from "./pages/RiskMap.jsx";
import AlertManagement from "./pages/AlertManagement.jsx";

function PlaceholderPage({ title, subtitle }) {
  return (
    <div className="placeholder-page">
      <div className="placeholder-card">
        <span className="placeholder-badge">PARVATRakshak AI</span>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/dashboard" element={<Dashboard />} />

        <Route
          path="/risk-map"
          element={<RiskMap />}
        />

        <Route
          path="/alerts"
          element={<AlertManagement />}
        />

        <Route
          path="/roads"
          element={
            <PlaceholderPage
              title="Highway Corridor Vulnerability Monitoring"
              subtitle="This page will be migrated next."
            />
          }
        />

        <Route
          path="/reports"
          element={
            <PlaceholderPage
              title="Field Hazard Reporting System"
              subtitle="This page will be migrated next."
            />
          }
        />

        <Route
          path="/analytics"
          element={
            <PlaceholderPage
              title="Predictive Risk Analytics"
              subtitle="This page will be migrated next."
            />
          }
        />

        <Route
          path="/settings"
          element={
            <PlaceholderPage
              title="Command System Settings"
              subtitle="This page will be migrated next."
            />
          }
        />

        <Route
          path="/"
          element={<Navigate to="/dashboard" replace />}
        />

        <Route
          path="*"
          element={<Navigate to="/dashboard" replace />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
