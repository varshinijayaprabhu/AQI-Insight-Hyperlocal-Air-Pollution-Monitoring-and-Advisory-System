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

// Fix marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// AQI Color Map
function aqiColor(aqi) {
  if (!aqi) return "rgba(0,0,0,0)";
  const v = Number(aqi);
  if (v <= 50) return "#00E400";
  if (v <= 100) return "#FFFF00";
  if (v <= 150) return "#FF7E00";
  if (v <= 200) return "#FF0000";
  if (v <= 300) return "#8F3F97";
  return "#7E0018";
}

// Fly to location
function FlyToLocation({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords) map.flyTo(coords, 12.5, { animate: true, duration: 0.8 });
  }, [coords]);
  return null;
}

// Click to fetch AQI
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
          onResult({ lat, lon: lng, error: json.error, aqiResult: null });
        } else {
          onResult({ lat, lon: lng, aqiResult: json });
        }
      } catch (err) {
        onResult({
          lat,
          lon: lng,
          error: "Backend unreachable",
          aqiResult: null,
        });
      }
    },
  });
  return null;
}

// Heatmap overlay
function SmoothHeatmap({ enabled, onError, setNote }) {
  const map = useMap();
  const overlayRef = useRef(null);
  const abortRef = useRef(null);

  const fetchAndRender = useCallback(
    async (bounds) => {
      if (!enabled) return;

      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();

      const url = `http://127.0.0.1:8000/aqi/heatmap/smooth?lat1=${sw.lat}&lon1=${sw.lng}&lat2=${ne.lat}&lon2=${ne.lng}&sample_grid=5&out_res=80`;

      try {
        if (abortRef.current) abortRef.current.abort();
        abortRef.current = new AbortController();

        const res = await fetch(url, { signal: abortRef.current.signal });
        const json = await res.json();

        if (json.error) {
          onError(json.error);
          setNote(json.note || null);
          return;
        }

        setNote(json.note || null);

        const { grid_aqi } = json;

        const rows = grid_aqi.length;
        const cols = grid_aqi[0].length;

        const canvas = document.createElement("canvas");
        canvas.width = cols;
        canvas.height = rows;

        const ctx = canvas.getContext("2d");

        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            ctx.fillStyle = aqiColor(grid_aqi[r][c]);
            ctx.fillRect(c, rows - 1 - r, 1, 1);
          }
        }

        const dataUrl = canvas.toDataURL();

        const imgBounds = [
          [Math.min(sw.lat, ne.lat), Math.min(sw.lng, ne.lng)],
          [Math.max(sw.lat, ne.lat), Math.max(sw.lng, ne.lng)],
        ];

        if (overlayRef.current) overlayRef.current.remove();

        const overlay = L.imageOverlay(dataUrl, imgBounds, { opacity: 0.55 });
        overlay.addTo(map);
        overlayRef.current = overlay;
      } catch (err) {
        if (err.name !== "AbortError") onError(err.message);
      }
    },
    [enabled]
  );

  useEffect(() => {
    if (!enabled) {
      if (overlayRef.current) overlayRef.current.remove();
      return;
    }

    fetchAndRender(map.getBounds());

    const debounced = () => {
      clearTimeout(window.hmTimer);
      window.hmTimer = setTimeout(() => {
        fetchAndRender(map.getBounds());
      }, 650);
    };

    map.on("moveend", debounced);
    map.on("zoomend", debounced);

    return () => {
      map.off("moveend", debounced);
      map.off("zoomend", debounced);
    };
  }, [enabled]);

  return null;
}

export default function App() {
  const [searchText, setSearchText] = useState("");
  const [markerPos, setMarkerPos] = useState(null);
  const [aqiData, setAqiData] = useState(null);
  const [popupOpen, setPopupOpen] = useState(false);
  const [heatmapEnabled, setHeatmapEnabled] = useState(false);
  const [message, setMessage] = useState(null);
  const [heatmapNote, setHeatmapNote] = useState(null);
  const [loadingSearch, setLoadingSearch] = useState(false);

  const inputStyle = {
    padding: 8,
    width: 260,
    background: "white",
    color: "black",
  };

  // Search by place
  async function handleSearch() {
    if (!searchText.trim()) return;

    setLoadingSearch(true);
    setMessage(null);

    try {
      const q = encodeURIComponent(searchText);
      const res = await fetch(
        `http://127.0.0.1:8000/aqi/location?place=${q}&country=India`
      );
      const json = await res.json();
      setLoadingSearch(false);

      if (json.error) {
        setMessage("Search failed: " + json.error);
        return;
      }

      setMarkerPos([json.latitude, json.longitude]);
      setAqiData(json);
      setPopupOpen(true);
    } catch {
      setMessage("Search failed.");
      setLoadingSearch(false);
    }
  }

  // Click result handler
  function handleClickResult({ lat, lon, aqiResult, error }) {
    setMarkerPos([lat, lon]);

    if (error) {
      setMessage(error);
      setAqiData(null);
    } else {
      setAqiData(aqiResult);
    }

    setPopupOpen(true);
  }

  function fmt(v) {
    if (v === null || v === undefined) return "N/A";
    if (typeof v === "number") return v.toFixed(1);
    return v;
  }

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      {/* SEARCH UI */}
      <div style={{ position: "absolute", top: 12, left: 12, zIndex: 9999 }}>
        <input
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Search place"
          style={inputStyle}
        />
        <button onClick={handleSearch} style={{ marginLeft: 8 }}>
          {loadingSearch ? "Searching..." : "Search"}
        </button>
        <button
          onClick={() => setHeatmapEnabled((v) => !v)}
          style={{ marginLeft: 8 }}
        >
          {heatmapEnabled ? "Hide Heatmap" : "Show Heatmap"}
        </button>

        {message && <div style={{ color: "red" }}>{message}</div>}
        {heatmapNote && <div>{heatmapNote}</div>}
      </div>

      {/* MAP */}
      <MapContainer
        center={[20.5937, 78.9629]}
        zoom={5}
        style={{ width: "100%", height: "100%" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        <FlyToLocation coords={markerPos} />
        <ClickFetcher onResult={handleClickResult} />
        <SmoothHeatmap
          enabled={heatmapEnabled}
          onError={setMessage}
          setNote={setHeatmapNote}
        />

        {/* MARKER */}
        {markerPos && aqiData && (
          <Marker position={markerPos}>
            <Popup>
              <div>
                <b>AQI:</b> {aqiData.aqi}
                <br />
                PM2.5: {fmt(aqiData.pm25)}
                <br />
                PM10: {fmt(aqiData.pm10)}
                <br />
                CO: {fmt(aqiData.carbon_monoxide)}
                <br />
                NO₂: {fmt(aqiData.nitrogen_dioxide)}
                <br />
                SO₂: {fmt(aqiData.sulphur_dioxide)}
                <br />
                O₃: {fmt(aqiData.ozone)}
                <br />
                Timestamp: {aqiData.timestamp}
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
