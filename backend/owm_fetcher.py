import requests
from database import get_connection
from datetime import datetime
from dotenv import load_dotenv
import os

# Load .env
load_dotenv()
API_KEY = os.getenv("OWM_API_KEY")

def save(lat, lon, data):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO air_quality 
        (latitude, longitude, aqi, pm25, pm10, co, no2, so2, o3, timestamp)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
    """, (
        lat, lon,
        data["aqi"],
        data["pm2_5"],
        data["pm10"],
        data["co"],
        data["no2"],
        data["so2"],
        data["o3"],
        datetime.utcnow()
    ))

    conn.commit()
    cur.close()
    conn.close()

def fetch_aqi(lat, lon):
    url = f"http://api.openweathermap.org/data/2.5/air_pollution?lat={lat}&lon={lon}&appid={API_KEY}"

    r = requests.get(url, timeout=10)
    js = r.json()

    comp = js["list"][0]["components"]
    aqi = js["list"][0]["main"]["aqi"]

    return {
        "aqi": aqi,
        "pm2_5": comp["pm2_5"],
        "pm10": comp["pm10"],
        "co": comp["co"],
        "no2": comp["no2"],
        "so2": comp["so2"],
        "o3": comp["o3"]
    }

def update(locations):
    for lat, lon in locations:
        try:
            data = fetch_aqi(lat, lon)
            save(lat, lon, data)
            print(f"Updated: {lat}, {lon}")
        except Exception as e:
            print(f"Error updating {lat},{lon} =>", e)

if __name__ == "__main__":
    # Example tracked coords
    locations = [
        (12.9716, 77.5946),  # Banglore
        (28.6139, 77.2090),  # Delhi
    ]
    update(locations)
