# backend/india_scheduler.py
import schedule
import time
from fetch_india_aqi import run_india_update
from database import cleanup_old_records

print("India AQI scheduler started (11:00 AM & 11:00 PM IST). Press Ctrl+C to stop.")
print("Database cleanup scheduled (once daily at 12:00 AM IST).")

run_india_update()       # run once immediately at startup
cleanup_old_records()    # clean stale data at startup too

# Schedule at fixed times (IST)
# Note: Render uses UTC, so converting IST to UTC:
# 11:00 AM IST = 05:30 UTC
# 11:00 PM IST = 17:30 UTC
# 12:00 AM IST = 18:30 UTC (previous day)

schedule.every().day.at("05:30").do(run_india_update)  # 11:00 AM IST
schedule.every().day.at("17:30").do(run_india_update)  # 11:00 PM IST
schedule.every().day.at("18:30").do(cleanup_old_records)  # 12:00 AM IST (daily cleanup)
