# backend/india_scheduler.py
import schedule
import time
from fetch_india_aqi import run_india_update
from database import cleanup_old_records

print("India AQI scheduler started (every 12 hours). Press Ctrl+C to stop.")
print("Database cleanup scheduled (once every 24 hours).")

run_india_update()       # run once immediately at startup
cleanup_old_records()    # clean stale data at startup too

schedule.every(12).hours.do(run_india_update)
schedule.every(24).hours.do(cleanup_old_records)   # auto-purge daily

while True:
    schedule.run_pending()
    time.sleep(1)
