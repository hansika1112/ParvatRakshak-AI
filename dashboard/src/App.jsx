import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import Dashboard from "./pages/Dashboard.jsx";
import RiskMap from "./pages/RiskMap.jsx";
import AlertManagement from "./pages/AlertManagement.jsx";
import RoadMonitoring from "./pages/RoadMonitoring.jsx";
import CitizenReports from "./pages/CitizenReports.jsx";
import PredictiveAnalytics from "./pages/PredictiveAnalytics.jsx";

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
          element={<RoadMonitoring />}
        />

        <Route
          path="/reports"
          element={<CitizenReports />}
        />

        <Route
          path="/analytics"
          element={<PredictiveAnalytics />}
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
