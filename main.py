''' from fastapi import FastAPI, Query
from database import get_connection
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed

# -----------------------------------------------------
#   FASTAPI APP
# -----------------------------------------------------
app = FastAPI()


# -----------------------------------------------------
#   HOME ROUTE
# -----------------------------------------------------
@app.get("/")
def home():
    return {"message": "AQI Insight Backend Running"}


# -----------------------------------------------------
#   AQI BY PLACE (search box)
# -----------------------------------------------------
@app.get("/aqi/location")
def get_aqi_by_place(
    place: str = Query(..., example="Whitefield"),
    country: str = Query("India", example="India")
):
    # Geocode
    geocode_url = (
        f"https://nominatim.openstreetmap.org/search?"
        f"q={place}, {country}&format=json&limit=1"
    )
    geo_res = requests.get(geocode_url, headers={"User-Agent": "AQI-Insight"}).json()

    if not geo_res:
        return {"error": "Location not found"}

    lat = float(geo_res[0]["lat"])
    lon = float(geo_res[0]["lon"])

    # AQI from Open-Meteo
    aqi_url = (
        f"https://air-quality-api.open-meteo.com/v1/air-quality?"
        f"latitude={lat}&longitude={lon}&hourly=pm10,pm2_5,ozone,"
        f"carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,us_aqi&forecast_days=1"
    )
    aqi_res = requests.get(aqi_url).json()
    hourly = aqi_res.get("hourly", {})

    if not hourly:
        return {"error": "AQI data unavailable"}

    return {
        "location": place,
        "country": country,
        "latitude": lat,
        "longitude": lon,
        "pm25": hourly["pm2_5"][-1],
        "pm10": hourly["pm10"][-1],
        "ozone": hourly["ozone"][-1],
        "carbon_monoxide": hourly["carbon_monoxide"][-1],
        "nitrogen_dioxide": hourly["nitrogen_dioxide"][-1],
        "sulphur_dioxide": hourly["sulphur_dioxide"][-1],
        "aqi": hourly["us_aqi"][-1],
        "timestamp": hourly["time"][-1]
    }


# -----------------------------------------------------
#   AQI BY COORDINATES (map click)
# -----------------------------------------------------
@app.get("/aqi/coords")
def get_aqi_by_coords(lat: float, lon: float):

    aqi_url = (
        f"https://air-quality-api.open-meteo.com/v1/air-quality?"
        f"latitude={lat}&longitude={lon}&hourly=pm10,pm2_5,ozone,"
        f"carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,us_aqi&forecast_days=1"
    )

    aqi_res = requests.get(aqi_url).json()
    hourly = aqi_res.get("hourly", {})

    if not hourly:
        return {"error": "AQI data unavailable"}

    return {
        "latitude": lat,
        "longitude": lon,
        "pm25": hourly["pm2_5"][-1],
        "pm10": hourly["pm10"][-1],
        "ozone": hourly["ozone"][-1],
        "carbon_monoxide": hourly["carbon_monoxide"][-1],
        "nitrogen_dioxide": hourly["nitrogen_dioxide"][-1],
        "sulphur_dioxide": hourly["sulphur_dioxide"][-1],
        "aqi": hourly["us_aqi"][-1],
        "timestamp": hourly["time"][-1]
    }


# -----------------------------------------------------
#   24-HOUR HISTORY (from DB)
# -----------------------------------------------------
@app.get("/aqi/history/24h")
def get_aqi_history_24h():
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT pm25, pm10, carbon_monoxide, nitrogen_dioxide,
               sulphur_dioxide, ozone, aqi, timestamp
        FROM openmeteo_aqi
        ORDER BY timestamp DESC
        LIMIT 24;
    """)

    rows = cur.fetchall()
    cur.close()
    conn.close()

    if not rows:
        return {"error": "No history data found"}

    history = []
    for row in rows:
        history.append({
            "pm25": row[0],
            "pm10": row[1],
            "carbon_monoxide": row[2],
            "nitrogen_dioxide": row[3],
            "sulphur_dioxide": row[4],
            "ozone": row[5],
            "aqi": row[6],
            "timestamp": str(row[7])
        })

    return {"history": history}


# -----------------------------------------------------
#   3-DAY FORECAST (coords)
# -----------------------------------------------------
@app.get("/aqi/forecast/coords")
def get_forecast_by_coords(lat: float, lon: float):

    forecast_url = (
        f"https://air-quality-api.open-meteo.com/v1/air-quality?"
        f"latitude={lat}&longitude={lon}&hourly=pm10,pm2_5,ozone,"
        f"carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,us_aqi"
        f"&forecast_days=3"
    )

    res = requests.get(forecast_url).json()
    hourly = res.get("hourly", {})

    if not hourly:
        return {"error": "Forecast unavailable"}

    forecast = [
        {
            "timestamp": hourly["time"][i],
            "pm25": hourly["pm2_5"][i],
            "pm10": hourly["pm10"][i],
            "ozone": hourly["ozone"][i],
            "carbon_monoxide": hourly["carbon_monoxide"][i],
            "nitrogen_dioxide": hourly["nitrogen_dioxide"][i],
            "sulphur_dioxide": hourly["sulphur_dioxide"][i],
            "aqi": hourly["us_aqi"][i]
        }
        for i in range(len(hourly["time"]))
    ]

    return {
        "latitude": lat,
        "longitude": lon,
        "forecast_hours": len(forecast),
        "forecast": forecast
    }


# -----------------------------------------------------
#   3-DAY FORECAST (place)
# -----------------------------------------------------
@app.get("/aqi/forecast/location")
def get_forecast_by_place(place: str, country: str = "India"):

    geocode_url = (
        f"https://nominatim.openstreetmap.org/search?"
        f"q={place}, {country}&format=json&limit=1"
    )
    geo_res = requests.get(geocode_url, headers={"User-Agent": "AQI-Insight"}).json()

    if not geo_res:
        return {"error": "Location not found"}

    lat = float(geo_res[0]["lat"])
    lon = float(geo_res[0]["lon"])

    return get_forecast_by_coords(lat, lon)


# -----------------------------------------------------
#   SMOOTH HEATMAP (fast, clean)
# -----------------------------------------------------
import numpy as np
from scipy.interpolate import Rbf

@app.get("/aqi/heatmap/smooth")
def get_smooth_heatmap(
    lat1: float, lon1: float, lat2: float, lon2: float,
    sample_grid: int = 8,
    out_res: int = 120,
    pick_hour: int = -1,
    parallel_workers: int = 6
):
    # Normalize bbox
    min_lat, max_lat = min(lat1, lat2), max(lat1, lat2)
    min_lon, max_lon = min(lon1, lon2), max(lon1, lon2)

    # Sample grid
    lat_points = np.linspace(min_lat, max_lat, sample_grid)
    lon_points = np.linspace(min_lon, max_lon, sample_grid)
    coords = [(float(lat), float(lon)) for lat in lat_points for lon in lon_points]

    # Fetch AQI for sample points
    def fetch(lat, lon):
        try:
            url = (f"https://air-quality-api.open-meteo.com/v1/air-quality?"
                   f"latitude={lat}&longitude={lon}&hourly=us_aqi&forecast_days=1")
            r = requests.get(url, timeout=10).json()
            aqi = r["hourly"]["us_aqi"][pick_hour] if "hourly" in r else None
            return (lat, lon, aqi)
        except:
            return None

    samples = []
    with ThreadPoolExecutor(max_workers=parallel_workers) as ex:
        for fut in as_completed([ex.submit(fetch, a, b) for a, b in coords]):
            if fut.result():
                samples.append(fut.result())

    if len(samples) < 4:
        return {"error": "Not enough samples"}

    xs = np.array([s[1] for s in samples])  # lon
    ys = np.array([s[0] for s in samples])  # lat
    zs = np.array([s[2] for s in samples], dtype=float)

    rbf = Rbf(xs, ys, zs, function="linear")

    grid_lats = np.linspace(min_lat, max_lat, out_res)
    grid_lons = np.linspace(min_lon, max_lon, out_res)
    gx, gy = np.meshgrid(grid_lons, grid_lats)

    grid_vals = rbf(gx, gy)
    grid_vals = np.clip(grid_vals, 0, 500)

    return {
        "bbox": {"min_lat": min_lat, "max_lat": max_lat, "min_lon": min_lon, "max_lon": max_lon},
        "sample_points": len(samples),
        "grid_lats": grid_lats.tolist(),
        "grid_lons": grid_lons.tolist(),
        "grid_aqi": grid_vals.tolist()
    }
from fastapi import FastAPI, Query
from database import get_connection
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed

app = FastAPI()
from tiles import router as tiles_router
app.include_router(tiles_router)


@app.get("/")
def home():
    return {"message": "AQI Insight Backend Running"}


# ------------------------------- AQI BY LOCATION (NAME) -------------------------------
@app.get("/aqi/location")
def get_aqi_by_place(
    place: str = Query(...),
    country: str = Query("India")
):
    geocode_url = (
        f"https://nominatim.openstreetmap.org/search?"
        f"q={place}, {country}&format=json&limit=1"
    )
    geo = requests.get(geocode_url, headers={"User-Agent": "AQI-Insight"}).json()

    if not geo:
        return {"error": "Location not found"}

    lat = float(geo[0]["lat"])
    lon = float(geo[0]["lon"])

    return get_aqi_by_coords(lat, lon)


# ------------------------------- AQI BY COORDINATES -------------------------------
@app.get("/aqi/coords")
def get_aqi_by_coords(lat: float, lon: float):
    url = (
        f"https://air-quality-api.open-meteo.com/v1/air-quality?"
        f"latitude={lat}&longitude={lon}&hourly=pm10,pm2_5,ozone,"
        f"carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,us_aqi&forecast_days=1"
    )
    js = requests.get(url).json()
    h = js.get("hourly", {})

    if not h:
        return {"error": "AQI data unavailable"}

    return {
        "latitude": lat,
        "longitude": lon,
        "pm25": h["pm2_5"][-1],
        "pm10": h["pm10"][-1],
        "ozone": h["ozone"][-1],
        "carbon_monoxide": h["carbon_monoxide"][-1],
        "nitrogen_dioxide": h["nitrogen_dioxide"][-1],
        "sulphur_dioxide": h["sulphur_dioxide"][-1],
        "aqi": h["us_aqi"][-1],
        "timestamp": h["time"][-1],
    }


# ------------------------------- FIX: /aqi/current (frontend uses this) -------------------------------
@app.get("/aqi/current")
def get_aqi_current(lat: float, lon: float):

    url = (
        "https://air-quality-api.open-meteo.com/v1/air-quality?"
        f"latitude={lat}&longitude={lon}&hourly=pm2_5,pm10,ozone,"
        "carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,us_aqi"
        "&forecast_days=1"
    )

    js = requests.get(url).json()
    h = js.get("hourly", {})

    if not h:
        return {"error": "AQI unavailable"}

    return {
        "latitude": lat,
        "longitude": lon,
        "pm25": h["pm2_5"][-1],
        "pm10": h["pm10"][-1],
        "ozone": h["ozone"][-1],
        "carbon_monoxide": h["carbon_monoxide"][-1],
        "nitrogen_dioxide": h["nitrogen_dioxide"][-1],
        "sulphur_dioxide": h["sulphur_dioxide"][-1],
        "aqi": h["us_aqi"][-1],
        "timestamp": h["time"][-1]
    }



# ------------------------------- 24H HISTORY -------------------------------
@app.get("/aqi/history/24h")
def history():
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT pm25, pm10, carbon_monoxide, nitrogen_dioxide,
               sulphur_dioxide, ozone, aqi, timestamp
        FROM openmeteo_aqi
        ORDER BY timestamp DESC
        LIMIT 24;
    """)

    rows = cur.fetchall()
    cur.close()
    conn.close()

    if not rows:
        return {"error": "No history"}

    return {
        "history": [
            {
                "pm25": r[0], "pm10": r[1], "carbon_monoxide": r[2],
                "nitrogen_dioxide": r[3], "sulphur_dioxide": r[4],
                "ozone": r[5], "aqi": r[6], "timestamp": str(r[7])
            }
            for r in rows
        ]
    }


# ------------------------------- FORECAST (COORDS) -------------------------------
@app.get("/aqi/forecast/coords")
def forecast_coords(lat: float, lon: float):
    url = (
        f"https://air-quality-api.open-meteo.com/v1/air-quality?"
        f"latitude={lat}&longitude={lon}&hourly=pm10,pm2_5,ozone,carbon_monoxide,"
        f"nitrogen_dioxide,sulphur_dioxide,us_aqi&forecast_days=3"
    )
    js = requests.get(url).json()
    h = js.get("hourly", {})

    if not h:
        return {"error": "Forecast unavailable"}

    return {
        "latitude": lat,
        "longitude": lon,
        "forecast_hours": len(h["time"]),
        "forecast": [
            {
                "timestamp": h["time"][i],
                "pm25": h["pm2_5"][i],
                "pm10": h["pm10"][i],
                "ozone": h["ozone"][i],
                "carbon_monoxide": h["carbon_monoxide"][i],
                "nitrogen_dioxide": h["nitrogen_dioxide"][i],
                "sulphur_dioxide": h["sulphur_dioxide"][i],
                "aqi": h["us_aqi"][i],
            }
            for i in range(len(h["time"]))
        ],
    }


# ------------------------------- FORECAST (PLACE) -------------------------------
@app.get("/aqi/forecast/location")
def forecast_place(place: str, country: str = "India"):
    geocode_url = (
        f"https://nominatim.openstreetmap.org/search?"
        f"q={place}, {country}&format=json&limit=1"
    )
    geo = requests.get(geocode_url, headers={"User-Agent": "AQI-Insight"}).json()

    if not geo:
        return {"error": "Location not found"}

    lat = float(geo[0]["lat"])
    lon = float(geo[0]["lon"])

    return forecast_coords(lat, lon)
'''
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from database import get_connection
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed
import numpy as np
from scipy.interpolate import Rbf

app = FastAPI()

# ---------------- CORS (VERY IMPORTANT) ----------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- HOME ----------------
@app.get("/")
def home():
    return {"message": "AQI Insight Backend Running"}

# ---------------- AQI BY PLACE ----------------
@app.get("/aqi/location")
def get_aqi_by_place(
    place: str = Query(...),
    country: str = Query("India")
):
    geocode_url = (
        f"https://nominatim.openstreetmap.org/search?"
        f"q={place}, {country}&format=json&limit=1"
    )
    geo = requests.get(geocode_url, headers={"User-Agent": "AQI-Insight"}).json()
    if not geo:
        return {"error": "Location not found"}

    lat = float(geo[0]["lat"])
    lon = float(geo[0]["lon"])
    return get_aqi_by_coords(lat, lon)

# ---------------- AQI BY COORDINATES ----------------
@app.get("/aqi/coords")
def get_aqi_by_coords(lat: float, lon: float):
    url = (
        f"https://air-quality-api.open-meteo.com/v1/air-quality?"
        f"latitude={lat}&longitude={lon}&hourly=pm10,pm2_5,ozone,"
        f"carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,us_aqi"
        f"&forecast_days=1"
    )
    js = requests.get(url).json()
    hourly = js.get("hourly")
    if not hourly:
        return {"error": "Data unavailable"}

    return {
        "latitude": lat,
        "longitude": lon,
        "pm25": hourly["pm2_5"][-1],
        "pm10": hourly["pm10"][-1],
        "ozone": hourly["ozone"][-1],
        "carbon_monoxide": hourly["carbon_monoxide"][-1],
        "nitrogen_dioxide": hourly["nitrogen_dioxide"][-1],
        "sulphur_dioxide": hourly["sulphur_dioxide"][-1],
        "aqi": hourly["us_aqi"][-1],
        "timestamp": hourly["time"][-1]
    }

# ---------------- 24-Hour History (DB) ----------------
@app.get("/aqi/history/24h")
def history():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT pm25,pm10,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,aqi,timestamp "
                "FROM openmeteo_aqi ORDER BY timestamp DESC LIMIT 24")
    rows = cur.fetchall()
    cur.close()
    conn.close()

    hist = []
    for r in rows:
        hist.append({
            "pm25": r[0], "pm10": r[1], "carbon_monoxide": r[2],
            "nitrogen_dioxide": r[3], "sulphur_dioxide": r[4],
            "ozone": r[5], "aqi": r[6], "timestamp": str(r[7])
        })
    return {"history": hist}

# ---------------- Heatmap (FAST SMOOTH) ----------------
@app.get("/aqi/heatmap/smooth")
def heatmap_smooth(
    lat1: float, lon1: float, lat2: float, lon2: float,
    sample_grid: int = 6,
    out_res: int = 60
):
    min_lat, max_lat = min(lat1, lat2), max(lat1, lat2)
    min_lon, max_lon = min(lon1, lon2), max(lon1, lon2)

    lats = np.linspace(min_lat, max_lat, sample_grid)
    lons = np.linspace(min_lon, max_lon, sample_grid)
    coords = [(float(a), float(b)) for a in lats for b in lons]

    def fetch(lat, lon):
        try:
            u = f"https://air-quality-api.open-meteo.com/v1/air-quality?latitude={lat}&longitude={lon}&hourly=us_aqi"
            r = requests.get(u, timeout=8).json()
            return (lat, lon, r["hourly"]["us_aqi"][-1])
        except:
            return None

    samples = []
    with ThreadPoolExecutor(max_workers=8) as ex:
        for f in as_completed([ex.submit(fetch, a, b) for a, b in coords]):
            if f.result():
                samples.append(f.result())

    if len(samples) < 4:
        return {"error": "Not enough points"}

    xs = np.array([s[1] for s in samples])
    ys = np.array([s[0] for s in samples])
    zs = np.array([s[2] for s in samples])

    rbf = Rbf(xs, ys, zs, function="linear")

    grid_lats = np.linspace(min_lat, max_lat, out_res)
    grid_lons = np.linspace(min_lon, max_lon, out_res)
    gx, gy = np.meshgrid(grid_lons, grid_lats)

    result = rbf(gx, gy)
    result = np.clip(result, 0, 500)

    return {
        "grid_lats": grid_lats.tolist(),
        "grid_lons": grid_lons.tolist(),
        "grid_aqi": result.tolist()
    }
