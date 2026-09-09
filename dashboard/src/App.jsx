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

function App() {
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchLocations() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/locations?limit=1000&offset=0`
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
      } finally {
        setLoading(false);
      }
    }

    fetchLocations();
  }, []);

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

        <section className="map-section">

          <div className="section-header">
            <div>
              <h2>NER Historical Landslide Map</h2>
              <p>GSI Historical Landslide Locations</p>
            </div>

            <div className="location-count">
              {loading
                ? "Loading..."
                : `${locations.length.toLocaleString()} locations`}
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
                    fillColor: "#2563eb",
                    color: "#1d4ed8",
                    weight: 1,
                    fillOpacity: 0.75
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
                  historical GSI landslide information.
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


          <div className="sidebar-card coverage-card">

            <h2>Monitoring Coverage</h2>

            <div className="coverage-number">

              {loading
                ? "—"
                : locations.length.toLocaleString()}

            </div>

            <p>
              GSI historical landslide locations loaded
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
