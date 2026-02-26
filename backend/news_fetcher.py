# backend/news_fetcher.py
import requests
import os
from datetime import datetime, timedelta
from dotenv import load_dotenv
from pathlib import Path

# Load .env from backend directory
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

GNEWS_API_KEY = os.getenv("GNEWS_API_KEY")

def fetch_news(days_back=30, max_articles=20):
    """
    Fetch news articles about air quality and climate from GNews API.
    
    Args:
        days_back: Number of days to look back for articles
        max_articles: Maximum number of articles to return
    
    Returns:
        List of articles or empty list if API fails
    """
    if not GNEWS_API_KEY:
        print("❌ GNEWS_API_KEY not found in environment")
        return []
    
    try:
        # Calculate date range
        today = datetime.utcnow()
        from_date = (today - timedelta(days=days_back)).strftime("%Y-%m-%d")
        to_date = today.strftime("%Y-%m-%d")
        
        # Build API URL
        url = (
            f"https://gnews.io/api/v4/search?"
            f"q=air+quality+OR+pollution+OR+climate&"
            f"lang=en&"
            f"from={from_date}&"
            f"to={to_date}&"
            f"max={max_articles}&"
            f"apikey={GNEWS_API_KEY}"
        )
        
        print(f"📰 Fetching news from {from_date} to {to_date}...")
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        articles = data.get("articles", [])
        
        print(f"✅ Fetched {len(articles)} articles")
        return articles
        
    except requests.exceptions.RequestException as e:
        print(f"❌ News fetch error: {e}")
        return []
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return []
