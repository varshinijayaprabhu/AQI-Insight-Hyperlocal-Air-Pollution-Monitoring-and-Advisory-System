// App.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import searchGif from "./assets/searching.gif";
import msgGif from "./assets/message.gif";

/* ====== PENGUIN GIFS (store in src/assets/) ====== */
import pengHappy from "./assets/peng_happy.gif";
import pengNormal from "./assets/peng_normal.gif";
import pengConcerned from "./assets/peng_concerned.gif";
import pengSick from "./assets/peng_sick.gif";
import pengVerySick from "./assets/peng_very_sick.gif";
import pengDead from "./assets/peng_dead.gif";
import NewsFeed from "./NewsFeed.jsx";
import HistoryAnalytics from "./HistoryAnalytics.jsx";

function NewsWrapper({ onBack }) {
  return (
    <div
      style={{
        background: "transparent",
        color: "white",
        height: "100vh",
        overflowY: "auto",
        position: "relative",
      }}
    >
      <button
        onClick={onBack}
        style={{
          position: "fixed",
          top: "15px",
          left: "15px",
          zIndex: 100,
          padding: "10px 18px",
          background: "#2563eb",
          color: "white",
          borderRadius: "10px",
          border: "none",
          cursor: "pointer",
          fontWeight: "600",
        }}
      >
        ⬅ Back
      </button>

      <NewsFeed />
    </div>
  );
  <div style={{ display: "grid", gap: 4 }}>
    {item.bullets?.map((point, j) => (
      <div
        key={j}
        style={{
          display: "flex",
          gap: 6,
          alignItems: "flex-start",
          color: "rgba(255,255,255,0.78)",
          fontSize: 12,
          lineHeight: 1.35,
        }}
      >
        <span style={{ color: "#a855f7" }}>•</span>
        <span>{point}</span>
      </div>
    ))}
  </div>;
}

/* =========================
   MAP THEMES
   ========================= */
const MAP_THEMES = {
  satellite:
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  dark: "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}.png",
  light: "https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}.png",
  neon: "https://cartodb-basemaps-a.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png",
  terrain: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
};

const THEME_ICONS = {
  satellite: "🛰",
  dark: "🌙",
  light: "🌞",
  neon: "🟣",
  terrain: "⛰",
};

const THEME_LABELS = {
  satellite: "Satellite",
  dark: "Dark",
  light: "Light",
  neon: "Neon",
  terrain: "Terrain",
};

/* =========================
   GLOBAL CSS
   ========================= */
const globalStyles = `
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  overflow-x: hidden;
}
@keyframes flowGradient {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
@keyframes floatInAir {
  0% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
  100% { transform: translateY(0); }
}
@keyframes fadeInOut {
  0% { opacity: 0; transform: translateY(12px); }
  10% { opacity: 1; transform: translateY(0); }
  90% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(12px); }
}
@keyframes slideInUp {
  0% { transform: translateY(18px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}
`;
document.head.appendChild(
  Object.assign(document.createElement("style"), { innerHTML: globalStyles })
);

/* =========================
   BUTTON STYLE
   ========================= */
const animatedButtonStyle = {
  padding: "9px 12px",
  borderRadius: "11px",
  border: "none",
  fontWeight: 600,
  cursor: "pointer",
  color: "white",
  background: "linear-gradient(270deg,#2563eb,#1e3a8a,#2563eb)",
  backgroundSize: "600% 600%",
  animation: "flowGradient 6s ease infinite",
  boxShadow: "0 8px 18px rgba(0,0,0,0.22)",
  transition: "all 0.22s ease",
};

/* =========================
   LEAFLET FIX
   ========================= */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

/* =========================
   AQI COLOR + CATEGORY
   ========================= */
function aqiColor(aqi) {
  if (aqi == null) return "#777";
  const v = Number(aqi);
  if (v <= 50) return "#00E400";
  if (v <= 100) return "#FFFF00";
  if (v <= 150) return "#FF7E00";
  if (v <= 200) return "#FF0000";
  if (v <= 300) return "#8F3F97";
  return "#7E0018";
}

function getAqiCategory(aqi) {
  const v = Number(aqi || 0);
  if (v <= 50)
    return { label: "Good", color: "#00E400", emoji: "😊", peng: pengHappy };
  if (v <= 100)
    return {
      label: "Moderate",
      color: "#FFFF00",
      emoji: "🙂",
      peng: pengNormal,
    };
  if (v <= 150)
    return {
      label: "Unhealthy for SG",
      color: "#FF7E00",
      emoji: "😐",
      peng: pengConcerned,
    };
  if (v <= 200)
    return {
      label: "Unhealthy",
      color: "#FF0000",
      emoji: "😷",
      peng: pengSick,
    };
  if (v <= 300)
    return {
      label: "Very Unhealthy",
      color: "#8F3F97",
      emoji: "🤒",
      peng: pengVerySick,
    };
  return { label: "Hazardous", color: "#7E0018", emoji: "☠", peng: pengDead };
}

/* =========================
   HEATMAP
   ========================= */
function SmoothHeatmap({ enabled, onError }) {
  const map = useMap();
  const overlayRef = useRef(null);
  const abortRef = useRef(null);

  const renderHeatmap = useCallback(
    async (bounds) => {
      if (!enabled) return;

      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();

      const url = `http://127.0.0.1:8000/aqi/heatmap/smooth?lat1=${sw.lat}&lon1=${sw.lng}&lat2=${ne.lat}&lon2=${ne.lng}&sample_grid=5&out_res=120`;

      try {
        if (abortRef.current) abortRef.current.abort();
        abortRef.current = new AbortController();

        const res = await fetch(url, { signal: abortRef.current.signal });
        const json = await res.json();
        const grid = json.grid_aqi;

        const rows = grid.length;
        const cols = grid[0].length;

        const canvas = document.createElement("canvas");
        canvas.width = cols;
        canvas.height = rows;

        const ctx = canvas.getContext("2d");
        for (let r = 0; r < rows; r++)
          for (let c = 0; c < cols; c++) {
            ctx.fillStyle = aqiColor(grid[r][c]);
            ctx.fillRect(c, rows - 1 - r, 1, 1);
          }

        const imgUrl = canvas.toDataURL();
        const imgBounds = [
          [sw.lat, sw.lng],
          [ne.lat, ne.lng],
        ];

        if (overlayRef.current) overlayRef.current.remove();
        overlayRef.current = L.imageOverlay(imgUrl, imgBounds, {
          opacity: 0.55,
        }).addTo(map);
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
    renderHeatmap(map.getBounds());
  }, [enabled]);

  return null;
}

/* =========================
   CLICK FETCHER
   ========================= */
function ClickFetcher({ onResult }) {
  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;

      try {
        const res = await fetch(
          `http://127.0.0.1:8000/aqi/coords?lat=${lat}&lon=${lng}`
        );
        const json = await res.json();

        onResult({
          lat,
          lon: lng,
          aqiResult: json.error ? null : json,
        });
      } catch {
        onResult({ lat, lon: lng, aqiResult: null });
      }
    },
  });

  return null;
}

/* =========================
   CSS-based Gauge component (conic-gradient + needle)
   This avoids complex SVG coordinate bugs and positions reliably.
   aqi -> 0..400 mapped to -90..+90 degrees
   ========================= */
/* -----------------------------------------
   PERFECT SEMICIRCLE SVG GAUGE (FINAL FIX)
------------------------------------------*/
/* =========================
   PERFECT SEMICIRCLE GAUGE (FINAL FIX)
   ========================= */
function CuteGauge({ aqi }) {
  const width = 300;
  const height = 110;

  // The circle needs to be ABOVE the bottom of SVG
  // so that the arc sits fully visible inside 110px height.
  const radius = 95;
  const cx = width / 2;
  const cy = height + 10; // center below visible area gives clean top semicircle

  const maxAQI = 400;
  const safeAQI = Math.min(aqi || 0, maxAQI);

  const angle = -90 + (safeAQI / maxAQI) * 180;

  const polar = (deg, r = radius) => {
    const rad = (deg * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    };
  };

  const segments = [
    { from: 0, to: 50, color: "#00E400" },
    { from: 50, to: 100, color: "#FFFF00" },
    { from: 100, to: 150, color: "#FF7E00" },
    { from: 150, to: 200, color: "#FF0000" },
    { from: 200, to: 300, color: "#8F3F97" },
    { from: 300, to: 400, color: "#7E0018" },
  ];

  const arc = (f, t) => {
    const a1 = -90 + (f / maxAQI) * 180;
    const a2 = -90 + (t / maxAQI) * 180;
    const p1 = polar(a1);
    const p2 = polar(a2);
    return `M ${p1.x} ${p1.y} A ${radius} ${radius} 0 0 1 ${p2.x} ${p2.y}`;
  };

  const ticks = [0, 50, 100, 150, 200, 300, 400];

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ display: "block", margin: "0 auto" }}
    >
      {segments.map((s, i) => (
        <path
          key={i}
          d={arc(s.from, s.to)}
          stroke={s.color}
          strokeWidth={14}
          fill="none"
          strokeLinecap="round"
        />
      ))}

      {ticks.map((t, i) => {
        const ang = -90 + (t / maxAQI) * 180;
        const pos = polar(ang, radius + 14);

        return (
          <text
            key={i}
            x={pos.x}
            y={pos.y}
            fill="white"
            fontSize={10}
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {t === 400 ? "301+" : t}
          </text>
        );
      })}

      {(() => {
        const end = polar(angle, radius - 18);
        return (
          <>
            <line
              x1={cx}
              y1={cy}
              x2={end.x}
              y2={end.y}
              stroke="white"
              strokeWidth={4}
              strokeLinecap="round"
            />
            <circle cx={cx} cy={cy} r={6} fill="white" />
          </>
        );
      })()}
    </svg>
  );
}

/* =========================
   NEW: Animated AQI Bar (replaces gauge usage in AQICard)
   - This component is intentionally minimal and uses the same space
     where the gauge used to be (so layout remains identical).
   - It shows a gradient fill and a white pointer that animates to AQI
*/
function AnimatedAqiBar({ aqi }) {
  const maxAQI = 400;
  const safe = Math.max(0, Math.min(Number(aqi) || 0, maxAQI));
  const pct = (safe / maxAQI) * 100;

  const gradient =
    "linear-gradient(90deg,#00E400,#FFFF00,#FF7E00,#FF0000,#8F3F97,#7E0018)";

  return (
    <div
      style={{
        width: "100%",
        padding: "6px 10px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          height: 18,
          borderRadius: 12,
          background: "rgba(255,255,255,0.04)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: gradient,
            backgroundSize: "200% 100%",
            animation: "flowGradient 4s linear infinite",
            transition: "width 0.8s ease",
            borderRadius: 12,
          }}
        />

        {/* Clean circular pointer (no white line issue) */}
        <div
          style={{
            position: "absolute",
            left: `calc(${pct}% - 6px)`,
            top: 2,
            width: 12,
            height: 12,
            background: "white",
            borderRadius: "50%",
            boxShadow: "0 0 6px rgba(255,255,255,0.6)",
            transition: "left 0.8s ease",
          }}
        />
      </div>

      <div
        style={{
          marginTop: 6,
          display: "flex",
          justifyContent: "space-between",
          fontSize: 11,
          color: "rgba(255,255,255,0.75)",
        }}
      >
        <div>0</div>
        <div>50</div>
        <div>100</div>
        <div>150</div>
        <div>200</div>
        <div>300</div>
        <div>301+</div>
      </div>
    </div>
  );
}

/* =========================
   MAIN APP (AQI CARD section starts here)
   Note: only change is gauge removal — rest is same.
   Replace the gauge container's content to show AnimatedAqiBar.
*/

export default function App() {
  const panelRef = useRef(null);
  const [mapTheme, setMapTheme] = useState("satellite");
  const [searchText, setSearchText] = useState("");
  const [markerPos, setMarkerPos] = useState(null);
  const [aqiData, setAqiData] = useState(null);
  const [heatmapEnabled, setHeatmapEnabled] = useState(false);
  const [message, setMessage] = useState(null);
  const [messageTop, setMessageTop] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showNews, setShowNews] = useState(false);
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  const [showFeaturesPanel, setShowFeaturesPanel] = useState(false);

  const featureList = [
    {
      icon: "📍",
      title: "Hyperlocal AQI",
      desc: "Tap any point on the map or use search to get live AQI with smart fallbacks.",
      bullets: [
        "Geocode search + map click fetch",
        "Live OpenWeather + cached/India grid fallbacks",
        "Snackbar updates for success/errors",
      ],
    },
    {
      icon: "🔥",
      title: "Heatmap Overlay",
      desc: "Toggle a smooth AQI heatmap generated from backend analytics.",
      bullets: [
        "Backend-generated smooth grid",
        "Bounds-aware fetching to save bandwidth",
        "Adjustable theme-friendly overlay",
      ],
    },
    {
      icon: "🌈",
      title: "Map Themes",
      desc: "Switch between satellite, dark, light, neon, and terrain basemaps.",
      bullets: [
        "One-tap theme toggle",
        "High-contrast neon/dark options",
        "Terrain layer for outdoor planning",
      ],
    },
    {
      icon: "🧪",
      title: "Pollutant Breakdown",
      desc: "View PM2.5, PM10, CO, NO₂, SO₂, O₃ details alongside AQI.",
      bullets: [
        "Component-level readings",
        "AQI category + color coding",
        "Animated AQI bar for quick glance",
      ],
    },
    {
      icon: "🤖",
      title: "Future Outlook",
      desc: "Forecast card with actions, penguin status, and smoking-equivalent exposure.",
      bullets: [
        "Current vs next-24h AQI",
        "Health advice + key actions",
        "Penguin mood + cigarette equivalence",
      ],
    },
    {
      icon: "📅",
      title: "AQI Calendar",
      desc: "Month view with color-coded days, hover hints, and current-day highlight.",
      bullets: [
        "AQI-colored day cells",
        "Hover zoom + current-day ring",
        "Compact legend for levels",
      ],
    },
    {
      icon: "📰",
      title: "Climate News",
      desc: "Curated AQI/climate headlines with immersive video backdrop.",
      bullets: [
        "Last-7-day AQI/climate stories",
        "Fullscreen video background",
        "Hover-lift news cards",
      ],
    },
    {
      icon: "🔔",
      title: "Smart Notices",
      desc: "Inline toast for searches, geolocation, and status updates.",
      bullets: [
        "Inline toasts for events",
        "Auto-dismiss with timers",
        "Responsive positioning near panel",
      ],
    },
  ];

  function showMessage(text) {
    setMessage(text);
    setTimeout(() => {
      if (panelRef.current) {
        const rect = panelRef.current.getBoundingClientRect();
        setMessageTop(rect.bottom + 8);
      }
    }, 30);
    setTimeout(() => setMessage(null), 10000);
  }

  /* LOAD USER LOCATION */
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        try {
          const res = await fetch(
            `http://127.0.0.1:8000/aqi/coords?lat=${lat}&lon=${lon}`
          );
          const json = await res.json();
          setMarkerPos([lat, lon]);
          setAqiData(json);
          showMessage("🎯 Location detected");
        } catch {
          loadIndiaDefault();
        }
      },
      () => loadIndiaDefault()
    );

    const onResize = () => {
      if (panelRef.current) {
        const rect = panelRef.current.getBoundingClientRect();
        setMessageTop(rect.bottom + 8);
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line
  }, []);

  async function loadIndiaDefault() {
    const lat = 22.5937,
      lon = 78.9629;
    const res = await fetch(
      `http://127.0.0.1:8000/aqi/coords?lat=${lat}&lon=${lon}`
    );
    const json = await res.json();
    setMarkerPos([lat, lon]);
    setAqiData(json);
    showMessage("🇮🇳 Showing India AQI (default)");
  }

  /* SEARCH */
  async function handleSearch() {
    if (!searchText.trim()) return;

    setIsSearching(true);
    showMessage("🔍 Searching…");

    try {
      const res = await fetch(
        `http://127.0.0.1:8000/aqi/location?place=${encodeURIComponent(
          searchText
        )}&country=India`
      );
      const json = await res.json();

      setMarkerPos([json.latitude, json.longitude]);
      setAqiData(json);
      showMessage("✅ Search completed");
    } catch {
      showMessage("❌ Search failed");
    }

    setIsSearching(false);
  }

  /* CURRENT LOCATION */
  async function handleCurrentLocationClick() {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;

        const res = await fetch(
          `http://127.0.0.1:8000/aqi/coords?lat=${lat}&lon=${lon}`
        );
        const json = await res.json();

        setMarkerPos([lat, lon]);
        setAqiData(json);
        showMessage("📍 Location updated");
      },
      () => showMessage("🚫 Location permission denied")
    );
  }

  /* =========================
     AQI CARD
     ========================= */
  function AQICard({ data }) {
    if (!data) return null;

    const aqi = data.aqi ?? data.AQI ?? data.index ?? null;
    const pm25 = data.pm25 ?? data.pm2_5 ?? null;
    const pm10 = data.pm10 ?? null;
    const co = data.carbon_monoxide ?? data.CO ?? null;
    const no2 = data.nitrogen_dioxide ?? data.NO2 ?? null;
    const so2 = data.sulphur_dioxide ?? data.SO2 ?? null;
    const o3 = data.ozone ?? data.O3 ?? null;
    const ts = data.timestamp ?? data.time ?? null;

    const cat = getAqiCategory(aqi);

    const normalize = (v) =>
      Math.min((v == null ? 0 : Number(v)) / 500, 1) * 100;

    const PollutantRow = ({ label, value }) => {
      const pct = normalize(value);
      return (
        <div style={{ marginBottom: 10 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 6,
            }}
          >
            <div
              style={{
                fontSize: 12,
                color: "rgba(255,255,255,0.9)",
                fontWeight: 700,
              }}
            >
              {label}
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.9)" }}>
              {value != null ? `${Number(value).toFixed(2)} µg/m³` : "N/A"}
            </div>
          </div>

          <div
            style={{
              width: "100%",
              height: 8,
              background: "rgba(255,255,255,0.06)",
              borderRadius: 6,
            }}
          >
            <div
              style={{
                width: `${pct}%`,
                height: "100%",
                borderRadius: 6,
                background: `linear-gradient(90deg, ${cat.color}, rgba(255,255,255,0.12))`,
              }}
            />
          </div>
        </div>
      );
    };

    return (
      <div
        style={{
          position: "static",
          width: 350,
          borderRadius: 14,
          background: "rgba(10,12,16,0.96)",
          color: "white",
          overflow: "hidden",
          boxShadow: "0 12px 36px rgba(0,0,0,0.45)",
          animation: "slideInUp 0.25s ease",
          border: "1px solid rgba(255,255,255,0.05)",
          pointerEvents: "auto",
          margin: "20px",
        }}
      >
        {/* Animated AQI BAR (TOP) — FIXED SPACING + NO WHITE SPOT */}
        <div
          style={{
            height: "auto",
            padding: "12px 0 6px",
            background: "rgba(255,255,255,0.02)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <AnimatedAqiBar aqi={aqi} />
        </div>

        {/* Row: GIF | AQI number + label */}
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            padding: "8px 14px 12px",
          }}
        >
          <div
            style={{
              width: 90,
              height: 90,
              borderRadius: 10,
              overflow: "hidden",
              background: "rgba(255,255,255,0.02)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <img
              src={cat.peng}
              style={{ width: 84, height: 84, objectFit: "contain" }}
            />
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ fontSize: 42, fontWeight: 900, color: cat.color }}>
                {aqi ?? "N/A"}
              </div>

              <div
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  background: "rgba(255,255,255,0.04)",
                  padding: "6px 10px",
                  borderRadius: 999,
                  color: "white",
                }}
              >
                {cat.label}
              </div>
            </div>

            <div
              style={{
                marginTop: 6,
                fontSize: 12,
                color: "rgba(255,255,255,0.7)",
              }}
            >
              {ts ? new Date(ts).toLocaleString() : ""}
            </div>
          </div>
        </div>

        {/* Bottom pollutant list */}
        <div style={{ padding: "0 14px 14px" }}>
          <PollutantRow label="PM2.5" value={pm25} />
          <PollutantRow label="PM10" value={pm10} />
          <PollutantRow label="NO₂" value={no2} />
          <PollutantRow label="SO₂" value={so2} />
          <PollutantRow label="CO" value={co} />
          <PollutantRow label="O₃" value={o3} />

          <div style={{ height: 8 }} />

          {/* Color scale */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                flex: 1,
                height: 12,
                background: "#00E400",
                borderRadius: 6,
              }}
            />
            <div
              style={{
                flex: 1,
                height: 12,
                background: "#FFFF00",
                borderRadius: 6,
              }}
            />
            <div
              style={{
                flex: 1,
                height: 12,
                background: "#FF7E00",
                borderRadius: 6,
              }}
            />
            <div
              style={{
                flex: 1,
                height: 12,
                background: "#FF0000",
                borderRadius: 6,
              }}
            />
            <div
              style={{
                flex: 1,
                height: 12,
                background: "#8F3F97",
                borderRadius: 6,
              }}
            />
            <div
              style={{
                flex: 1,
                height: 12,
                background: "#7E0018",
                borderRadius: 6,
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  /* THEME PICKER */
  function ThemePicker() {
    return (
      <div style={{ width: "100%" }}>
        <div
          style={{
            fontSize: 14,
            color: "rgba(255,255,255,0.85)",
            marginBottom: 6,
            fontWeight: 500,
          }}
        >
          🌐 Map Theme
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            gap: 8,
            padding: 8,
            background: "rgba(255,255,255,0.06)",
            borderRadius: 14,
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.15)",
          }}
        >
          {Object.keys(THEME_ICONS).map((theme) => {
            const isActive = mapTheme === theme;
            return (
              <div
                key={theme}
                onClick={() => setMapTheme(theme)}
                style={{
                  textAlign: "center",
                  cursor: "pointer",
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: isActive
                      ? "rgba(255,255,255,0.25)"
                      : "rgba(255,255,255,0.10)",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    fontSize: 20,
                    margin: "0 auto",
                    border: isActive
                      ? "2px solid rgba(255,255,255,0.9)"
                      : "2px solid rgba(255,255,255,0.15)",
                    boxShadow: isActive
                      ? "0 0 12px rgba(255,255,255,0.8)"
                      : "none",
                    transform: isActive ? "scale(1.05)" : "scale(1.0)",
                    transition: "0.2s",
                  }}
                >
                  {THEME_ICONS[theme]}
                </div>
                <div
                  style={{
                    fontSize: 9,
                    marginTop: 4,
                    color: isActive ? "white" : "rgba(255,255,255,0.6)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {THEME_LABELS[theme]}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  /* =========================
      MAIN UI
     ========================= */
  return (
    <>
      {showNews ? (
        /* =============================
         NEWS PAGE
      ==============================*/
        <div
          style={{
            width: "100vw",
            minHeight: "100vh",
            background: "linear-gradient(180deg, #0d0d0d, #1a1a1a)",
            padding: "20px 30px",
            color: "white",
            overflowY: "auto",
            boxSizing: "border-box",
            position: "relative",
          }}
        >
          {/* TOP-RIGHT BUTTONS */}
          <div
            style={{
              position: "absolute",
              top: "20px",
              right: "30px",
              display: "flex",
              gap: "12px",
              zIndex: 1000,
            }}
          >
            {/* MAP BUTTON */}
            <button
              onClick={() => setShowNews(false)}
              style={{
                padding: "10px 18px",
                background: "#2563eb",
                color: "white",
                borderRadius: "10px",
                border: "none",
                cursor: "pointer",
                fontWeight: "600",
                boxShadow: "0px 4px 12px rgba(0,0,0,0.4)",
                transition: "0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = "scale(1.05)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = "scale(1)")
              }
            >
              🗺 Map
            </button>

            {/* FEATURES BUTTON */}
            <button
              onClick={() => setShowFeaturesPanel(true)}
              style={{
                padding: "10px 18px",
                background: "#9333ea",
                color: "white",
                borderRadius: "10px",
                border: "none",
                cursor: "pointer",
                fontWeight: "600",
                boxShadow: "0px 4px 12px rgba(0,0,0,0.4)",
                transition: "0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = "scale(1.05)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = "scale(1)")
              }
            >
              ⭐ Features
            </button>
          </div>

          {/* News Feed */}
          <div style={{ marginTop: "80px" }}>
            <NewsFeed />
          </div>

          {/* Features Overlay */}
          {showFeaturesPanel && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.55)",
                backdropFilter: "blur(10px)",
                zIndex: 2000,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                padding: "20px",
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: "min(960px, 95vw)",
                  maxHeight: "85vh",
                  overflowY: "auto",
                  background:
                    "linear-gradient(160deg, rgba(30,41,59,0.9), rgba(15,23,42,0.95))",
                  border: "1px solid rgba(147,51,234,0.35)",
                  boxShadow: "0 20px 50px rgba(0,0,0,0.55)",
                  borderRadius: 16,
                  padding: 22,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 14,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 26,
                        fontWeight: 800,
                        color: "white",
                        letterSpacing: "0.5px",
                      }}
                    >
                      🚀 Application Features
                    </div>
                    <div
                      style={{
                        color: "rgba(255,255,255,0.7)",
                        fontSize: 13,
                        marginTop: 4,
                      }}
                    >
                      Everything packed into your AQI & climate experience.
                    </div>
                  </div>
                  <button
                    onClick={() => setShowFeaturesPanel(false)}
                    style={{
                      background: "rgba(255,255,255,0.08)",
                      color: "white",
                      border: "1px solid rgba(255,255,255,0.15)",
                      borderRadius: 10,
                      padding: "8px 12px",
                      cursor: "pointer",
                      fontWeight: 700,
                    }}
                  >
                    ✕ Close
                  </button>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                    gap: 14,
                  }}
                >
                  {featureList.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: "rgba(255,255,255,0.08)",
                        borderRadius: 16,
                        padding: 16,
                        border: "1px solid rgba(255,255,255,0.12)",
                        boxShadow: "0 10px 24px rgba(0,0,0,0.45)",
                        display: "flex",
                        gap: 12,
                        alignItems: "flex-start",
                        transition:
                          "transform 0.22s ease, box-shadow 0.22s ease",
                        cursor: "default",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform =
                          "translateY(-6px) scale(1.01)";
                        e.currentTarget.style.boxShadow =
                          "0 14px 28px rgba(0,0,0,0.55)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform =
                          "translateY(0) scale(1)";
                        e.currentTarget.style.boxShadow =
                          "0 10px 24px rgba(0,0,0,0.45)";
                      }}
                    >
                      <div
                        style={{
                          fontSize: 20,
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          display: "grid",
                          placeItems: "center",
                          background: "rgba(147,51,234,0.15)",
                          border: "1px solid rgba(147,51,234,0.4)",
                        }}
                      >
                        {item.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            color: "#ffffff",
                            fontSize: 15,
                            fontWeight: 700,
                            marginBottom: 6,
                          }}
                        >
                          {item.title}
                        </div>
                        <div
                          style={{
                            color: "rgba(255,255,255,0.82)",
                            fontSize: 13,
                            lineHeight: 1.4,
                            marginBottom: 8,
                          }}
                        >
                          {item.desc}
                        </div>
                        <div style={{ display: "grid", gap: 4 }}>
                          {item.bullets?.map((point, j) => (
                            <div
                              key={j}
                              style={{
                                display: "flex",
                                gap: 6,
                                alignItems: "flex-start",
                                color: "rgba(255,255,255,0.78)",
                                fontSize: 12,
                                lineHeight: 1.35,
                              }}
                            >
                              <span style={{ color: "#a855f7" }}>•</span>
                              <span>{point}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* =============================
         MAP PAGE (BANNER + SCROLLABLE ANALYTICS)
      ==============================*/
        <div
          style={{
            width: "100vw",
            minHeight: "100vh",
            position: "relative",
            overflowY: "auto",
            overflowX: "hidden",
            background: "#000",
          }}
        >
          {/* MAP BANNER - FIXED AT TOP */}
          <div
            style={{
              position: "relative",
              width: "100%",
              height: isMapFullscreen ? "100vh" : "60vh",
              minHeight: isMapFullscreen ? "100vh" : "500px",
              overflow: "hidden",
              transition: "height 0.3s ease",
              border: "none",
              outline: "none",
            }}
          >
            {/* FLOATING PANEL - FIXED WITHIN MAP BANNER */}
            <div
              ref={panelRef}
              style={{
                position: "absolute",
                top: 5,
                right: 18,
                width: 300,
                padding: 16,
                zIndex: 9999,
                borderRadius: 20,
                background: "rgba(20,20,28,0.94)",
                backdropFilter: "blur(12px)",
                boxShadow: "0 12px 30px rgba(0,0,0,0.45)",
                display: "flex",
                flexDirection: "column",
                gap: 12,
                alignItems: "center",
              }}
            >
              {/* Banner */}
              <div
                style={{
                  width: "100%",
                  height: 140,
                  overflow: "hidden",
                  borderRadius: 12,
                  background: "rgba(255,255,255,0.04)",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <img
                  src={searchGif}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: "center",
                    animation: "floatInAir 3s ease-in-out infinite",
                  }}
                />
              </div>

              {/* SEARCH */}
              <div style={{ width: "100%", position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    left: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: 18,
                  }}
                >
                  🔍
                </span>

                <input
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder={isSearching ? "Searching…" : "Search place…"}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  style={{
                    width: "100%",
                    padding: "10px 40px 10px 36px",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(22,30,48,0.85)",
                    color: "white",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />

                <button
                  onClick={handleCurrentLocationClick}
                  style={{
                    position: "absolute",
                    right: 6,
                    top: "50%",
                    transform: "translateY(-50%)",
                    padding: "4px 8px",
                    borderRadius: "50%",
                    border: "none",
                    background: "rgba(255,255,255,0.15)",
                    color: "white",
                    cursor: "pointer",
                    fontSize: 16,
                  }}
                >
                  {"\u29BF"}
                </button>
              </div>

              {/* BUTTONS */}
              <div style={{ width: "100%", display: "flex", gap: 10 }}>
                <button
                  onClick={handleSearch}
                  style={{ ...animatedButtonStyle, flex: 1 }}
                >
                  {isSearching ? "Searching…" : "Search"}
                </button>

                <button
                  onClick={() => {
                    setHeatmapEnabled((v) => !v);
                    showMessage(
                      heatmapEnabled ? "🧊 Heatmap off" : "🔥 Heatmap on"
                    );
                  }}
                  style={{
                    ...animatedButtonStyle,
                    flex: 1,
                    background: heatmapEnabled
                      ? "linear-gradient(270deg,#9333ea,#3b0764,#9333ea)"
                      : "linear-gradient(270deg,#3b82f6,#1e40af,#3b82f6)",
                  }}
                >
                  {heatmapEnabled ? "Hide" : "Heatmap"}
                </button>

                {/* NEWS BUTTON */}
                <button
                  onClick={() => setShowNews(true)}
                  style={{
                    ...animatedButtonStyle,
                    flex: 1,
                    background:
                      "linear-gradient(270deg,#9333ea,#3b0764,#9333ea)",
                  }}
                >
                  News
                </button>
              </div>

              {/* THEME PICKER */}
              <ThemePicker />

              {/* FULLSCREEN TOGGLE BUTTON */}
              <button
                onClick={() => setIsMapFullscreen(!isMapFullscreen)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  background: isMapFullscreen
                    ? "linear-gradient(270deg,#dc2626,#991b1b,#dc2626)"
                    : "linear-gradient(270deg,#2563eb,#1e3a8a,#2563eb)",
                  backgroundSize: "600% 600%",
                  animation: "flowGradient 6s ease infinite",
                  color: "white",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: 12,
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 14,
                  boxShadow: "0 8px 20px rgba(0,0,0,0.3)",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.02)";
                  e.currentTarget.style.boxShadow =
                    "0 10px 25px rgba(0,0,0,0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow =
                    "0 8px 20px rgba(0,0,0,0.3)";
                }}
              >
                {isMapFullscreen ? "⬇ Exit Fullscreen" : "⬆ Fullscreen Map"}
              </button>

              {/* MESSAGE POPUP - BELOW SEARCH CARD */}
              {message && (
                <div
                  style={{
                    marginTop: 2,
                    width: "100%",
                    borderRadius: 10,
                    background: "rgba(20,20,28,0.85)",
                    color: "white",
                    boxShadow: "0 8px 20px rgba(0,0,0,0.4)",
                    padding: "6px 10px",
                    display: "flex",
                    gap: 6,
                    alignItems: "center",
                    justifyContent: "center",
                    border: "2px solid rgba(99, 102, 241, 0.5)",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  <img
                    src={msgGif}
                    style={{ width: 28, height: 28, borderRadius: 6 }}
                  />
                  <div style={{ fontSize: 12, fontWeight: "500" }}>
                    {message}
                  </div>
                </div>
              )}
            </div>

            {/* AQI CARD - WITHIN MAP BANNER */}
            <div
              style={{ position: "absolute", left: 0, bottom: 0, zIndex: 9990 }}
            >
              <AQICard data={aqiData} />
            </div>

            {/* MAP CONTAINER */}
            <MapContainer
              center={[20.5937, 78.9629]}
              zoom={5}
              style={{
                width: "100%",
                height: "100%",
                pointerEvents: "auto",
                cursor: "grab",
              }}
              scrollWheelZoom={isMapFullscreen}
              dragging={true}
              zoomControl={true}
              doubleClickZoom={true}
            >
              <TileLayer url={MAP_THEMES[mapTheme]} />

              <ClickFetcher
                onResult={({ lat, lon, aqiResult }) => {
                  setMarkerPos([lat, lon]);
                  setAqiData(aqiResult);
                  showMessage("📍 Location clicked");
                }}
              />

              <SmoothHeatmap
                enabled={heatmapEnabled}
                onError={(e) => showMessage(e)}
              />

              {markerPos && <Marker position={markerPos} />}
            </MapContainer>
          </div>

          {/* ---------- AQI HISTORY ANALYTICS SECTION (Scrollable) ---------- */}
          <div
            style={{
              width: "100%",
              background: "#000",
              backdropFilter: "blur(8px)",
              padding: "60px 20px 60px",
              boxSizing: "border-box",
              borderTop: "none",
              position: "relative",
              zIndex: 1,
              marginTop: 0,
            }}
          >
            <div style={{ maxWidth: 1200, margin: "0 auto" }}>
              {aqiData && aqiData.latitude && aqiData.longitude ? (
                <HistoryAnalytics
                  lat={markerPos ? markerPos[0] : aqiData.latitude}
                  lon={markerPos ? markerPos[1] : aqiData.longitude}
                  days={30}
                  rolling_window={5}
                />
              ) : (
                <>
                  <h2
                    style={{
                      color: "white",
                      textAlign: "center",
                      marginBottom: 20,
                    }}
                  >
                    📊 India AQI Analytics Overview
                  </h2>
                  <HistoryAnalytics
                    lat={22.5937}
                    lon={78.9629}
                    days={30}
                    rolling_window={5}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
