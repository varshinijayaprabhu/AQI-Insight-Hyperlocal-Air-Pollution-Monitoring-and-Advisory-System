# VTU ACADEMIC PROJECT SYNOPSIS

## PROJECT TITLE: AIR QUALITY INDEX (AQI) INSIGHT SYSTEM

---

## 1. EXECUTIVE SUMMARY

The Air Quality Index Insight System is a full-stack web application designed to provide real-time and historical air quality monitoring across global and Indian regions. The system integrates live atmospheric data from the OpenWeatherMap API, stores historical measurements in a PostgreSQL database, and presents analytical insights through an interactive web interface.

---

## 2. PROJECT OBJECTIVES

- To fetch and monitor real-time air quality parameters (PM2.5, PM10, NO2, SO2, O3, CO)
- To compute standardized AQI values based on Indian/international air quality standards
- To provide historical data analysis and trend visualization
- To implement intelligent fallback mechanisms when live API data is unavailable
- To deliver a responsive web interface for global air quality monitoring with location-based search

---

## 3. TECHNOLOGY STACK

| **Layer** | **Technology** | **Purpose** |
|-----------|----------------|-----------|
| **Backend** | FastAPI (Python) | RESTful API server, real-time data processing |
| **Frontend** | React 19.2.0, Vite 7.2.4 | Interactive UI with map visualization |
| **Mapping** | Leaflet.js, React-Leaflet | Interactive geographic data visualization |
| **Database** | PostgreSQL | Persistent storage of AQI measurements |
| **External API** | OpenWeatherMap API | Real-time atmospheric pollutant data |
| **Utilities** | NumPy, SciPy | Statistical analysis and RBF interpolation |

---

## 4. SYSTEM ARCHITECTURE

### 4.1 Backend Architecture (3-Tier)

**Layer 1: Data Acquisition**
- `fetch_india_aqi.py`: Automated scheduled batch fetching of India-wide AQI data at 1°×1° grid resolution (spanning latitude 6-38°N, longitude 68-98°E)
- `get_aqi.py`: On-demand global AQI retrieval with intelligent fallback logic
- `owm_fetcher.py`: Direct integration with OpenWeatherMap Air Pollution API

**Layer 2: Data Processing & Computation**
- `aqi_utils.py`: Implements comprehensive AQI conversion algorithms for six pollutants:
  - **PM2.5**: 7 breakpoint ranges (0–500 scale)
  - **PM10**: 7 breakpoint ranges
  - **NO2, O3, SO2**: Standard breakpoint ranges
  - **CO**: Concentration conversion (μg/m³)
  - Uses linear interpolation for accurate AQI calculation

**Layer 3: API & Analytics**
- `main.py`: FastAPI server exposing REST endpoints with CORS support
- `analytics.py`: Historical data analysis endpoint (`/aqi/history/*`)
  - Statistical computations: mean, median, std deviation, min/max
  - Rolling average calculations (window-based)
  - Spatial/temporal queries with radius-based filtering
  - Dual database fallback (air_quality → india_aqi)

**Layer 4: Data Persistence**
- `database.py`: PostgreSQL connection management
- Two tables:
  - `air_quality`: User search history and live API results
  - `india_aqi`: Pre-computed India grid data (lat, lon, timestamp, 6 pollutants, AQI)

### 4.2 Frontend Architecture

**Component Structure:**
- `App.jsx`: Main application container (1597 lines)
  - Interactive Leaflet map with 5 theme options (Satellite, Dark, Light, Neon, Terrain)
  - Real-time location search with autocomplete
  - Animated penguin mascot with 6 sentiment states (reflecting AQI severity)
  - Dynamic AQI color coding (green→yellow→orange→red→purple)

- `NewsFeed.jsx`: Environmental news/awareness component
- `HistoryAnalytics.jsx`: Historical trend visualization and analysis

**UI Features:**
- Responsive design with hover effects and animations
- Real-time search with loading indicators
- Map-based coordinate selection
- Data visualization with charts and statistics

---

## 5. DATA FLOW ARCHITECTURE

```
┌─────────────────────────────────────────────┐
│     OpenWeatherMap Air Pollution API        │
│  (Real-time pollutant concentrations)       │
└──────────────────┬──────────────────────────┘
                   │
     ┌─────────────┴──────────────┐
     ▼                            ▼
 ┌─────────────┐        ┌─────────────────┐
 │  get_aqi()  │◄──────│ india_aqi_grid   │
 │ (Live)      │       │ (Batch update)   │
 └──────┬──────┘       └────────┬─────────┘
        │                       │
        │      ┌────────────────┘
        │      ▼
        └─────►┌─────────────────────┐
               │   aqi_utils.py      │
               │  (AQI Calculation)  │
               └──────────┬──────────┘
                          │
                ┌─────────┴──────────┐
                ▼                    ▼
          ┌──────────────┐    ┌─────────────┐
          │  air_quality │    │ india_aqi   │
          │  (DB Store)  │    │ (DB Store)  │
          └──────┬───────┘    └─────────────┘
                 │
        ┌────────┴────────┐
        ▼                 ▼
   ┌─────────┐      ┌──────────────┐
   │Analytics│      │  API Routes  │
   │Endpoint │      │  (FastAPI)   │
   └────┬────┘      └──────┬───────┘
        │                  │
        └──────────┬───────┘
                   ▼
            ┌─────────────┐
            │   React UI  │
            │  (Frontend) │
            └─────────────┘
```

---

## 6. KEY FUNCTIONAL COMPONENTS

### 6.1 AQI Computation Algorithm
- Uses standardized EPA breakpoint methodology
- Handles missing data gracefully (None returns None)
- Supports 6 pollutants with individual linear interpolation
- Returns composite AQI as maximum individual pollutant AQI

### 6.2 Fallback Mechanism (Resilience)
```
1. User requests AQI for (lat, lon)
2. Try: Fetch from OpenWeatherMap API
   ├─ Success → Return live data, Save to DB
   └─ Failure ↓
3. If lat/lon inside India bounds (6-38°N, 68-98°E):
   └─ Check india_aqi table for historical grid data
4. Else: Return offline error
```

### 6.3 Batch India Update Process
- Systematic grid traversal: 32°×30° area at 1° resolution (~960 points)
- Rate-limited API calls (1-second delay between requests)
- Database conflict handling (upsert with ON CONFLICT)
- Error recovery with logging

### 6.4 Analytics Engine
- Temporal filtering (days parameter)
- Spatial filtering (radius-based in kilometers)
- Statistical aggregation (mean, median, std, min, max)
- Rolling average for trend smoothing
- Dual data source fallback

---

## 7. DATABASE SCHEMA

### Table 1: `india_aqi` (India grid data)
```sql
Columns: lat, lon, dt, pm25, pm10, no2, so2, o3, co, aqi
Primary Key: (lat, lon, dt)
Purpose: Pre-computed batch AQI for rapid fallback queries
```

### Table 2: `air_quality` (User search history)
```sql
Columns: latitude, longitude, aqi, pm25, pm10, co, no2, so2, o3, timestamp
Purpose: Stores user-triggered live API results for historical analysis
```

---

## 8. API ENDPOINTS

| **Endpoint** | **Method** | **Purpose** | **Parameters** |
|--------------|-----------|-----------|----------------|
| `/aqi` | GET | Fetch current AQI at location | `lat`, `lon` |
| `/aqi/history/*` | GET | Fetch historical analytics | `lat`, `lon`, `days`, `radius_km` |
| `*` | * | News feed & analytics views | N/A |

---

## 9. DEPLOYMENT & EXECUTION

### Backend:
```bash
uvicorn main:app --reload
```

### Frontend:
```bash
npm run dev  # Vite development server
npm run build  # Production build
```

### Database:
- PostgreSQL initialized with schema in `sql/create_india_table.sql`
- Environment variables: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASS`, `OWM_API_KEY`

---

## 10. KEY FEATURES

✅ Real-time global AQI monitoring
✅ India-wide pre-computed grid data for fallback
✅ Historical trend analysis with statistical aggregation
✅ Intelligent multi-level fallback mechanism
✅ Interactive map with theme switching
✅ Responsive mobile-friendly UI
✅ Environmental news integration
✅ Rate-limited batch data fetching (DDoS protection)
✅ CORS-enabled for distributed frontends
✅ Error handling with graceful degradation

---

## 11. CONCLUSION

The Air Quality Index Insight System demonstrates a complete modern full-stack architecture integrating real-time data acquisition, scientific computation, persistent storage, and responsive visualization. The application combines cloud API integration with offline resilience, providing users reliable access to critical environmental health information. The project exemplifies best practices in API design, database optimization, and frontend user experience.

---

**Project Date:** December 21, 2025  
**Technology Stack:** Python, FastAPI, React, PostgreSQL, Leaflet.js
