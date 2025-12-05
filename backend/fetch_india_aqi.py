# backend/fetch_india_aqi.py
import os
import time
import requests
import psycopg2
from datetime import datetime
from dotenv import load_dotenv
from aqi_utils import compute_aqi_for_row

load_dotenv()

OPENWEATHER_KEY = os.getenv("OWM_API_KEY")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "postgres")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASS = os.getenv("DB_PASS", "")

if not OPENWEATHER_KEY:
    raise RuntimeError("OWM_API_KEY not found in .env")

LAT_START, LAT_END = 6, 38
LON_START, LON_END = 68, 98
STEP = 1.0   # 1 degree grid (fast, safe)

def frange(start, stop, step):
    v = start
    while v <= stop:
        yield round(v, 3)
        v += step

def get_conn():
    return psycopg2.connect(
        host=DB_HOST, port=DB_PORT, database=DB_NAME,
        user=DB_USER, password=DB_PASS
    )

def save_row(row):
    conn = get_conn()
    cur = conn.cursor()
    query = """
    INSERT INTO india_aqi(lat, lon, dt, pm25, pm10, no2, so2, o3, co, aqi)
    VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
    ON CONFLICT (lat, lon, dt) DO NOTHING;
    """
    cur.execute(query, row)
    conn.commit()
    cur.close()
    conn.close()

def fetch_point(lat, lon):
    url = f"http://api.openweathermap.org/data/2.5/air_pollution?lat={lat}&lon={lon}&appid={OPENWEATHER_KEY}"
    r = requests.get(url, timeout=8)
    r.raise_for_status()
    js = r.json()
    item = js["list"][0]
    dt = datetime.utcfromtimestamp(item["dt"])
    comp = item["components"]
    conc = {
        "pm25": comp.get("pm2_5"),
        "pm10": comp.get("pm10"),
        "no2":  comp.get("no2"),
        "so2":  comp.get("so2"),
        "o3":   comp.get("o3"),
        "co":   comp.get("co") / 1000.0 if comp.get("co") is not None else None
    }
    aqi_map = compute_aqi_for_row(conc)
    return (lat, lon, dt,
            conc["pm25"], conc["pm10"], conc["no2"],
            conc["so2"], conc["o3"], conc["co"],
            aqi_map["aqi"])

def run_india_update():
    print("Starting India update:", datetime.utcnow().isoformat())
    count = 0
    for lat in frange(LAT_START, LAT_END, STEP):
        for lon in frange(LON_START, LON_END, STEP):
            try:
                row = fetch_point(lat, lon)
                save_row(row)
                count += 1
                print(f"Saved {lat},{lon}")
            except Exception as e:
                print("Error at", lat, lon, "->", e)
            time.sleep(1)  # safe spacing
    print("Finished. Total saved:", count)


# -------------------------------------------------------------------
#  FALLBACK METHOD → LIVE API FIRST, IF FAIL → RETURN DB LATEST DATA
# -------------------------------------------------------------------
def get_india_aqi(lat, lon):
    try:
        # 1) Live OpenWeather API request
        return fetch_point(lat, lon)

    except Exception as e:
        print("⚠️ Live API failed, using fallback DB:", e)

        conn = get_conn()
        cur = conn.cursor()

        cur.execute("""
            SELECT lat, lon, dt, pm25, pm10, no2, so2, o3, co, aqi
            FROM india_aqi
            WHERE lat = %s AND lon = %s
            ORDER BY dt DESC
            LIMIT 1;
        """, (lat, lon))

        row = cur.fetchone()
        cur.close()
        conn.close()

        return row


if __name__ == "__main__":
    run_india_update()
