# backend/india_scheduler.py
import schedule
import time
from fetch_india_aqi import run_india_update

print("India AQI scheduler started (every 12 hours). Press Ctrl+C to stop.")
run_india_update()  # run once immediately at startup
schedule.every(12).hours.do(run_india_update)

while True:
    schedule.run_pending()
    time.sleep(1)
