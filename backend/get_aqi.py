# backend/get_aqi.py
import requests
import psycopg2
from dotenv import load_dotenv
import os
from aqi_utils import compute_aqi_for_row
from datetime import datetime

load_dotenv()
OPENWEATHER_KEY = os.getenv("OWM_API_KEY")
DB_HOST = os.getenv("DB_HOST","localhost")
DB_PORT = os.getenv("DB_PORT","5432")
DB_NAME = os.getenv("DB_NAME","postgres")
DB_USER = os.getenv("DB_USER","postgres")
DB_PASS = os.getenv("DB_PASS","")

def global_api(lat, lon):
    try:
        url = f"http://api.openweathermap.org/data/2.5/air_pollution?lat={lat}&lon={lon}&appid={OPENWEATHER_KEY}"
        js = requests.get(url, timeout=5).json()
        comp = js["list"][0]["components"]
        conc = {
            "pm25": comp.get("pm2_5"),
            "pm10": comp.get("pm10"),
            "no2": comp.get("no2"),
            "so2": comp.get("so2"),
            "o3": comp.get("o3"),
            "co": comp.get("co")/1000.0 if comp.get("co") is not None else None
        }
        return compute_aqi_for_row(conc)
    except Exception:
        return None

def india_fallback(lat, lon):
    conn = psycopg2.connect(host=DB_HOST,port=DB_PORT,database=DB_NAME,user=DB_USER,password=DB_PASS)
    cur = conn.cursor()
    cur.execute("SELECT pm25,pm10,no2,so2,o3,co,aqi FROM india_aqi WHERE lat=%s AND lon=%s ORDER BY dt DESC LIMIT 1", (lat, lon))
    r = cur.fetchone()
    cur.close()
    conn.close()
    if not r:
        return None
    return {
        "pm25_aqi": r[0], "pm10_aqi": r[1], "no2_aqi": r[2],
        "so2_aqi": r[3], "o3_aqi": r[4], "co_aqi": r[5], "aqi": r[6]
    }

def get_aqi(lat, lon):
    live = global_api(lat, lon)
    if live:
        return live, "live"
    # fallback only if inside India
    if 6 <= lat <= 38 and 68 <= lon <= 98:
        fb = india_fallback(lat, lon)
        if fb:
            return fb, "fallback"
    return None, "offline"
