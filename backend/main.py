# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import requests
import numpy as np
from scipy.interpolate import Rbf
from datetime import datetime, timezone
import os
from dotenv import load_dotenv
from database import get_connection
from analytics import router as analytics_router

# Load .env
load_dotenv()
OWM_KEY = os.getenv("OWM_API_KEY")
if not OWM_KEY:
    raise RuntimeError("OWM_API_KEY not found in environment (.env)")

app = FastAPI(title="AQI Insight Backend")
app.include_router(analytics_router)
# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

HEADERS = {"User-Agent": "AQI-Insight-App"}

# ============================================================
# OPENWEATHER → Convert AQI 1–5 → 0–300 scale (frontend friendly)
# ============================================================
def owm_aqi_to_numeric(idx):
    try:
        idx = int(idx)
    except:
        return None
    mapping = {1: 50, 2: 100, 3: 150, 4: 200, 5: 300}
    return mapping.get(idx)


# ============================================================
# DB SAVE — stores the fetched live API results
# ============================================================
def save_to_db(lat, lon, data):
    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute(
            """
            INSERT INTO air_quality
            (latitude, longitude, aqi, pm25, pm10, co, no2, so2, o3, timestamp)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            """,
            (
                lat, lon,
                data.get("aqi"),
                data.get("pm25"),
                data.get("pm10"),
                data.get("co"),
                data.get("no2"),
                data.get("so2"),
                data.get("o3"),
                datetime.now(timezone.utc)
            )
        )

        conn.commit()
        cur.close()
        conn.close()

    except Exception as e:
        print("DB INSERT ERROR:", e)


# ============================================================
# FALLBACK 1 → Check user search history (air_quality table)
# ============================================================
def get_latest_from_air_quality(lat, lon, radius_deg=0.7):
    """Return most recent AQI data near the coordinates."""
    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute(
            """
            SELECT aqi, pm25, pm10, co, no2, so2, o3, timestamp
            FROM air_quality
            WHERE ABS(latitude - %s) < %s
              AND ABS(longitude - %s) < %s
            ORDER BY timestamp DESC
            LIMIT 1
            """,
            (lat, radius_deg, lon, radius_deg)
        )

        row = cur.fetchone()
        cur.close()
        conn.close()
        return row

    except Exception as e:
        print("air_quality fallback error:", e)
        return None


# ============================================================
# FALLBACK 2 → India AQI table (synced grid data)
# ============================================================
def get_nearest_india_aqi(lat, lon):
    """Return nearest AQI from india_aqi table."""
    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute(
            """
            SELECT pm25, pm10, no2, so2, o3, co, aqi, dt, lat, lon
            FROM india_aqi
            ORDER BY ABS(lat - %s) + ABS(lon - %s)
            LIMIT 1
            """,
            (lat, lon)
        )

        row = cur.fetchone()
        cur.close()
        conn.close()

        if not row:
            return None

        return {
            "latitude": row[8],
            "longitude": row[9],
            "pm25": row[0],
            "pm10": row[1],
            "nitrogen_dioxide": row[2],
            "sulphur_dioxide": row[3],
            "ozone": row[4],
            "carbon_monoxide": row[5],
            "aqi": row[6],
            "timestamp": row[7].isoformat(),
        }

    except Exception as e:
        print("india_aqi fallback error:", e)
        return None


# ============================================================
# FETCH LIVE DATA FROM OPENWEATHER API
# ============================================================
def fetch_owm(lat, lon):
    url = (
        "http://api.openweathermap.org/data/2.5/air_pollution?"
        f"lat={lat}&lon={lon}&appid={OWM_KEY}"
    )

    try:
        resp = requests.get(url, headers=HEADERS, timeout=8)
        resp.raise_for_status()

        js = resp.json()
        if "list" not in js or not js["list"]:
            return None

        record = js["list"][0]
        comp = record.get("components", {})
        idx = record.get("main", {}).get("aqi")

        return {
            "aqi": owm_aqi_to_numeric(idx),
            "pm25": comp.get("pm2_5"),
            "pm10": comp.get("pm10"),
            "co": comp.get("co"),
            "no2": comp.get("no2"),
            "so2": comp.get("so2"),
            "o3": comp.get("o3"),
            "raw_aqi_index": idx,
            "fetched_at": datetime.now(timezone.utc).isoformat()
        }

    except Exception as e:
        print("OWM FETCH ERROR:", e)
        return None


# ============================================================
# HOME
# ============================================================
@app.get("/")
def home():
    return {"status": "AQI Insight Backend Running"}


# ============================================================
# Geocode → Then fetch AQI
# ============================================================
@app.get("/aqi/location")
def get_aqi_by_place(place: str, country: str = "India"):
    geocode_url = (
        "https://nominatim.openstreetmap.org/search?"
        f"q={place}, {country}&format=json&limit=1"
    )

    try:
        geo = requests.get(geocode_url, headers=HEADERS, timeout=8).json()
    except Exception as e:
        return {"error": "Geocoding failed", "detail": str(e)}

    if not geo:
        return {"error": "Location not found"}

    lat = float(geo[0]["lat"])
    lon = float(geo[0]["lon"])

    return get_aqi(lat, lon)


# ============================================================
# MAIN AQI ENDPOINT (LIVE + 3 FALLBACKS)
# ============================================================
@app.get("/aqi/coords")
def get_aqi(lat: float, lon: float):

    # 1) LIVE API
    live = fetch_owm(lat, lon)
    if live and live["aqi"] is not None:
        save_to_db(lat, lon, live)
        live["source"] = "openweather"
        return {**live, "latitude": lat, "longitude": lon}

    # 2) SEARCH HISTORY FALLBACK
    h = get_latest_from_air_quality(lat, lon)
    if h:
        return {
            "latitude": lat,
            "longitude": lon,
            "aqi": h[0],
            "pm25": h[1],
            "pm10": h[2],
            "carbon_monoxide": h[3],
            "nitrogen_dioxide": h[4],
            "sulphur_dioxide": h[5],
            "ozone": h[6],
            "timestamp": h[7].isoformat(),
            "source": "air_quality_cache"
        }

    # 3) INDIA GRID FALLBACK
    if 6 <= lat <= 38 and 68 <= lon <= 98:
        india = get_nearest_india_aqi(lat, lon)
        if india:
            india["source"] = "india_aqi"
            return india

    # 4) HARD FALLBACK
    return {
        "latitude": lat,
        "longitude": lon,
        "aqi": 50,
        "pm25": None,
        "pm10": None,
        "carbon_monoxide": None,
        "nitrogen_dioxide": None,
        "sulphur_dioxide": None,
        "ozone": None,
        "timestamp": None,
        "source": "hard_fallback"
    }


# ============================================================
# HEATMAP ENDPOINT
# ============================================================
@app.get("/aqi/heatmap/smooth")
def heatmap(lat1: float, lon1: float, lat2: float, lon2: float,
            sample_grid: int = 5, out_res: int = 80):

    sample_grid = max(3, min(11, sample_grid))
    out_res = max(40, min(200, out_res))

    min_lat, max_lat = min(lat1, lat2), max(lat1, lat2)
    min_lon, max_lon = min(lon1, lon2), max(lon1, lon2)

    lats = np.linspace(min_lat, max_lat, sample_grid)
    lons = np.linspace(min_lon, max_lon, sample_grid)
    coords = [(a, b) for a in lats for b in lons]

    samples = []
    for a, b in coords:
        d = fetch_owm(a, b)
        if d and d["aqi"] is not None:
            samples.append((a, b, d["aqi"]))

    if len(samples) < 4:
        grid = np.full((out_res, out_res), 50.0)
        return {
            "grid_lats": np.linspace(min_lat, max_lat, out_res).tolist(),
            "grid_lons": np.linspace(min_lon, max_lon, out_res).tolist(),
            "grid_aqi": grid.tolist(),
            "note": "fallback - insufficient samples"
        }

    xs = np.array([s[1] for s in samples])
    ys = np.array([s[0] for s in samples])
    zs = np.array([s[2] for s in samples])

    rbf = Rbf(xs, ys, zs, function="linear")

    gx, gy = np.meshgrid(
        np.linspace(min_lon, max_lon, out_res),
        np.linspace(min_lat, max_lat, out_res)
    )
    smoothed = np.clip(rbf(gx, gy), 0, 500)

    return {
        "grid_lats": np.linspace(min_lat, max_lat, out_res).tolist(),
        "grid_lons": np.linspace(min_lon, max_lon, out_res).tolist(),
        "grid_aqi": smoothed.tolist()
    }
