# tiles.py (modified: memory cache + parallel fetching + safer defaults)
import os
import io
import math
import time
from typing import Tuple, List, Optional

import numpy as np
from scipy.interpolate import Rbf
from PIL import Image
import requests
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse, Response

from concurrent.futures import ThreadPoolExecutor, as_completed

# Optional: mercantile helps convert tile <-> bbox. If you prefer not to install,
# fallback conversion is included.
try:
    import mercantile
    HAS_MERCANTILE = True
except Exception:
    HAS_MERCANTILE = False

router = APIRouter()

# -------------------- CACHING / CONFIG --------------------
CACHE_DIR = "tiles_cache"
os.makedirs(CACHE_DIR, exist_ok=True)

# File cache TTL (seconds) and memory cache TTL
FILE_CACHE_TTL = 600    # 10 minutes
MEMORY_CACHE_TTL = 600  # 10 minutes (same as file cache)

# Memory cache structure: {key: (timestamp, bytes)}
_memory_tile_cache = {}

# Tile size (px)
TILE_SIZE = 256

# Sample grid used to fetch "real" AQI points (coarse)
# Reduced default for performance; you can override per-request
SAMPLE_GRID = 6

# Interpolation output resolution (we will produce TILE_SIZE x TILE_SIZE by default)
OUT_RES = TILE_SIZE

# Max parallel workers for fetching sample points
MAX_WORKERS = 12

# ----------------- Utility functions -----------------

def _get_mem_cache(key: str) -> Optional[bytes]:
    entry = _memory_tile_cache.get(key)
    if not entry:
        return None
    ts, data = entry
    if time.time() - ts > MEMORY_CACHE_TTL:
        try:
            del _memory_tile_cache[key]
        except KeyError:
            pass
        return None
    return data

def _set_mem_cache(key: str, data: bytes):
    _memory_tile_cache[key] = (time.time(), data)

def tile_to_bbox(z: int, x: int, y: int) -> Tuple[float, float, float, float]:
    """
    Return bbox in lat/lon (min_lat, min_lon, max_lat, max_lon) for given WebMercator tile.
    Uses mercantile if available; otherwise falls back to math.
    """
    if HAS_MERCANTILE:
        t = mercantile.bounds(x, y, z)
        # mercantile returns (west, south, east, north)
        return (t.south, t.west, t.north, t.east)
    # fallback math:
    n = 2.0 ** z
    lon_deg_w = x / n * 360.0 - 180.0
    lon_deg_e = (x + 1) / n * 360.0 - 180.0

    def tile2lat(yv, zv):
        n2 = math.pi - 2.0 * math.pi * yv / (2.0 ** zv)
        return math.degrees(math.atan(math.sinh(n2)))

    lat_deg_n = tile2lat(y, z)
    lat_deg_s = tile2lat(y + 1, z)
    # return min_lat, min_lon, max_lat, max_lon
    return (lat_deg_s, lon_deg_w, lat_deg_n, lon_deg_e)

def grid_points_in_bbox(min_lat, min_lon, max_lat, max_lon, grid_n: int) -> List[Tuple[float,float]]:
    lat_points = [min_lat + (max_lat - min_lat) * (i / (grid_n - 1)) for i in range(grid_n)]
    lon_points = [min_lon + (max_lon - min_lon) * (j / (grid_n - 1)) for j in range(grid_n)]
    pts = [(round(lat,6), round(lon,6)) for lat in lat_points for lon in lon_points]
    return pts

def fetch_aqi_for_point(lat: float, lon: float, pick_hour: int = -1, timeout: int = 8):
    """
    Fetch us_aqi for a single lat/lon. Returns float or None.
    """
    try:
        url = (
            f"https://air-quality-api.open-meteo.com/v1/air-quality?"
            f"latitude={lat}&longitude={lon}&hourly=us_aqi&forecast_days=1"
        )
        r = requests.get(url, timeout=timeout)
        js = r.json()
        hourly = js.get("hourly", {})
        aqi_vals = hourly.get("us_aqi", [])
        if not aqi_vals:
            return None
        idx = pick_hour if (pick_hour is not None and pick_hour >= 0 and pick_hour < len(aqi_vals)) else -1
        return float(aqi_vals[idx])
    except Exception:
        return None

def aqi_to_rgba(aqi_val: float, alpha: float = 1.0) -> Tuple[int,int,int,int]:
    """
    Map AQI numeric value to RGBA color.
    Smooth interpolation between stops.
    """
    if aqi_val is None:
        return (0,0,0,0)  # fully transparent

    v = max(0.0, min(aqi_val, 500.0))

    stops = [
        (0.0,   (0, 228, 0)),    # green
        (50.0,  (0, 228, 0)),
        (100.0, (255, 255, 0)),  # yellow
        (150.0, (255, 126, 0)),  # orange
        (200.0, (255, 0, 0)),    # red
        (300.0, (143, 63, 151)), # purple
        (500.0, (126, 0, 35)),   # maroon
    ]

    for i in range(len(stops)-1):
        a_lo, c_lo = stops[i]
        a_hi, c_hi = stops[i+1]
        if v >= a_lo and v <= a_hi:
            t = (v - a_lo) / (a_hi - a_lo) if (a_hi - a_lo) > 0 else 0.0
            r = int(c_lo[0] + (c_hi[0] - c_lo[0]) * t)
            g = int(c_lo[1] + (c_hi[1] - c_lo[1]) * t)
            b = int(c_lo[2] + (c_hi[2] - c_lo[2]) * t)
            a = int(255 * alpha)
            return (r, g, b, a)
    return (126,0,35,int(255*alpha))

# ----------------- Tile generation -----------------

def generate_tile_image(min_lat, min_lon, max_lat, max_lon,
                        sample_grid: int = SAMPLE_GRID, out_res: int = OUT_RES, pick_hour: int = -1):
    """
    Returns PNG bytes for the tile (256x256) by:
      1) sampling sample_grid x sample_grid real AQI points (parallel)
      2) RBF interpolating onto out_res x out_res grid
      3) mapping to RGBA image
    """
    sample_pts = grid_points_in_bbox(min_lat, min_lon, max_lat, max_lon, sample_grid)

    # Parallel fetch sample points
    samples = []
    with ThreadPoolExecutor(max_workers=min(MAX_WORKERS, len(sample_pts))) as ex:
        future_to_pt = {ex.submit(fetch_aqi_for_point, lat, lon): (lat, lon) for (lat, lon) in sample_pts}
        for fut in as_completed(future_to_pt):
            lat, lon = future_to_pt[fut]
            try:
                val = fut.result()
                if val is not None:
                    # store as (lon, lat, aqi) because Rbf expects x=lon, y=lat
                    samples.append((lon, lat, float(val)))
            except Exception:
                # ignore failed point
                continue

    # If not enough samples, return transparent tile
    if len(samples) < 4:
        img = Image.new("RGBA", (TILE_SIZE, TILE_SIZE), (0,0,0,0))
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        buf.seek(0)
        return buf.getvalue()

    xs = np.array([s[0] for s in samples])
    ys = np.array([s[1] for s in samples])
    zs = np.array([s[2] for s in samples])

    # build RBF interpolator
    try:
        rbf = Rbf(xs, ys, zs, function='multiquadric', eps=0.1)
    except Exception:
        rbf = Rbf(xs, ys, zs, function='linear')

    # create dense grid in lon/lat order matching tile orientation
    grid_lon = np.linspace(min_lon, max_lon, out_res)
    # image rows go top->bottom so lat descends
    grid_lat = np.linspace(max_lat, min_lat, out_res)
    grid_x, grid_y = np.meshgrid(grid_lon, grid_lat)  # X = lon, Y = lat

    # interpolate and clamp
    grid_z = rbf(grid_x, grid_y)
    grid_z = np.clip(grid_z, 0, 500)

    # map grid to RGBA array
    rgba = np.zeros((out_res, out_res, 4), dtype=np.uint8)
    for i in range(out_res):
        for j in range(out_res):
            aqi_val = float(grid_z[i, j])
            rgba[i, j] = aqi_to_rgba(aqi_val, alpha=0.85)

    # convert to image and resize to TILE_SIZE
    img = Image.fromarray(rgba, mode="RGBA")
    if out_res != TILE_SIZE:
        img = img.resize((TILE_SIZE, TILE_SIZE), resample=Image.BICUBIC)

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return buf.getvalue()

# ----------------- Tile route -----------------

@router.get("/tiles/{z}/{x}/{y}.png")
def tile_png(z: int, x: int, y: int, sample_grid: int = SAMPLE_GRID, out_res: int = OUT_RES, pick_hour: int = -1):
    """
    Returns PNG tile for WebMercator tile (z/x/y).
    Query params:
     - sample_grid: coarse sampling grid (default 6)
     - out_res: interpolation output resolution before resize to 256 (default 256)
     - pick_hour: -1 for latest
    """
    # ensure ints
    z = int(z); x = int(x); y = int(y)
    sample_grid = int(sample_grid)
    out_res = int(out_res)

    # Limit values to safe ranges
    if sample_grid < 2 or sample_grid > 30:
        raise HTTPException(status_code=400, detail="sample_grid must be between 2 and 30")
    if out_res < 32 or out_res > 512:
        raise HTTPException(status_code=400, detail="out_res must be between 32 and 512")

    # compute bbox for this tile
    min_lat, min_lon, max_lat, max_lon = tile_to_bbox(z, x, y)

    # cache keys
    cache_name = f"tile_z{z}_x{x}_y{y}_sg{sample_grid}_or{out_res}_ph{pick_hour}.png"
    cache_path = os.path.join(CACHE_DIR, cache_name)

    # 1) check memory cache
    mem_cached = _get_mem_cache(cache_name)
    if mem_cached is not None:
        return StreamingResponse(io.BytesIO(mem_cached), media_type="image/png")

    # 2) check file cache
    if os.path.exists(cache_path):
        age = time.time() - os.path.getmtime(cache_path)
        if age < FILE_CACHE_TTL:
            try:
                with open(cache_path, "rb") as f:
                    data = f.read()
                # populate memory cache for faster subsequent responses
                _set_mem_cache(cache_name, data)
                return StreamingResponse(io.BytesIO(data), media_type="image/png")
            except Exception:
                pass

    # generate tile (may take time first request)
    png_bytes = generate_tile_image(min_lat, min_lon, max_lat, max_lon,
                                    sample_grid=sample_grid, out_res=out_res, pick_hour=pick_hour)

    # save to file cache (atomic)
    try:
        with open(cache_path + ".tmp", "wb") as f:
            f.write(png_bytes)
        os.replace(cache_path + ".tmp", cache_path)
    except Exception:
        # ignore cache saving errors
        pass

    # store in memory cache
    try:
        _set_mem_cache(cache_name, png_bytes)
    except Exception:
        pass

    return StreamingResponse(io.BytesIO(png_bytes), media_type="image/png")
