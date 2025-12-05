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

# Load .env
load_dotenv()
OWM_KEY = os.getenv("OWM_API_KEY")
if not OWM_KEY:
    raise RuntimeError("OWM_API_KEY not found in environment (.env)")

app = FastAPI(title="AQI Insight Backend (OpenWeather)")

# CORS - allow localhost frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

HEADERS = {"User-Agent": "AQI-Insight/OWM"}

# ---------- helpers ----------
def owm_aqi_to_numeric(idx):
    """
    OpenWeather 'aqi' is 1..5 (1=Good,5=Very Poor).
    Map to a numeric scale roughly matching US EPA bands so frontend colors match.
    Mapping chosen: 1 -> 50, 2 -> 100, 3 -> 150, 4 -> 200, 5 -> 300
    """
    try:
        idx = int(idx)
    except:
        return None
    mapping = {1: 50, 2: 100, 3: 150, 4: 200, 5: 300}
    return mapping.get(idx, None)

# ---------- DB utils ----------
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


def get_latest_global(lat, lon):
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT aqi, pm25, pm10, co, no2, so2, o3, timestamp
            FROM global_aqi
            WHERE ABS(latitude-%s) < 1.0
              AND ABS(longitude-%s) < 1.0
            ORDER BY timestamp DESC
            LIMIT 1
        """, (lat, lon))
        row = cur.fetchone()
        cur.close()
        conn.close()
        return row
    except Exception as e:
        print("DB fallback error:", e)
        return None

# ---------- OpenWeather fetch ----------
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
        numeric_aqi = owm_aqi_to_numeric(idx)
        return {
            "aqi": numeric_aqi,
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
        # print for debugging but don't crash
        print("OWM FETCH ERROR:", e)
        return None

# ---------- endpoints ----------
@app.get("/")
def home():
    return {"message": "AQI Insight Backend Running (OpenWeather)"}

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
    return get_aqi(lat=lat, lon=lon)

@app.get("/aqi/coords")
def get_aqi(lat: float, lon: float):
    # 1) Try live OWM
    live = fetch_owm(lat, lon)
    if live and live["aqi"] is not None:
        # save reduced payload to db
        save_to_db(lat, lon, {
            "aqi": live["aqi"],
            "pm25": live["pm25"],
            "pm10": live["pm10"],
            "co": live["co"],
            "no2": live["no2"],
            "so2": live["so2"],
            "o3": live["o3"]
        })
        return {
            "latitude": lat,
            "longitude": lon,
            "aqi": live["aqi"],
            "pm25": live["pm25"],
            "pm10": live["pm10"],
            "carbon_monoxide": live["co"],
            "nitrogen_dioxide": live["no2"],
            "sulphur_dioxide": live["so2"],
            "ozone": live["o3"],
            "raw_aqi_index": live.get("raw_aqi_index"),
            "timestamp": live.get("fetched_at")
        }

    # 2) DB fallback
    row = get_latest_global(lat, lon)
    if row:
        return {
            "latitude": lat,
            "longitude": lon,
            "aqi": row[0],
            "pm25": row[1],
            "pm10": row[2],
            "carbon_monoxide": row[3],
            "nitrogen_dioxide": row[4],
            "sulphur_dioxide": row[5],
            "ozone": row[6],
            "timestamp": row[7].isoformat() if hasattr(row[7], "isoformat") else str(row[7])
        }

    # 3) Hard fallback
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
        "timestamp": None
    }

@app.get("/aqi/heatmap/smooth")
def heatmap(lat1: float, lon1: float, lat2: float, lon2: float,
            sample_grid: int = 5, out_res: int = 80):
    # clamp sensible minimums
    sample_grid = max(3, min(11, sample_grid))
    out_res = max(40, min(200, out_res))

    min_lat, max_lat = min(lat1, lat2), max(lat1, lat2)
    min_lon, max_lon = min(lon1, lon2), max(lon1, lon2)

    lats = np.linspace(min_lat, max_lat, sample_grid)
    lons = np.linspace(min_lon, max_lon, sample_grid)
    coords = [(a, b) for a in lats for b in lons]

    samples = []
    # fetch sequentially (safe); if you need speed later, we can parallelize
    for a, b in coords:
        d = fetch_owm(a, b)
        if d and d.get("aqi") is not None:
            samples.append((a, b, d["aqi"]))

    if len(samples) < 4:
        arr = np.full((out_res, out_res), 50.0)
        return {
            "grid_lats": np.linspace(min_lat, max_lat, out_res).tolist(),
            "grid_lons": np.linspace(min_lon, max_lon, out_res).tolist(),
            "grid_aqi": arr.tolist(),
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
