import requests
import psycopg2
from datetime import datetime

# ------------------ PostgreSQL credentials ------------------
DB_HOST = "localhost"
DB_PORT = 5432
DB_NAME = "postgres"
DB_USER = "postgres"
DB_PASS = "Admin@123"

# ------------------ Choose your location ------------------
latitude = 28.6139     # Delhi example
longitude = 77.2090

# ------------------ Open-Meteo API URL ------------------
url = (
    f"https://air-quality-api.open-meteo.com/v1/air-quality?"
    f"latitude={latitude}&longitude={longitude}&hourly="
    f"pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,us_aqi"
)

response = requests.get(url)
data = response.json()

# Check received data
hours = data.get("hourly", {})
if not hours:
    print("No data received!")
    exit()

# Connect to DB
conn = psycopg2.connect(
    host=DB_HOST,
    port=DB_PORT,
    database=DB_NAME,
    user=DB_USER,
    password=DB_PASS
)
cur = conn.cursor()

# Extract hourly values
timestamps = hours["time"]
pm25_values = hours["pm2_5"]
pm10_values = hours["pm10"]
co_values = hours["carbon_monoxide"]
no2_values = hours["nitrogen_dioxide"]
so2_values = hours["sulphur_dioxide"]
o3_values = hours["ozone"]
aqi_values = hours["us_aqi"]

# Insert each hour into DB
for i in range(len(timestamps)):
    ts = datetime.fromisoformat(timestamps[i])

    cur.execute("""
        INSERT INTO openmeteo_aqi 
        (latitude, longitude, pm25, pm10, carbon_monoxide, nitrogen_dioxide, 
         sulphur_dioxide, ozone, aqi, timestamp)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
    """, (
        latitude,
        longitude,
        pm25_values[i],
        pm10_values[i],
        co_values[i],
        no2_values[i],
        so2_values[i],
        o3_values[i],
        aqi_values[i],
        ts
    ))

conn.commit()
cur.close()
conn.close()

print("Open-Meteo AQI data stored successfully!")
