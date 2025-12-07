# analytics.py
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta, timezone
import math
import numpy as np
from database import get_connection

router = APIRouter(prefix="/aqi/history", tags=["history"])

# ---------------------------
# Helpers
# ---------------------------
def deg_radius_for_km(km: float) -> float:
    # approximate: 1 deg latitude ~ 111 km
    return max(0.01, km / 111.0)

def rows_to_dicts(cursor, rows):
    cols = [d.name for d in cursor.description]
    return [dict(zip(cols, r)) for r in rows]

def compute_basic_stats(values: List[float]):
    arr = np.array([v for v in values if v is not None], dtype=float)
    if arr.size == 0:
        return {"count": 0, "mean": None, "median": None, "std": None, "min": None, "max": None}
    return {
        "count": int(arr.size),
        "mean": float(np.nanmean(arr)),
        "median": float(np.nanmedian(arr)),
        "std": float(np.nanstd(arr, ddof=0)),
        "min": float(np.nanmin(arr)),
        "max": float(np.nanmax(arr)),
    }

def compute_rolling(values: List[Optional[float]], window: int = 3):
    """Simple rolling average; returns list aligned with input (None where not enough)."""
    out = []
    buf = []
    for v in values:
        if v is None:
            buf.append(None)
        else:
            buf.append(float(v))
        # compute last `window` non-None
        valid = [x for x in buf[-window:] if x is not None]
        out.append(float(np.mean(valid)) if len(valid) else None)
    return out

# ---------------------------
# DB fetchers (air_quality primary)
# ---------------------------
def fetch_history_from_air_quality(lat: float, lon: float, days: int, radius_km: float):
    rdeg = deg_radius_for_km(radius_km)
    since = datetime.now(timezone.utc) - timedelta(days=days)
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT latitude, longitude, aqi, pm25, pm10, co, no2, so2, o3, timestamp
        FROM air_quality
        WHERE ABS(latitude - %s) <= %s
          AND ABS(longitude - %s) <= %s
          AND timestamp >= %s
        ORDER BY timestamp ASC
        """,
        (lat, rdeg, lon, rdeg, since)
    )
    rows = cur.fetchall()
    out = rows_to_dicts(cur, rows)
    cur.close()
    conn.close()
    return out

def fetch_history_from_india_aqi_nearest(lat: float, lon: float, days: int):
    """
    If no air_quality history found, fall back to recent india_aqi grid
    within last `days`. We fetch nearest N rows within bounding box.
    """
    since = datetime.now(timezone.utc) - timedelta(days=days)
    conn = get_connection()
    cur = conn.cursor()
    # get nearest points inside india_aqi in timeframe
    cur.execute(
        """
        SELECT lat AS latitude, lon AS longitude, aqi, pm25, pm10, co, no2, so2, o3, dt AS timestamp
        FROM india_aqi
        WHERE dt >= %s
        ORDER BY ABS(lat - %s) + ABS(lon - %s)
        LIMIT 200
        """,
        (since, lat, lon)
    )
    rows = cur.fetchall()
    out = rows_to_dicts(cur, rows)
    cur.close()
    conn.close()
    return out

# ---------------------------
# Endpoints
# ---------------------------
@router.get("/raw", summary="Raw history rows from india_aqi")
def raw_history(lat: float, lon: float, days: int = Query(30, ge=1, le=365), radius_km: float = Query(70.0, gt=0)):
    """
    Return raw DB rows near lat/lon over last `days`.
    Fetches from india_aqi table only.
    """
    # Always use india_aqi data
    rows = fetch_history_from_india_aqi_nearest(lat, lon, days)
    source = "india_aqi"
    return {"latitude": lat, "longitude": lon, "days": days, "radius_km": radius_km, "source": source, "rows": rows}

@router.get("/timeseries", summary="Cleaned timeseries for charting")
def timeseries(lat: float, lon: float, days: int = Query(30, ge=1, le=365), radius_km: float = Query(70.0, gt=0), rolling_window: int = Query(3, ge=1, le=30)):
    """
    Return time-ordered series of {timestamp, aqi, pm25, pm10, ...}
    plus rolling averages for AQI and PM2.5 (window configurable).
    Fetches from india_aqi table only.
    """
    # Always use india_aqi data
    raw = fetch_history_from_india_aqi_nearest(lat, lon, days)
    source = "india_aqi"

    # Normalize timestamps to ISO, ensure floats or None
    timestamps = []
    aqi_vals = []
    pm25_vals = []
    pm10_vals = []
    co_vals = []
    no2_vals = []
    so2_vals = []
    o3_vals = []

    for r in raw:
        ts = r.get("timestamp")
        if isinstance(ts, str):
            try:
                ts_iso = ts
            except:
                ts_iso = str(ts)
        elif hasattr(ts, "isoformat"):
            ts_iso = ts.isoformat()
        else:
            ts_iso = str(ts)
        timestamps.append(ts_iso)
        # push numeric or None
        aqi_vals.append(None if r.get("aqi") is None else float(r.get("aqi")))
        pm25_vals.append(None if r.get("pm25") is None else float(r.get("pm25")))
        pm10_vals.append(None if r.get("pm10") is None else float(r.get("pm10")))
        co_vals.append(None if r.get("co") is None else float(r.get("co")))
        no2_vals.append(None if r.get("no2") is None else float(r.get("no2")))
        so2_vals.append(None if r.get("so2") is None else float(r.get("so2")))
        o3_vals.append(None if r.get("o3") is None else float(r.get("o3")))

    aqi_roll = compute_rolling(aqi_vals, window=rolling_window)
    pm25_roll = compute_rolling(pm25_vals, window=rolling_window)

    series = []
    for i, ts in enumerate(timestamps):
        series.append({
            "timestamp": ts,
            "aqi": aqi_vals[i],
            "aqi_roll": aqi_roll[i],
            "pm25": pm25_vals[i],
            "pm25_roll": pm25_roll[i],
            "pm10": pm10_vals[i],
            "co": co_vals[i],
            "no2": no2_vals[i],
            "so2": so2_vals[i],
            "o3": o3_vals[i],
        })

    return {"latitude": lat, "longitude": lon, "days": days, "radius_km": radius_km, "source": source, "series": series}

@router.get("/summary", summary="Summary statistics for the period")
def summary(lat: float, lon: float, days: int = Query(30, ge=1, le=365), radius_km: float = Query(70.0, gt=0)):
    """
    Basic summary: mean/median/std/min/max/count for AQI and main pollutants,
    plus latest value if present.
    Fetches from india_aqi table only.
    """
    # Always use india_aqi data
    raw = fetch_history_from_india_aqi_nearest(lat, lon, days)
    source = "india_aqi"

    if not raw:
        return {"latitude": lat, "longitude": lon, "days": days, "source": "none", "summary": None}

    aqi = [r.get("aqi") for r in raw]
    pm25 = [r.get("pm25") for r in raw]
    pm10 = [r.get("pm10") for r in raw]
    co = [r.get("co") for r in raw]
    no2 = [r.get("no2") for r in raw]
    so2 = [r.get("so2") for r in raw]
    o3 = [r.get("o3") for r in raw]
    timestamps = [r.get("timestamp") for r in raw]

    stats = {
        "aqi": compute_basic_stats(aqi),
        "pm25": compute_basic_stats(pm25),
        "pm10": compute_basic_stats(pm10),
        "co": compute_basic_stats(co),
        "no2": compute_basic_stats(no2),
        "so2": compute_basic_stats(so2),
        "o3": compute_basic_stats(o3),
    }

    latest = raw[-1] if raw else None
    return {
        "latitude": lat,
        "longitude": lon,
        "days": days,
        "radius_km": radius_km,
        "source": source,
        "summary": {
            "stats": stats,
            "latest": latest
        }
    }

@router.get("/daily", summary="Daily aggregated averages")
def daily(lat: float, lon: float, days: int = Query(30, ge=1, le=365), radius_km: float = Query(70.0, gt=0)):
    """
    Return daily aggregated averages (date, avg_aqi, avg_pm25, avg_pm10, count)
    from india_aqi table only.
    """
    since = datetime.now(timezone.utc) - timedelta(days=days)
    
    # Always use india_aqi data
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT date_trunc('day', dt) AS day,
               AVG(aqi) FILTER (WHERE aqi IS NOT NULL) AS avg_aqi,
               AVG(pm25) FILTER (WHERE pm25 IS NOT NULL) AS avg_pm25,
               AVG(pm10) FILTER (WHERE pm10 IS NOT NULL) AS avg_pm10,
               COUNT(*) AS cnt
        FROM india_aqi
        WHERE dt >= %s
        GROUP BY day
        ORDER BY day ASC
        LIMIT 365
        """,
        (since,)
    )
    rows = cur.fetchall()
    india_daily = rows_to_dicts(cur, rows)
    cur.close()
    conn.close()
    return {"latitude": lat, "longitude": lon, "days": days, "radius_km": radius_km, "source": "india_aqi", "daily": india_daily}
