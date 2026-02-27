import os
import psycopg2
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv

load_dotenv()

# How many days of data to keep (older records are auto-deleted)
DATA_RETENTION_DAYS = 30

def get_connection():
    """
    Connect using DATABASE_URL (Render provides this automatically)
    or fall back to individual env vars / defaults for local dev.
    """
    database_url = os.getenv("DATABASE_URL")
    if database_url:
        return psycopg2.connect(database_url)
    return psycopg2.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", "5432")),
        database=os.getenv("DB_NAME", "postgres"),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASS", "Admin@123")
    )


def cleanup_old_records():
    """
    Delete records older than DATA_RETENTION_DAYS from both
    air_quality and india_aqi tables.
    This keeps the database small and efficient.
    """
    cutoff = datetime.now(timezone.utc) - timedelta(days=DATA_RETENTION_DAYS)
    try:
        conn = get_connection()
        cur = conn.cursor()

        # Clean air_quality table (user search results)
        cur.execute(
            "DELETE FROM air_quality WHERE timestamp < %s", (cutoff,)
        )
        deleted_aq = cur.rowcount

        # Clean india_aqi table (scheduled India data)
        cur.execute(
            "DELETE FROM india_aqi WHERE dt < %s", (cutoff,)
        )
        deleted_india = cur.rowcount

        conn.commit()
        cur.close()
        conn.close()

        print(f"[CLEANUP] Deleted {deleted_aq} rows from air_quality, "
              f"{deleted_india} rows from india_aqi (older than {DATA_RETENTION_DAYS} days)")
    except Exception as e:
        print(f"[CLEANUP ERROR] {e}")
