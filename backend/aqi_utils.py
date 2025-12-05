# aqi_utils.py
# Full AQI conversion for PM2.5, PM10, NO2, O3, SO2, CO

from typing import Optional, Dict

def _linear(aqi_lo, aqi_hi, conc_lo, conc_hi, conc):
    """Linear interpolation helper."""
    return int(((aqi_hi - aqi_lo) / (conc_hi - conc_lo)) * (conc - conc_lo) + aqi_lo)


# ---------- PM2.5 ----------
pm25_bp = [
    (0.0, 12.0, 0, 50),
    (12.1, 35.4, 51, 100),
    (35.5, 55.4, 101, 150),
    (55.5, 150.4, 151, 200),
    (150.5, 250.4, 201, 300),
    (250.5, 350.4, 301, 400),
    (350.5, 500.4, 401, 500),
]

def pm25_to_aqi(conc):
    if conc is None: return None
    for clo, chi, alo, ahi in pm25_bp:
        if clo <= conc <= chi:
            return _linear(alo, ahi, clo, chi, conc)
    return 500


# ---------- PM10 ----------
pm10_bp = [
    (0, 54, 0, 50),
    (55, 154, 51, 100),
    (155, 254, 101, 150),
    (255, 354, 151, 200),
    (355, 424, 201, 300),
    (425, 504, 301, 400),
    (505, 604, 401, 500),
]

def pm10_to_aqi(conc):
    if conc is None: return None
    for clo, chi, alo, ahi in pm10_bp:
        if clo <= conc <= chi:
            return _linear(alo, ahi, clo, chi, conc)
    return 500


# ---------- NO2 ----------
no2_bp = [
    (0, 53, 0, 50),
    (54, 100, 51, 100),
    (101, 360, 101, 150),
    (361, 649, 151, 200),
    (650, 1249, 201, 300),
    (1250, 1649, 301, 400),
    (1650, 2049, 401, 500),
]

def no2_to_aqi(conc):
    if conc is None: return None
    for clo, chi, alo, ahi in no2_bp:
        if clo <= conc <= chi:
            return _linear(alo, ahi, clo, chi, conc)
    return 500


# ---------- O3 ----------
o3_bp = [
    (0, 54, 0, 50),
    (55, 70, 51, 100),
    (71, 85, 101, 150),
    (86, 105, 151, 200),
    (106, 200, 201, 300),
]

def o3_to_aqi(conc):
    if conc is None: return None
    for clo, chi, alo, ahi in o3_bp:
        if clo <= conc <= chi:
            return _linear(alo, ahi, clo, chi, conc)
    return 500


# ---------- SO2 ----------
so2_bp = [
    (0, 35, 0, 50),
    (36, 75, 51, 100),
    (76, 185, 101, 150),
    (186, 304, 151, 200),
    (305, 604, 201, 300),
    (605, 804, 301, 400),
    (805, 1004, 401, 500),
]

def so2_to_aqi(conc):
    if conc is None: return None
    for clo, chi, alo, ahi in so2_bp:
        if clo <= conc <= chi:
            return _linear(alo, ahi, clo, chi, conc)
    return 500


# ---------- CO ----------
co_bp = [
    (0.0, 4.4, 0, 50),
    (4.5, 9.4, 51, 100),
    (9.5, 12.4, 101, 150),
    (12.5, 15.4, 151, 200),
    (15.5, 30.4, 201, 300),
    (30.5, 40.4, 301, 400),
    (40.5, 50.4, 401, 500),
]

def co_to_aqi(conc):
    if conc is None: return None
    for clo, chi, alo, ahi in co_bp:
        if clo <= conc <= chi:
            return _linear(alo, ahi, clo, chi, conc)
    return 500


# ---------- FINAL COMBINED ----------
def compute_aqi_for_row(conc_dict: Dict[str, float]) -> Dict[str, int]:
    pm25_aqi = pm25_to_aqi(conc_dict.get("pm25"))
    pm10_aqi = pm10_to_aqi(conc_dict.get("pm10"))
    no2_aqi = no2_to_aqi(conc_dict.get("no2"))
    o3_aqi = o3_to_aqi(conc_dict.get("o3"))
    so2_aqi = so2_to_aqi(conc_dict.get("so2"))
    co_aqi = co_to_aqi(conc_dict.get("co"))

    all_vals = [pm25_aqi, pm10_aqi, no2_aqi, o3_aqi, so2_aqi, co_aqi]
    overall = max(v for v in all_vals if v is not None)

    return {
        "pm25_aqi": pm25_aqi,
        "pm10_aqi": pm10_aqi,
        "no2_aqi": no2_aqi,
        "o3_aqi": o3_aqi,
        "so2_aqi": so2_aqi,
        "co_aqi": co_aqi,
        "aqi": overall
    }
