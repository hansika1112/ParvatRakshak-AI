import { useEffect, useMemo, useState } from "react";
import AppShell from "../components/AppShell.jsx";
import "../App.css";

const API_URL = "http://127.0.0.1:8000";

const SEVERITIES = [
  "Low",
  "Medium",
  "High",
  "Critical",
];

function severityIcon(severity) {
  if (severity === "Critical") return "🔴";
  if (severity === "High") return "🟠";
  if (severity === "Medium") return "🟡";
  return "🟢";
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

export default function CitizenReports() {
  const [reports, setReports] = useState([]);

  const [reportForm, setReportForm] = useState({
    latitude: "",
    longitude: "",
    description: "",
    severity: "Medium",
    language: "English",
  });

  const [reportMedia, setReportMedia] = useState(null);
  const [reportSubmitting, setReportSubmitting] = useState(false);

  const [loading, setLoading] = useState(true);
  const [reportError, setReportError] = useState("");
  const [reportSuccess, setReportSuccess] = useState(null);

  const [selectedSeverity, setSelectedSeverity] =
    useState("All");

  const [selectedReport, setSelectedReport] =
    useState(null);

  async function fetchReports() {
    try {
      setLoading(true);
      setReportError("");

      const response = await fetch(`${API_URL}/reports`);

      if (!response.ok) {
        throw new Error("Failed to fetch citizen reports.");
      }

      const data = await response.json();

      setReports(data.reports || []);
    } catch (error) {
      console.error("Citizen reports error:", error);
      setReportError(
        "Unable to load citizen reports."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchReports();

    const interval = setInterval(
      fetchReports,
      300000
    );

    return () => clearInterval(interval);
  }, []);

  function handleReportChange(event) {
    const { name, value } = event.target;

    setReportForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function useCurrentLocation() {
    setReportError("");

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
          latitude:
            position.coords.latitude.toFixed(6),
          longitude:
            position.coords.longitude.toFixed(6),
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
        maximumAge: 0,
      }
    );
  }

  async function handleReportSubmit(event) {
    event.preventDefault();

    setReportSubmitting(true);
    setReportError("");
    setReportSuccess(null);

    try {
      const latitude = Number(
        reportForm.latitude
      );

      const longitude = Number(
        reportForm.longitude
      );

      if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude)
      ) {
        throw new Error(
          "Please enter valid latitude and longitude."
        );
      }

      if (
        latitude < -90 ||
        latitude > 90 ||
        longitude < -180 ||
        longitude > 180
      ) {
        throw new Error(
          "Latitude or longitude is outside the valid range."
        );
      }

      if (
        !reportForm.description.trim()
      ) {
        throw new Error(
          "Description cannot be empty."
        );
      }

      const formData = new FormData();

      formData.append(
        "latitude",
        String(latitude)
      );

      formData.append(
        "longitude",
        String(longitude)
      );

      formData.append(
        "description",
        reportForm.description.trim()
      );

      formData.append(
        "severity",
        reportForm.severity
      );

      formData.append(
        "language",
        reportForm.language
      );

      if (reportMedia) {
        formData.append(
          "media",
          reportMedia
        );
      }

      const response = await fetch(
        `${API_URL}/reports`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data =
        await response.json().catch(
          () => null
        );

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            "Failed to submit citizen report."
        );
      }

      setReportSuccess(data.report);

      setReports((previous) => [
        data.report,
        ...previous.filter(
          (report) =>
            report.report_id !==
            data.report.report_id
        ),
      ]);

      setSelectedReport(data.report);

      setReportForm({
        latitude: "",
        longitude: "",
        description: "",
        severity: "Medium",
        language: "English",
      });

      setReportMedia(null);

      const mediaInput =
        document.getElementById(
          "citizen-report-media"
        );

      if (mediaInput) {
        mediaInput.value = "";
      }
    } catch (error) {
      console.error(
        "Report submission error:",
        error
      );

      setReportError(
        error.message ||
          "Failed to submit citizen report."
      );
    } finally {
      setReportSubmitting(false);
    }
  }

  const counts = useMemo(() => {
    return {
      Critical: reports.filter(
        (report) =>
          report.severity === "Critical"
      ).length,

      High: reports.filter(
        (report) =>
          report.severity === "High"
      ).length,

      Medium: reports.filter(
        (report) =>
          report.severity === "Medium"
      ).length,

      Low: reports.filter(
        (report) =>
          report.severity === "Low"
      ).length,
    };
  }, [reports]);

  const emergencyCount =
    counts.Critical + counts.High;

  const filteredReports =
    selectedSeverity === "All"
      ? reports
      : reports.filter(
          (report) =>
            report.severity ===
            selectedSeverity
        );

  return (
    <AppShell>
      <div className="citizen-reports-page">

        <section className="citizen-page-header">

          <div>
            <span className="page-eyebrow">
              FIELD HAZARD INTELLIGENCE
            </span>

            <h1>
              Field Hazard Reporting System
            </h1>

            <p>
              Submit geo-tagged landslide observations
              and provide real-time field intelligence
              to the command center.
            </p>
          </div>

          <div className="citizen-system-status">
            <span className="citizen-status-dot"></span>

            <div>
              <strong>
                REPORTING SYSTEM ACTIVE
              </strong>

              <span>
                Citizen field intelligence connected
              </span>
            </div>
          </div>

        </section>

        <section className="citizen-kpi-grid">

          <div className="citizen-kpi-card total">
            <div className="citizen-kpi-icon">
              📍
            </div>

            <div>
              <span>TOTAL REPORTS</span>
              <strong>{reports.length}</strong>
              <small>
                Received by command center
              </small>
            </div>
          </div>

          <div className="citizen-kpi-card critical">
            <div className="citizen-kpi-icon">
              🔴
            </div>

            <div>
              <span>CRITICAL REPORTS</span>
              <strong>{counts.Critical}</strong>
              <small>
                Immediate attention
              </small>
            </div>
          </div>

          <div className="citizen-kpi-card high">
            <div className="citizen-kpi-icon">
              🟠
            </div>

            <div>
              <span>HIGH PRIORITY</span>
              <strong>{counts.High}</strong>
              <small>
                Emergency monitoring
              </small>
            </div>
          </div>

          <div className="citizen-kpi-card emergency">
            <div className="citizen-kpi-icon">
              🚨
            </div>

            <div>
              <span>EMERGENCY REPORTS</span>
              <strong>
                {emergencyCount}
              </strong>
              <small>
                High + Critical
              </small>
            </div>
          </div>

        </section>

        <section className="citizen-reports-layout">

          <section className="citizen-form-card">

            <div className="citizen-section-heading">

              <div>
                <h2>
                  🚨 Submit Hazard Report
                </h2>

                <p>
                  Send a geo-tagged observation
                  directly to the monitoring system.
                </p>
              </div>

              <span className="citizen-live-badge">
                ● CONNECTED
              </span>

            </div>

            <form
              className="citizen-report-form"
              onSubmit={handleReportSubmit}
            >

              <div className="citizen-location-heading">
                <strong>
                  📍 Incident Location
                </strong>

                <span>
                  Coordinates are required
                </span>
              </div>

              <div className="citizen-form-row">

                <div className="citizen-field">
                  <label htmlFor="citizen-latitude">
                    Latitude
                  </label>

                  <input
                    id="citizen-latitude"
                    name="latitude"
                    type="number"
                    step="any"
                    placeholder="e.g. 26.198000"
                    value={
                      reportForm.latitude
                    }
                    onChange={
                      handleReportChange
                    }
                    required
                  />
                </div>

                <div className="citizen-field">
                  <label htmlFor="citizen-longitude">
                    Longitude
                  </label>

                  <input
                    id="citizen-longitude"
                    name="longitude"
                    type="number"
                    step="any"
                    placeholder="e.g. 90.298000"
                    value={
                      reportForm.longitude
                    }
                    onChange={
                      handleReportChange
                    }
                    required
                  />
                </div>

              </div>

              <button
                type="button"
                className="citizen-location-button"
                onClick={
                  useCurrentLocation
                }
              >
                📍 Use My Current Location
              </button>

              <div className="citizen-field">

                <label htmlFor="citizen-description">
                  Hazard Description
                </label>

                <textarea
                  id="citizen-description"
                  name="description"
                  rows="6"
                  placeholder="Describe the landslide, rainfall, road blockage, cracks, falling soil, damaged infrastructure, or other observations..."
                  value={
                    reportForm.description
                  }
                  onChange={
                    handleReportChange
                  }
                  required
                />

                <small>
                  Provide as much field detail as
                  possible for authorities.
                </small>

              </div>

              <div className="citizen-form-row">

                <div className="citizen-field">
                  <label htmlFor="citizen-severity">
                    Severity
                  </label>

                  <select
                    id="citizen-severity"
                    name="severity"
                    value={
                      reportForm.severity
                    }
                    onChange={
                      handleReportChange
                    }
                  >
                    <option value="Low">
                      Low
                    </option>

                    <option value="Medium">
                      Medium
                    </option>

                    <option value="High">
                      High
                    </option>

                    <option value="Critical">
                      Critical
                    </option>
                  </select>
                </div>

                <div className="citizen-field">
                  <label htmlFor="citizen-language">
                    Alert Language
                  </label>

                  <select
                    id="citizen-language"
                    name="language"
                    value={
                      reportForm.language
                    }
                    onChange={
                      handleReportChange
                    }
                  >
                    <option value="English">
                      English
                    </option>

                    <option value="Hindi">
                      Hindi
                    </option>

                    <option value="Assamese">
                      Assamese
                    </option>
                  </select>
                </div>

              </div>

              <div className="citizen-field">

                <label htmlFor="citizen-report-media">
                  Photo / Video Evidence
                </label>

                <input
                  id="citizen-report-media"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
                  onChange={(event) =>
                    setReportMedia(
                      event.target.files?.[0] ||
                        null
                    )
                  }
                />

                <small>
                  JPG, PNG, WEBP, MP4 or WEBM
                  • Maximum 20 MB
                </small>

              </div>

              {reportError && (
                <div className="citizen-message error">
                  ❌ {reportError}
                </div>
              )}

              {reportSuccess && (
                <div className="citizen-message success">

                  <strong>
                    ✅ Report submitted successfully
                  </strong>

                  <p>
                    Report ID:{" "}
                    <strong>
                      {
                        reportSuccess.report_id
                      }
                    </strong>
                  </p>

                  <p>
                    {reportSuccess.status ===
                    "alert_generated"
                      ? "A high-priority emergency alert was generated."
                      : "Your report has been received by the system."}
                  </p>

                </div>
              )}

              <button
                type="submit"
                className="citizen-submit-button"
                disabled={
                  reportSubmitting
                }
              >
                {reportSubmitting
                  ? "Submitting Report..."
                  : "🚨 Submit Landslide Report"}
              </button>

            </form>

          </section>

          <aside className="citizen-side-column">

            <section className="citizen-summary-card">

              <div className="citizen-section-heading compact">

                <div>
                  <h2>
                    Report Distribution
                  </h2>

                  <p>
                    Current citizen reports by severity
                  </p>
                </div>

              </div>

              <div className="citizen-severity-list">

                {SEVERITIES.map(
                  (severity) => (
                    <button
                      type="button"
                      key={severity}
                      className={`citizen-severity-row ${severity.toLowerCase()}`}
                      onClick={() =>
                        setSelectedSeverity(
                          severity
                        )
                      }
                    >

                      <span>
                        {severityIcon(
                          severity
                        )}
                      </span>

                      <div>
                        <strong>
                          {severity}
                        </strong>

                        <small>
                          {severity ===
                          "Critical"
                            ? "Immediate attention"
                            : severity ===
                                "High"
                              ? "Priority response"
                              : severity ===
                                  "Medium"
                                ? "Monitor situation"
                                : "Informational"}
                        </small>
                      </div>

                      <b>
                        {counts[severity]}
                      </b>

                    </button>
                  )
                )}

              </div>

              <button
                type="button"
                className="citizen-view-all-button"
                onClick={() =>
                  setSelectedSeverity(
                    "All"
                  )
                }
              >
                View all reports →
              </button>

            </section>

            <section className="citizen-guidance-card">

              <h2>
                📋 Reporting Guidance
              </h2>

              <div>
                <span>01</span>
                <p>
                  Use accurate coordinates or
                  current location.
                </p>
              </div>

              <div>
                <span>02</span>
                <p>
                  Describe visible cracks,
                  debris, rainfall or movement.
                </p>
              </div>

              <div>
                <span>03</span>
                <p>
                  Select severity based on the
                  observed field situation.
                </p>
              </div>

              <div>
                <span>04</span>
                <p>
                  Add photo/video evidence when
                  available.
                </p>
              </div>

            </section>

          </aside>

        </section>

        <section className="citizen-report-list-card">

          <div className="citizen-section-heading">

            <div>
              <h2>
                📡 Submitted Field Reports
              </h2>

              <p>
                Citizen observations received by
                the command center.
              </p>
            </div>

            <div className="citizen-filter-group">

              <button
                type="button"
                className={
                  selectedSeverity ===
                  "All"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setSelectedSeverity(
                    "All"
                  )
                }
              >
                All ({reports.length})
              </button>

              {SEVERITIES.map(
                (severity) => (
                  <button
                    type="button"
                    key={severity}
                    className={
                      selectedSeverity ===
                      severity
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      setSelectedSeverity(
                        severity
                      )
                    }
                  >
                    {severityIcon(
                      severity
                    )}{" "}
                    {severity} (
                    {counts[severity]})
                  </button>
                )
              )}

            </div>

          </div>

          {loading ? (
            <div className="citizen-empty-state">
              <span>⏳</span>
              <strong>
                Loading citizen reports...
              </strong>
            </div>
          ) : reportError &&
            reports.length === 0 ? (
            <div className="citizen-empty-state error">
              <span>⚠️</span>
              <strong>
                {reportError}
              </strong>

              <button
                type="button"
                onClick={fetchReports}
              >
                Retry
              </button>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="citizen-empty-state">
              <span>📭</span>

              <strong>
                No reports in this category
              </strong>

              <p>
                Submitted citizen reports matching
                the selected filter will appear here.
              </p>
            </div>
          ) : (
            <div className="citizen-report-table">

              {filteredReports
                .slice()
                .reverse()
                .map((report) => (
                  <button
                    type="button"
                    key={report.report_id}
                    className={`citizen-report-row ${String(
                      report.severity
                    ).toLowerCase()} ${
                      selectedReport?.report_id ===
                      report.report_id
                        ? "selected"
                        : ""
                    }`}
                    onClick={() =>
                      setSelectedReport(
                        report
                      )
                    }
                  >

                    <div className="citizen-report-severity">
                      <span>
                        {severityIcon(
                          report.severity
                        )}
                      </span>

                      <div>
                        <strong>
                          {report.severity}
                        </strong>

                        <small>
                          {report.report_id}
                        </small>
                      </div>
                    </div>

                    <div className="citizen-report-description">
                      <strong>
                        {report.description}
                      </strong>

                      <span>
                        📍{" "}
                        {Number(
                          report.latitude
                        ).toFixed(4)}
                        ,{" "}
                        {Number(
                          report.longitude
                        ).toFixed(4)}
                      </span>
                    </div>

                    <div className="citizen-report-meta">
                      <span>
                        🌐 {report.language}
                      </span>

                      <span>
                        {report.emergency_alert
                          ? "🚨 Alert Generated"
                          : "Received"}
                      </span>

                      <small>
                        {formatDate(
                          report.created_at
                        )}
                      </small>
                    </div>

                    <span className="citizen-report-arrow">
                      →
                    </span>

                  </button>
                ))}

            </div>
          )}

        </section>

        {selectedReport && (
          <section className="citizen-selected-card">

            <div className="citizen-section-heading">

              <div>
                <h2>
                  Selected Report Details
                </h2>

                <p>
                  Detailed field report information
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedReport(null)
                }
              >
                Close
              </button>

            </div>

            <div className="citizen-selected-grid">

              <div>
                <span>REPORT ID</span>
                <strong>
                  {selectedReport.report_id}
                </strong>
              </div>

              <div>
                <span>SEVERITY</span>
                <strong>
                  {severityIcon(
                    selectedReport.severity
                  )}{" "}
                  {selectedReport.severity}
                </strong>
              </div>

              <div>
                <span>LANGUAGE</span>
                <strong>
                  {selectedReport.language}
                </strong>
              </div>

              <div>
                <span>STATUS</span>
                <strong>
                  {selectedReport.status}
                </strong>
              </div>

              <div>
                <span>LATITUDE</span>
                <strong>
                  {selectedReport.latitude}
                </strong>
              </div>

              <div>
                <span>LONGITUDE</span>
                <strong>
                  {selectedReport.longitude}
                </strong>
              </div>

              <div>
                <span>SUBMITTED</span>
                <strong>
                  {formatDate(
                    selectedReport.created_at
                  )}
                </strong>
              </div>

              <div>
                <span>MEDIA</span>
                <strong>
                  {selectedReport.media_filename ||
                    "No media attached"}
                </strong>
              </div>

            </div>

            <div className="citizen-selected-description">

              <span>FIELD OBSERVATION</span>

              <p>
                {selectedReport.description}
              </p>

            </div>

            {selectedReport.emergency_alert && (
              <div className="citizen-emergency-alert">

                <strong>
                  🚨 Emergency Alert Generated
                </strong>

                <p>
                  {selectedReport.emergency_alert.message ||
                    selectedReport.emergency_alert.alert ||
                    "High-priority citizen report triggered the alert engine."}
                </p>

              </div>
            )}

          </section>
        )}

        <div className="citizen-prototype-notice">

          <strong>
            ℹ️ Citizen Reporting System
          </strong>

          <p>
            Citizen reports are stored by the ParvatRakshak
            AI backend. High and Critical reports trigger
            the existing multilingual emergency alert engine.
          </p>

        </div>

      </div>
    </AppShell>
  );
}
