/* App.jsx
import { useState, useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat"; // registers L.heatLayer

// Fix marker icons when bundlers change paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// map AQI -> color-ish (simple)
function aqiColor(aqi) {
  if (aqi == null) return "#00000000";
  if (aqi <= 50) return "#00E400";
  if (aqi <= 100) return "#FFFF00";
  if (aqi <= 150) return "#FF7E00";
  if (aqi <= 200) return "#FF0000";
  if (aqi <= 300) return "#8F3F97";
  return "#7E0018";
}

// Fly-to component
function FlyToLocation({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords) map.flyTo(coords, 13);
  }, [coords, map]);
  return null;
}

// Map click fetcher (uses /aqi/coords)
function ClickFetcher({ onResult }) {
  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      try {
        const res = await fetch(
          `http://127.0.0.1:8000/aqi/coords?lat=${lat}&lon=${lng}`
        );
        const json = await res.json();
        onResult({ lat, lon: lng, aqiResult: json });
      } catch (err) {
        console.error("AQI fetch error:", err);
        onResult({ lat, lon: lng, aqiResult: null });
      }
    },
  });
  return null;
}

export default function App() {
  const [searchText, setSearchText] = useState("");
  const [markerPos, setMarkerPos] = useState(null);
  const [aqiData, setAqiData] = useState(null);
  const [popupOpen, setPopupOpen] = useState(false);

  const [heatOn, setHeatOn] = useState(false);
  const [heatLoading, setHeatLoading] = useState(false);
  const heatLayerRef = useRef(null);
  const mapRef = useRef(null);

  // heuristic to prefer India search first
  function userIncludesCountry(text) {
    const countries = ["india", "usa", "japan", "china", "uk", "france"];
    return countries.some((c) => text.toLowerCase().includes(c));
  }

  // Search handler uses /aqi/location (place) + geocode implicitly done on backend in that endpoint
  async function handleSearch() {
    if (!searchText.trim()) return;
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        searchText
      )}`;
      // Prefer India first
      let data = [];
      if (!userIncludesCountry(searchText)) {
        const urlIndia = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=in&q=${encodeURIComponent(
          searchText
        )}`;
        const r = await fetch(urlIndia);
        data = await r.json();
      }
      if (!data || data.length === 0) {
        const r2 = await fetch(url);
        data = await r2.json();
      }
      if (!data || data.length === 0) {
        alert("Location not found.");
        return;
      }
      const lat = parseFloat(data[0].lat);
      const lon = parseFloat(data[0].lon);

      // set marker and fetch from backend aqi/location -> but our backend requires /aqi/location with place param
      // We will call coords endpoint directly (simpler) to get immediate values.
      setMarkerPos([lat, lon]);
      setPopupOpen(true);

      const res = await fetch(
        `http://127.0.0.1:8000/aqi/coords?lat=${lat}&lon=${lon}`
      );
      const json = await res.json();
      setAqiData(json);
    } catch (err) {
      console.error("Search error:", err);
      alert("Search failed. See console.");
    }
  }

  // When map is clicked
  function handleClickResult({ lat, lon, aqiResult }) {
    setMarkerPos([lat, lon]);
    setAqiData(aqiResult);
    setPopupOpen(true);
  }

  // Build heatmap by fetching points from backend /aqi/heatmap/points
  async function loadHeatmap() {
    if (!mapRef.current) return;
    setHeatLoading(true);
    try {
      const map = mapRef.current;
      const bounds = map.getBounds();
      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();

      const lat1 = sw.lat;
      const lon1 = sw.lng;
      const lat2 = ne.lat;
      const lon2 = ne.lng;

      // sample_grid small for speed (6x6 default). You can increase if desired.
      const sample_grid = 6;
      const res = await fetch(
        `http://127.0.0.1:8000/aqi/heatmap/points?lat1=${lat1}&lon1=${lon1}&lat2=${lat2}&lon2=${lon2}&sample_grid=${sample_grid}`
      );
      const json = await res.json();
      const pts = (json.points || json.data || json).filter(Boolean);

      // convert to [lat, lon, intensity]
      const heatPts = pts
        .map((p) => {
          if (!p || p.aqi === null || p.aqi === undefined) return null;
          // intensity 0..1 (normalize by 200 - tweak to taste)
          const intensity = Math.min(1, (p.aqi || 0) / 200);
          return [p.lat, p.lon, intensity];
        })
        .filter(Boolean);

      // remove old heat layer if exists
      if (heatLayerRef.current) {
        try {
          map.removeLayer(heatLayerRef.current);
        } catch (e) {}
        heatLayerRef.current = null;
      }

      if (heatPts.length > 0) {
        const heat =
          typeof L.heatLayer === "function"
            ? L.heatLayer(heatPts, { radius: 25, blur: 30, maxZoom: 13 })
            : null;
        if (heat) {
          heat.addTo(map);
          heatLayerRef.current = heat;
        }
      } else {
        alert("No valid AQI points available for heatmap in this area.");
      }
    } catch (err) {
      console.error("Heatmap load error:", err);
      alert("Failed to load heatmap. See console.");
    } finally {
      setHeatLoading(false);
    }
  }

  // Toggle heatmap: load only when turned on
  async function toggleHeat() {
    if (heatOn) {
      // turn off: remove layer
      if (mapRef.current && heatLayerRef.current) {
        try {
          mapRef.current.removeLayer(heatLayerRef.current);
        } catch (e) {}
        heatLayerRef.current = null;
      }
      setHeatOn(false);
    } else {
      // turn on: load
      await loadHeatmap();
      setHeatOn(true);
    }
  }

  // Provide mapRef via a small component
  function MapRefSetter() {
    const map = useMap();
    useEffect(() => {
      mapRef.current = map;
      return () => {
        mapRef.current = null;
      };
    }, [map]);
    return null;
  }

  // Legend items
  const legendItems = [
    { label: "Good (0-50)", color: "#00E400" },
    { label: "Moderate (51-100)", color: "#FFFF00" },
    { label: "Unhealthy for Sensitive (101-150)", color: "#FF7E00" },
    { label: "Unhealthy (151-200)", color: "#FF0000" },
    { label: "Very Unhealthy (201-300)", color: "#8F3F97" },
    { label: "Hazardous (301+)", color: "#7E0018" },
  ];

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      {/* Search box */ /*}
      <div
        style={{
          position: "absolute",
          top: 14,
          left: 14,
          zIndex: 9999,
          background: "white",
          padding: "10px 12px",
          borderRadius: 10,
          boxShadow: "0 2px 10px rgba(0,0,0,0.14)",
        }}
      >
        <input
          type="text"
          placeholder="Search (whitefield / bengaluru / tokyo japan)"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ padding: 8, width: 260 }}
        />
        <button
          onClick={handleSearch}
          style={{ marginLeft: 8, padding: "8px 10px" }}
        >
          Search
        </button>

        <button
          onClick={toggleHeat}
          style={{ marginLeft: 8, padding: "8px 10px" }}
        >
          {heatOn
            ? "Hide Heatmap"
            : heatLoading
            ? "Loading..."
            : "Show Heatmap"}
        </button>

        <div style={{ marginTop: 6, fontSize: 12, color: "#444" }}>
          Tip: click anywhere on the map to probe AQI.
        </div>
      </div>

      {/* AQI info card */ /*}
      {aqiData && (
        <div
          style={{
            position: "absolute",
            bottom: 18,
            left: 18,
            zIndex: 9999,
            background: "white",
            padding: 14,
            borderRadius: 10,
            width: 300,
            boxShadow: "0 2px 12px rgba(0,0,0,0.12)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: 4,
                background: aqiColor(aqiData.aqi),
                border: "1px solid #222",
              }}
            />
            <h3 style={{ margin: 0 }}>AQI: {aqiData.aqi ?? "N/A"}</h3>
          </div>
          <div style={{ marginTop: 8, fontSize: 14 }}>
            <div>PM2.5: {aqiData.pm25 ?? "N/A"}</div>
            <div>PM10: {aqiData.pm10 ?? "N/A"}</div>
            <div>NO₂: {aqiData.nitrogen_dioxide ?? "N/A"}</div>
            <div>SO₂: {aqiData.sulphur_dioxide ?? "N/A"}</div>
            <div>O₃: {aqiData.ozone ?? "N/A"}</div>
            <div style={{ marginTop: 8, fontSize: 12, color: "#666" }}>
              Timestamp: {aqiData.timestamp ?? "N/A"}
            </div>
          </div>
        </div>
      )}

      {/* Legend */ /*}
      <div
        style={{
          position: "absolute",
          bottom: 18,
          right: 18,
          zIndex: 9999,
          background: "white",
          padding: 10,
          borderRadius: 8,
          boxShadow: "0 2px 10px rgba(0,0,0,0.12)",
          width: 200,
          fontSize: 12,
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 6 }}>AQI Legend</div>
        {legendItems.map((it) => (
          <div
            key={it.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 6,
            }}
          >
            <div
              style={{
                width: 16,
                height: 12,
                background: it.color,
                borderRadius: 2,
              }}
            />
            <div>{it.label}</div>
          </div>
        ))}
      </div>

      {/* Map */ /*}
      <MapContainer
        center={[20.5937, 78.9629]}
        zoom={5}
        style={{ width: "100%", height: "100%" }}
      >
        <MapRefSetter />
        <FlyToLocation coords={markerPos} />
        <ClickFetcher onResult={handleClickResult} />

        {/* Base OSM */ /*}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="© OpenStreetMap"
        />

        {/* Marker + Popup */ /*}
        {markerPos && (
          <Marker
            position={markerPos}
            eventHandlers={{ click: () => setPopupOpen(true) }}
          >
            {popupOpen && (
              <Popup position={markerPos} onClose={() => setPopupOpen(false)}>
                <div style={{ minWidth: 200 }}>
                  <b>Lat:</b> {markerPos[0].toFixed(5)} <br />
                  <b>Lon:</b> {markerPos[1].toFixed(5)} <br />
                  <hr />
                  <div>
                    <b>AQI:</b> {aqiData?.aqi ?? "N/A"}
                  </div>
                  <div>PM2.5: {aqiData?.pm25 ?? "N/A"}</div>
                  <div>PM10: {aqiData?.pm10 ?? "N/A"}</div>
                  <div>NO₂: {aqiData?.nitrogen_dioxide ?? "N/A"}</div>
                </div>
              </Popup>
            )}
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
*/
// App.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix marker icons when bundlers remove them
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// AQI → Color
function aqiColor(aqi) {
  if (aqi == null || Number.isNaN(aqi)) return "rgba(0,0,0,0)";
  const v = Number(aqi);
  if (v <= 50) return "#00E400";
  if (v <= 100) return "#FFFF00";
  if (v <= 150) return "#FF7E00";
  if (v <= 200) return "#FF0000";
  if (v <= 300) return "#8F3F97";
  return "#7E0018";
}

// Fly animation
function FlyToLocation({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords) map.flyTo(coords, 13, { animate: true });
  }, [coords, map]);
  return null;
}

// Map click AQI fetch
function ClickFetcher({ onResult }) {
  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      try {
        const res = await fetch(
          `http://127.0.0.1:8000/aqi/coords?lat=${lat}&lon=${lng}`
        );
        const json = await res.json();
        if (json.error) {
          onResult({ lat, lon: lng, aqiResult: null, error: json.error });
        } else {
          onResult({ lat, lon: lng, aqiResult: json });
        }
      } catch (err) {
        onResult({
          lat,
          lon: lng,
          aqiResult: null,
          error: "Backend unreachable",
        });
      }
    },
  });
  return null;
}

// Heatmap Overlay Component
function SmoothHeatmap({ enabled, onError }) {
  const map = useMap();
  const [overlay, setOverlay] = useState(null);
  const abortRef = useRef(null);

  const fetchAndRender = useCallback(
    async (bounds) => {
      if (!enabled) return;

      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();

      const url = `http://127.0.0.1:8000/aqi/heatmap/smooth?lat1=${sw.lat}&lon1=${sw.lng}&lat2=${ne.lat}&lon2=${ne.lng}&sample_grid=6&out_res=70`;

      try {
        if (abortRef.current) abortRef.current.abort();
        abortRef.current = new AbortController();

        const res = await fetch(url, {
          signal: abortRef.current.signal,
          cache: "no-store",
        });
        const json = await res.json();
        if (json.error) return onError(json.error);

        const lats = json.grid_lats;
        const lons = json.grid_lons;
        const grid = json.grid_aqi;

        const rows = grid.length;
        const cols = grid[0].length;
        const canvas = document.createElement("canvas");
        canvas.width = cols;
        canvas.height = rows;
        const ctx = canvas.getContext("2d");

        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            ctx.fillStyle = aqiColor(grid[r][c]);
            ctx.fillRect(c, r, 1, 1);
          }
        }

        const img = canvas.toDataURL("image/png");

        const imgBounds = [
          [sw.lat, sw.lng],
          [ne.lat, ne.lng],
        ];

        if (overlay) overlay.remove();

        const newOverlay = L.imageOverlay(img, imgBounds, { opacity: 0.55 });
        newOverlay.addTo(map);
        setOverlay(newOverlay);
      } catch (err) {
        if (err.name === "AbortError") return;
        onError("Heatmap fetch failed");
      }
    },
    [enabled, map, overlay, onError]
  );

  useEffect(() => {
    if (!enabled) {
      if (overlay) overlay.remove();
      return;
    }

    fetchAndRender(map.getBounds());

    let timer = null;
    const handler = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        fetchAndRender(map.getBounds());
      }, 600);
    };

    map.on("moveend", handler);
    map.on("zoomend", handler);

    return () => {
      map.off("moveend", handler);
      map.off("zoomend", handler);
    };
  }, [enabled, fetchAndRender, map, overlay]);

  return null;
}

export default function App() {
  const [searchText, setSearchText] = useState("");
  const [markerPos, setMarkerPos] = useState(null);
  const [aqiData, setAqiData] = useState(null);
  const [popupOpen, setPopupOpen] = useState(false);
  const [message, setMessage] = useState(null);
  const [heatmapEnabled, setHeatmapEnabled] = useState(false);

  const fmt = (v) =>
    v == null || Number.isNaN(v)
      ? "N/A"
      : typeof v === "number"
      ? v.toFixed(1)
      : v;

  async function handleSearch() {
    if (!searchText.trim()) return;

    setMessage("Searching...");

    try {
      const q = encodeURIComponent(searchText);
      const res = await fetch(
        `http://127.0.0.1:8000/aqi/location?place=${q}&country=India`
      );
      const json = await res.json();

      if (json.error) {
        setMessage("Search failed: " + json.error);
        return;
      }

      const lat = json.latitude;
      const lon = json.longitude;

      setMarkerPos([lat, lon]);
      setAqiData(json);
      setPopupOpen(true);
      setMessage(null);
    } catch (err) {
      setMessage("Search failed. Backend not reachable.");
    }
  }

  function handleClickResult({ lat, lon, aqiResult, error }) {
    setMarkerPos([lat, lon]);
    if (error) {
      setAqiData(null);
      setMessage(error);
    } else {
      setAqiData(aqiResult);
      setMessage(null);
    }
    setPopupOpen(true);
  }

  const legendItems = [
    { label: "Good (0-50)", color: "#00E400" },
    { label: "Moderate (51-100)", color: "#FFFF00" },
    { label: "Unhealthy (101-150)", color: "#FF7E00" },
    { label: "Unhealthy (151-200)", color: "#FF0000" },
    { label: "Very Unhealthy (201-300)", color: "#8F3F97" },
    { label: "Hazardous (301+)", color: "#7E0018" },
  ];

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      {/* Search box — TOP CENTER */}
      <div
        style={{
          position: "absolute",
          top: 14,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 9999,
          background: "white",
          padding: 12,
          borderRadius: 10,
          width: 380,
          boxShadow: "0 2px 12px rgba(0,0,0,0.12)",
        }}
      >
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="text"
            placeholder="Search (Whitefield, Bengaluru)"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{
              padding: 8,
              flex: 1,
              border: "1px solid #ddd",
              color: "#000",
            }}
          />
          <button onClick={handleSearch} style={{ padding: "8px 12px" }}>
            Search
          </button>
          <button
            onClick={() => setHeatmapEnabled((x) => !x)}
            style={{ padding: "8px 12px" }}
          >
            {heatmapEnabled ? "Hide" : "Heatmap"}
          </button>
        </div>

        {message && (
          <div style={{ marginTop: 6, color: "#b00", fontSize: 13 }}>
            {message}
          </div>
        )}
      </div>

      {/* AQI Card */}
      {aqiData && (
        <div
          style={{
            position: "absolute",
            bottom: 18,
            left: 18,
            zIndex: 9999,
            background: "white",
            padding: 14,
            borderRadius: 10,
            width: 280,
            color: "#000",
            boxShadow: "0 2px 12px rgba(0,0,0,0.12)",
          }}
        >
          <h3 style={{ margin: 0 }}>AQI: {fmt(aqiData.aqi)}</h3>
          <div>PM2.5: {fmt(aqiData.pm25)}</div>
          <div>PM10: {fmt(aqiData.pm10)}</div>
          <div>NO₂: {fmt(aqiData.nitrogen_dioxide)}</div>
          <div>SO₂: {fmt(aqiData.sulphur_dioxide)}</div>
          <div>O₃: {fmt(aqiData.ozone)}</div>
          <div>CO: {fmt(aqiData.carbon_monoxide)}</div>
          <div style={{ marginTop: 6, fontSize: 12 }}>{aqiData.timestamp}</div>
        </div>
      )}

      {/* Legend */}
      <div
        style={{
          position: "absolute",
          bottom: 18,
          right: 18,
          zIndex: 9999,
          background: "white",
          padding: 12,
          borderRadius: 8,
          width: 200,
          color: "#000",
          boxShadow: "0 2px 10px rgba(0,0,0,0.12)",
          fontSize: 12,
        }}
      >
        <div style={{ fontWeight: "bold", marginBottom: 6 }}>AQI Legend</div>
        {legendItems.map((i) => (
          <div
            key={i.label}
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            <div
              style={{
                width: 18,
                height: 12,
                background: i.color,
                borderRadius: 2,
              }}
            />
            {i.label}
          </div>
        ))}
      </div>

      {/* Map */}
      <MapContainer
        center={[20.5937, 78.9629]}
        zoom={5}
        style={{ width: "100%", height: "100%" }}
      >
        <ClickFetcher onResult={handleClickResult} />
        <FlyToLocation coords={markerPos} />

        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="© OpenStreetMap"
        />

        <SmoothHeatmap
          enabled={heatmapEnabled}
          onError={(e) => setMessage(e)}
        />

        {markerPos && (
          <Marker position={markerPos}>
            {popupOpen && (
              <Popup onClose={() => setPopupOpen(false)}>
                <div style={{ color: "#000" }}>
                  <div>Lat: {markerPos[0].toFixed(5)}</div>
                  <div>Lon: {markerPos[1].toFixed(5)}</div>
                  <hr />
                  <div>AQI: {fmt(aqiData?.aqi)}</div>
                  <div>PM2.5: {fmt(aqiData?.pm25)}</div>
                  <div>PM10: {fmt(aqiData?.pm10)}</div>
                  <div>NO₂: {fmt(aqiData?.nitrogen_dioxide)}</div>
                </div>
              </Popup>
            )}
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
